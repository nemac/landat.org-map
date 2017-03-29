import {GetMap} from "./map";
import {updateShareUrl} from "./share";

export const BASE_LAYER_TYPE = "baselayer";

var _baselayers;

export function CreateBaseLayers (map, layerConfig) {
    layerConfig = layerConfig || 
        [{
            "id" : "carto-light-default",
            "url" : "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "attribution" : '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }];

    _baselayers = layerConfig;
    var i;
    var baseLayer;
    var config;

    for (i = 0; i < layerConfig.length; i++) {
        config = layerConfig[i];

        if (!config.active) continue;
        baseLayer = createBaseLayer(config);
        config.layer = baseLayer;
        baseLayer.addTo(map);
    }

    createBaseLayerUI(layerConfig)
}

function createBaseLayerUI (config) {
    var baseUI = document.createElement("div");
    baseUI.className = "baselayer-ui";
    var baseWrapper;
    var baseImg;
    var baseLabel;

    var layer;
    for (var i = 0, l = config.length; i < l; i++) {
        layer = config[i];
        if (!layer.hasOwnProperty("image")) continue;

        baseWrapper = document.createElement("div");
        baseWrapper.setAttribute("data-layer", layer.id);
        baseImg = document.createElement("img");
        baseImg.setAttribute("src", layer.image);
        baseImg.setAttribute("alt", layer.label);
        baseImg.setAttribute("title", layer.label);
        baseLabel = document.createElement("div");
        baseLabel.textContent = layer.label;
        baseWrapper.appendChild(baseImg);
        baseWrapper.appendChild(baseLabel);
        baseWrapper.addEventListener("click", handleBaseClick)

        d3.select(baseWrapper)
            .classed("base-selector", true)
            .classed("active", layer.active);
       
        baseUI.appendChild(baseWrapper);
    }

    document.getElementsByClassName("leaflet-bottom leaflet-left")[0].appendChild(baseUI);
}

function handleBaseClick (e) {
    e.stopPropagation();
    var layerid = this.getAttribute("data-layer");
    toggleActiveBaseUI(this);
    removeCurrentBaseLayer();
    addNewBaseLayerToMap(layerid);
    updateShareUrl();
}

function toggleActiveBaseUI (baseUIElem) {
    d3.select(".base-selector.active").classed("active", false);
    d3.select(baseUIElem).classed("active", true);
}

function removeCurrentBaseLayer () {
    var map = GetMap();

    map.eachLayer(function (layer) {
        if (layer.options.type !== BASE_LAYER_TYPE) return;
        map.removeLayer(layer);
    })
}

function addNewBaseLayerToMap (layerid) {
    var map = GetMap();

    var layer;
    for (var i = 0, l = _baselayers.length; i < l; i++) {
        layer = _baselayers[i];
        if (layer.id !== layerid) continue;
        if (!layer.layer) layer.layer = createBaseLayer(layer);
        layer.layer.addTo(map);
        layer.layer.bringToBack();
        break;
    }
}

function createBaseLayer (layerConfig) {
    return L.tileLayer(
        layerConfig.url,
        makeBaseLayerOptions(layerConfig)
    );
}

function makeBaseLayerOptions (config) {
    var options = {};
    if (config.id) options.id = config.id;
    if (config.attribution) options.attribution = config.attribution;
    if (config.subdomains) options.subdomains = config.subdomains;
    options.type = BASE_LAYER_TYPE;

    return options;
}

