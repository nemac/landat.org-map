import {clearMap} from './map'

export default function BindMobileMenuEvents () {
	d3.select("#mobile-toggle-panel-button")
		.on("click", handleMobileTogglePanelBtnClick)
	d3.selectAll("#mobile-clear-map-button")
		.on("click", handleMobileClearMapBtnClick)
}

function handleMobileClearMapBtnClick() {
	d3.event.stopPropagation()
	clearMap()
	dispatchMobileClearMapBtnClickAnalytics()
}

function handleMobileTogglePanelBtnClick () {
	d3.event.stopPropagation()
	var wrapper = d3.select("#wrapper");
	var status = wrapper.classed("mobile-menu-hidden");
	wrapper.classed("mobile-menu-hidden", !status);
	dispatchMobileTogglePanelBtnClickAnalytics(!status ? "opening" : "closing");
}

function dispatchMobileClearMapBtnClickAnalytics () {
	ga('send', 'event', {
		eventCategory: 'mobile clearmap',
		eventAction: 'click',
		eventLabel: 'Mobile Clear Map',
		nonInteraction: false
	})
}

function dispatchMobileTogglePanelBtnClickAnalytics (status) {
	ga('send', 'event', {
		eventCategory: 'mobile menu',
		eventAction: 'click',
		eventLabel: 'Mobile Panel Toggle' + status,
		nonInteraction: false
	});
}
