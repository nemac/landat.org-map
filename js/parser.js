/**
 * Parses a config file. Since the process to get external files
 * uses AJAX you need to pass a callback to handle the next steps
 * of using the config file, since we do not know how long it
 * will take to grab the file.
 */
export function ParseConfig (configFile, callback) {
    GetConfig(configFile, callback);
}

export function GetAjaxObject(responseHandler) {
    var xmlhttp
    if (!window.XMLHttpRequest && window.ActiveXObject) {
        xmlhttp = new window.ActiveXObject("MSXML2.XMLHTTP.3.0")
    } else {
        xmlhttp = new XMLHttpRequest()
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
            responseHandler(xmlhttp.response)
        }
    }
    return xmlhttp
}

function GetConfig (configFile, callback) {
    var xmlhttp = GetAjaxObject(function (response) {
        var data = responseHandler(response)
        callback(data)
    })
    xmlhttp.open("GET", configFile, true);
    xmlhttp.send();
    console.log("hi")
}

function responseHandler (response) {
    response = JSON.parse(response)
    formatMap(response);
    formatLayers(response);
    return response
}

function formatMap (data) {
    if (!data.map) data.map = {};
}

function formatLayers (data) {
    var layers = data.layers;
    var defaultMapserverUrl = data.mapserverUrl;
    var defaultEnabledLayers = data["active-layers"];
    var layergroup;
    var i;

    for (var prop in layers) {
        if (!layers.hasOwnProperty(prop)) return;
        layergroup = layers[prop];
        for (i = 0; i < layergroup.length; i++) {
            setMapserverUrl(layergroup[i], defaultMapserverUrl);
            setDefaultLayerOpacity(layergroup[i], data.defaultLayerOpacity)
        }
    }
}

function setDefaultLayerOpacity (layer, opacity) {
    layer.opacity = layer.opacity || opacity
}

function setMapserverUrl (layer, url) {
    layer.url = layer.url || url;
}
