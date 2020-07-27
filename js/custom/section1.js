function drawMap(mapData, crimeUnemploymentData) {
    var width  = 500;
    var height = 350;
    var centered;

    var svg = d3.select("#section1Map").attr("width", width).attr("height", height).attr("class", "svg");
    var g = svg.append("g");

    var projection = d3.geoMercator()
        .scale(3500)
        .translate([-8590,-2200]);

    var path = d3.geoPath()
        .projection(projection);

    var textTooltip = d3.select("body")
        .append("div")
        .attr("class", "textTooltip")
        .style("opacity", 0);

    var multilineTooltip = d3.select("#section1MapContainer")
        .append("div")
        .attr("class", "multilineTooltip");

    //绘制地图
    g.selectAll("path")
        .data(mapData.features)
        .enter()
        .append("path")
        .attr("stroke","#000")
        .attr("stroke-width",1)
        .attr("fill", function(d,i){
          return "gray";
        })
        .attr("d", path )
        .on("mouseover",function(d,i){
            textTooltip
                .html(d.properties.LGA_NAME15)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px")
                .style("opacity", 1);
        })
        .on("mouseout",function(d,i){
            textTooltip.style("opacity", 0);
        })
        .on("click", function(d) {
            // Zoom in
            var x, y, k;
            if (d && centered !== d) {
                var centroid = path.centroid(d);
                x = centroid[0];
                y = centroid[1];
                k = 4;
                centered = d;

                // Draw multiline chart
                d3.select(".multilineTooltip svg").remove();
                var multilineTooltipSVG = d3.select(".multilineTooltip")
                    .append("svg")
                    .attr("class","mytooltip")
                    .attr("width", 400)
                    .attr("height", 200);
                drawMultiline(multilineTooltipSVG, crimeUnemploymentData.filter(function(e) { return e.Area === d.properties.LGA_NAME15; }));
                multilineTooltip.style("opacity", 1);
            } else {
                x = width / 2;
                y = height / 2;
                d3.select(".mytooltip")
                    .attr("width", 0)
                    .attr("height", 0)
                k = 1;
                centered = null;
                multilineTooltip.style("opacity", 0);
            }

            g.selectAll("path")
                .classed("active", centered && function(d) { return d === centered; });

            g.transition()
                .duration(750)
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                .style("stroke-width", 1.5 / k + "px");
        });
    return g;
}


function drawMultiline(svg, data) {
    data = data.map(function(e) {
        e.Crime = parseFloat(e.Crime);
        e.Unemployment = parseFloat(e.Unemployment);
        e.Year = parseInt(e.Year);
        return e;
    });

    var crime = data.map(function(e) { return { Year: e.Year, Value: e.Crime } });
    var unemployment = data.map(function(e) { return { Year: e.Year, Value: e.Unemployment } });

    data = [{
        "name": "Crime",
        "color": "red",
        "latest": crime.find(function(e) {
            return e.Year === Math.max.apply(null, crime.map(function(e) { return e.Year }))
        }).Value,
        "history": crime
    }, {
        "name": "Unemployment",
        "color": "green",
        "latest": unemployment.find(function(e) {
            return e.Year === Math.max.apply(null, unemployment.map(function(e) { return e.Year }))
        }).Value,
        "history": unemployment
    }]

    var margin = {top: 40, right: 120, bottom: 30, left: 60};
    var width = 400 - margin.left - margin.right;
    var height = 200 - margin.top - margin.bottom;

    // Define the scales and tell D3 how to draw the line
    var x = d3
        .scaleLinear()
        .domain([2010, 2019])
        .range([0, width]);     
    var y = d3
        .scaleLinear()
        .domain([
            Math.min(
                Math.min.apply(null, crime.map(function(e) { return e.Value })),
                Math.min.apply(null, unemployment.map(function(e) { return e.Value }))
            ),
            Math.max(
                Math.max.apply(null, crime.map(function(e) { return e.Value })),
                Math.max.apply(null, unemployment.map(function(e) { return e.Value }))
            ),
        ])
        .range([height, 0]);
    var line = d3.line().x(function(d) { return x(d.Year) }).y(function(d) { return y(d.Value) });
    var chart = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var multilineTooltipTooltip = d3.select('body').append('div').attr("class", "multilineTooltipTooltip");
    var multilineTooltipTooltipLine = chart.append('line');

    // Add the axes and a title
    var xAxis = d3.axisBottom(x).tickFormat(d3.format('.4'));
    var yAxis = d3.axisLeft(y).tickFormat(d3.format('.2s'));
    chart.append('g').call(yAxis); 
    chart.append('g').attr('transform', 'translate(0,' + height + ')').call(xAxis);

    chart.selectAll()
        .data(data).enter()
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', function(d) { return d.color })
        .attr('stroke-width', 2)
        .datum(function(d) { return d.history })
        .attr('d', line);

    chart.selectAll()
        .data(data).enter()
        .append('text')
        .html(function(d) { return d.name; })
        .attr('fill', function(d) { return d.color })
        .attr('alignment-baseline', 'middle')
        .attr('x', width)
        .attr('dx', '.5em')
        .attr('y', function(d) { return y(d.latest) });
    
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", 12)
        .attr("x", -70)
        .attr("transform", "rotate(-90)")
        .text("Z Score Value");
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", 12)
        .attr("x", 350)
        .text("Z Score Value of The Population of Crime and Unemployment");
    
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", 200)
        .attr("x", 180)
        .text("Year");

    var tipBox = chart.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('opacity', 0)
        .on('mousemove', drawTooltip)
        .on('mouseout', removeTooltip);

    function removeTooltip() {
        if (multilineTooltipTooltip) multilineTooltipTooltip.style('display', 'none');
        if (multilineTooltipTooltipLine) multilineTooltipTooltipLine.attr('stroke', 'none');

    }

    function drawTooltip() {
        var year = Math.round((x.invert(d3.mouse(tipBox.node())[0])));
        data.sort(function(a, b) {
            return b.history.find(function(h) { return h.Year == year }).Value - a.history.find(function(h) { return h.Year == year }).Value;
        });

        

        multilineTooltipTooltipLine.attr('stroke', 'black')
            .attr('x1', x(year))
            .attr('x2', x(year))
            .attr('y1', 0)
            .attr('y2', height);
        
        multilineTooltipTooltip.html(year)
            .style('left', (d3.event.pageX + 20) + "px")
            .style('top', (d3.event.pageY - 20) + "px")
            .style('display', 'block')
            .style('position', 'absolute')
            .selectAll()
            .data(data).enter()
            .append('div')
            .style('color', function(d) { return d.color })
            .html(function(d) {
                return d.name + ': ' + Math.round((d.history.find(function(h) { return h.Year == year }).Value + Number.EPSILON) * 100) / 100;
            });
        
        

     }
}

var CRIMETYPE = "crime-type";
var YEAR = "year";
var colorScale = d3.scaleThreshold().domain([1, 10, 100, 1000, 3000, 10000]).range(d3.schemeBlues[7]);

function fillMap(g, data) {

    var legend = d3.legendColor()
        .labelFormat(d3.format(".0f"))
        .labels(d3.legendHelpers.thresholdLabels)
        .scale(colorScale);
    d3.select("#section1MapLegend").call(legend);

    updateMapColor(data);
    var filterWrapper = d3.select("#section1FilterWrapper");

    var crimeTypes = ["All"].concat(data.map(function(d) {
        return d.Type;
    }).filter(function(a, i, self) {
        return self.indexOf(a) == i;
    }));
    var crimeTypeFilterContainer = filterWrapper.append("div").attr("class", "filterContainer");
    crimeTypeFilterContainer.append("label").attr("for", CRIMETYPE).text("Crime Type");
    var crimeTypeSelection = crimeTypeFilterContainer.append("select").attr("id", CRIMETYPE);
    var crimeTypeFilter = document.getElementById(CRIMETYPE);
    crimeTypeSelection.on("change", function(){
        var selectedCrimeType = crimeTypeFilter.options[crimeTypeFilter.selectedIndex].text;
        if (selectedCrimeType === "All") {
            return updateMapColor(data);
        }
        return updateMapColor(data.filter(function(e) { return e.Type === selectedCrimeType; }));
    });
    crimeTypeFilter.value = "All";
    crimeTypeSelection.selectAll("option")
        .data(crimeTypes)
        .enter().append("option")
        .attr("value", function(d){
            return d;
        })
        .text(function(d){
            return d;
        });

   
         
    var myTimer;

    d3.select("#range")
        .on("input propertychange",function(d,i){
            val = this.value;
            clearInterval (myTimer);
            document.getElementById("start").innerHTML = "start"
             var location=document.getElementById("show"); 
            location.value=val; 
            updateMapColor(data.filter(function(e) { return e.Year === val; }));
        });

    d3.select("#start").on("click", function() {
        a = document.getElementById("start").innerHTML;
        if(a=="start"){
            document.getElementById("start").innerHTML = "stop";
            clearInterval (myTimer);
            myTimer = setInterval (function() {
            var b= d3.select("#range");
              var t = (+b.property("value") + 1) % (+b.property("max") + 1);
              if (t == 0) { t = +b.property("min"); }
              b.property("value", t);
              d3.select("#start").property("value", "stop");
              var location=document.getElementById("show"); 
            location.value=t+""; 
              updateMapColor(data.filter(function(e) { return e.Year === t+""; }));
            }, 1000);
        }
        else
        {
            clearInterval (myTimer);
            document.getElementById("start").innerHTML = "start";
        }
        
    });


    var years = ["All"].concat(data.map(function(d) {
        return d.Year;
    }).filter(function(a, i, self) {
        return self.indexOf(a) == i;
    }));

    var yearFilterContainer = filterWrapper.append("div").attr("class", "filterContainer");
    yearFilterContainer.append("label").attr("for", YEAR).text("Year");
    var yearSelection = yearFilterContainer.append("select").attr("id", YEAR);
    var yearFilter = document.getElementById(YEAR);
    yearSelection.on("change", function() {
        var selectedYear = yearFilter.options[yearFilter.selectedIndex].text;
        if (selectedYear === "All") {
            return updateMapColor(data);
        }
        return updateMapColor(data.filter(function(e) { return e.Year === selectedYear; }));
    });
    yearFilter.value = "All";
    yearSelection.selectAll("option")
        .data(years)
        .enter().append("option")
        .attr("value", function(d){
            return d;
        })
        .text(function(d){
            return d;
        });



    function updateMapColor(data) {
        g.selectAll("path")
        .attr("fill", function (d) {
            var totalIncidents = data
                .filter(function(e) { return e.Area === d.properties.LGA_NAME15 })
                .reduce(function(acc, cur) { return acc + parseInt(cur.Incidents) }, 0);
            return colorScale(totalIncidents);
        });
    }
}
