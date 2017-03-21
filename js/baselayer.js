export default function CreateBaseLayers (map, layerConfig) {
    layerConfig = layerConfig || 
        [{
            "url" : "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "attribution" : '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }];

    var i;
    var baseLayer;

    for (i = 0; i< layerConfig.length; i++) {
        baseLayer = createBaseLayer(layerConfig[i]);
        baseLayer.addTo(map);
    }
}

function createBaseLayer (layerConfig) {
    return L.tileLayer(
        layerConfig.url,
        { attribution: layerConfig.attribution }
    );
}
