var Base = function (config) {
    ParseConfig(config, callback);
}

var callback = function (data) {
    renderLayerList(data.layers)
}
