import ParseConfig from './parser';
import CreateSearch from './search';
import {SetupPanel} from './panel';
import {CreateBaseLayers} from './baselayer';
import {SetupGraphs, BindGraphEvents} from './graph'
import {BindTabEvents, HandleTabChange} from './tabs'
import {CreateMap} from './map'
import {BindUpdateShareUrl, AddShareSettingsToConfig} from './share'
import {CreateDefaultLayers} from './layer'
import CreateLogo from './logo';
import {BindPointsOfInterest} from './poi';
import {updateShareUrl} from './share';

var css = require('../css/sass/landat.scss')

// Does not rely on map object or config file
var Base = function (config) {
    ParseConfig(config, callback);
    SetupGraphs();
    BindTabEvents();
}

// Does rely on map object or config file
var callback = function (data) {
    AddShareSettingsToConfig(data)
    var map = CreateMap(data.map);
    CreateBaseLayers(map, data.baselayers);
    CreateDefaultLayers(data.layers, data["active-layers"]);
    SetupPanel(data.layers, data.layout);
    CreateSearch(map);
    CreateLogo(data.logo);
    if (data.tab) HandleTabChange(data.tab);
    BindGraphEvents(map);
    BindUpdateShareUrl(map);
    BindPointsOfInterest(map, data.pois)
    updateShareUrl()
}

window.Base = Base;

export default {Base};
