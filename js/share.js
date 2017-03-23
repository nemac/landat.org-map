import {GetMap} from './map';

export function BindUpdateShareUrl (map) {
    map.on("moveend", updateShareUrl);
}

function updateShareUrl (e) {
    var map = GetMap();

    var params = [
        makeCenterString(map),
        makeZoomString(map),
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
}

function formatCenterParam (val) {
    return val.split(",");
}

export function AddShareSettingsToConfig (config) {
    var share = parseShareUrl();

    if (!config.map) config.map = {};
    if (share.center) config.map.initialCenter = share.center;
    if (share.zoom) config.map.initialZoom = share.zoom;
}
