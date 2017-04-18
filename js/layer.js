import {GetMap} from "./map";
import {updateShareUrl} from "./share";

/**
 * Needed for the share url since Leaflet does not have a default way to surface
 * the order of layers in the map
 */
var _current_layers = [];
var _current_layers_objects = [];

/**
 * Note: layer is not the leaflet concept of a layer, but rather the internal
 *       object which tracks them. layer.mapLayer is the pointer to the
 *       leaflet layer.
 */

export function GetCurrentLayers () {
    return _current_layers;
}

export function CreateDefaultLayers (layers, defaultLayers) {
    var i, j, prop, layergroup;
    var defaultLayer;
    var foundLayer;

    if (!defaultLayers || defaultLayers.length === 0) return;

    for (i = 0; i < defaultLayers.length; i++) {
        foundLayer = false;
        defaultLayer = defaultLayers[i];
        for (prop in layers) {
            if (!layers.hasOwnProperty(prop)) return;
            layergroup = layers[prop];
            for (j = 0; j < layergroup.length; j++) {
                if (layergroup[j].id === defaultLayer) {
                    enableLayer(layergroup[j]);
                    foundLayer = true;
                    break;
                }
            }
            if (foundLayer) break;
        }
    }
}

export function toggleLayer (layer) {
    if (!layer.active) {
        enableLayer(layer);

        //send google analytics toggle the layer on
        ga('send', 'event', {
          eventCategory: 'layer',
          eventAction: 'toggle on',
          eventLabel: layer.name,
          nonInteraction: false
        });

    } else {
        disableLayer(layer);

        //send google analytics toggle the layer off
        ga('send', 'event', {
          eventCategory: 'layer',
          eventAction: 'toggle off',
          eventLabel: layer.name,
          nonInteraction: false
        });

    }
}

export function enableLayer (layer) {
    var map = GetMap();

    layer.active = true;
    layer.mapLayer = layer.mapLayer || makeWmsTileLayer(layer);
    map.addLayer(layer.mapLayer);
    addLayerToInternalTracker(layer);
    moveOverlayLayersToTop();
    updateShareUrl();
}

function moveOverlayLayersToTop () {
    var layer;
    var i, l;

    for (i = 0, l = _current_layers_objects.length; i < l; i++) {
        layer = _current_layers_objects[i];
        if (layer.type === "overlay") layer.mapLayer.bringToFront();
    }
}

function addLayerToInternalTracker (layer) {
    _current_layers.push(layer.id);
    _current_layers_objects.push(layer);
}

export function disableLayer (layer) {
    var map = GetMap();

    layer.active = false;
    if (layer.mapLayer && map.hasLayer(layer.mapLayer)) {
        map.removeLayer(layer.mapLayer);
    }
    removeLayerFromInternalTracker(layer);
    updateShareUrl();
}

function removeLayerFromInternalTracker (layer) {
    var loc = _current_layers.indexOf(layer.id);
    if (loc === -1) return;
    _current_layers.splice(loc, 1);
    _current_layers_objects.splice(loc, 1);
}

export function updateLayerOpacity (layer, newOpacity) {
    layer.opacity = newOpacity
    layer.mapLayer.setOpacity(newOpacity)
}

function makeWmsTileLayer (layer) {
    return L.tileLayer.wms(layer.url, {
        layers: layer.id,
        transparent: layer.transparent || true,
        version: layer.version || '1.3.0',
        crs: layer.crs || L.CRS.EPSG900913,
        format: layer.format || 'image/png',
        opacity: layer.opacity || 1.0,
        tileSize: layer.tileSize || document.getElementById("map").clientWidth
    });
}
