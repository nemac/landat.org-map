var Base = function () {
    //ParseConfig(config, callback);
    callback(config)
}

var callback = function (data) {
    renderLayerList(data.layers, data.layout)
}
