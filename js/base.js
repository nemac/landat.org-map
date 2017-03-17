import ParseConfig from './parser.js';

var Base = function (config) {
    ParseConfig(config, callback);
}

var callback = function (data) {
    renderLayerList(data.layers, data.layout)
}

window.Base = Base;

export default {Base};
