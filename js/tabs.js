import {updatePanelDragOverlayHeight} from './panel'

export default function BindTabEvents () {
    d3.selectAll(".panel-top-btn").on("click", handleTabHeaderBtnClick);
}

function handleTabHeaderBtnClick () {
    // If the section is already active, do nothing
    if (this.classList.contains("active")) return;

    disableActiveTab();
    enableTab(this.getAttribute("data-active"));
}

function enableTab (activeClass) {
    d3.select(".panel-top-btn[data-active='" + activeClass + "']").classed("active", true);

    d3.selectAll("#map-wrapper, #right-panel")
        .classed(activeClass, true);

    d3.select(".panel-section-wrapper[data-active='" + activeClass + "']").classed("active", true);

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
