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
    
    //send google analytics click on graph type
    ga('send', 'event', {
      eventCategory: 'tab',
      eventAction: 'click',
      eventLabel: this.getAttribute("data-active"),
      nonInteraction: false
    });

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
    resetPanelWidth();
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

/**
 * Since the panel has child elements with position fixed and width inherit
 * we need to clear the inline width property if and only if the inline
 * width is less than the min width
 */
function resetPanelWidth () {
    var panel = document.getElementById("right-panel");
    var width = panel.style.width;
    if (!width) return;

    var panelMinWidth = d3.select(panel).style('min-width').slice(0, -2);
    if (parseInt(width.slice(0, -2), 10) > parseInt(panelMinWidth, 10)) return;

    panel.style.width = "";
}
