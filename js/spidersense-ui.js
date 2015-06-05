  d3.select(".Tab1").on('click',function(d,i){
    d3.select('#SeeSoftView').html("");
    d3.select("#TreemapSpaceOuter").style("display","");
    d3.select('#SeeSoftView').html("");
    d3.selectAll("li")
      .attr("class"," ");
    var className = d3.select(this).attr("class");
    console.log(className);
    d3.select("#"+className).attr("class","active");
    /*d3.select("#TabContent")
      .html("");
    d3.select("#TabContent")
      .append("h3")
      .text("Select files to add....");*/
      if(d3.event !=null) d3.event.stopPropagation();

  });
  var c_id = '';
  var c_secret = '';
  var o_str = 'client_id='+c_id+'&client_secret='+c_secret;
  var displayCounter = 0;
  var currentFile = 0;
  var keys = [];
  function onSelect(d) {
    var search_term = d.State;
    console.log(search_term);
    var node = svg.selectAll(".cell");
    var selected = node.filter(function (d,i) {
      return d.name == search_term;
    });
    selected.each(function(d) {
      zoom(d);
      displayFile(d, function(str) {

        return atob(str).replace(/\n/g, "<br/>");
        //return str1.replace(/\t/g, "&nbsp;");
      });
    });
  }
  
  var mc = autocomplete(document.getElementById('test'))
    .keys(keys)
    .dataField("State")
    .placeHolder("Search files")
    .width(960)
    .height(500)
    .onSelected(onSelect)
    .render();

  var optArray = [];
  $(function () {
    $("#search").autocomplete({
      source: optArray
    });
  });

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;
  var w = width,
  h = height,
  x = d3.scale.linear().range([0, w]),
  y = d3.scale.linear().range([0, h]);
  //color = d3.scale.category20c();
  //console.log(color);


  var color_palette;
  var color_hash = {};
  function setPalette(num){
    color_palette = colors(num);
  }
  var _next_idx=0;
  function getColor(key){
    if(key == null) return color_palette[0];
    if(!(key in color_hash)) color_hash[key] = (_next_idx++)%color_palette.length;
    return color_palette[color_hash[key]];
  }


  var treemap = d3.layout.treemap()
  .round(false)
  .size([w, h])
  .sticky(false)
  .value(function(d) { return d.size; });

  /*var svg = d3.select("body").append("div")
  .attr("class", "chart")
  .style("width", w + "px")
  .style("height", h + "px")*/
  var svg = d3.select("#TreemapSpace").append("div")
  .style("position", "relative")
  .style("width", (width + margin.left + margin.right) + "px")
  .style("height", (height + margin.top + margin.bottom) + "px")
  .style("left", margin.left + "px")
  .style("top", margin.top + "px")
  .append("svg:svg")
  .attr("width", w)
  .attr("height", h)
  .append("svg:g");
  /*var svg = d3.select("#TreemapSpace").append("svg:svg")
  .attr("width", w)
  .attr("height", h)
  .append("svg:g");*/
  //.attr("transform", "translate(.5,.5)");


  var offline = false;

  if(offline) {
    d3.selectAll("#updateButton").on("click", getData_offline);
  }
  else {
    d3.selectAll("#updateButton").on("click", getData);
  }

  d3.selectAll("#searchButton").on("click", searchFile);
  //d3.selectAll("#zoomRestoreButton").on("click", zoomOut);

  function seeSoftZoom(thresh,fileCounter) {
    var colSize = Math.floor((thresh-1)/4);
    colSize = (colSize+1) * 3;
    var colClass = "col-md-" + colSize.toString();
    var fileSelectID = '#File'+currentFile.toString();
    var codespaceOuter = d3.select('#SeeSoftView');
    var codespace = codespaceOuter.select(fileSelectID);
    var allPre = codespace.selectAll('pre');
    //console.log(thresh);
    var newFontSize = thresh.toString() +"px";
    //console.log(newFontSize);
    allPre.style("font-size",newFontSize);
    codespace.attr("class",colClass)
  }

  function zoomOut() {
    zoom(root);
  }

  function searchFile() {
    var search_term = d3.select("#search").property('value');
    console.log(search_term);
    var node = svg.selectAll(".cell");
    var selected = node.filter(function (d,i) {
      return d.name == search_term;
    });
    selected.each(function(d) {
      zoom(d);
      displayFile(d, function(str) {

        return atob(str).replace(/\n/g, "<br/>");
        //return str1.replace(/\t/g, "&nbsp;");
      });
    });

  }

  function getData_offline() {
    var user = d3.select("#user").property('value');
    var repo = d3.select("#repo").property('value');
    var url = 'data/'+repo+'.json';

    console.log(url);
    d3.json(url, function(error, data) {
      if(error) {
        console.log(error);
        return;
      }
      var root = parseData(data.tree);
      update(root);
    });
  }

  var api_url;
  var cur_repo;
  var cur_branch;
  function getData() {
    var user = d3.select("#user").property('value');
    var repo = d3.select("#repo").property('value');
    api_url = 'https://api.github.com/repos/'+user+'/'+repo;

    d3.json(api_url+"?"+ o_str, function(error, repo) {
      if(error) { console.log(error); return; }
      cur_repo = repo;

      d3.json(api_url+"/branches/" + repo.default_branch +"?"+ o_str, function(error, data) {
        if(error) {
          console.log(error);
          return;
        }
        cur_branch = data;
        d3.json(api_url+ "/git/trees/"+data.commit.sha+"?recursive=1&" + o_str, function(error, data) {
          if(error) {
            console.log(error);
            return;
          }
          var root = parseData(data.tree);
          //console.log(data);
          //setPalette(data.tree.length);
          update(root);
        });
      });
    });

  }

  function update (data) {
    svg.selectAll("g").remove();
    node = root = data;

    var nodes = treemap.nodes(root)
    .filter(function(d) { return !d.children; });

    var cell = svg.selectAll("g")
    .data(nodes);

    cell.exit().remove();

    cell.enter().append("svg:g");

    cell
    .attr("class", "cell")
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    .on("click", function(d) {


      if(d3.event.altKey){
        return zoom(node.parent);
      }

      if(d==root || d==node) return zoom(d);

      while(node != d.parent) d = d.parent;
      return zoom(d);
    })
    .on("dblclick", function(d) {
      console.log("Double Clicked");
      zoom(d);
      /*displayFile(d, function(str) {
        return atob(str.replace(/\s/g, '')).replace(/\n/g, "<br/>");
      });*/
    })
    .on("contextmenu", function(d) {
      console.log("Double Clicked");
      //zoom(d);
      displayFile(d, function(str) {
        return atob(str.replace(/\s/g, '')).replace(/\n/g, "<br/>");
      });
      d3.event.preventDefault();
    });


    var filesToNumbers = {};
    var gradient = cell.append("svg:defs")
      .append("svg:radialGradient")
      .attr("id", function(d,i) {
        filesToNumbers[d.path] = i;
        return "grad" + i.toString() ; })
      .attr("fx","50%")
      .attr("fy","50%")
      .attr("r","100%");
      //.attr("fx","50%")
      //.attr("fy","50%");
    console.log(filesToNumbers);

    /*gradient.append("svg:stop")
      .attr("offset","0%")
      .attr("stop-color",function(d) { return color(d.parent.name); });*/

    gradient.append("svg:stop")
      .attr("id", function(d,i) {
        filesToNumbers[d.path] = i;
        return "stop" + i.toString() ; })
      .attr("offset","0%")
      .attr("stop-color","#cccccc");

    gradient.append("svg:stop")
      .attr("offset","70%")
      .attr("stop-color",function(d) { return getColor(d.parent.path); });

    cell.append("svg:rect")
    .attr("width", function(d) { return d.dx ; })
    .attr("height", function(d) { return d.dy ; })
    .attr("id",function(d) { return d.path ; } )
    .style("fill", function(d,i) {
      var gradientURL = "url(#grad" + i.toString() + ')';
      return gradientURL;
    });

    cell.append("svg:text")
    .attr("x", function(d) { return d.dx / 2; })
    .attr("y", function(d) { return d.dy / 2; })
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(function(d) { return d.name; })
    .style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

    d3.select(window).on("click", function() { zoom(root); });

    // Section: Filling the AutoComplete Array
    var all_files = svg.selectAll(".cell");
    //console.log("All Files:\n");
    //console.log(all_files);
    var filesLength = 0;
    all_files.each(function(d,i) {
      optArray[i] = d.name;
      filesLength++;
    });
    while(optArray.length > filesLength) {
      optArray.pop();
    }
    //\Section

    // Section: Filling the D3 AutoComplete Array
    keysArray = [];
    for(var i=0; i<optArray.length; ++i){
      var obj = {};
      obj['State'] = optArray[i];
      keysArray.push(obj);
    }
    mc.keys(keysArray);
    //\Section

    zoom(root);
    showCommitsOntheMap(filesToNumbers);

  }

  function displayFileFromTab(file, decoder,fileCounter) {
    d3.select("#TreemapSpaceOuter").style("display","none");
    currentFile = fileCounter;
    var user = d3.select("#user").property('value');
    var repo = d3.select("#repo").property('value');
    var fileURL = "https://github.com/"+user+'/'+repo+"/blob/master/"+file.path;
    var fileName = file.path;

    var tabSelector = d3.select("#Tabs");
    var contentSelector = d3.select("#TabContent");

    var fileDivID = "File" + fileCounter.toString();
    //d3.selectAll('pre').remove();
    var codespaceOuter = d3.select('#SeeSoftView');
    codespaceOuter.html("");
    codespaceOuter.append("div")
      .attr("class","col-md-3")
      .attr("id",fileDivID);
    var hashFileDivID = '#' + fileDivID;
    var codespace = codespaceOuter.select(hashFileDivID);

    d3.json(file.url, function(err, data) {
      if(err) {
        console.log(err);
        return;
      }
      var coded_source = data.content;
      var source = decoder(coded_source);
      console.log(file.name);
      codespace.append("pre")
        .text("The program is: ");
      var lines = source.split("<br/>");

      var colors = ["red","green","yellow"];
      var colors = ["#F2D8D8","#CCEBCD","#F2F1D5"];
      for(var line = 0; line<lines.length; ++line){
        var lineNo = line+1;
        var lineId = "L" + fileCounter.toString() + '_'+ lineNo.toString();
        codespace.append("div")
          .attr("id",lineId)
          .append("pre")
          .text(lines[line])
          .style("font-family", "Courier")
          .style("font-size", "3px")
          .style("background-color", colors[line%3])
          .style("margin-top", "0px")
          .style("margin-bottom", "0px")
          .style("overflow", "auto");
      }

      /*for(var line = 0; line<lines.length; ++line){
        var codeLine = lines[line];
        var regex1 = new RegExp('<', 'g');
        var regex2 = new RegExp('>', 'g');
        codeLine= "<code>" + codeLine.replace(regex1,'&lt;').replace(regex2,'&gt;')+ "</code>";

        codespace.append("pre")
          //.attr("id",colors[line%3])
          .text(codeLine)
          .style("font-family", "Courier")
          //.style("background-color", colors[line%3])
          .style("margin-top", "2px")
          .style("margin-bottom", "2px")
          .style("overflow", "auto");
      }*/


      var allPre = codespace.selectAll('pre')
        .on("click", function(d,i) {
          console.log(d);
          var lineNo = i-8;
          if(lineNo<1){
            var lineId = "#L8";
          }
          else{
            var lineId = "#L" + fileCounter.toString()  + '_'+ lineNo.toString();
          }

          seeSoftZoom(16);

          //var codespace = d3.select('#SeeSoftView');
          //var allPre = codespace.selectAll('pre');
          //var slider = d3.select("zoomSlider);
          allPre.style("font-size","16px");
          $('html, body').animate({
            scrollTop: $(lineId).offset().top
          }, 300);
        })
        .on("dblclick", function(d,i) {
          var outURL = fileURL + '#L' + i.toString();
          console.log(outURL);
          window.open(outURL);
        });
    });
  }

  function displayFile(file, decoder) {
    d3.select("#TreemapSpaceOuter").style("display","none");
    displayCounter++;
    var fileCounter = displayCounter;
    currentFile = fileCounter;
    var user = d3.select("#user").property('value');
    var repo = d3.select("#repo").property('value');
    var fileURL = "https://github.com/"+user+'/'+repo+"/blob/master/"+file.path;
    var fileName = file.path;

    var tabSelector = d3.select("#Tabs");
    var contentSelector = d3.select("#TabContent");
    var contentID = "file" + fileCounter.toString();
    d3.selectAll("li")
      .attr("class"," ");
    var listElement = tabSelector.append("li")
      .attr("id",contentID)
      .attr("class","active")
      .append("a");
    listElement.attr("data-toggle","tab")
      .attr("class",contentID)
      .text(file.name);
      //<input id="zoomRestoreButton" type="button" value="Restore"/>
    listElement.append("input")
      .attr("id","X"+contentID)
      .attr("type","button")
      .attr("class","close")
      .attr("value","X");
    console.log(fileURL);

    /*d3.select("#TabContent")
      .html("");
    d3.select("#TabContent")
      .append("h3")
      .text(file.path);*/
    d3.select("#X"+contentID).on('click',function(d,i){
      d3.select("#TreemapSpaceOuter").style("display","");
      var className = d3.select(this).attr("id");
      className = className.substring(1,className.length);
      d3.select("."+className).attr("class","defunct");
      d3.select("#"+className).remove();
      d3.selectAll("li").attr("class"," ");
      d3.select("#Tab1").attr("class","active");
      console.log("Reached here");
      d3.select('#SeeSoftView').html("");
    });
    d3.select("."+contentID).on('click',function(d,i){

      var className = d3.select(this).attr("class");
      if(className != "defunct") {
        console.log(className);
        d3.selectAll("li").attr("class"," ");
        d3.select("#"+className).attr("class","active");
        displayFileFromTab(file,decoder,fileCounter);
      }
    });

    var fileDivID = "File" + fileCounter.toString();
    //d3.selectAll('pre').remove();
    var codespaceOuter = d3.select('#SeeSoftView');
    codespaceOuter.html("");
    codespaceOuter.append("div")
      .attr("class","col-md-3")
      .attr("id",fileDivID);
    var hashFileDivID = '#' + fileDivID;
    var codespace = codespaceOuter.select(hashFileDivID);

    d3.json(file.url, function(err, data) {
      if(err) {
        console.log(err);
        return;
      }
      var coded_source = data.content;
      var source = decoder(coded_source);
      console.log(file.name);
      codespace.append("pre")
        .text("The program is: ");
      var lines = source.split("<br/>");

      var colors = ["red","green","yellow"];
      var colors = ["#F2D8D8","#CCEBCD","#F2F1D5"];
      for(var line = 0; line<lines.length; ++line){
        var lineNo = line+1;
        var lineId = "L" + fileCounter.toString() + '_'+ lineNo.toString();
        codespace.append("div")
          .attr("id",lineId)
          .append("pre")
          .text(lines[line])
          .style("font-family", "Courier")
          .style("font-size", "3px")
          .style("background-color", colors[line%3])
          .style("margin-top", "0px")
          .style("margin-bottom", "0px")
          .style("overflow", "auto");
      }

      /*for(var line = 0; line<lines.length; ++line){
        var codeLine = lines[line];
        var regex1 = new RegExp('<', 'g');
        var regex2 = new RegExp('>', 'g');
        codeLine= "<code>" + codeLine.replace(regex1,'&lt;').replace(regex2,'&gt;')+ "</code>";

        codespace.append("pre")
          //.attr("id",colors[line%3])
          .text(codeLine)
          .style("font-family", "Courier")
          //.style("background-color", colors[line%3])
          .style("margin-top", "2px")
          .style("margin-bottom", "2px")
          .style("overflow", "auto");
      }*/


      var allPre = codespace.selectAll('pre')
        .on("click", function(d,i) {
          console.log(d);
          var lineNo = i-8;
          if(lineNo<1){
            var lineId = "#L8";
          }
          else{
            var lineId = "#L" + fileCounter.toString()  + '_'+ lineNo.toString();
          }
          seeSoftZoom(16);
          //var codespace = d3.select('#SeeSoftView');
          //var allPre = codespace.selectAll('pre');
          //var slider = d3.select("zoomSlider);
          allPre.style("font-size","16px");
          $('html, body').animate({
            scrollTop: $(lineId).offset().top
          }, 300);
        })
        .on("dblclick", function(d,i) {
          var outURL = fileURL + '#L' + i.toString();
          console.log(outURL);
          window.open(outURL);
        });
    });
  }

  function size(d) {
    return d.size;
  }

  function count(d) {
    return 1;
  }

  function zoom(d) {
    deleteDetails();
    d3.select("#dir").text(d.path);

    var kx = w / d.dx, ky = h / d.dy;
    x.domain([d.x, d.x + d.dx]);
    y.domain([d.y, d.y + d.dy]);

    var t = svg.selectAll("g.cell").transition()
    //.duration(d3.event.altKey ? 7500 : 750)
    .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    t.select("rect")
    .attr("width", function(d) { return kx * d.dx ; })
    .attr("height", function(d) { return ky * d.dy ; })

    t.select("text")
    .attr("x", function(d) { return kx * d.dx / 2; })
    .attr("y", function(d) { return ky * d.dy / 2; })
    .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

    node = d;
    if(d3.event !=null) d3.event.stopPropagation();

    if(d.children==null){
      showDetails(d);
      displayFile(d, function(str) {
        return atob(str.replace(/\s/g, '')).replace(/\n/g, "<br/>");
      });
    }
    else deleteDetails();
  }


  function showDetails(d){

    var margin = 10;
    var g = svg.append("g")
      .attr("id","detail");

    var panel_commits = g.append("rect")
      .attr("x", 10)
      .attr("y", 10)
      .attr("width", w/2 - margin)
      .attr("height", h/2 - margin)
      .attr("style","fill:black;fill-opacity:0.5")
      .on("click", function(d) {
        if(d3.event !=null) d3.event.stopPropagation();
      });

    var text_commits = g.append("foreignObject")
      .attr("x","10")
      .attr("y","10")
      .attr("width", w/2 - margin)
      .attr("height", h/2 - margin)
      .append("xhtml:body")
      .style("background-color","transparent")
      .on("click", function(d) {
        if(d3.event !=null) d3.event.stopPropagation();

      });

    var panel_src = g.append("rect")
      .attr("x", w/2 + margin)
      .attr("y", 10)
      .attr("width", w/2 - margin*2)
      .attr("height", h - margin*2)
      .attr("style","fill:black;fill-opacity:0.5")
      .on("click", function(d) {
        if(d3.event !=null) d3.event.stopPropagation();

      });

    var text_src = g.append("foreignObject")
      .attr("x", w/2 + margin)
      .attr("y","10")
      .attr("width", w/2 - margin*2)
      .attr("height", h - margin*2)
      .append("xhtml:body")
      .on("click", function(d) {
        if(d3.event !=null) d3.event.stopPropagation();
      //.attr("overflow", "scroll");
      });

    //var file = new Gh3.File(null, gh3_user, gh3_repo.name, gh3_repo.default_branch);
    //file.path = d.path;

    d3.json(d.url+"?"+o_str,function(err, res) {
      if(err) { throw "outch ..." }
        //console.log(SyntaxHighlighter.brushes);
      var brush = new SyntaxHighlighter.brushes.Java(),
      html;
      brush.init({ toolbar: false });
      html = brush.getHtml(atob(res.content.replace(/\s/g,'')));
      text_src
            //.append("xhtml:pre")
            .append("xhtml:div")
            .style("font-size", "5px")
            .attr("align","left")
            .style("overflow", "hidden;scroll")
            .html(html)
            //.attr("x", 10)
            //.attr("dy", "1.2em")
            //.attr("class","log")
            //.style("color", "#00ff00")
            //.style("font-size", "5px")
            //.text(html); //BASE64 decoder is needed here.
      //console.log(window.atob( unescape(encodeURIComponent(res.content))));
    });
    d3.json(api_url+"/commits?path="+encodeURIComponent(d.path)+"&sha="+cur_branch.name+"&"+o_str,function(err, res) {
      if(err) { throw "outch ..." }
      res.forEach(function (c) {
        text_commits.append("xhtml:p")
        .attr("align","left")

            //.attr("x", 10)
            .attr("dy", "1.2em")
            .style("font-size", "12px")
            //.attr("class","log")
            .style("color", "#00ff00")
            //.attr("width", w/2)
            .text(c.commit.committer.date +' '+ c.author.login +' '+ c.commit.message );
      });
    });

/*
    file.fetchContent(function (err, res) {
      if(err) { throw "outch ..." }
      text_src.append("xhtml:pre")
            //.attr("x", 10)
            .attr("dy", "1.2em")
            //.attr("class","log")
            .style("color", "#00ff00")
            .style("font-size", "5px")
            .text(file.getRawContent());
            console.log(file);
    });

    file.fetchCommits(function (err, res) {
      if(err) { throw "outch ..." }
      file.eachCommit(function (commit) {
        text_commits.append("xhtml:p")
            //.attr("x", 10)
            .attr("dy", "1.2em")
            .style("font-size", "15px")
            //.attr("class","log")
            .style("color", "#00ff00")
            //.attr("width", w/2)
            .text(commit.date +' '+ commit.author.name +' '+ commit.message );

      });

    });
  */
  }

  function deleteDetails(d){
    svg.select("#detail").remove();
  }



  function showCommitsOntheMap(filesToNumbers){
    console.log(filesToNumbers);
    var commits = {};
    //read all commits
    d3.json(api_url+"/commits?"+o_str,function(error, data) {
        if(error) {
          console.log(error);
          return;
        }
        //for all commits
        data.forEach(function(e, idx) {
          if(idx > 5) return;
          //read each commit
          d3.json(e.url+"?"+o_str,function(error, data) {
            if(error) {
              console.log(error);
              return;
            }
            //for single commit
            data.files.forEach(function(e) {
              d3.select(escape("#"+e.filename))
                ;
              //  .style("fill", function(d){return d3.rgb(this.style.fill).brighter(0.5);});
              //console.log(e.filename);
              var fileNo = filesToNumbers[e.filename];
              //var radialDef = d3.select("#grad"+fileNo.toString());
              var stop = d3.select("#stop"+fileNo.toString());
              var curStopColor = stop.attr("stop-color");
              console.log(curStopColor);
              stop.transition().duration(1000).attr("stop-color",function(d){
                              return d3.rgb(curStopColor).brighter(3);    
              });

              
            });

            //console.log(commits);
            /*
            for( key in commits) {
              d3.select(escape("#"+key))
              .transition().duration(1000)
              .style("fill", function(d){return d3.rgb(this.style.fill).brighter(commits[key]);});
            }
            */

          });

        });
    //makeItShine(commits);
    });
  }

  function makeItShine(d){

    console.log(d, Object.keys(d));

    for(var k in d) {
      //d3.select(escape("#"+key))
      //.transition().duration(1000)
      //.style("fill", function(d){return d3.rgb(this.style.fill).brighter(d[key]);});
      console.log(k);
    }

  }

  Array.prototype.select = function(closure){
    for(var n = 0; n < this.length; n++) {
      if(closure(this[n])){
        return this[n];
      }
    }
    return null;
  };

  function escape(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  function parseData(data) {
    var nNode=0;
    var root = {};
    root.children = [];
    for(var i =0; i < data.length;i++){
      var current = root.children;
      var steps = data[i].path.split('/');
      var steps_len = steps.length;
      for(var j = 0 ; j < steps_len;j++) {
        var step = steps[j];
        if(j == steps_len - 1) {
          current.push({name:step, size:data[i].size, url:data[i].url, path:data[i].path});
          break;
        }
        current = current.select(function(v){return v.name == step;});
        if(current.children == null) ++nNode;
        current.children =  current.children || [];
        current = current.children;
      }
    }
    //console.log(nNode, data.length);
    setPalette(nNode);
    return root;
  }