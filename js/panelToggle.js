import {GetMap} from "./map";

export default function BindDesktopMenuEvents () {
    d3.select("#hide-menu-button").on("click", handleDesktopMenuBtnClick);
}

function handleDesktopMenuBtnClick (e) {
    d3.event.stopPropagation();
    var wrapper = d3.select("#wrapper");
    var status = wrapper.classed("panel-active");
    wrapper.classed("panel-active", !status);
    wrapper.classed("panel-inactive", status);
    (GetMap()).invalidateSize({pan: false});
    dispatchMobileMenuBtnClickAnalytics(!status ? "opening" : "closing");
}

function dispatchMobileMenuBtnClickAnalytics (status) {
    ga('send', 'event', {
        eventCategory: 'desktop menu',
        eventAction: 'click',
        eventLabel: 'Desktop Menu ' + status,
        nonInteraction: false
    });
}
