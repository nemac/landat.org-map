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
        var list = document.getElementById("graph-list");
        list.appendChild(div);
        console.log(response)
    });
    oReq.open("GET", url);
    oReq.send()
}

function createMarker (lat, lng) {
    var marker = L.marker([lat, lng]).addTo(map);
}
