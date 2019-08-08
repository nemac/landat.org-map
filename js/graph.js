import {updatePanelDragOverlayHeight} from './panel'
import {updateShareUrl} from './share'
import {GetMap} from './map'
import {GetAjaxObject} from './parser'

var tip = {};

export function SetupGraphs () {
    d3.selectAll(".graph-type-btn").on("click", handleGraphTypeBtnClick);
    extendDateModule();
    tip = d3.tip().attr('class', 'd3-tip').html(function (d) { return d; });
}

export function removeAllGraphs() {
    var graphList = document.getElementById('graph-list')
    while (graphList.firstChild) {
        graphList.removeChild(graphList.firstChild)
    }
}

function extendDateModule () {
    Date.prototype.isLeapYear = function() {
        var year = this.getFullYear();
        if ((year & 3) != 0) return false;
        return ((year % 100) != 0 || (year % 400) == 0);
    };

    // Get Day of Year
    Date.prototype.getDOY = function() {
        var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var mn = this.getMonth();
        var dn = this.getDate();
        var dayOfYear = dayCount[mn] + dn;
        if (mn > 1 && this.isLeapYear()) dayOfYear++;
        return dayOfYear;
    };
}

////////////////////// GRAPH DATA PROCESSING ///////////////////////////////

function handleGraphDataResponse (div, poi, response) {
    response = response.replace(/\[|\]|\'/g, "").split(", ");
    drawGraph(response, div, poi);
    updatePanelDragOverlayHeight()
}

function getData(poi, div) {
    var url = "https://fcav-ndvi.nemac.org/landdat_product.cgi?args=" + poi.lng + "," + poi.lat;
    var oReq = GetAjaxObject(function (response) {
        handleGraphDataResponse(div, poi, response)
    })

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
    var expectedYearLength = 46;
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
        // The last data point for a year's data rolls over to the next year
        // at 1/3, so adjust the key (year) accordingly for these cases
        if (point[0].substring(4) === "0103") {
          key = String(parseInt(key)-1)
        }
        data[key].push(point);
    }

    var keysToBeDeleted = [];
    for (i = 0; i < data.keys.length; i++) {
        key = data.keys[i];
        if (data[key].length !== expectedYearLength) {
            keysToBeDeleted.push(key);
        }
    }

    for (i = 0; i < keysToBeDeleted.length; i++) {
        key = keysToBeDeleted[i];
        delete data[key];
        data.keys.splice(data.keys.indexOf(key), 1);
    }

    // Baseline is computed from raw data array
    var dataForBaseline;
    var mean;
    data["baseline"] = [];
    for (i = 0; i < expectedYearLength; i++) {
        dataForBaseline = [];
        for (j = i; j < origdata.length; j += expectedYearLength) {
            dataForBaseline.push(parseInt(origdata[j][1], 10));
        }

        mean = computeAverage(dataForBaseline);
        data["baseline"].push(mean);
    }

    return data;
}

function computeAverage (arr) {
    var sum = 0, i, l;

    for (i = 0, l = arr.length; i < l; i++) {
        sum += arr[i];
    }

    return (sum / l).toString();
}

////////////////////// GRAPH INTERFACE ///////////////////////////

function handleGraphTypeBtnClick () {
    var type = this.getAttribute('data-type');
    var activeType = document.getElementsByClassName("graph-type-btn active")[0].getAttribute('data-type');

    if (type === activeType) {
        return;
    }

    //send google analytics click on graph type
    ga('send', 'event', {
      eventCategory: 'graph type',
      eventAction: 'click',
      eventLabel: type,
      nonInteraction: false
    });

    HandleGraphTabChange(type, activeType);
}

export function HandleGraphTabChange (graphType) {
    if (!isGraphListEmpty()) {
        var oldActiveGraphElemHeight = document.getElementsByClassName('graph-elem')[0].scrollHeight
        var oldActiveGraphInfoHeight = document.getElementsByClassName('graph-type-info active')[0].scrollHeight
        var rightPanelScrollTop = document.getElementById('right-panel').scrollTop
    }
    disableActiveGraphTab();
    enableGraphTab(graphType);
    if (!isGraphListEmpty()) adjustScrollPosition(oldActiveGraphInfoHeight, oldActiveGraphElemHeight, rightPanelScrollTop)
    updateShareUrl();
}

function isGraphListEmpty() {
    return document.getElementsByClassName('graph-elem')[0] === undefined
}

function adjustScrollPosition(oldGraphInfoHeight, oldGraphElemHeight, oldRightPanelScrollTop) {
    var newGraphInfoHeight = document.getElementsByClassName('graph-type-info active')[0].scrollHeight
    var newGraphElemHeight = document.getElementsByClassName('graph-elem')[0].scrollHeight

    var newGraphElemHeightScale = (newGraphElemHeight / oldGraphElemHeight)
    var newRightPanelScrollTop = newGraphInfoHeight + (
        (oldRightPanelScrollTop - oldGraphInfoHeight) * newGraphElemHeightScale
    )

    document.getElementById('right-panel').scrollTop = newRightPanelScrollTop
}

function disableActiveGraphTab () {
    var activeElem = document.getElementsByClassName("graph-type-btn active")[0];
    var activeClass = "graph-" + activeElem.getAttribute("data-type");

    activeElem.classList.remove("active");
    document.getElementById("graph-list").classList.remove(activeClass);
}

function enableGraphTab (graphType) {
    d3.select(".graph-type-btn[data-type='" + graphType + "']").classed("active", true);
    document.getElementById("graph-list").classList.add("graph-" + graphType);
    d3.selectAll('.graph-type-info')
    .classed('active', function () {
        return graphType === this.id.split('-')[0]
    })
}

export function createGraphDiv (poi) {
    var decimalPlaces = 3
    var latShort = roundFloat(poi.lat, decimalPlaces)
    var lngShort = roundFloat(poi.lng, decimalPlaces)
    var wrapper = document.createElement("div");
    var header = document.createElement("div");
    wrapper.appendChild(header)
    var zoomToMarkerButton = makeZoomToMapMarkerButton(poi)
    var content = document.createTextNode("Lat: " + latShort + ", Long: " + lngShort);
    var contentDiv = document.createElement("div");
    contentDiv.className = "graph-lat-lon";
    contentDiv.appendChild(content);

    header.appendChild(zoomToMarkerButton)
    header.appendChild(contentDiv);

    var loadingDiv = document.createElement("div");
    loadingDiv.classList.add("graph-loading-div");
    wrapper.appendChild(loadingDiv);

    wrapper.classList.add("graph-elem");
    wrapper.classList.add("graph-loading");
    header.classList.add("graph-elem-header");

    var list = document.getElementById("graph-list");
    list.appendChild(wrapper);
    getData(poi, wrapper);
    return wrapper;
}

function makeZoomToMapMarkerButton(poi) {
    var button = document.createElement("button")
    button.classList.add('btn')
    button.classList.add('pan-to-marker-btn')
    button.textContent = "Show On Map"
    button.onclick = function (poi, e) {
        var map = GetMap()
        map.panTo([poi.lat, poi.lng])

        //send google analytics click on show on map
        ga('send', 'event', {
          eventCategory: 'graph',
          eventAction: 'click',
          eventLabel: '{"show on map":{"lat":' + poi.lat + ',"long":'+  poi.lng+ '}}',
          nonInteraction: false
        });

    }.bind(button, poi)
    return button
}

function drawGraph(data, div, poi) {
    data = splitData(data);
    var reprocessedData = reprocessData(data);
    makeUpDownLineGraph(data, div);
    makeUpDownOverlapingLineGraphWithCheckboxes(reprocessedData, div, poi);
    drawUpDownPolarWithCheckboxesAndThresholds(reprocessedData, div, poi);
    div.classList.remove("graph-loading");
}

function roundFloat(number, decimalPlaces) {
    return Math.round(number * Math.pow(10, decimalPlaces)) / (Math.pow(10, decimalPlaces))
}

///////////////////// TIMESERIES LINE GRAPH ////////////////////////////////

function makeUpDownLineGraph (data, div) {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 29},
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
    var svg = wrapper.append("svg")
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
    var bottomAxisElement = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    bottomAxisElement.selectAll("text")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start");

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    /**
     * This block of code draws the point at each data point
     */
    drawLinearPoints(data, valueline, svg);
}

///////////////// OVERLAPPING TIMESERIES LINE GRAPH ////////////////

function makeUpDownOverlapingLineGraphWithCheckboxes (data, div, poi) {
    var charts = {};

    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 29},
        width = 500 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    var averages = data.baseline;

    var x = d3.scaleLinear().range([0, width])
        .domain([0, 368]);
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
        .x(function(d, i) {
          // Hack for dealing with the last data point in a year stack,
          // which falls on the following year. In this case we set the x
          // value to te "368th" day of the year, or the third day 
          // of the next year.
          if (d[0].substring(4, 8) === '0103') {
            return x(368);
          } else {
            return x(parseJulianDay(d[0]));
          }
          //return (Array.isArray(d) ? x(parseJulianDay(d[0])) : x((i * 8) + 3 ));
          
        })
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

    var plot, i, l;
    for (i = 0, l = poi.plots.length; i < l; i++) {
        plot = poi.plots[i];
        if (plot === "thresholds" || plot === "thresholdsactive") continue;
        charts[plot] = {
            "path" : drawLinearPath(data[plot], valueline, svg)
        }
    }

    /**
     * This block of code draws the point at each data point
     */
    for (i = 0, l = poi.plots.length; i < l; i++) {
        plot = poi.plots[i];
        if (plot === "thresholds" || plot === "thresholdsactive") continue;
        charts[plot].points = drawLinearPoints(data[plot], valueline, svg);
    }

    var inputwrapper = wrapper.append("div").classed("input-wrapper", true);

    data.keys.forEach(function (key) {
        createCheckbox(inputwrapper, key, "overlapping", poi, charts, data, valueline, svg, averages);
    });

    createCheckbox(inputwrapper, "baseline", "overlapping", poi, charts, data, valueline, svg, averages);
}

///////////////////////// POLAR GRAPH //////////////////////////////////////

function drawUpDownPolarWithCheckboxesAndThresholds (data, div, poi) {
    var width = 490,
        height = 490,
        radius = Math.min(width, height) / 2 - 30;

    var averages = data["baseline"];
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
    var ga_a = svg.append("g")
        .attr("class", "a axis")
        .selectAll("g")
        .data(d3.range(0, 360, 30))
        .enter().append("g")
            .attr("transform", function(d) { return "rotate(" + (d - 90) + ")"; });

    ga_a.append("line")
        .attr("x2", radius);

    ga_a.append("text")
        .attr("x", radius + 6)
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { return d < 360 && d > 180 ? "end" : null; })
        .attr("transform", function(d) { return d < 360 && d > 180 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
        .text(function(d) { return MONTH_LABELS[d/30]; });

    var allDataThresholds = drawAllThresholdElems(svg, thresholds, radius, poi, "thresholds", center, line, "Center (All Data)");

    var activeDataThresholds = drawActiveDataThresholds(data, svg, radius, poi, line);

    var charts = {};

    /**
     * This block of code draws the line that the data follows
     */
    var plot, i, l;
    for (i = 0, l = poi.plots.length; i < l; i++) {
        plot = poi.plots[i];
        if (plot === "thresholds" || plot === "thresholdsactive") continue;
        charts[plot] = {
            "path" : drawPolarPath(data[plot], line, svg)
        }
    }

    /**
     * This block of code draws the point at each data point
     */
    for (i = 0, l = poi.plots.length; i < l; i++) {
        plot = poi.plots[i];
        if (plot === "thresholds" || plot === "thresholdsactive") continue;
        charts[plot].points = drawLinearPoints(data[plot], line, svg);
    }

    var inputwrapper = wrapper.append("div").classed("input-wrapper", true);

    data.keys.forEach(function (key) {
        createCheckbox(inputwrapper, key, "polar", poi, charts, data, line, svg, averages, radius, activeDataThresholds);
    });

    var thresholdActiveCheckbox = inputwrapper.append("div")
        .classed("threshold-checkbox--active", true);

    thresholdActiveCheckbox.append("input")
        .attr("type", "checkbox")
        .attr("id", "threshold-checkbox--active-" + poi.lat.toString().replace(".", "") + "-" + poi.lng.toString().replace(".", ""))
        .attr("disabled", (checkNoActiveYears(poi.plots) === true) ? "disabled" : null)
        .property("checked", poi.plots.indexOf("thresholdsactive") !== -1)
        .on("change", function (e) {
            var checkbox = this;
            activeDataThresholds.forEach(function (elem) {
                elem.style("display", (checkbox.checked) ? null : "none");
            });
            
            var offon = this.checked ? 'off' : 'on';

            if (this.checked) {
                addKeyToPOI(poi, "thresholdsactive");
            } else {
                removeKeyFromPOI(poi, "thresholdsactive");
            }

            updateShareUrl();
            //send google analytics graph threshold click off
            dispatchGraphCheckboxClick('threshold polar timeseries ' + offon);
        });

    thresholdActiveCheckbox.append("label")
        .text("Thresholds (Active Years)")
        .attr("for", "threshold-checkbox--active-" + poi.lat.toString().replace(".", "") + "-" + poi.lng.toString().replace(".", ""));

    createCheckbox(inputwrapper, "baseline", "polar", poi, charts, data, line, svg, averages, radius, activeDataThresholds);

    var thresholdCheckbox= inputwrapper.append("div")
        .classed("threshold-checkbox", true);

    thresholdCheckbox.append("input")
        .attr("type", "checkbox")
        .attr("id", "threshold-checkbox-" + poi.lat.toString().replace(".", "") + "-" + poi.lng.toString().replace(".", ""))
        .property("checked", poi.plots.indexOf("thresholds") !== -1)
        .on("change", function (e) {
            var checkbox = this;
            allDataThresholds.forEach(function (elem) {
                elem.style("display", (checkbox.checked) ? null : "none");
            });

            var offon = this.checked ? 'off' : 'on';

            if (this.checked) {
                addKeyToPOI(poi, "thresholds");
            } else {
                removeKeyFromPOI(poi, "thresholds");
            }

            updateShareUrl();
            //send google analytics graph threshold click off
            dispatchGraphCheckboxClick('threshold polar timeseries ' + offon);
        });

    thresholdCheckbox.append("label")
        .text("Thresholds (All Years)")
        .attr("for", "threshold-checkbox-" + poi.lat.toString().replace(".", "") + "-" + poi.lng.toString().replace(".", ""));
}

function findActivePlots(plots) {
    var activePlots = plots.filter(function (p) {
        return parseInt(p, 10).toString() === p;
    });
    return activePlots;
}

function makePlotAverages(data, plots) {
    var newData = {};
    var i, j, l, yearLength;
    var sum;

    plots.forEach(function (plot) {
        newData[plot] = data[plot];
    });

    newData["baseline"] = [];

    for (i = 0, yearLength = 46; i < yearLength; i++) {
        sum = 0;
        for (j = 0, l = plots.length; j < l; j++) {
            sum += parseInt(newData[plots[j]][i][1], 10);
        }
        newData["baseline"].push(sum/46);
    }

    newData["keys"] = plots;

    return newData;
}

function getActiveThreholdData(data, poi) {
    var activePlots = findActivePlots(poi.plots);
    var plotAverages = makePlotAverages(data, activePlots);
    return plotAverages;
}

function drawThresholdElem(svg, data, radius, poi, key) {
    var inset = (key === "thresholds") ? 30 : 70;

    var thresholdElem = svg.append("g")
        .selectAll("g")
        .data(data)
        .enter().append("g")
            .attr("transform", function(d) { return "rotate(" + (d.data[1][0] - 90) + ")"; });

    thresholdElem.append("line")
        .attr("class", "line line--" + key)
        .attr("x2", radius);

    thresholdElem.append("text")
        .attr("x", function (d) { var day = d.data[1][0]; return day < 360 && day > 180 ? radius + inset : radius - inset})
        .attr("y", function (d) { return ((((d.data[1][0])%365)/365) * (2*Math.PI)) + 6; })
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { var day = d.data[1][0]; return day < 360 && day > 180 ? "middle" : null; })
        .attr("transform", function(d) { var day = d.data[1][0]; return day < 360 && day > 180 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
        .text(function(d) { return d.label; });

    thresholdElem.style("display", (poi.plots.indexOf(key) !== -1) ? null : "none");

    return thresholdElem;
}

function drawAllThresholdElems(svg, thresholds, radius, poi, key, center, line, label) {
    /**
     * Draws the threshold lines
     */
    var thresholdElem = drawThresholdElem(svg, thresholds, radius, poi, key);

    /**
     * Draws the line to the center of the data
     */
    var centerDay = center[1][0];
    var centerDayOpposite = (centerDay + (365/2)) % 365;
    var centerDayData = [centerDay, 100];
    var centerDayOppositeData = [centerDayOpposite, 100];
    var growingSeasonData = [centerDayData, centerDayOppositeData]

    var growingLine = drawPolarPath(growingSeasonData, line, svg)
        .classed("growing-season-line", "true")
        .classed("line--" + key, "true")
        .style("display", (poi.plots.indexOf(key) !== -1) ? null : "none");

    var centerLine = drawPolarPath(center, line, svg)
        .classed("center-line", "true")
        .classed("line--" + key, "true")
        .style("display", (poi.plots.indexOf(key) !== -1) ? null : "none");

    var centerPoint = svg.selectAll("point")
        .data([center[1]])
        .enter()
        .append("circle")
        .attr("class", "center center--" + key)
        .attr("r", 4)
        .attr("transform", function(d) {
            var coors = line([d]).slice(1).slice(0, -1);
            return "translate(" + coors + ")"
        })
        .attr("stroke", "#000")
        .attr("fill", "#ea0c48")
        .style("display", (poi.plots.indexOf(key) !== -1) ? null : "none")
        .on("mouseover", function(d) {
            tip.show(label + ": "  + String(d[1]).substring(0, 7));
            this.setAttribute("r", 5)
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 4)
        });

    return [thresholdElem, growingLine, centerLine, centerPoint];
}

function drawActiveDataThresholds(data, svg, radius, poi, line) {
    if (checkNoActiveYears(poi.plots) === true) {
        return [];
    }
    var activeThresholdData = getActiveThreholdData(data, poi);
    var activeThresholdCenter = findPolarCenter(activeThresholdData);
    // This line was causing active thresholds to be different from all-years
    // thresholds even when every year was activated. I'm not sure why it was
    // put here in the first place. Leaving commented out for now.
    // It probably has something to do with the fact that the data points start
    // on the 8th of January. It's possible that both center points
    // (active & all-years) need to be shifted!
    //activeThresholdCenter[1][0] = activeThresholdCenter[1][0] - 8;
    var activeThresholds = findPolarThresholds(activeThresholdData["baseline"], activeThresholdCenter[1][0]);
    return drawAllThresholdElems(svg, activeThresholds, radius, poi, "thresholdsactive", activeThresholdCenter, line, "Center (Active Data)");
}

function checkNoActiveYears(plots) {
    var noYearFlag = true;
    var i, l;
    for (i = 0, l = plots.length; i < l; i++) {
        if (parseInt(plots[i], 10).toString() === plots[i]) {
            noYearFlag = false;
            break;
        }
    }

    return noYearFlag;
}

function handleActiveThresholdCheckbox(lat, lng, plots) {
    var activeThresholdCheckbox = d3.select("#threshold-checkbox--active-" + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""));
    activeThresholdCheckbox.attr("disabled", (checkNoActiveYears(plots) === true) ? "disabled" : null);
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
    var avgs = data.baseline;
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

    var midpoint = (firstRadius + secondRadius) / 2;
    var firstDiff = Math.abs(totalSum - midpoint);
    var secondDiff = Math.abs(-totalSum - midpoint);
    if (secondDiff < firstDiff) {
        areaIndex = areaIndex + 23;
    }

    var circlecenter = [0, 0];
    var datacenter = [(areaIndex * 8) + 3, totalSum];

    return([circlecenter, datacenter]);
}

/**
 * startDay is actually the seasonality index, it should be flipped
 */
function findPolarThresholds (data, startDay) {
    var startIndex = Math.floor((startDay - 3) / 8);
    startIndex += (startIndex > 22) ? (-23) : 23;
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
    var fifteenIndexFound = false,
        eightyIndexFound = false;
    var fifteenIndex, eightyIndex;

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
    }

    var circleCenter = [0, 0];

    var fifteenEnd = [(fifteenIndex * 8) + 3, 100];
    var eightyEnd = [(eightyIndex * 8) + 3, 100];

    return [
        {
            "label" : "15%",
            "data" : [circleCenter, fifteenEnd]
        },
        {
            "label" : "80%",
            "data" : [circleCenter, eightyEnd]
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

function drawLinearPoints(data, line, svg) {
    return svg.selectAll("point")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", 2)
        .attr("class", "point")
        .attr("transform", function(d, i) {
            var point = Array.isArray(d) ? d : [(i*8) + 3, d];
            var coors = line([point]).slice(1).slice(0, -1);
            return "translate(" + coors + ")"
        })
        //.attr("r", 3)
        .attr("stroke", "#000")
        .attr("fill",function(d,i){
            var val = Array.isArray(d) ? d[0].substring(0, 4) : 0;
            return pullDistinctColor(val)
        })
        .on("mouseover", handlePointMouseover)
        .on("mouseout", handlePointMouseout);
}

function handlePointMouseover(d) {
    var tipString = Array.isArray(d) ? formatDate(d[0]) + ": "  + d[1] : "Average: "  + d;
    tip.show(tipString);
    this.setAttribute("r", "4");
}

function handlePointMouseout(d) {
    tip.hide();
    this.setAttribute("r", "2");

    var activeType = document.getElementsByClassName("graph-type-btn active")[0].getAttribute('data-type');

    //send google analytics tool tip on graph do this on the mouseout so mouseover dose not do a lot of events....
    // we miss a few but that is better than over counting.
    ga('send', 'event', {
      eventCategory: 'graph',
      eventAction: 'hover',
      eventLabel: activeType + ' tool tip',
      nonInteraction: false
    });
}

function createCheckbox(wrapper, key, type, poi, charts, data, line, svg, averages, radius, activeDataThresholds) {
    var checkboxWrapper = wrapper.append("div");
    var lat = poi.lat;
    var lng = poi.lng;

    checkboxWrapper.append("input")
        .attr("type", "checkbox")
        .attr("id", type + "-" + key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""))
        .attr("data-link", key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""))
        .attr("value", key)
        .property("checked", (poi.plots.indexOf(key) !== -1) ? true : false)
        .on("change", function (e) {
            var newYear = this.value;
            if (!this.checked) {
                handleCheckboxDisable(charts, newYear, data);
                removeKeyFromPOI(poi, key);
                //send google analytics graph year click off
                dispatchGraphCheckboxClick(newYear + ' ' + type + ' timeseries off');
            } else {
                handleCheckboxEnable(charts, newYear, data, line, svg, averages);
                addKeyToPOI(poi, key);
                //send google analytics graph year click on
                dispatchGraphCheckboxClick(newYear + ' ' + type + ' timeseries on');
            }

            if (activeDataThresholds) {
                activeDataThresholds.forEach(function (elem) {
                    elem.remove();
                });
                var i, l;
                for (i = 0, l = activeDataThresholds.length; i < l; i++) {
                    activeDataThresholds.pop();
                }
                var newThresholdElems = drawActiveDataThresholds(data, svg, radius, poi, line);
                for (i = 0, l = newThresholdElems.length; i < l; i++) {
                    activeDataThresholds.push(newThresholdElems[i]);
                }
                handleActiveThresholdCheckbox(lat, lng, poi.plots);
            }
            
            handleCheckboxSync(key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""), this.checked);
            updateShareUrl();
        });

    checkboxWrapper.append("label")
        .text(key !== "baseline" ? key : "Baseline (All Years)")
        .attr("for", type + "-" + key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""));

    checkboxWrapper.append("div")
        .style("background", pullDistinctColor(key !== "baseline" ? key : 0))
        .classed("graph-pip-example", true);
}

function handleCheckboxDisable (charts, newYear, data) {
    charts[newYear].path.remove();
    charts[newYear].points.remove();
}

function handleCheckboxEnable (charts, newYear, data, line, svg) {
    if (!charts.hasOwnProperty(newYear)) {
        charts[newYear] = {};
    }
    charts[newYear].path = drawLinearPath(data[newYear], line, svg);
    charts[newYear].points = drawLinearPoints(data[newYear], line, svg);
}

function handleCheckboxSync (key, checkedStatus, wrapper) {
    d3.selectAll("input[data-link='" + key + "']").each(function (p, j) {
        var elem = d3.select(this);
        if (elem.property("checked") !== checkedStatus) {
            elem.property("checked", checkedStatus);
            elem.dispatch("change");
        }
    });
}

function removeKeyFromPOI (poi, key) {
    var index = poi.plots.indexOf(key);
    if (index === -1) return;
    poi.plots.splice(index, 1);
}

function addKeyToPOI (poi, key) {
    if (poi.plots.indexOf(key) !== -1) return;
    poi.plots.push(key);
}

function dispatchGraphCheckboxClick (label) {
    ga('send', 'event', {
        eventCategory: 'graph',
        eventAction: 'click',
        eventLabel:  label,
        nonInteraction: false
    });
}

function pullDistinctColor (year) {
    var colorRamp = [
        "#116c91",
        "#1a708f",
        "#23758e",
        "#2c798d",
        "#357e8c",
        "#3e838b",
        "#47878a",
        "#518c89",
        "#5a9088",
        "#639587",
        "#6c9a86",
        "#759e85",
        "#7ea384",
        "#88a883",
        "#91ac82",
        "#9ab181",
        "#a3b580",
        "#acba7f",
        "#b5bf7e",
        "#bec37d",
        "#c8c87c",
        "#d1cc7b",
        "#dad17a",
        "#e3d679",
        "#ecda78",
        "#f5df77",
        "#ffe476"
    ];

    return (year === 0) ? "#fff" : colorRamp[parseInt(year, 10) % colorRamp.length];
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
    return FORMATTED_MONTH_LABELS[month];
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

var FORMATTED_MONTH_LABELS = {
    0: "Jan.",
    1: "Feb.",
    2: "Mar.",
    3: "Apr.",
    4: "May",
    5: "Jun.",
    6: "Jul.",
    7: "Aug.",
    8: "Sep.",
    9: "Oct.",
    10: "Nov.",
    11: "Dec."
};
