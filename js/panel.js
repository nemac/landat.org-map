import {toggleLayer} from "./layer";
import {makeOpacitySlider} from "./opacitySlider"
import {setSliderInitialPos} from "./opacitySlider"
import {updateShareUrl} from "./share";

export function SetupPanel (layers, layout) {
    var layerGroups = makeLayerGroups(layout['layer-groups-order']);
    makeLayerElems(layerGroups, layers);
    makePanelDraggable()
    setPanelScrollHandler()
}

function setPanelScrollHandler() {
    var panel = document.getElementById('right-panel')
    panel.onscroll = updatePanelDragOverlayHeight
}

function makePanelDraggable() {
    var overlay = d3.select('#right-panel-drag-overlay')

    overlay.call(d3.drag()
        .on('drag', function () {
        panelDragEventHandler.call(this)
    }));
}

function panelDragEventHandler() {
    updatePanelDragOverlayHeight()
    updatePanelWidth()
}

export function updatePanelDragOverlayHeight () {
    var panel = d3.select('#right-panel')
    var panelOffsetHeight = panel.property('offsetHeight')
    var panelDragOverlay = document.getElementById('right-panel-drag-overlay')
    var header = document.getElementById('right-panel-header')

    var newHeight

    if (panel.classed('graphs-active')) {
        var graphList = document.getElementById('graph-list')
        newHeight = header.scrollHeight + graphList.scrollHeight
    }
    else { // panel.classed('layers-active')
        var layerList = document.getElementById('layer-list')
        newHeight = header.scrollHeight + layerList.scrollHeight
    }
    newHeight = newHeight > panelOffsetHeight ? `${newHeight}`+'px' : null
    panelDragOverlay.style.height = newHeight
}

function updatePanelWidth() {
    var panel = d3.select('#right-panel')
    var panelMinWidth = +panel.style('min-width').slice(0, -2)
    var panelClientWidth = panel.property('clientWidth')

    var wrapper = document.getElementById('wrapper')
    var wrapperWidth = wrapper.clientWidth

    var mapWrapper = document.getElementById('map-wrapper')

    var mouseX = d3.event.sourceEvent.x
    var xDelta = (wrapperWidth - mouseX) - panelClientWidth

    var newPanelWidth = panelClientWidth + xDelta
    newPanelWidth = newPanelWidth < panelMinWidth ?
        panelMinWidth
    :   newPanelWidth > wrapperWidth ?
        wrapperWidth
    :   newPanelWidth
    mapWrapper.style.paddingRight = `${newPanelWidth}`+'px'
    panel.style('width', `${newPanelWidth}`+'px')
}

function makeLayerGroups (layout) {
    return d3.select('#layer-list')
        .selectAll('.layer-group-wrapper')
        .data(layout)
        .enter()
            .append('div')
            .attr('class', 'layer-group-wrapper')
            .attr('id', layerGroup => layerGroup.id)
            .classed('active', layerGroup => layerGroup.active)
            .each(function (layerGroup) {
                d3.select(this).append('div')
                    .attr('class', 'layer-group-btn btn')
                    .on('click', function (layerGroup) {
                        layerGroup.active = !layerGroup.active;
                        d3.select(this.parentNode).classed('active', () => layerGroup.active);
                        updatePanelDragOverlayHeight()
                    })
                    .text(layerGroup.name)
            })
            .append('div').attr('class', 'layer-group');
}

function makeLayerElems (layerGroups, layers) {
    layerGroups.selectAll('.layer-select')
        .data(layerGroup => layers[layerGroup.id])
        .enter().append('div')
        .attr('class', 'layer-select')
        .each(function (layer) {
            var groupName = this.parentNode.parentNode.id;
            var layerDiv = d3.select(this)
            makeCheckbox(layer, layerDiv);
            makeLabel(layer, layerDiv);
            makeDescription(layer, layerDiv);
            makeLayerTools(layer, layerDiv);
        });
}

function makeCheckbox (layer, layerDiv) {
    layerDiv.append('input')
        .attr('type', 'checkbox')
        .attr('id', layer => layer.id)
        .attr('checked', (layer) => {
            return layer.active ? 'checked' : null;
        })
        .on('click', function(layer) {
            toggleLayer(layer);
            layerDiv.select('.layer-tools-wrapper')
                .classed('active', layer.active);
            if (layer.active) setSliderInitialPos(layer, layerDiv)
        });
}

function makeLabel(layer, layerDiv) {
    layerDiv
        .append('div')
            .attr('class', 'layer-label-wrapper')
        .append('label')
            .attr('for', layer => layer.id)
            .attr('class', 'layer-label')
            .html(layer => layer.name);
}

function makeDescription (layer, layerDiv) {
    if (layer.info && layer.info !== '') {
        layerDiv.append('div')
            .attr('class', 'layer-info-btn')
            .text('(?)')
            .on('click', function () {
                d3.select(this.parentNode)
                    .select('.layer-info-wrapper')
                    .classed('active', function () {
                        return !d3.select(this).classed('active');
                    })
            });

        layerDiv.append('div')
            .attr('class', 'layer-info-wrapper')
            .text(layer => layer.info);
    }
}

function makeLayerTools(layer, layerDiv) {
    var layerToolsDiv = layerDiv.append('div')
        .attr('class', 'layer-tools-wrapper')
        .classed('active', function () {
            return layer.active
        })

    makeOpacitySlider(layer, layerToolsDiv);
    makeLegend(layer, layerToolsDiv);
}

function makeLegend (layer, layerToolsWrapper) {
    layerToolsWrapper
        .append('div')
            .attr('class', 'legend-wrapper')
        .append('img')
            .attr('src', layer.legend || 'mean_ndvi_legend.jpg');
}



