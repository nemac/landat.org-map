import {GetMap} from "./map";
import {updateShareUrl} from "./share";

/**
 * Needed for the share url since Leaflet does not have a default way to surface
 * the order of layers in the map
 */
var _current_layers = [];

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

export function toggleLayer (layer, layerDiv) {
    if (!layer.active) {
        enableLayer(layer);
    } else {
        disableLayer(layer);
    }
}

export function enableLayer (layer, layerDiv) {
    var map = GetMap();

    layer.active = true;
    layer.mapLayer = layer.mapLayer || makeWmsTileLayer(layer);
    map.addLayer(layer.mapLayer);
    addLayerToInternalTracker(layer);
    updateShareUrl();
}

function addLayerToInternalTracker (layer) {
    _current_layers.push(layer.id);
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
        crs: layer.crs || L.CRS.EPSG4326,
        format: layer.format || 'image/png',
        opacity: layer.opacity || "1"
    });
}
