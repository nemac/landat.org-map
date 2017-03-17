import ParseConfig from './parser';
import CreateSearch from './search';

var Base = function (config) {
    ParseConfig(config, callback);
}

var callback = function (data) {
    renderLayerList(data.layers, data.layout);
    CreateSearch(map);
}

window.Base = Base;

export default {Base};
