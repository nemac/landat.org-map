/**
 * Parses a config file. Since the process to get external files
 * uses AJAX you need to pass a callback to handle the next steps
 * of using the config file, since we do not know how long it
 * will take to grab the file.
 */
export default function ParseConfig (configFile, callback) {
    GetConfig(configFile, callback);
}

function GetConfig (configFile, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            try {
                var data = JSON.parse(xmlhttp.responseText);
            } catch(err) {
                console.log("ERROR: Malformed JSON in config file.");
                console.log(err);
            }
            formatMap(data);
            formatLayers(data);
            callback(data);
        }
    };
 
    xmlhttp.open("GET", configFile, true);
    xmlhttp.send();
    console.log("hi")
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
            setDefaultLayers(layergroup[i], defaultEnabledLayers);
        }
    }
}

function setMapserverUrl (layer, url) {
    layer.url = layer.url || url;
}

function setDefaultLayers (layer, defaultLayers) {
    if (!defaultLayers || defaultLayers.length ===  0) return;
    if (defaultLayers.indexOf(layer.id) !== -1) {
        layer.active = true;
    } else {
        layer.active = false;
    }
}
