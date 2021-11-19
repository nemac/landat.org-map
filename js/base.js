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
import {config} from './config';

import '../sass/landat.scss';

window.print = str => console && console.log(str)

// Does not rely on map object or config file
var Base = function () {
  window.app = config
  callback()
	BindTabEvents();
	BindCopyLinkEvents();
	BindMobileMenuEvents();
	BindDesktopMenuEvents();
}

// Does rely on map object or config file
var callback = function () {
  const app = window.app
  let stage = getStage();
	AddShareSettingsToConfig(app)
	var map = CreateMap(app.map);
	CreateBaseLayers(map, app.baselayers);
	CreateDefaultLayers(app.layers, app["active-layers"]);
	SetupPanel(app.layers, app.layout);
	CreateSearch(map);
	CreateLogo(app.logo);
	if (app.tab) HandleTabChange(app.tab);
	if (app.graph) HandleGraphTabChange(app.graph);
	BindGraphEvents(map, app.graphs);
	BindUpdateShareUrl(map);
	SetupPointsOfInterest(map, app.pois, app.graphs)
	updateShareUrl()
	SetupGraphs(app.graphs, stage);
}

export function getStage() {
  let mode = process.env.NODE_ENV;
  if (mode === 'none') { return 'local' };
  if (mode === 'development') { return 'beta' };
  if (mode === 'production') { return 'prod' }; 
}

window.Base = Base;

export default {Base};
