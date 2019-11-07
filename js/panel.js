import {toggleLayer} from "./layer";
import {makeOpacitySlider} from "./opacitySlider"
import {setOpacitySliderPosition} from "./opacitySlider"
import {updateShareUrl} from "./share";

var layerGroupLayout = []
var layerGroups

export function GetActiveLayerGroups () {
    return layerGroupLayout.filter(layerGroup => {
        return layerGroup.active
    })
}

export function resetPanelState () {

}

export function getLayerGroups () {
    return layerGroups
}

export function SetupPanel (layers, layout) {
    layerGroupLayout = layout['layer-groups-order']
    layerGroups = makeLayerGroups(layout['layer-groups-order']);
    makeLayerElems(layerGroups, layers);
    makePanelDraggable()
    setPanelScrollHandler()
}

function browserIsInternetExplorer() {
    var ua = window.navigator.userAgent
    return ua.indexOf('MSIE') > -1 || ua.indexOf('rv:11.0') > -1
}

function setPanelScrollHandler() {
    var panel = document.getElementById('right-panel')
    panel.onscroll = updatePanelDragOverlayHeight
}

function makePanelDraggable() {
    if (browserIsInternetExplorer()) return

    var overlay = d3.select('#right-panel-drag-overlay')

    overlay.style('cursor', 'ew-resize')

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
        var graphListExtraSpace = 700
        var graphList = document.getElementById('graph-list')
        newHeight = header.scrollHeight + graphList.scrollHeight + graphListExtraSpace
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
                var group = d3.select(this).append('div')
                    .attr('class', 'layer-group-btn btn')
                    .on('click', function (layerGroup) {

                        //send google analytics toggle the layer list accordians
                        ga('send', 'event', {
                          eventCategory: 'layer list',
                          eventAction: 'toggle ' + !layerGroup.active,
                          eventLabel: layerGroup.name,
                          nonInteraction: false
                        });

                        layerGroup.active = !layerGroup.active;
                        d3.select(this.parentNode).classed('active', () => layerGroup.active);
                        updatePanelDragOverlayHeight()
                        updateShareUrl()
                    })
                    .text(layerGroup.name)
                makeDescription(layerGroup, group);
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
            layer.layerDiv = layerDiv
            var hasdownload = (layer.hasOwnProperty('download'))
            // console.log('layer', layer.name, hasdownload)

            makeCheckbox(layer, layerDiv);
            makeLabel(layer, layerDiv);
            makeDescription(layer, layerDiv);
            layerDiv.node().appendChild(makeLayerTools(layer));
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
            toggleLayer(layer)
            toggleLayerToolsUI(layer)
        });
}

export function toggleLayerToolsUI (layer) {
    layer.layerDiv.select('.layer-tools-wrapper')
        .classed('active', layer.active);
    if (layer.active) {
        var sliderHandle = layer.layerDiv.select('.opacity-slider-handle').node()
        setOpacitySliderPosition(layer, sliderHandle, layer.opacitiy)
    }
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
    var imgsrc = (layerDiv.classed("layer-group-btn") === true ?
                  'imgs/more-info-icon-64x64--white.png' :
                  'imgs/more-info-icon-64x64.png');

    var imgsrcDownload = (layerDiv.classed("layer-group-btn") === true ?
        'imgs/download-icon-v2-64x64-white.png' :
        'imgs/download-icon-v2-64x64.png');

                  // 'imgs/download-icon-64x64-white.png' :
                  // 'imgs/download-icon-64x64.png');

    if (layer.info && layer.info !== '') {
        layerDiv.append('div')
            .attr('class', 'layer-info-btn-wrapper')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.select(this.parentNode)
                    .select('.layer-info-wrapper')
                    .classed('active', function () {

                        //send google analytics click on layer info
                        ga('send', 'event', {
                          eventCategory: 'layer info',
                          eventAction: 'clicked',
                          eventLabel: layer.name + " " + !d3.select(this).classed('active'),
                          nonInteraction: false
                        });


                        return !d3.select(this).classed('active');
                    })
            })

            .append('img')
                .attr('class', 'layer-info-icon')
                .attr('src', imgsrc)
                .attr("alt", "Read more about the " + layer.name + " layer")
                .attr("title", "Read more about the " + layer.name + " layer")

        // not all layers have download and some layer groups do not have a downoload
        // so check and make sure that the object exists and is not null
        var hasdownload = !(typeof layer.download == 'undefined');
        var downloadNotNull =  !(layer.download === null);

        // add download load button
        if (downloadNotNull) {
          if (hasdownload){
            layerDiv.append('div')
              .attr('class', 'download-btn-wrapper')
              .append('a')
                .attr('href', layer.download)
                .attr("title", "download data for the layer " + layer.name)
              .append('img')
                .attr('class', 'download-icon')
                .attr('src', imgsrcDownload)
                .attr("alt", "dowdownload data for the layer " + layer.name)
                .attr("title", "download data for the layer " + layer.name)
          }

        }

        layerDiv.append('div')
            .attr('class', 'layer-info-wrapper')
            .text(layer => layer.info);

    }
}

function makeLayerTools(layer, layerDiv) {
    var layerToolsDiv = document.createElement('div')
    layerToolsDiv.classList.add('layer-tools-wrapper')
    if (layer.active) layerToolsDiv.classList.add('active')

    var opacitySlider = makeOpacitySlider(layer);
    var legend = makeLegend(layer);

    layerToolsDiv.appendChild(legend)
    layerToolsDiv.appendChild(opacitySlider)

    return layerToolsDiv
}

function makeLegend (layer, layerToolsWrapper) {
    var legendWrapper = document.createElement('div')
    var legendImg = document.createElement('img')
    legendWrapper.classList.add('legend-wrapper')
    legendImg.setAttribute('src', layer.legend)
    legendWrapper.appendChild(legendImg)
    return legendWrapper
}
