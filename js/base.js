import {ParseConfig} from './parser';
import CreateSearch from './search';
import {SetupPanel} from './panel';
import {CreateBaseLayers} from './baselayer';
import {SetupGraphs, HandleGraphTabChange} from './graph'
import {BindGraphEvents} from './poi';
import {BindTabEvents, HandleTabChange} from './tabs'
import {CreateMap} from './map'
import {BindUpdateShareUrl, AddShareSettingsToConfig, BindCopyLinkEvents} from './share'
import {CreateDefaultLayers} from './layer'
import CreateLogo from './logo';
import {SetupPointsOfInterest} from './poi';
import {updateShareUrl} from './share';
import BindMobileMenuEvents from './mobile';
import BindDesktopMenuEvents from './panelToggle';

var css = require('../sass/landat.scss')

// Does not rely on map object or config file
var Base = function (config) {
	ParseConfig(config, callback);
	SetupGraphs();
	BindTabEvents();
	BindCopyLinkEvents();
	BindMobileMenuEvents();
	BindDesktopMenuEvents();
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
	if (data.graph) HandleGraphTabChange(data.graph);
	BindGraphEvents(map);
	BindUpdateShareUrl(map);
	SetupPointsOfInterest(map, data.pois)
	updateShareUrl()
}

window.Base = Base;

export default {Base};
