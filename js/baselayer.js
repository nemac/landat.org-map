export default function CreateBaseLayers (map, layerConfig) {
    layerConfig = layerConfig || 
        [{
            "id" : "carto-light-default",
            "url" : "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "attribution" : '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }];
    var i;
    var baseLayer;
    var config;

    for (i = 0; i< layerConfig.length; i++) {
        config = layerConfig[i];

        if (!config.active) continue;
        baseLayer = createBaseLayer(config);
        baseLayer.addTo(map);
    }
}

function createBaseLayer (layerConfig) {
    return L.tileLayer(
        layerConfig.url,
        {
            id: layerConfig.id,
            type: "baselayer",
            attribution: layerConfig.attribution
        }
    );
}
