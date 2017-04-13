import {updatePanelDragOverlayHeight} from "./panel";
import {updateShareUrl} from "./share";

export function BindTabEvents () {
    d3.selectAll(".panel-top-btn").on("click", handleTabHeaderBtnClick);
}

export function GetActiveTab () {
    return document.getElementsByClassName("panel-top-btn active")[0].getAttribute("data-active");
}

function handleTabHeaderBtnClick () {
    // If the section is already active, do nothing
    if (this.classList.contains("active")) return;
    HandleTabChange(this.getAttribute("data-active"));
}

export function HandleTabChange (newClass) {
    disableActiveTab();
    enableTab(newClass);
    updateShareUrl();
}

function enableTab (newClass) {
    d3.select(".panel-top-btn[data-active='" + newClass + "']").classed("active", true);

    d3.selectAll("#map-wrapper, #right-panel")
        .classed(newClass, true);

    d3.select(".panel-section-wrapper[data-active='" + newClass + "']").classed("active", true);

    toggleMapPadding();
    updatePanelDragOverlayHeight();
}

function disableActiveTab () {
    var activeClass = d3.select(".panel-top-btn.active").attr("data-active");

    d3.selectAll('#map-wrapper, #right-panel')
        .classed(activeClass, false);

    d3.selectAll('.panel-top-btn.active, .panel-section-wrapper.active')
        .classed('active', false);
}

function toggleMapPadding () {
    var paddingRight = document.getElementById("right-panel").offsetWidth;
    document.getElementById("map-wrapper").style.paddingRight = paddingRight + "px";
}
