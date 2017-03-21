import ParseConfig from './parser';
import CreateSearch from './search';
import renderLayerList from './renderLayerList';

var Base = function (config) {
    ParseConfig(config, callback);
}

var callback = function (data) {
    renderLayerList(map, data.layers, data.layout);
    CreateSearch(map);
}

window.Base = Base;

export default {Base};
