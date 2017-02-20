Date.prototype.isLeapYear = function() {
    var year = this.getFullYear();
    if((year & 3) != 0) return false;
    return ((year % 100) != 0 || (year % 400) == 0);
};

// Get Day of Year
Date.prototype.getDOY = function() {
    var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var mn = this.getMonth();
    var dn = this.getDate();
    var dayOfYear = dayCount[mn] + dn;
    if(mn > 1 && this.isLeapYear()) dayOfYear++;
    return dayOfYear;
};

var map = L.map('map', {"scrollWheelZoom" : false}).setView(["38.5", "-81"], 6);

var baselayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' }).addTo(map);

var tip = d3.tip().attr('class', 'd3-tip').html(function (d) { return d; });

function handleMapClick (e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    createGraphDiv(lat, lng);
    createMarker(lat, lng);
}

map.on("click", handleMapClick);

function createGraphDiv (lat, lng) {
    var div = document.createElement("div");
    var content = document.createTextNode("Lat: " + lat + ", Lon: " + lng);
    div.appendChild(content);
    div.classList.add("graph-elem")
    getData(lat, lng, div);
}

function getData(lat, lng, div) {
    var url = "https://fcav-ndvi.nemac.org/landdat_product.cgi?args=" + lng + "," + lat;
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        var response = this.responseText;
        response = response.replace(/\[|\]|\'/g, "").split(", ");
        drawGraph(response, div);
        console.log(response)
    });
    oReq.open("GET", url);
    oReq.send()
}

function drawGraph(data, div) {
    data = splitData(data);
    var reprocessedData = reprocessData(data);
    makeUpDownLineGraph(data, div, reprocessedData["medians"]);
    makeUpDownOverlapingLineGraphWithCheckboxes(reprocessedData, div);
    console.log(reprocessedData);
    var list = document.getElementById("graph-list");
    list.appendChild(div);
}

function makeUpDownLineGraph (data, div, averages) {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 25},
        width = 580 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    // Set the ranges
    var x = d3.scaleTime().range([0, width])
        .domain([
            parseDate(data[0][0]),
            parseDate(data[data.length-1][0])
        ]);
    var y = d3.scaleLinear().range([height, 0])
        .domain([0, 100]);

    // Define the axes
    var xAxis = d3.axisBottom(x)
        .ticks(16)
        .tickFormat(function (d) {
            return d.getFullYear();
        });
    
    var yAxis = d3.axisLeft(y)
        .ticks(6);

    // Define the line
    var valueline = d3.line()
        .x(function(d) { return x(parseDate(d[0])); })
        .y(function(d) { return y(d[1]); });
    
    // Adds the svg canvas
    var svg = d3.select(div)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

    // Add the valueline path.
    drawLinearPath(data, valueline, svg);

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    /**
     * This block of code draws the point at each data point
     */
    drawLinearPoints(data, valueline, svg, averages);
}

function makeUpDownOverlapingLineGraphWithCheckboxes (data, div) {
    var year = "2015";

    var charts = {};

    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 25},
        width = 500 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    var averages = data.medians;

    var x = d3.scaleLinear().range([0, width])
        .domain([0, 365]);
    var y = d3.scaleLinear().range([height, 0])
        .domain([0, 100]);

    // Define the axes
    function formatMonthTick (d) {
        return (MONTH_LABELS[(d-15)/30]);
    }
    var xAxis = d3.axisBottom(x)
        .ticks(11)
        .tickValues([15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345])
        .tickFormat(formatMonthTick);
    
    var yAxis = d3.axisLeft(y)
        .ticks(6);

    // Define the line
    var valueline = d3.line()
        .x(function(d, i) { return (Array.isArray(d) ? x(parseJulianDay(d[0])) : x((i * 8) + 3 )); })
        .y(function(d) { return (Array.isArray(d) ? y(d[1]) : y(d)); });

    var wrapper = d3.select(div).append("div");
    
    // Adds the svg canvas
    var svg = wrapper
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    charts["medians"] = {
        "path" : drawLinearPath(data["medians"], valueline, svg)
    };

    charts[year] = {
        "path" : drawLinearPath(data[year], valueline, svg)
    };

    /**
     * This block of code draws the point at each data point
     */
    charts["medians"]["points"] = drawLinearPoints(data["medians"], valueline, svg, averages);
    charts[year]["points"] = drawLinearPoints(data[year], valueline, svg, averages);

    var inputwrapper = wrapper.append("div").classed("input-wrapper", true);

    data.keys.forEach(function (key) {
        console.log(key)
        createCheckbox(inputwrapper, key, "timeseries", year, charts, data, valueline, svg, averages);
    });

    createCheckbox(inputwrapper, "medians", "timeseries", "medians", charts, data, valueline, svg, averages);
}

function drawLinearPath(data, line, svg) {
    return svg.append("path")
        .attr("class", "line")
        .attr("d", line(data))
}

function drawLinearPoints(data, line, svg, averages) {
    return svg.selectAll("point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("transform", function(d, i) {
            var point = Array.isArray(d) ? d : [(i*8) + 3, d];
            var coors = line([point]).slice(1).slice(0, -1);
            return "translate(" + coors + ")"
        })
        .attr("r", 3)
        .attr("stroke", "#000")
        .attr("fill",function(d,i){
            var val = Array.isArray(d) ? d[1] : d;
            return computeColor(val, averages[i%46], 3);
        })
        .on("mouseover", handlePointMouseover)
        .on("mouseout", handlePointMouseout);
}

function handlePointMouseover(d) {
    var tipString = Array.isArray(d) ? formatDate(d[0]) + ": "  + d[1] : "Average: "  + d;
    tip.show(tipString);
    this.setAttribute("r", 5);
    this.setAttribute("stroke-width", "2px");
}

function handlePointMouseout(d) {
    tip.hide();
    this.setAttribute("r", 3);
    this.setAttribute("stroke-width", "1px");
}

function createCheckbox(wrapper, key, type, year, charts, data, line, svg, averages) {
    var checkboxWrapper = wrapper.append("div");

    checkboxWrapper.append("input")
        .attr("type", "checkbox")
        .attr("id", type + "-" + key)
        .attr("value", key)
        .property("checked", (key === year) ? true : false)
        .on("change", function (e) {
            var newYear = this.value;
            if (!this.checked) {
                charts[newYear].path.remove();
                charts[newYear].points.remove();
            } else {
                if (!charts.hasOwnProperty(newYear)) {
                    charts[newYear] = {};
                }
                charts[newYear].path = drawLinearPath(data[newYear], line, svg);
                charts[newYear].points = drawLinearPoints(data[newYear], line, svg, averages);
            }
        });

    checkboxWrapper.append("label")
        .text(key)
        .attr("for", type + "-" + key);
}

function createMarker (lat, lng) {
    var marker = L.marker([lat, lng]).addTo(map);
}

function splitData(data) {
    var i;
    for (i = 0; i < data.length; i++) {
        data[i] = data[i].split(",");
    }
    return data;
}

function reprocessData (origdata) {
    var data = {};
    var point;
    var key;
    var i, j;

    data["keys"] = [];
    for (i = 0; i < origdata.length; i++) {
        point = origdata[i];
        key = point[0].substring(0,4);
        if (!data.hasOwnProperty(key)) {
            data[key] = [];
            data["keys"].push(key);
        }
        data[key].push(point);
    }

    var dataForMedians;
    var median;
    data["medians"] = [];
    for (i = 0; i < 46; i++) {
        dataForMedians = [];
        for (j = i; j < origdata.length; j += 46) {
            dataForMedians.push(origdata[j][1]);
        }

        median = dataForMedians.sort()[Math.floor(dataForMedians.length/2)];
        data["medians"].push(median);
    }

    return data;
}

function computeColor (value, median, scale) {
    var diff = value - median;
    var percent_diff = (Math.abs(diff)/median) * 100 * scale;
    var lightness = (100 - percent_diff) + "%";

    if (diff > 0) {
        return "hsl(8, 79%, " + lightness + ")";
    } else {
        return "hsl(219, 79%, " + lightness + ")";
    }
}

function parseDate (date) {
    date = date.toString();
    var year = date.substring(0, 4);
    var month = parseInt(date.substring(4, 6), 10) - 1;
    var day = date.substring(6, 8);

    return new Date(year, month, day);
}

function parseJulianDay (date) {
    if (typeof(date) === "string") {
        date = parseDate(date);
        return date.getDOY();
    } else {
        return date;
    }
}

function formatDate (date) {
    if (date === "Average") { return date; }

    date = parseDate(date);
    return formatMonth(date.getMonth()) + " " + ordinal_suffix_of(date.getDate()) + ", " + date.getFullYear();
}

function formatMonth (month) {
    switch (month) {
        case 0:
            return "Jan."
        case 1:
            return "Feb."
        case 2:
            return "Mar."
        case 3:
            return "Apr."
        case 4:
            return "May"
        case 5:
            return "Jun."
        case 6:
            return "Jul."
        case 7:
            return "Aug."
        case 8:
            return "Sep."
        case 9:
            return "Oct."
        case 10:
            return "Nov."
        case 11:
            return "Dec."
    }
}

function ordinal_suffix_of(day) {
    var j = day % 10,
        k = day % 100;
    if (j === 1 && k !== 11) {
        return day + "st";
    }
    if (j === 2 && k !== 12) {
        return day + "nd";
    }
    if (j === 3 && k !== 13) {
        return day + "rd";
    }
    return day + "th";
}

var MONTH_LABELS = {
    0: "Jan",
    1: "Feb",
    2: "Mar",
    3: "Apr",
    4: "May",
    5: "Jun",
    6: "Jul",
    7: "Aug",
    8: "Sep",
    9: "Oct",
    10: "Nov",
    11: "Dec"
};
