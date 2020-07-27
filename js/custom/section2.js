function drawSunburst(data) {
    var hierarchicalData = {name: "VIC", children: []};
    data.forEach(function(e) {
        var yearObj = { name: e.Year, size: parseInt(e.Incidents) };
        var typeObj = { name: e.Type, children: [yearObj] };
        var areaObj = { name: e.Area, children: [typeObj] };
        
        var existedAreaObj = hierarchicalData.children.find(function(c) { return c.name === e.Area });
        if (existedAreaObj) {
            var existedTypeObj = existedAreaObj.children.find(function(c) { return c.name === e.Type });
            if (existedTypeObj) {
                existedTypeObj.children.push(yearObj);
            } else {
                existedAreaObj.children.push(typeObj);
            }
        } else {
            hierarchicalData.children.push(areaObj);
        }
    });

    const width = 400,
        height = 400,
        maxRadius = (Math.min(width, height) / 2) - 5;

    const formatNumber = d3.format(',d');
    const formatFloat = d3.format(".1f");

    const x = d3.scaleLinear()
        .range([0, 2 * Math.PI])
        .clamp(true);

    const y = d3.scaleSqrt()
        .range([maxRadius*.1, maxRadius]);

    const color = d3.scaleOrdinal(d3.schemeCategory20);

    const partition = d3.partition();

    const arc = d3.arc()
        .startAngle(d => x(d.x0))
        .endAngle(d => x(d.x1))
        .innerRadius(d => Math.max(0, y(d.y0)))
        .outerRadius(d => Math.max(0, y(d.y1)));

    const middleArcLine = d => {
        const halfPi = Math.PI/2;
        const angles = [x(d.x0) - halfPi, x(d.x1) - halfPi];
        const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);

        const middleAngle = (angles[1] + angles[0]) / 2;
        const invertDirection = middleAngle > 0 && middleAngle < Math.PI; // On lower quadrants write text ccw
        if (invertDirection) { angles.reverse(); }

        const path = d3.path();
        path.arc(0, 0, r, angles[0], angles[1], invertDirection);
        return path.toString();
    };

    const textFits = d => {
        const CHAR_SPACE = 6;

        const deltaAngle = x(d.x1) - x(d.x0);
        const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
        const perimeter = r * deltaAngle;

        return d.data.name.length * CHAR_SPACE < perimeter;
    };

    svg = d3.select('#section2Sunburst')
        .style('width', width)
        .style('height', height)
        .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
        .on('click', () => focusOn()); // Reset zoom on canvas click

    hierarchicalData = d3.hierarchy(hierarchicalData);
    hierarchicalData.sum(d => d.size);

    const slice = svg.selectAll('g.slice')
        .data(partition(hierarchicalData).descendants());

    slice.exit().remove();

    const newSlice = slice.enter()
        .append('g').attr('class', 'slice')
        .on('click', d => {
            d3.event.stopPropagation();
            focusOn(d);
            drawBarChart(d,colorDic);
        });

    newSlice.append('title')
        .text(d => {
            if (d.parent)
                //console.log(d.parent.data.name,d.parent.value);
                return d.data.name + '\n' + formatNumber(d.value) + '\n' + formatFloat(d.value/d.parent.value*100)+"%";
            else
                return d.data.name + '\n' + formatNumber(d.value);
        })

    const colorDic = {};
    newSlice.append('path')
        .attr('class', 'main-arc')
        .style('fill', d => {
            var name = (d.children ? d : d.parent).data.name;
            var c = color((d.children ? d : d.parent).data.name);
            colorDic[d.data.name] = c;
            return c})
        .attr('d', arc);

    newSlice.append('path')
        .attr('class', 'hidden-arc')
        .attr('id', (_, i) => `hiddenArc${i}`)
        .attr('d', middleArcLine);

    const text = newSlice.append('text')
        .attr('display', function (d) { return (textFits(d) ? null : 'none')}) ;

    // Add white contour
    text.append('textPath')
        .attr('startOffset','50%')
        .attr('xlink:href', (_, i) => `#hiddenArc${i}` )
        .text(d => d.data.name)
        .style('fill', 'none')
        .style('stroke', '#fff')
        .style('stroke-width', 5)
        .style('stroke-linejoin', 'round');

    text.append('textPath')
        .attr('startOffset','50%')
        .attr('xlink:href', (_, i) => `#hiddenArc${i}` )
        .text(d => {
            return d.data.name
        });

    

    drawBarChart(hierarchicalData,colorDic);
    newSlice.on("mouseover", function (d) {
                svg.selectAll('g.slice')
                    .filter(function(slice){return slice.data.name != d.data.name})
                    .attr("opacity", 0.2);

                d3.select("#section2BarChart").selectAll(".bar")
                    .filter(function(rect){return rect.name != d.data.name})
                    .attr("opacity", 0.2);
                })
            .on("mouseout", function (d, i) {
                svg.selectAll('g.slice').attr("opacity", 1);
                d3.select("#section2BarChart").selectAll(".bar").attr("opacity", 1);
                });
    
    

}

function focusOn(d = { x0: 0, x1: 1, y0: 0, y1: 1 }) {
        // Reset to top-level if no data point specified
        const width = 400,
            height = 400,
            maxRadius = (Math.min(width, height) / 2) - 5;

        const formatNumber = d3.format(',d');

        const x = d3.scaleLinear()
            .range([0, 2 * Math.PI])
            .clamp(true);

        const y = d3.scaleSqrt()
            .range([maxRadius*.1, maxRadius]);
        const arc = d3.arc()
            .startAngle(d => x(d.x0))
            .endAngle(d => x(d.x1))
            .innerRadius(d => Math.max(0, y(d.y0)))
            .outerRadius(d => Math.max(0, y(d.y1)));

        const middleArcLine = d => {
            const halfPi = Math.PI/2;
            const angles = [x(d.x0) - halfPi, x(d.x1) - halfPi];
            const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);

            const middleAngle = (angles[1] + angles[0]) / 2;
            const invertDirection = middleAngle > 0 && middleAngle < Math.PI; // On lower quadrants write text ccw
            if (invertDirection) { angles.reverse(); }

            const path = d3.path();
            path.arc(0, 0, r, angles[0], angles[1], invertDirection);
            return path.toString();
        };

        const textFits = d => {
            const CHAR_SPACE = 6;

            const deltaAngle = x(d.x1) - x(d.x0);
            const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
            const perimeter = r * deltaAngle;

            return d.data.name.length * CHAR_SPACE < perimeter;
        };

        const transition = d3.select("#section2Sunburst").transition()
            //.duration(500)
            .tween('scale', () => {
                const xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]);
                return t => { x.domain(xd(t)); y.domain(yd(t)); };
            });

        transition.selectAll('path.main-arc')
            .attrTween('d', d => () => arc(d));

        transition.selectAll('path.hidden-arc')
            .attrTween('d', d => () => middleArcLine(d));

        transition.selectAll('text')
            .attrTween('display', d => () => textFits(d) ? null : 'none');

        moveStackToFront(d);

        function moveStackToFront(elD) {
            d3.select("#section2Sunburst").selectAll('.slice').filter(d => d === elD)
                .each(function(d) {
                    this.parentNode.appendChild(this);
                    if (d.parent) { moveStackToFront(d.parent); }
                })
        }
    }

function drawBarChart(hierarchicalData,colorDic) {
    var name = hierarchicalData.data.name;
    data = hierarchicalData.children.map(function(e) { return {name: e.data.name, value: e.value,children:e.children} })
    //sort bars based on value
    data = data.sort(function (a, b) {
        return d3.ascending(a.value, b.value);
    })
    total =  d3.sum(data , function( d){return d.value});;

    //set up svg using margin conventions - we'll need plenty of room on the left for labels
    var margin = {
        top: 15,
        right: 80,
        bottom: 15,
        left: 300
    };

    var width = 550 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
    const color2 = d3.scaleOrdinal(d3.schemeCategory20);
    var formatData = d3.format(".1f");

    var svg = d3.select("#section2BarChart").html("")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", 0)
        .attr("x", 250)
        .text("The Number & Percentage of Criminal Incidents from 2010 to 2019");
    
    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(data, function (d) {
            return d.value;
        })]);

    var y = d3.scaleBand()
        .rangeRound([height, 0])
        .padding(0.1)
        .domain(data.map(function (d) {
            return d.name;
        }));

    //make y axis to show bar names
    var yAxis = d3.axisLeft()
        .scale(y)
        //no tick marks
        .tickSize(0);

    var gy = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    var bars = svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("g")


    //append rects
    bars.append("rect")
        .attr("class", "bar")
        .attr("y", function (d) {
            return y(d.name);
        })
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", function (d) {
            return x(d.value);
        })
        .style('fill', d => {
            if (d.children)
                return colorDic[d.name]
            else
                return colorDic[name]
    });

    //add a value label to the right of each bar
    bars.append("text")
        .attr("class", "label")
        //y position of the label is halfway down the bar
        .attr("y", function (d) {
            return y(d.name) + y.bandwidth() / 2 + 4;
        })
        //x position is 3 pixels to the right of the bar
        .attr("x", function (d) {
            return x(d.value) + 3;
        })
        .text(function (d) {
            return d.value + "  ["+formatData(d.value/total*100)+"%]";
        });
    
    
    d3.select("#section2BarChart").selectAll(".bar")
        .on('click', d => {
            d3.select("#section2Sunburst").selectAll('g.slice')
                .filter(function(slice){return slice.data.name == d.name})
                .call(function (slice) {
                    slice = slice._groups[0][0].__data__;
                    d3.event.stopPropagation();
                    focusOn(slice);
                    drawBarChart(slice,colorDic);
                })
        });

    d3.select("#section2BarChart").selectAll(".bar").on("mouseover", function (d) {
                d3.select("#section2Sunburst").selectAll('g.slice')
                    .filter(function(slice){return slice.data.name != d.name})
                    .attr("opacity", 0.2);

                d3.select("#section2BarChart").selectAll(".bar")
                    .filter(function(rect){return rect.name != d.name})
                    .attr("opacity", 0.2);
                })
            .on("mouseout", function (d, i) {
                d3.select("#section2Sunburst").selectAll('g.slice').attr("opacity", 1);
                d3.select("#section2BarChart").selectAll(".bar").attr("opacity", 1);
                });
}
