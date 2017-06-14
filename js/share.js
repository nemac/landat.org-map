import {GetMap} from './map';
import {BASE_LAYER_TYPE} from './baselayer';
import {GetCurrentLayers} from './layer';
import {GetAllPointsOfInterest, createPOI} from './poi';
import {GetActiveLayerGroups} from './panel';

export function BindUpdateShareUrl (map) {
	map.on("moveend", updateShareUrl);
}

export function updateShareUrl (e) {
	var map = GetMap();

	var params = [
		makeCenterString(map),
		makeZoomString(map),
		makeLayerString(map),
		makeLayerGroupsString(),
		makeBaseLayerString(map),
		makePointsOfInterestString(),
		makeActiveTabString(),
		makeActiveGraphTabString()
	];

	setShareUrl(makeShareUrl(params));
	setCopyLinkUrl();
	setSocialUrls();
}

export function AddShareSettingsToConfig (config) {
	var share = parseShareUrl();
	if (!share) return;
	if (share.center) config.map.center = share.center;
	if (share.zoom) config.map.zoom = share.zoom;
	if (share.layers) addLayerSettingsToConfig(share.layers, config);
	if (share.baselayers) addBaseLayerSettingsToConfig(share.baselayers, config);
	if (share.pois) addPointsOfInterestToConfig(share.pois, config)
	if (share.tab) config.tab = share.tab;
	if (share.graph) config.graph = share.graph;
	if (share.layerGroups) config.layerGroups = addLayerGroupSettingsToConfig(share.layerGroups, config)
}

function makeShareUrl (params) {
	return "?" + params.filter(function (p) { return p !== undefined }).join("&");
}

function setShareUrl (url) {
	if (window.history && window.history.replaceState) {
		window.history.replaceState({}, "", url);
	}
}

function setCopyLinkUrl () {
	var url = window.location.href;
	document.getElementById("shareurl-link-url").setAttribute("value", url);
}

export function BindCopyLinkEvents () {
	d3.select(document).on("click", handleBodyClick);
	d3.select(".shareurl-link a").on("click", handleShareLinkButtonClick);
	d3.select(".shareurl-link-url").on("click", handleShareLinkUrlClick);
	d3.select(".shareurl-link-popup-remover").on("click", handleShareLinkCloseButtonClick);
}

/**
 * Should close the copy link popup if it is active and if you click on any element
 * that is not the popup or its children.
 */
function handleBodyClick () {
	var event = d3.event;
	var nodePath = []
	nodePath = getDomPath(event.target)

	var toClosePopup = true;
	var i, l;

	for (i = 0, l = nodePath.length; i < l; i++) {
		try {
			if (nodePath[i].classList.contains('shareurl-link-popup') ||
					nodePath[i].classList.contains('shareurl-link')) {
				toClosePopup = false;
				break;
			}            
		} catch(e) {
			// clicking svg throws an error in IE
		}
	}

	if (toClosePopup) {
		var sharePopup = document.getElementsByClassName('shareurl-link-popup').item(0)
		handleCopyLinkClose(sharePopup);
	}
}

function getDomPath(node) {
	var path = []
	while (node && node.parentNode) {
		path.push(node)
		node = node.parentNode
	}
	return path
}

function handleShareLinkButtonClick () {
	var sharePopup = document.getElementsByClassName("shareurl-link-popup").item(0)
	if (d3.select(sharePopup).classed("active")) {
		handleCopyLinkClose(sharePopup)
	} else {
		handleCopyLinkOpen(sharePopup);
	}
}

function handleShareLinkCloseButtonClick () {
	var sharePopup = document.getElementsByClassName("shareurl-link-popup").item(0)
	handleCopyLinkClose(sharePopup);
}

function handleShareLinkUrlClick () {
	selectCopyLinkUrl();
}

function handleCopyLinkOpen (sharePopup) {
	sharePopup.classList.toggle("active")
	selectCopyLinkUrl();

	//send google analytics event click on share url
	ga('send', 'event', {
	  eventCategory: 'shareurl',
	  eventAction: 'open',
	  eventLabel: document.getElementById("shareurl-link-url").getAttribute("value"),
	  nonInteraction: false
	});

}

function handleCopyLinkClose (sharePopup) {

	//send google analytics event click on share url close
	ga('send', 'event', {
	  eventCategory: 'shareurl',
	  eventAction: 'close',
	  eventLabel: document.getElementById("shareurl-link-url").getAttribute("value"),
	  nonInteraction: false
	});

	sharePopup.classList.remove("active")
}

function selectCopyLinkUrl () {
	var shareInput = document.getElementById("shareurl-link-url");
	shareInput.focus();
	shareInput.setSelectionRange(0, shareInput.value.length);
}

function setSocialUrls () {
	var url = mangleParamString(window.location.href);
	var socialLinks = document.getElementsByClassName("shareurl-social");
	var socialLink;
	var newUrl;
	var i, l;

	for (i = 0, l = socialLinks.length; i < l; i++) {
		socialLink = socialLinks[i];

		newUrl = socialLink.getAttribute("data-baseurl") + url;
		socialLink.setAttribute("href", newUrl);

		//send google analytics event for social urls
		socialLink.addEventListener('click', function() {

		  ga('send', 'event', {
			eventCategory: 'shareurl',
			eventAction: this.getAttribute("aria-label"),
			eventLabel: this.href,
			nonInteraction: false
		  });

		});

	}
}

function makeCenterString (map) {
	var center = map.getCenter();
	return "center=" + center.lat.toString() + "," + center.lng.toString();
}

function makeZoomString (map) {
	return "zoom=" + map.getZoom();
}

function makeLayerString (map) {
	var layers = [];
	var opacityVals = {};
	var currentLayers = GetCurrentLayers();

	map.eachLayer(function (layer) {
		var options = layer.options;
		if (options && options.layers) {
			opacityVals[options.layers] = options.hasOwnProperty("opacity") ? options.opacity : "1";
		}
	});

	var currentLayer;
	var i;
	for (i = 0; i < currentLayers.length; i++) {
		currentLayer = currentLayers[i];
		layers.push(currentLayer);
		layers.push(opacityVals[currentLayer]);
	}
	return "layers=" + layers.join(",");
}

function makeBaseLayerString (map) {
	var layers = [];
	map.eachLayer(function (layer) {
		if (layer.options && layer.options.type === BASE_LAYER_TYPE) {
			layers.push(layer.options.id);
		}
	});
	return "baselayers=" + layers.join(",");
}

function makeLayerGroupsString () {
	var activeLayerGroups = GetActiveLayerGroups()
	return "layerGroups="+activeLayerGroups.map(d => d.id).join(',')
}

function makePointsOfInterestString () {
	var pois = GetAllPointsOfInterest()
	if (!pois.length) return;
	var poiString = "pois=";
	pois.forEach(poi => {
		poiString += poi.lat + ',' + poi.lng;
		if (poi.plots && poi.plots.length) {
			poiString += ',' + poi.plots.join(',');
		}
		poiString += ';';
	})
	return poiString;
}

function makeActiveTabString () {
	return "tab=" + d3.select(".panel-top-btn.active").attr("data-active");
}

function makeActiveGraphTabString () {
	return "graph=" + d3.select(".graph-type-btn.active").attr("data-type");
}

function parseShareUrl () {
	var params = window.location.search;
	if (params === "") return;

	params = getParamsArray(params);
	params = makeKeyedParamsObject(params);

	formatParams(params);
	return params;
}

function getParamsArray (params) {
	params = params.substring(1);
	params = unmangleParamString(params);
	return params.split("&");
}

function mangleParamString (url) {
	return url.replace(/\:/g, "%3A")
		.replace(/\;/g, "%3B")
		.replace(/\//g, "%2F")
		.replace(/\,/g, "%2C")
		.replace(/\&/g, "%26");
}

function unmangleParamString (params) {
	return params.replace(/\%2[c|C]/g, ",").replace(/\%3[b|B]/g, ";")
}

function makeKeyedParamsObject (paramsArr) {
	var parsedParams = {};
	var paramPair;
	var i;

	for (i = 0; i < paramsArr.length; i++) {
		paramPair = paramsArr[i].split("=");
		parsedParams[paramPair[0]] = paramPair[1]
	}

	return parsedParams;
}

function formatParams (params) {
	if (params.center) params.center = formatCenterParam(params.center);
	if (params.layers) params.layers = formatLayerParam(params.layers);
	if (params.baselayers) params.baselayers = formatBaseLayerParam(params.baselayers);
	if (params.pois) params.pois = formatPointsOfInterestParam(params.pois)
	if (params.layerGroups) params.layerGroups = formatLayerGroupsParam(params.layerGroups)
}

function formatCenterParam (center) {
	return center.split(",");
}

function formatLayerParam (layers) {
	var formattedLayers = {
		"enabledLayers": [],
		"opacityVals": {}
	};
	var layerId;
	var i;

	layers = layers.split(",");
	for (i = 0; i < layers.length; i = i + 2) {
		layerId = layers[i];
		formattedLayers.enabledLayers.push(layerId);
		formattedLayers.opacityVals[layerId] = layers[i+1];
	}

	return formattedLayers;
}

function formatBaseLayerParam (baselayers) {
	return baselayers.split(",");
}

function formatPointsOfInterestParam (pois) {
	return pois.split(';')
		.filter((str) => str !== '')
		.map((poi) => {
			poi = poi.split(',');
			if (poi.length > 2) {
				return createPOI(poi[0], poi[1], poi.splice(2));
			} else {
				return createPOI(poi[0], poi[1], null);
			}
		});
}

function formatLayerGroupsParam (layerGroupSettings) {
	return layerGroupSettings.split(',')
}

function addLayerGroupSettingsToConfig(activeLayerGroupIds, config) {
	config.layout['layer-groups-order'].forEach(layerGroup => {
		// set layer group to active if its id appears in the share url settings
		layerGroup.active = activeLayerGroupIds.filter(id => {
			return id === layerGroup.id
		}).length > 0
	})
}

function addLayerSettingsToConfig (shareLayerSettings, config) {
	var enabledLayers = shareLayerSettings.enabledLayers;
	config["active-layers"] = enabledLayers;

	var i, j, prop, layergroup;
	var enabledLayer;
	var foundLayer;
	var layers = config.layers;

	for (i = 0; i < enabledLayers.length; i++) {
		foundLayer = false;
		enabledLayer = enabledLayers[i];
		for (prop in layers) {
			if (!layers.hasOwnProperty(prop)) return;
			layergroup = layers[prop];
			for (j = 0; j < layergroup.length; j++) {
				if (layergroup[j].id === enabledLayer) {
					layergroup[j].opacity = shareLayerSettings.opacityVals[enabledLayer];
					foundLayer = true;
					break;
				}
			}
			if (foundLayer) break;
		}
	}
}

function addBaseLayerSettingsToConfig (shareBaseLayerSettings, config) {
	var baselayers = config.baselayers;
	var baselayer;
	var i;

	for (i = 0; i < baselayers.length; i++) {
		baselayer = baselayers[i];
		baselayer.active = (shareBaseLayerSettings.indexOf(baselayer.id) !== -1) ? true : false;
	}
}

function addPointsOfInterestToConfig(pois, config) {
	config["pois"] = pois
}

