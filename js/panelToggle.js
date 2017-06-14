import {GetMap, clearMap} from "./map";

export default function BindDesktopMenuEvents () {
	d3.select("#toggle-panel-button")
		.on("click", handleDesktopTogglePanelBtnClick)
	d3.selectAll("#clear-map-button")
		.on("click", handleDesktopClearMapBtnClick)
}

function handleDesktopClearMapBtnClick(e) {
	d3.event.stopPropagation()
	clearMap()
	// Quick and dirty solution -- creates a new session for google analytics?
	//var url = window.location.href.split('?')[0]
	//window.location.href = url
	dispatchDesktopClearMapBtnClickAnalytics()
}

function handleDesktopTogglePanelBtnClick (e) {
	d3.event.stopPropagation()
	var wrapper = d3.select("#wrapper");
	var status = wrapper.classed("panel-active");
	wrapper.classed("panel-active", !status);
	wrapper.classed("panel-inactive", status);
	(GetMap()).invalidateSize({pan: false});
	dispatchDesktopTogglePanelBtnClickAnalytics(!status ? "Open" : "Close");
}

function dispatchDesktopClearMapBtnClickAnalytics () {
	ga('send', 'event', {
		eventCategory: 'desktop',
		eventAction: 'click',
		eventLabel: 'Clear Map Btn',
		nonInteraction: false
	});
}

function dispatchDesktopTogglePanelBtnClickAnalytics (status) {
	ga('send', 'event', {
		eventCategory: 'desktop',
		eventAction: 'click',
		eventLabel: 'Panel Toggle ' + status,
		nonInteraction: false
	});
}
