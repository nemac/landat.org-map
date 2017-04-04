import {updatePanelDragOverlayHeight} from './panel'

var tip;

export function SetupGraphs () {
    d3.selectAll(".graph-type-btn").on("click", handleGraphTypeBtnClick);
    extendDateModule();
    tip = d3.tip().attr('class', 'd3-tip').html(function (d) { return d; });
}

function extendDateModule () {
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
}

export function BindGraphEvents (map) {
    map.on("click", handleMapClick);
}

var baseIcon = L.Icon.extend({});

var graphIcon = new baseIcon({
    iconUrl: 'imgs/blue_icon.png',
    shadowUrl: 'imgs/marker_shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var hoverIcon = new baseIcon({
    iconUrl: 'imgs/orange_icon.png',
    shadowUrl: 'imgs/marker_shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function handleMapClick (e) {
    var map = this;
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;

    var div = createGraphDiv(lat, lng);
    var marker = createMarker(map, lat, lng);
    d3.select(div).on("mouseenter", function () {
        marker.setIcon(hoverIcon);
    })
    d3.select(div).on("mouseleave", function () {
        marker.setIcon(graphIcon);
    })
    createGraphRemover(map, div, marker);
}

function createMarker (map, lat, lng) {
    return L.marker([lat, lng], {icon: graphIcon}).addTo(map);
}

function createGraphRemover (map, div, marker) {
    var elem = createGraphRemoverElem();
    div.appendChild(elem);
    d3.select(elem).on("click", function () {
        var list = document.getElementById("graph-list");
        list.removeChild(div);
        map.removeLayer(marker);
        updatePanelDragOverlayHeight()
    });
}

function createGraphRemoverElem () {
    var elem = document.createElement("button");
    elem.className = "remove-graph";
    elem.innerText = String.fromCharCode("10005");
    elem.setAttribute("title", "Remove graph");
    return elem;
}

////////////////////// GRAPH DATA PROCESSING ///////////////////////////////

function getData(lat, lng, div) {
    var url = "https://fcav-ndvi.nemac.org/landdat_product.cgi?args=" + lng + "," + lat;
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
        var response = this.responseText;
        response = response.replace(/\[|\]|\'/g, "").split(", ");
        drawGraph(response, div, lat, lng);
        updatePanelDragOverlayHeight()
    });
    oReq.open("GET", url);
    oReq.send()
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

////////////////////// GRAPH INTERFACE ///////////////////////////

function handleGraphTypeBtnClick () {
    var type = this.dataset.type;
    var activeElem = document.getElementsByClassName("graph-type-btn active")[0];
    var activeType = activeElem.dataset.type;

    if (type === activeType) {
        return;
    }

    d3.select("#graph-list")
        .classed("graph-" + activeType, false)
        .classed("graph-" + type, true);

    d3.select(activeElem).classed("active", false);
    d3.select(this).classed("active", true);
}

function createGraphDiv (lat, lng) {
    var div = document.createElement("div");
    var content = document.createTextNode("Lat: " + lat + ", Lon: " + lng);
    div.appendChild(content);
    div.classList.add("graph-elem")
    getData(lat, lng, div);
    return div;
}

function drawGraph(data, div, lat, lng) {
    data = splitData(data);
    var reprocessedData = reprocessData(data);
    makeUpDownLineGraph(data, div, reprocessedData["medians"]);
    makeUpDownOverlapingLineGraphWithCheckboxes(reprocessedData, div, lat, lng);
    drawUpDownPolarWithCheckboxesAndThresholds(reprocessedData, div, lat, lng);
    var list = document.getElementById("graph-list");
    list.appendChild(div);
}

///////////////////// TIMESERIES LINE GRAPH ////////////////////////////////

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

    var wrapper = d3.select(div)
        .append("div")
        .classed("timeseries-graph", true);

    // Adds the svg canvas
    var svg = wrapper
        .append("svg")
        //.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr('viewBox', function () {
            var w = width + margin.left + margin.right
            var h = height + margin.top + margin.bottom
            return '0 0 ' + w + ' ' + h
        })
        .attr('preserveAspectRatio', 'xMidYMid')
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

///////////////// OVERLAPPING TIMESERIES LINE GRAPH ////////////////

function makeUpDownOverlapingLineGraphWithCheckboxes (data, div, lat, lng) {
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

    var wrapper = d3.select(div).append("div").classed("overlapping-graph", true);

    // Adds the svg canvas
    var svg = wrapper
        .append("svg")
            .attr('viewBox', function () {
                var w = width + margin.left + margin.right
                var h = height + margin.top + margin.bottom
                return '0 0 ' + w + ' ' + h
            })
            .attr('preserveAspectRatio', 'xMidYMid')
            //.attr("width", width + margin.left + margin.right)
            //.attr("height", height + margin.top + margin.bottom)
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
        createCheckbox(inputwrapper, key, "timeseries", year, charts, data, valueline, svg, averages, lat, lng);
    });

    createCheckbox(inputwrapper, "medians", "timeseries", "medians", charts, data, valueline, svg, averages, lat, lng);
}

///////////////////////// POLAR GRAPH //////////////////////////////////////

function drawUpDownPolarWithCheckboxesAndThresholds (data, div, lat, lng) {
    var year = "2015";
    var width = 490,
        height = 490,
        radius = Math.min(width, height) / 2 - 30;

    var averages = data["medians"];
    var center = findPolarCenter(data);
    var thresholds = findPolarThresholds(averages, center[1][0]);

    /**
     * Sets up scaling of data. We know that the ndvi values fall between
     * 0 & 100 so we set our domain to that. The range controls where the
     * points will lie in our graph, so we set them to be between 0 and the
     * radius.
     */
    var r = d3.scaleLinear()
        .domain([0, 100])
        .range([0, radius]);

    /**
     * function which will draw each point. To compute the distance from the
     * center each point is we pass the datapoint to the function defined above.
     * To determine the angle from the origin we need to convert the day to
     * radians, so we convert the day to a number between 0 & 1 and then multiply
     * it by 2 pi.
     */
    var line = d3.radialLine()
        .radius(function(d) { return Array.isArray(d) ? r(d[1]) : r(d); })
        .angle(function(d, i) {
            var day = Array.isArray(d) ? parseJulianDay(d[0]) : (i * 8) + 3;
            return ((((day - 1)%365)/365) * (2*Math.PI));
        });

    /**
     * Sets up the canvas where the circle will be drawn.
     */
    var wrapper = d3.select(div).append("div").classed("polar-graph", true);
    var svg = wrapper.append("svg")
        //.attr("width", width)
        //.attr("height", height)
        .attr('viewBox', function () {
            return '0 0 '+ width + ' ' + height
        })
        .attr('preserveAspectRatio', 'xMidYMid')
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.call(tip);

    /**
     * This block of code draws the big circles of the graph & their labels
     */
    var gr = svg.append("g")
        .attr("class", "r axis")
        .selectAll("g")
        .data(r.ticks(5).slice(1))
        .enter().append("g");

    gr.append("circle")
        .attr("r", r);

    gr.append("text")
        .attr("y", function(d) { return -r(d) - 4; })
        .attr("transform", "rotate(15)")
        .style("text-anchor", "middle")
        .text(function(d) { return d; });

    /**
     * This block of code draws the labels for each month and the lines
     * that go out to them.
     */
    var ga = svg.append("g")
        .attr("class", "a axis")
        .selectAll("g")
        .data(d3.range(0, 360, 30))
        .enter().append("g")
            .attr("transform", function(d) { return "rotate(" + (d - 90) + ")"; });

    ga.append("line")
        .attr("x2", radius);

    ga.append("text")
        .attr("x", radius + 6)
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { return d < 360 && d > 180 ? "end" : null; })
        .attr("transform", function(d) { return d < 360 && d > 180 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
        .text(function(d) { return MONTH_LABELS[d/30]; });

    /**
     * Draws the threshold lines
     */
    var thresholdElem = svg.append("g")
        .selectAll("g")
        .data(thresholds)
        .enter().append("g")
            .attr("transform", function(d) { return "rotate(" + (d.data[1][0] - 90) + ")"; });

    thresholdElem.append("line")
        .attr("class", "line")
        .attr("x2", radius);

    thresholdElem.append("text")
        .attr("x", radius + 6)
        .attr("y", function (d) { return ((((d.data[1][0] - 1)%365)/365) * (2*Math.PI)); })
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { var day = d.data[1][0]; return day < 360 && day > 180 ? "end" : null; })
        .attr("transform", function(d) { var day = d.data[1][0]; return day < 360 && day > 180 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
        .text(function(d) { return d.label; });

    /**
     * Draws the line to the center of the data
     */
    var centerDay = center[1][0];
    var centerDayOpposite = (centerDay + (365/2)) % 365;
    var centerDayData = [centerDay, 100];
    var centerDayOppositeData = [centerDayOpposite, 100];
    var growingSeasonData = [centerDayData, centerDayOppositeData]

    drawPolarPath(growingSeasonData, line, svg)
        .classed("growing-season-line", "true");

    drawPolarPath(center, line, svg)
        .classed("center-line", "true");

    svg.selectAll("point")
        .data([center[1]])
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("transform", function(d) {
            var coors = line([d]).slice(1).slice(0, -1);
            return "translate(" + coors + ")"
        })
        .attr("r", 2.5)
        .attr("stroke", "#000")
        .attr("fill", "#dd82d2")
        .on("mouseover", function(d) {
            tip.show("Center: "  + String(d[1]).substring(0, 7));
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 2.5);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });

    var charts = {};

    /**
     * This block of code draws the line that the data follows
     */
    charts["medians"] = {
        "path" : drawPolarPath(averages, line, svg)
    };

    charts[year] = {
        "path" : drawPolarPath(data[year], line, svg)
    };

    /**
     * This block of code draws the point at each data point
     */
    charts.medians.points = drawLinearPoints(averages, line, svg, averages);
    charts[year].points = drawLinearPoints(data[year], line, svg, averages);

    var inputwrapper = wrapper.append("div").classed("input-wrapper", true);

    data.keys.forEach(function (key) {
        var checkboxWrapper = inputwrapper.append("div");

        checkboxWrapper.append("input")
            .attr("type", "checkbox")
            .attr("id", "polar-" + key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""))
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

                    charts[newYear].path = drawPolarPath(data[newYear], line, svg);
                    charts[newYear].points = drawLinearPoints(data[newYear], line, svg, averages);
                }
            });

        checkboxWrapper.append("label")
            .text(key)
            .attr("for", "polar-" + key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""));
    });

    var checkboxWrapper = inputwrapper.append("div");

    checkboxWrapper.append("input")
        .attr("type", "checkbox")
        .attr("id", "polar-average-" + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""))
        .attr("value", "medians")
        .property("checked", true)
        .on("change", function (e) {
            var newYear = this.value;
            if (!this.checked) {
                charts[newYear].path.remove();
                charts[newYear].points.remove();
            } else {
                if (!charts.hasOwnProperty(newYear)) {
                    charts[newYear] = {};
                }

                charts[newYear].path = drawPolarPath(data[newYear], line, svg)

                charts[newYear].points = drawLinearPoints(data[newYear], line, svg, averages);
            }
        });

    checkboxWrapper.append("label")
        .text("Baseline")
        .attr("for", "polar-average-" + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""));

    var thresholdCheckbox= inputwrapper.append("div")
        .classed("threshold-checkbox", true);

    thresholdCheckbox.append("input")
        .attr("type", "checkbox")
        .attr("id", "threshold-checkbox-" + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""))
        .property("checked", true)
        .on("change", function (e) {
            thresholdElem.style("opacity", (this.checked) ? 1 : 0);
        });

    thresholdCheckbox.append("label")
        .text("Thresholds")
        .attr("for", "threshold-checkbox-" + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""));
}

/* POLAR GRAPH HELPERS */

function findPolarCenter (data) {
    var i, j, length, arr;
    var totalSum = 0;
    var incompleteYears = 0;
    var sum;
    length = 46;

    for (i = 0; i < data.keys.length; i++) {
        arr = data[data.keys[i]];
        if (arr.length !== length) {
            incompleteYears++;
            continue;
        }
        sum = 0;
        for (j = 0; j < length/2; j++) {
            sum += (arr[j][1] - arr[j+23][1]);
        }
        sum = sum / 23;
        totalSum += sum;
    }
    totalSum = Math.abs(totalSum) / (data.keys.length - incompleteYears);

    var areaDiff = 1000000;
    var checkDiff;
    var areaIndex = 0;
    var leftArea, rightArea;
    var avgs = data.medians;
    var k, counter;

    for (i = 0; i < length/2; i++) {
        leftArea = 0;
        rightArea = 0;
        for (counter = 0; counter < length/2; counter++) {
            j = (i + counter) % 46;
            k = (j + 23) % 46;

            leftArea += parseInt(avgs[j], 10);
            rightArea += parseInt(avgs[k],10);
        }
        checkDiff = Math.abs(leftArea - rightArea);
        if (checkDiff < areaDiff) {
            areaDiff = checkDiff;
            areaIndex = i;
        }
    }

    var firstRadius = parseInt(avgs[areaIndex], 10);
    var secondRadius = parseInt(-avgs[areaIndex + 23], 10);

    var firstDiff = Math.abs(totalSum - firstRadius) - Math.abs(totalSum - secondRadius);
    var secondDiff = Math.abs(-totalSum - firstRadius) - Math.abs(-totalSum - secondRadius);
    if (secondDiff > firstDiff) {
        areaIndex = areaIndex + 23;
    }

    var circlecenter = [0, 0];
    var datacenter = [(areaIndex * 8) + 3, totalSum];

    return([circlecenter, datacenter]);
}

/**
 * startDay is actually the seasonality index, if it occurs after july it should be flipped
 */
function findPolarThresholds (data, startDay) {
    var startIndex = Math.floor((startDay - 3) / 8);
    if (startIndex > 22) {
        startIndex = startIndex - 23;
    }

    var i, j, length, arr;
    var totalSum = 0;
    var sum;
    length = 46;

    for (i = 0; i < length; i++) {
        j = (startIndex + i) % length;
        totalSum += parseInt(data[j], 10);
    }

    var fifteenThreshold = totalSum * .15;
    var eightyThreshold = totalSum * .80;
    var eightyfiveThreshold = totalSum * .85;
    var fifteenIndexFound = false, 
        eightyIndexFound = false,
        eightyfiveIndexFound = false;
    var fifteenIndex, eightyIndex, eightyfiveIndex;

    totalSum = 0;
    for (i = 0; i < length; i++) {
        j = (startIndex + i) % length;
        totalSum += parseInt(data[j], 10);
        if (!fifteenIndexFound && totalSum > fifteenThreshold) {
            fifteenIndex = j;
            fifteenIndexFound = true;
            continue;
        }
        if (!eightyIndexFound && totalSum > eightyThreshold) {
            eightyIndex = j;
            eightyIndexFound = true;
            continue;
        }
        if (!eightyfiveIndexFound && totalSum > eightyfiveThreshold) {
            eightyfiveIndex = j;
            eightyfiveIndexFound = true;
            break;
        }
    }

    var circleCenter = [0, 0];

    var fifteenEnd = [(fifteenIndex * 8) + 3, 100];
    var eightyEnd = [(eightyIndex * 8) + 3, 100];
    var eightyfiveEnd = [(eightyfiveIndex * 8) + 3, 100];

    return [
        {
            "label" : "15%",
            "data" : [circleCenter, fifteenEnd]
        },
        {
            "label" : "80%",
            "data" : [circleCenter, eightyEnd]
        },
        {
            "label" : "85%",
            "data" : [circleCenter, eightyfiveEnd]
        }
    ];
}

//////////////////////// GRAPH HELPERS ///////////////////////////////////

function drawLinearPath(data, line, svg) {
    return svg.append("path")
        .attr("class", "line")
        .attr("d", line(data));
}

function drawPolarPath(data, line, svg) {
    return svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);
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

function createCheckbox(wrapper, key, type, year, charts, data, line, svg, averages, lat, lng) {
    var checkboxWrapper = wrapper.append("div");

    checkboxWrapper.append("input")
        .attr("type", "checkbox")
        .attr("id", type + "-" + key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""))
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
        .attr("for", type + "-" + key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""));
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

///////////////////////// DATE HELPERS /////////////////////////////////

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
