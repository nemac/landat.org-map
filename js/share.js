import {GetMap} from './map';
import {BASE_LAYER_TYPE} from './baselayer';
import {GetCurrentLayers} from './toggleLayer';

export function BindUpdateShareUrl (map) {
    map.on("moveend", updateShareUrl);
}

function updateShareUrl (e) {
    var map = GetMap();

    var params = [
        makeCenterString(map),
        makeZoomString(map),
        makeLayerString(map),
        makeBaseLayerString(map),
    ];

    setShareUrl(makeShareUrl(params));
}

function makeShareUrl (params) {
    return "?" + params.filter(function (p) { return p !== undefined }).join("&");
}

function setShareUrl (url) {
    if (window.history && window.history.replaceState) {
        window.history.replaceState({}, "", url);
    }
}

function makeCenterString (map) {
    var center = map.getCenter();
    return "center=" + center.lat.toString() + "," + center.lng.toString()
}

function makeZoomString (map) {
    return "zoom=" + map.getZoom();
}

function makeLayerString (map) {
    var layers = [];
    var opacityVals = {};
    var currentLayers = GetCurrentLayers();

    map.eachLayer(function (layer) {
        var options = layer.options;
        if (options && options.layers) {
            opacityVals[options.layers] = options.hasOwnProperty("opacity") ? options.opacity : "1";
        }
    });

    var currentLayer;
    var i;
    for (i = 0; i < currentLayers.length; i++) {
        currentLayer = currentLayers[i];
        layers.push(currentLayer);
        layers.push(opacityVals[currentLayer]);
    }
    return "layers=" + layers.join(",");
}

function makeBaseLayerString (map) {
    var layers = [];
    map.eachLayer(function (layer) {
        if (layer.options && layer.options.type === BASE_LAYER_TYPE) {
            layers.push(layer.options.id);
        }
    });
    return "baselayers=" + layers.join(",");
}

function parseShareUrl () {
    var params = window.location.search;
    if (params === "") return;

    params = getParamsArray(params);
    params = makeKeyedParamsObject(params);

    formatParams(params);
    return params;
}

function getParamsArray (params) {
    params = params.substring(1);
    params = unmangleParamString(params);
    return params.split("&");
}

function unmangleParamString (params) {
    return params.replace(/\%2[c|C]/g, ",");
}

function makeKeyedParamsObject (paramsArr) {
    var parsedParams = {};
    var paramPair;
    var i;

    for (i = 0; i < paramsArr.length; i++) {
        paramPair = paramsArr[i].split("=");
        parsedParams[paramPair[0]] = paramPair[1]
    }

    return parsedParams;
}

function formatParams (params) {
    if (params.center) params.center = formatCenterParam(params.center);
    if (params.layers) params.layers = formatLayerParam(params.layers);
    if (params.baselayers) params.baselayers = formatBaseLayerParam(params.baselayers);
}

function formatCenterParam (center) {
    return center.split(",");
}

function formatLayerParam (layers) {
    var formattedLayers = {
        "enabledLayers": [],
        "opacityVals": {}
    };
    var layerId;
    var i;

    layers = layers.split(",");
    for (i = 0; i < layers.length; i = i + 2) {
        layerId = layers[i];
        formattedLayers.enabledLayers.push(layerId);
        formattedLayers.opacityVals[layerId] = layers[i+1];
    }

    return formattedLayers;
}

function formatBaseLayerParam (baselayers) {
    return baselayers.split(",");
}

export function AddShareSettingsToConfig (config) {
    var share = parseShareUrl();
    if (!share) return;
    if (share.center) config.map.initialCenter = share.center;
    if (share.zoom) config.map.initialZoom = share.zoom;
    if (share.layers) addLayerSettingsToConfig(share.layers, config);
    if (share.baselayers) addBaseLayerSettingsToConfig(share.baselayers, config);
}

function addLayerSettingsToConfig (shareLayerSettings, config) {
    var enabledLayers = shareLayerSettings.enabledLayers;
    config["active-layers"] = enabledLayers;

    var i, j, prop, layergroup;
    var enabledLayer;
    var foundLayer;
    var layers = config.layers;

    for (i = 0; i < enabledLayers.length; i++) {
        foundLayer = false;
        enabledLayer = enabledLayers[i];
        for (prop in layers) {
            if (!layers.hasOwnProperty(prop)) return;
            layergroup = layers[prop];
            for (j = 0; j < layergroup.length; j++) {
                if (layergroup[j].id === enabledLayer) {
                    layergroup[j].opacity = shareLayerSettings.opacityVals[enabledLayer];
                    foundLayer = true;
                    break;
                }
            }
            if (foundLayer) break;
        }
    }
}

function addBaseLayerSettingsToConfig (shareBaseLayerSettings, config) {
    var baselayers = config.baselayers;
    var baselayer;
    var i;

    for (i = 0; i < baselayers.length; i++) {
        baselayer = baselayers[i];
        baselayer.active = (shareBaseLayerSettings.indexOf(baselayer.id) !== -1) ? true : false;
    }
}
