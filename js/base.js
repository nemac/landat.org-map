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

import '../sass/landat.scss';

window.print = str => console && console.log(str)

// Does not rely on map object or config file
var Base = function (config) {
	ParseConfig(config, callback);
	BindTabEvents();
	BindCopyLinkEvents();
	BindMobileMenuEvents();
	BindDesktopMenuEvents();
}

// Does rely on map object or config file
var callback = function (data) {
        let stage = getStage();
	AddShareSettingsToConfig(data)
	var map = CreateMap(data.map);
	CreateBaseLayers(map, data.baselayers);
	CreateDefaultLayers(data.layers, data["active-layers"]);
	SetupPanel(data.layers, data.layout);
	CreateSearch(map);
	CreateLogo(data.logo);
	if (data.tab) HandleTabChange(data.tab);
	if (data.graph) HandleGraphTabChange(data.graph);
	BindGraphEvents(map, data.graphs);
	BindUpdateShareUrl(map);
	SetupPointsOfInterest(map, data.pois, data.graphs)
	updateShareUrl()
	SetupGraphs(data.graphs, stage);
}

export function getStage() {
  let mode = process.env.NODE_ENV;
  if (mode === 'none') { return 'local' };
  if (mode === 'development') { return 'beta' };
  if (mode === 'production') { return 'prod' }; 
}

window.Base = Base;

export default {Base};
