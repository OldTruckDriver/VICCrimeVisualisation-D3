var AREAFILTERID = "section3AreaFilter";

function drawInteractiveBarChart(data) {
    var filterWrapper = d3.select("#section3FilterWrapper");
    var areas = data.map(function(d) { return d.Area; });
    var areaFilterContainer = filterWrapper.append("div").attr("class", "filterContainer");
    areaFilterContainer.append("label").attr("for", AREAFILTERID).text("Area");
    var areaSelection = areaFilterContainer.append("select").attr("id", AREAFILTERID);
    var areaFilter = document.getElementById(AREAFILTERID);
    areaSelection.on("change", function(){
        var selectedArea = areaFilter.options[areaFilter.selectedIndex].text;
        return updateInteractiveBarChart(data.find(function(e) { return e.Area === selectedArea; }));
    });
    areaFilter.value = "Ararat";
    areaSelection.selectAll("option")
        .data(areas)
        .enter().append("option")
        .attr("value", function(d){
            return d;
        })
        .text(function(d){
            return d;
        });

    updateInteractiveBarChart(data.find(function(e) { return e.Area === areaFilter.value; }));
}

function updateInteractiveBarChart(data) {
    data = Object.keys(data)
        .filter(function(k) { return k != "Area" && k })
        .map(function(k) { return { name: k, value: parseFloat(data[k]) } });

    var margin = {
        top: 10,
        right: 10,
        bottom: 100,
        left: 30
    },
    width = 920 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var y = d3.scaleLinear()
        .range([height, 0]);

    var x = d3.scaleBand()
        .range([0, width])
        .padding(.2);


    var xAxisScale = d3.scaleBand()
        .rangeRound([0, width])
        .padding(0.1)
        .domain(data.map(function (d) {
            return d.name;
        }));

    var xAxis = d3.axisBottom().scale(xAxisScale).tickFormat(function(d,i){ return data[i].name });

    var yAxis = d3.axisLeft()
        .scale(y);

    var svg = d3.select("#section3BarChart svg").html("")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function(d) {
        return d.name;
    }));

    y.domain(d3.extent(data, function(d) {
        return d.value;
    })).nice();


    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", function(d) {
            if (d.value < 0){
                return "bar negative";
            } else {
                return "bar positive";
            }

        })
        .attr("y", function(d) {
            if (d.value > 0){
                return y(d.value);
            } else {
                return y(0);
            }
        })
        .attr("x", function(d) {
            return x(d.name);
        })
        .attr("width", x.bandwidth())
        .attr("height", function(d) {
            return Math.abs(y(d.value) - y(0));
        })

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .text("Z-score")
        .attr("transform", "translate(15, 40), rotate(-90)")

    svg.append("g")
        .attr("class", "X axis")
        .attr("transform", "translate(" + 0 + "," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-90)");

    svg.append("g")
        .attr("class", "x axis")
        .append("line")
        .attr("y1", y(0))
        .attr("y2", y(0))
        .attr("x2", width);

}
