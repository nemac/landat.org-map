import {updatePanelDragOverlayHeight} from './panel'
import {updateShareUrl} from './share'
import {GetMap} from './map'
import {GetAjaxObject} from './parser'

var tip = {}
var expectedYearLength = 46
const modeBarButtonsToRemove = ['hoverClosestCartesian', 'hoverCompareCartesian', 'lasso2d', 'select2d', 'toggleSpikelines', 'zoom2d']

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
    for (let i = 0; i < data.length; i++) {
        data[i] = data[i].split(",");
        data[i] = [parseDate(data[i][0]), data[i][1]] // parse all date strings into dates
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
        key = point[0].getFullYear();
        // The last data point for a year's data rolls over to the next year
        // at 1/3, so adjust the key (year) accordingly for these cases
        if (String(point[0].getMonth()).concat(String(point[0].getDate())) === "03" || 
            String(point[0].getMonth()).concat(String(point[0].getDate())) === "02") {
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
        let date = calendarYearData[2000][i][0]
        if (date.getDOY() >= startDayOfPhenoYear) {
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
    data = splitData(data) // split data and parse all date strings into dates
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
    let dates = []
    data.forEach(function (item) {
        dates.push(item[0])
        ndviData.push(item[1])
    })

    let layout = {
        hovermode: 'closest',
        margin: { l: 23, r: 30, t: 50, b: 35 },
        modebar: { orientation: 'h' },
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


    ndviData.forEach(function (item, index){ 
        console.log(item)
        console.log(index)
    })
    let dataPlotly = [{
        type: 'scatter',
        mode: 'lines+markers',
        y: ndviData,
        customdata: dates,
        hovertemplate: "%{customdata|%B %d, %Y}: %{y:.1f}<extra></extra>",
    }]

    var wrapper = d3.select(div).append("div").classed("timeseries-graph", true)
    let config = {responsive: true, displaylogo: false, displayModeBar: true, modeBarButtonsToRemove: modeBarButtonsToRemove}
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
        modebar: { orientation: 'h' },
        legend: {
            title: {
                text: "Click to turn on/off"
            },
            x: 1.07,
        },
        xaxis: {
            tickangle: '0',
            tickvals: [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335],
            ticktext: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        },
        yaxis: {
            range: [0, 100]
        }
    }

    var wrapper = d3.select(div).append("div").classed("overlapping-graph", true)
    let config = {responsive: true, displaylogo: false, displayModeBar: true, modeBarButtonsToRemove: modeBarButtonsToRemove}
    Plotly.newPlot(wrapper.node(), dataPlotly, layout, config)
}

function buildScatterTrace(data, traceName, color, visibility = 'legendonly', 
                           hovertemplate = "%{customdata|%B %d, %Y}<br>%{y:.1f}<extra></extra>") {
    let traceObject = {'x': [], 'y': [], 'dateArray': []}
    data.forEach(function (item, index) {
        // last day in the dataset is the first day of next year so we add 365 to it so it plots correctly
        index === 45 ? traceObject.x.push(item[0].getDOY() + 365) : traceObject.x.push(item[0].getDOY())
        traceObject.y.push(parseInt(item[1], 10))
        traceObject.dateArray.push(item[0])
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
    let startPhenoData = {"r": [0, 10, 20, 40, 60, 80, 100, 250], "theta": [0].concat(repeat([startDayOfPhenoYear], 7)) }
    let fifteenData = {"r": [0, 10, 20, 40, 60, 80, 100, 250], "theta": [0].concat(repeat([baselineThresholds.fifteenEnd], 7)) }
    let middleGrowingData = {"r": [0, 10, 20, 40, 60, 80, 100, 250], "theta": [0].concat(repeat([baselineSeasonalIndex], 7)) }
    let eightyData = {"r": [0, 10, 20, 40, 60, 80, 100, 250], "theta": [0].concat(repeat([baselineThresholds.eightyEnd], 7)) }
    
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
    let plotlyLayout = getPlotlyLayout()
    Plotly.newPlot(wrapper.node(), dataPlotly, plotlyLayout, config)
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
        Plotly.restyle(wrapper.node(), {theta: [[0].concat(repeat([fifteenValue], 7))]}, 1)
        Plotly.restyle(wrapper.node(), {theta: [[0].concat(repeat([centerLineValue], 7))]}, 2)
        Plotly.restyle(wrapper.node(), {theta: [[0].concat(repeat([eightyValue], 7))]}, 3)
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
        traceObject.theta.push(convertDayOfYearToDegrees(item[0]))
        traceObject.dateArray.push(item[0])
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

function getPlotlyLayout(upperRange = 100, tickVals = [0, 20, 40, 60, 80]) {
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
                angle: 90,
                side: 'clockwise',
                tickangle: 90,
                tickvals: tickVals,
                gridcolor: '#E2E2E2',
                tickfont: {
                    color: '#444',
                },
                range: [0, upperRange],
            },
            angularaxis: {
                visible: true,
                gridcolor: '#E2E2E2',
                type: "linear",
                tickmode: "array",
                showticklabels: true,
                tickvals: dayOfYearToDegrees(firstOfMonthJulianDays),
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
                rotation: false,
                period: 12
            }
        }
    }  
}

const convertDayOfYearToDegrees = date => {
    let dayOfYear = date.getDOY()
    // if we're in a leap year and later then February, subtract a day from the returned day of year
    if (date.getFullYear() % 4 === 0 && date.getMonth() > 1) {
        dayOfYear -= 1
    }
    return ((dayOfYear - 1) * 360) / 364
}

const dayOfYearToDegrees = array => {
    let newArray = array.map(x => ((x - 1 ) * 360) / 364)
    return newArray
}

const modeBarButtons = [[
    {
        name: 'Zoom In',
        icon: Plotly.Icons.zoom_plus,
        click: function(div) {
            let tickVals = div.layout.polar.radialaxis.tickvals
            if ((div.layout.polar.radialaxis.range[1] - 10) % 20 === 0 && 
                (tickVals[tickVals.length - 1] + 20) != div.layout.polar.radialaxis.range[1] - 10) 
                tickVals.pop()
            Plotly.relayout(div, getPlotlyLayout(div.layout.polar.radialaxis.range[1] - 10, tickVals))
        }
    },
    {
       name: 'Zoom Out',
        icon: Plotly.Icons.zoom_minus,
        click: function(div) {
            let tickVals = div.layout.polar.radialaxis.tickvals
            if ((div.layout.polar.radialaxis.range[1] + 10) % 20 === 0 && 
                (tickVals[tickVals.length - 1] + 20) != div.layout.polar.radialaxis.range[1] + 10) 
                tickVals.push(div.layout.polar.radialaxis.range[1] - 10)
            Plotly.relayout(div, getPlotlyLayout(div.layout.polar.radialaxis.range[1] + 10, tickVals))
        }
    },
    {
        name: 'Reset axes and traces',
        icon: Plotly.Icons.home,
        click: function(div) {
            // turn every pheno trace back to legendonly
            Plotly.restyle(div, {visible: 'legendonly'}, [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22])
            Plotly.restyle(div, {visible: true}, 23) // turn on all-years mean trace
            console.log(div)
            Plotly.relayout(div, getPlotlyLayout())
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

function parseDate (date) {
    date = date.toString();
    var year = date.substring(0, 4);
    var month = parseInt(date.substring(4, 6), 10) - 1;
    var day = date.substring(6, 8);

    return new Date(year, month, day);
}

var firstOfMonthJulianDays = [ 1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]
