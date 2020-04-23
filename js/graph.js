import {updatePanelDragOverlayHeight} from './panel'
import {updateShareUrl} from './share'
import {GetMap} from './map'
import {GetAjaxObject} from './parser'

var tip = {};
var expectedYearLength = 46;

export function SetupGraphs () {
    d3.selectAll(".graph-type-btn").on("click", handleGraphTypeBtnClick);
    extendDateModule();
    tip = d3.tip().attr('class', 'd3-tip').html(function (d) { return d; });

    // Adding a block here to trigger AWS endpoint so lambda function stays hot
    var url = "https://pwol6zjt3f.execute-api.us-east-1.amazonaws.com/production/landat-ndvi?lng=-82.5515&lat=35.5951" // Asheville, NC
    var oReq = GetAjaxObject(function () {})
    oReq.open("GET", url);
    oReq.send()
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
    response = JSON.parse(response);
    drawGraph(response, div, poi);
    updatePanelDragOverlayHeight()
}

function getData(poi, div) {
    var url = "https://pwol6zjt3f.execute-api.us-east-1.amazonaws.com/production/landat-ndvi?lng=" + poi.lng + "&lat=" + poi.lat;
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
    var data = {};
    var point;
    var key;
    var i, j;

    data["keys"] = [];
    for (i = 0; i < origdata.length; i++) {
        point = origdata[i];
        key = point[0].substring(0,4);
        // The last data point for a year's data rolls over to the next year
        // at 1/3, so adjust the key (year) accordingly for these cases
        if (point[0].substring(4) === "0103" || point[0].substring(4) === "0102") {
          key = String(parseInt(key)-1)
        }

        if (!data.hasOwnProperty(key)) {
            data[key] = [];
            data["keys"].push(key);
        }

        data[key].push(point);
    }

    data['baseline'] = calculateBaseline(origdata)

    return data;
}

function calculateBaseline (data) {
    var dataForBaseline
    var mean
    data['baseline'] = []
    for (let i = 0; i < expectedYearLength; i++) {
        dataForBaseline = []
        for (let j = i; j < data.length; j += expectedYearLength) {
            dataForBaseline.push(parseInt(data[j][1], 10));
        }

        mean = computeAverage(dataForBaseline)
        data['baseline'].push(mean)
    }
    return data['baseline']
}

function computeAverage (arr) {
    var sum = 0, i, l;

    for (i = 0, l = arr.length; i < l; i++) {
        sum += arr[i];
    }

    return (sum / l).toString();
}

function buildPhenologicalYearData (rawJsonData, calendarYearData) {
    let center = findPolarCenter(calendarYearData)
    let startDayOfPhenoYear = (center[1][0] + (365 / 2)) % 365 // e.g. 36 would be February 5th
    let phenoYearFound = false
    let phenoYearBeginDayIndex = 0
    let phenoYearArray = []

    // Find where the pheno year begins for one year and capture that value. It will be the same for all years
    for (let i = 0; i < calendarYearData[2000].length; i++) {
        if (phenoYearFound) break
        let dateString = calendarYearData[2000][i][0]
        if (getDayOfYear(dateString) >= startDayOfPhenoYear) {
            phenoYearFound = true
            phenoYearBeginDayIndex = i
        }
    }

    // Build an array of 46 values each using the pheno year begin day index found above
    let numberOfCalendarYears = (rawJsonData.length / expectedYearLength) // 46 data points per calendar year
    let numberOfPhenoYears = numberOfCalendarYears - 1 // number of pheno years is always one less than your number of calendar years
    let counter = phenoYearBeginDayIndex
    for (let i = 0; i <= numberOfPhenoYears; i++) {
        phenoYearArray[i] = []
        for (let j = 0; j < expectedYearLength; j++) {
            phenoYearArray[i].push(rawJsonData[counter]) // start building pheno year array from start of pheno year
            counter++
        }
    }
    phenoYearArray.pop() // remove the last pheno year from the array since it's incomplete
    return phenoYearArray
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
    data = splitData(data)
    var reprocessedData = reprocessData(data)
    let phenoYearData = buildPhenologicalYearData(data, reprocessedData)
    drawAllYearsGraph(data, div)
    drawOverlappingYearsGraph(reprocessedData, div, poi)
    drawPolarGraph(reprocessedData, div, phenoYearData)
    div.classList.remove("graph-loading")
}

function roundFloat(number, decimalPlaces) {
    return Math.round(number * Math.pow(10, decimalPlaces)) / (Math.pow(10, decimalPlaces))
}

function drawAllYearsGraph(data, div) {
    let ndviData = []
    let parsedDates = []
    data.forEach(function (item) {
        parsedDates.push(parseDate(item[0]))
        ndviData.push(item[1])
    })
    let dataPlotly = [{
        type: 'scatter',
        mode: 'lines+markers',
        y: ndviData,
        customdata: parsedDates,
        hovertemplate: "%{customdata|%B %d, %Y}: %{y:.1f}<extra></extra>"
    }]

    let layout = {
        hovermode: 'closest',
        margin: { l: 28, r: 30, t: 50, b: 35 },
        modebar: { orientation: 'v' },
        xaxis: {
            tickangle: '-45',
            tickvals: [0, 46, 92, 138, 184, 230, 276, 322, 368, 414, 460, 506, 552, 598, 644, 690, 736, 782, 828, 874],
            ticktext: ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009",
                       "2010","2011","2012","2013","2014","2015","2016","2017","2018","2019"]
        },
        yaxis: {
            range: [0, 100]
        }
    }

    var wrapper = d3.select(div).append("div").classed("timeseries-graph", true)
    let config = {displaylogo: false, displayModeBar: true, modeBarButtonsToRemove: []}
    Plotly.newPlot(wrapper.node(), dataPlotly, layout, config)
}

function drawOverlappingYearsGraph(data, div) {
    let dataPlotly = []

    // Take the existing array of baseline ndvi values and add non-leap year date values to them so we can plot them
    let baselineDateAndValuesArray = []
    data[2001].forEach(function (item, index){ // 2001 date strings
        baselineDateAndValuesArray.push([item[0], data['baseline'][index]]) 
    })

    // plot all year traces
    data.keys.forEach(function(key) {
        dataPlotly = dataPlotly.concat(buildScatterTrace(data[key], key, pullDistinctColor(key)))
    })
    
    // plot baseline
    dataPlotly = dataPlotly.concat(buildScatterTrace(baselineDateAndValuesArray, 'All-years mean', '#000000', true, // baseline plot
                                                          "%{customdata|%B %d}<br>NDVI: %{y:.1f}<extra></extra>"))

    let layout = {
        hovermode: 'closest',
        margin: { l: 28, r: 40, t: 20, b: 20 },
        modebar: { orientation: 'v' },
        legend: {
            title: {
                text: "Click to turn on/off"
            },
            x: 1.07,
        },
        xaxis: {
            showgrid: false,
            tickangle: '0',
            tickvals: [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335],
                ticktext: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        },
        yaxis: {
            showgrid: false,
            range: [0, 100]
        }
    }

    var wrapper = d3.select(div).append("div").classed("overlapping-graph", true)
    let config = {displaylogo: false, displayModeBar: true, modeBarButtonsToRemove: []}
    Plotly.newPlot(wrapper.node(), dataPlotly, layout, config)
}

function buildScatterTrace(data, traceName, color, visibility = 'legendonly', 
                           hovertemplate = "%{customdata|%B %d, %Y}<br>%{y:.1f}<extra></extra>") {
    let traceObject = {'x': [], 'y': [], 'dateArray': []}
    data.forEach(function (item, index) {
        // last day in the dataset is the first day of next year so we add 365 to it so it plots correctly
        index === 45 ? traceObject.x.push(getDayOfYear(item[0]) + 365) : traceObject.x.push(getDayOfYear(item[0]))
        traceObject.y.push(parseInt(item[1], 10))
        traceObject.dateArray.push(parseDate(item[0]))
    })
    return [{
        type: 'scatter',
        visible: visibility,
        mode: "lines+markers",
        name: traceName,
        x: traceObject.x,
        y: traceObject.y,
        customdata: traceObject.dateArray,
        line: {
            color: color
        },
        hovertemplate: hovertemplate
    }]
}

function drawPolarGraph(data, div, phenoYearData) {
    let dataPlotly = []

    // Take the existing array of baseline ndvi values and add non-leap year date values to them
    let phenoYearBaselineDateAndValuesArray = []
    let phenoYearBaselineValues = calculateBaseline(phenoYearData.flat())
    phenoYearData[1].forEach(function (item, index){ // 2001 date strings
        phenoYearBaselineDateAndValuesArray.push([item[0], phenoYearBaselineValues[index]]) 
    })

    // Build data for centerline and thresholds
    let center = findPolarCenter(data)
    var centerDay = center[1][0]
    let startDayOfPhenoYear = (center[1][0] + (365 / 2)) % 365 // e.g. 36 would be February 5th
    var centerPoint = center[1][1]
    var baselineThresholds = findPolarThresholds(phenoYearBaselineValues, startDayOfPhenoYear)
    var baselineSeasonalIndex = (baselineThresholds.fifteenEnd + baselineThresholds.eightyEnd) / 2
    
    // Start building the data to be plotted
    let startPhenoData = {"r": [0, 10, 20, 40, 60, 80, 100], "theta": [0].concat(repeat([startDayOfPhenoYear], 6)) }
    let fifteenData = {"r": [0, 10, 20, 40, 60, 80, 100], "theta": [0].concat(repeat([baselineThresholds.fifteenEnd], 6)) }
    let middleGrowingData = {"r": [0, 10, 20, 40, 60, 80, 100], "theta": [0].concat(repeat([baselineSeasonalIndex], 6)) }
    let eightyData = {"r": [0, 10, 20, 40, 60, 80, 100], "theta": [0].concat(repeat([baselineThresholds.eightyEnd], 6)) }
    
    dataPlotly = dataPlotly.concat(buildReferenceLine(startPhenoData, "lines", "start pheno", "Beginning of Phenological Year", "#429bb8"))
    dataPlotly = dataPlotly.concat(buildReferenceLine(fifteenData, "lines", "15% threshold", "Start of Growing Season", "#90ee90"))
    dataPlotly = dataPlotly.concat(buildReferenceLine(middleGrowingData, "lines", "middle growing", "Middle of Growing Season", "#056608"))
    dataPlotly = dataPlotly.concat(buildReferenceLine(eightyData, "lines", "80% threshold", "End of Growing Season", "#ffa500"))
    dataPlotly = dataPlotly.concat(buildCenterLine([centerDay, centerPoint])) // Red center line

    var wrapper = d3.select(div).append("div").classed("polar-graph", true)
    let colorRampArray = []
    for (const [key] of Object.entries(data)) { // Use the year values to build a color ramp array for pheno years
        colorRampArray.push(pullDistinctColor(key))
    }
    let colorRampCounter = 0
    phenoYearData.forEach(function (item, index) { // Plot all of the pheno years
        dataPlotly = dataPlotly.concat(buildTrace(item, 'Pheno Year ' + parseInt(index+1), colorRampArray[colorRampCounter]))
        colorRampCounter++
    })
    dataPlotly = dataPlotly.concat(buildTrace(phenoYearBaselineDateAndValuesArray, 'All-years mean', '#000000', true, // baseline plot
                                                          "%{customdata|%B %d}<br>NDVI: %{r:.1f}<extra></extra>"))
    
    var config = {responsive: true, displaylogo: false, displayModeBar: true, modeBarButtons: modeBarButtons}
    Plotly.newPlot(wrapper.node(), dataPlotly, getPlotlyLayout(), config)
    let traceObject = {}

    /* On a legend click event, find out what trace was clicked on and grab all of the r values for that trace.
       Add trace name and values to traceObject if it doesn't exist. If it does exist, you can assume that
       the trace is being turned off and needs to be removed from the traceObject. If you have at least one trace on, 
       calculate the new baseline and reference lines for those traces otherwise fall back to original reference lines.
       Restyle the reference lines based on this information.
    */
    wrapper.node().on('plotly_legendclick', function(x){
        let traceData = x.node.__data__[0].trace.r
        let traceName = x.node.__data__[0].trace.name
        let centerLineValue, fifteenValue, eightyValue
        if (traceName === 'All-years mean') {
            return // do nothing
        }
        if (traceObject[traceName]) {
            delete traceObject[traceName]
        } else {
            traceObject[traceName] = traceData
        }
        if (Object.keys(traceObject).length >= 1) {
            let traceArray = Object.values(traceObject).flat()
            let dynamicBaseline = calculateDynamicBaseline(traceArray)
            let dynamicThresholds = findPolarThresholds(dynamicBaseline, startDayOfPhenoYear)
            fifteenValue = dynamicThresholds.fifteenEnd
            eightyValue = dynamicThresholds.eightyEnd
            centerLineValue = (dynamicThresholds.fifteenEnd + dynamicThresholds.eightyEnd) / 2
        } else {
            fifteenValue = baselineThresholds.fifteenEnd
            eightyValue = baselineThresholds.eightyEnd
            centerLineValue = baselineSeasonalIndex
        }
        Plotly.restyle(wrapper.node(), {theta: [[0].concat(repeat([fifteenValue], 6))]}, 1)
        Plotly.restyle(wrapper.node(), {theta: [[0].concat(repeat([centerLineValue], 6))]}, 2)
        Plotly.restyle(wrapper.node(), {theta: [[0].concat(repeat([eightyValue], 6))]}, 3)
    })
}

/* PLOTLY FUNCTIONS AND CONSTANTS */

function calculateDynamicBaseline(data) {
    var dataForBaseline
    var mean
    let dynamicBaseline = []
    for (let i = 0; i < expectedYearLength; i++) {
        dataForBaseline = []
        for (let j = i; j < data.length; j += expectedYearLength) {
            dataForBaseline.push(parseInt(data[j], 10));
        }

        mean = computeAverage(dataForBaseline)
        dynamicBaseline.push(mean)
    }
    return dynamicBaseline
}

function buildTrace(data, traceName, color, visibility = 'legendonly',
                    hovertemplate = "%{customdata|%B %d, %Y}<br>NDVI: %{r:.1f}<extra></extra>") {
    let traceObject = {'r': [], 'theta': [], 'dateArray': []}
    data.forEach(function (item) {
        traceObject.r.push(parseInt(item[1], 10))
        traceObject.theta.push(getDayOfYear(item[0]))
        traceObject.dateArray.push(parseDate(item[0]))
    })
    return [{
        type: 'scatterpolar',
        visible: visibility,
        mode: "lines+markers",
        name: traceName,
        r: traceObject.r,
        theta: traceObject.theta,
        customdata: traceObject.dateArray,
        line: {
            color: color
        },
        hovertemplate: hovertemplate
    }]
}

function buildReferenceLine(data, mode, traceName, hoverText, lineColor) {
    return [{
        type: 'scatterpolar',
        mode: mode,
        name: traceName,
        visible: true,
        showlegend: false,
        r: data.r,
        theta: data.theta,
        hovertext: hoverText,
        hoverinfo: "text",
        line: {
            color: lineColor,
            width: 3
        }
    }]
}

function buildCenterLine(centerlineData, visibility = true) {
    return [
    { // red center line and dot
        type: "scatterpolar",
        mode: "lines+markers",
        name: 'Seasonality',
        visible: visibility,
        showlegend: false,
        r: [parseFloat(centerlineData[1]).toFixed(2), 0],
        theta: [centerlineData[0], 0],
        hovertemplate: ["Center: %{r}<extra></extra>", ""],
        marker: {
            size: 9,
            // Markers go from left to right in the 'r' array defined above
            maxdisplayed: 1 // Value of 1 so dot isn't at both ends of the line. 
        },
        line: {
            color: "#ff0000",
            width: 4
        },
    },
    ]
}

function getPlotlyLayout() {
    return {
        dragmode: false, // disables zoom on polar graph
        modebar: {
            orientation: 'h',
        },
        autoresize: true,
        margin: {
            l: 28,
            r: 40,
            t: 20,
            b: 20
        },
        height: 570,
        legend: {
            title: {
                text: "Click to turn on/off"
            },
            x: 1.07,
            itemdoubleclick: false,
        },
        polar: {
            domain: {
                x: [0, 100],
                y: [1, 365]
            },
            radialaxis: {
                visible: true,
                fixedrange: true,
                angle: 180,
                side: 'counterclockwise',
                tickangle: -180,
                gridcolor: '#E2E2E2',
                tickfont: {
                    color: '#444',
                },
                range: [0, 100]
            },
            angularaxis: {
                visible: true,
                gridcolor: '#E2E2E2',
                type: "linear",
                tickmode: "array",
                showticklabels: true,
                tickvals: [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335],
                ticktext: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec"
                ],
                direction: "clockwise",
                period: 12
            }
        }
    }  
}

function getDayOfYear (dateString) {
    let date = parseDate(dateString)
    let start = new Date(date.getFullYear(), 0, 0)
    let diff = date - start
    let oneDay = 1000 * 60 * 60 * 24
    let day = Math.floor(diff / oneDay)
    return day
}

const modeBarButtons = [[
    {
        name: 'Reset Plot Layout',
        icon: Plotly.Icons.home,
        click: function(gd) {
            Plotly.relayout(gd, getPlotlyLayout())
        }
     },
     "toImage"
]]

const repeat = (a, n) => Array(n).fill(a).flat(1)

/* POLAR GRAPH HELPERS */

function findPolarCenter (data) {
    var i, j, arr;
    var totalSum = 0;
    var incompleteYears = 0;
    var sum;

    // line 793-810 calculate the r value for our polar center
    for (i = 0; i < data.keys.length; i++) {
        arr = data[data.keys[i]];
        if (arr.length !== expectedYearLength) {
            incompleteYears++;
            continue;
        }
        sum = 0;
        for (j = 0; j < expectedYearLength/2; j++) {
            sum += (arr[j][1] - arr[j+23][1]);
        }
        sum = sum / 23;
        totalSum += sum;
    }
    totalSum = Math.abs(totalSum) / (data.keys.length - incompleteYears);

    // lines 813-845 calculate our theta value
    var areaDiff = 1000000;
    var checkDiff;
    var areaIndex = 0;
    var leftArea, rightArea;
    var avgs = data.baseline;
    var k, counter;

    // Iterate through the data 23 times to find out where the minimal amount of difference is between
    // left area and right area. This should be the line along which the center point will be
    for (i = 0; i < expectedYearLength/2; i++) {
        leftArea = 0;
        rightArea = 0;
        for (counter = 0; counter < expectedYearLength/2; counter++) {
            j = (i + counter) % expectedYearLength; // keeps j within limit of array index [0-45]
            k = (j + 23) % expectedYearLength; // keeps k within limit of array index [0-45]

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

function findPolarThresholds (data, startDay) {
    var startIndex = 0
    var totalSum = 0;

    // grab total sum of all ndvi values so you can caclulate the 15% and 80% value below
    for (let i = 0; i < expectedYearLength; i++) {
        let j = (startIndex + i) % expectedYearLength;
        totalSum += parseInt(data[j], 10);
    }

    var fifteenThreshold = totalSum * .15;
    var eightyThreshold = totalSum * .80;
    var fifteenIndexFound = false,
        eightyIndexFound = false;
    var fifteenIndex, eightyIndex;

    // Go through every index of the data until you find out where the 15% and 80% value index is
    totalSum = 0;
    for (let i = 0; i < expectedYearLength; i++) {
        let j = (startIndex + i) % expectedYearLength;
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

    var fifteenEnd = (fifteenIndex * 8) + 3 + startDay
    var eightyEnd = (eightyIndex * 8) + 3 + startDay

    return { fifteenEnd, eightyEnd }
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

function createCheckbox(wrapper, key, type, poi, charts, data, line, svg, averages) {
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
            handleCheckboxSync(key + lat.toString().replace(".", "") + "-" + lng.toString().replace(".", ""), this.checked);
            updateShareUrl();
        });

    checkboxWrapper.append("label")
        .text(key !== "baseline" ? key : "Baseline")
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
