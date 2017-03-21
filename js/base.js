import ParseConfig from './parser';
import CreateSearch from './search';
import renderLayerList from './renderLayerList';
import CreateBaseLayers from './baselayer';
import {SetupGraphs, BindGraphEvents} from './graph'

var Base = function (config) {
    ParseConfig(config, callback);
    SetupGraphs();
}

var callback = function (data) {
    CreateBaseLayers(map, data.baselayers);
    renderLayerList(map, data.layers, data.layout);
    CreateSearch(map);
    BindGraphEvents(map);
}

window.Base = Base;

export default {Base};
