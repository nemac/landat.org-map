var map = L.map('map', {"scrollWheelZoom" : false}).setView(["38.5", "-81"], 6);

var baselayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' }).addTo(map);

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

//    svg.call(tip);

    // Add the valueline path.
    svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(data));

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
    svg.selectAll("point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("transform", function(d) {
        var coors = valueline([d]).slice(1).slice(0, -1);
        return "translate(" + coors + ")"
      })
      .attr("r", 3)
      .attr("stroke", "#000")
      .attr("fill",function(d,i){
        return computeColor(d[1], averages[i%46], 3);
      });
/*
        .on("mouseover", function(d) {
            var date = dateToMonthDay(d.year)
            tip.show(date[1] + ", " + date[0] + ": "  + d[l]);
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 3);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });
*/
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
    var month = date.substring(4, 6);
    var day = date.substring(6, 8);

    return new Date(year, month, day);
}
