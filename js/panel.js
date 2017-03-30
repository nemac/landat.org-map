import {toggleLayer} from "./toggleLayer";
import {makeOpacitySlider} from "./opacitySlider"
import {updateShareUrl} from "./share";

export default function setupPanel (layers, layout) {
    var layerGroups = makeLayerGroups(layout['layer-groups-order']);
    makeLayerElems(layerGroups, layers);
    makePanelDraggable()
}

function makePanelDraggable() {
  var overlay = d3.select('#right-panel-drag-overlay')

  overlay.call(d3.drag()
    .on('drag', function () {
      panelDragEventHandler.call(this)
    }));
}

function panelDragEventHandler() {
    var panel = document.getElementById('right-panel')
    var mapWrapper = document.getElementById('map-wrapper')
    var wrapper = document.getElementById('wrapper')
    var wrapperWidth = wrapper.clientWidth

    var panelWidth = panel.clientWidth
    var panelMinWidth = +panel.style.minWidth.slice(0, -2)

    var mouseX = d3.event.sourceEvent.x
    var xDelta = (wrapperWidth - mouseX) - panelWidth

    var newPanelWidth = panelWidth + xDelta
    newPanelWidth = newPanelWidth < panelMinWidth ? panelMinWidth : newPanelWidth

    mapWrapper.style.paddingRight = `${newPanelWidth}px`
    panel.style.width = `${newPanelWidth}px`
}

function makeLayerGroups (layout) {
    return d3.select('.layer-list')
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
            var layerDiv = d3.select(this);

            makeCheckbox(layer, layerDiv);
            makeLabel(layer, layerDiv);
            makeDescription(layer, layerDiv);
            makeLegend(layer, layerDiv);
            makeOpacitySlider(layer, layerDiv);
        });
}

function makeCheckbox (layer, layerDiv) {
    layerDiv.append('input')
        .attr('type', 'checkbox')
        .attr('id', layer => layer.id)
        .attr('checked', (layer) => {
            return layer.active ? 'checked' : null;
        })
        .on('click', layer => {
            toggleLayer(layer);
            layerDiv.selectAll('.legend-wrapper, .opacity-slider-wrapper')
                .classed('active', layer.active);
        });
}

function makeLabel(layer, layerDiv) {
    layerDiv.append('label')
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

function makeLegend (layer, layerDiv) {
    layerDiv.append('div')
        .attr('class', 'legend-wrapper')
        .classed('active', layer.active)
        .append('img')
        .attr('src', layer.legend || 'mean_ndvi_legend.jpg');
}



