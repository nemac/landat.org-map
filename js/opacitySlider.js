import {updateShareUrl} from './share'
import {updateLayerOpacity} from "./layer";

// set it manually for now
const OPACITY_RANGE_MAX = 90

var opacityScale = d3.scaleLinear()
    .domain([1, 0])
    .range([0, OPACITY_RANGE_MAX])
    .clamp(true)

export function setSliderInitialPos (layer, layerToolsWrapper) {

    var layerOpacity = layer.opacity || 1
    var handleOffset = opacityScale(layerOpacity)

    layerToolsWrapper.select('.opacity-slider-handle').style('top', function () {
        return `${handleOffset}`+'px'
    })
}

export function makeOpacitySlider (layer, layerToolsWrapper) {

    var layerOpacity = layer.opacity !== undefined ? layer.opacity : 1
    
    var wrapper = layerToolsWrapper.append('div')
        .attr('class', 'opacity-slider-wrapper')

    var opacityPercentIndicator = wrapper.append('div')
        .attr('class', 'opacity-slider-indicator')

    makeSliderTrack(wrapper, layer, layerToolsWrapper, layerOpacity)

}

function makeSliderTrack(wrapper, layer, layerToolsWrapper, layerOpacity) {

    var overlay = wrapper.append('div')
        .attr('class', 'opacity-slider-track-overlay')

    var track = overlay.append('div')
        .attr('class', 'opacity-slider-track')

    overlay.append('div')
        .attr('class', 'opacity-slider-handle')

    if (layer.active) setSliderInitialPos(layer, layerToolsWrapper)
    setDragEventListener(wrapper, layer, layerOpacity)

}

function setDragEventListener(wrapper, layer, layerOpacity) {
    var overlay = wrapper.select('.opacity-slider-track-overlay')
    overlay.call(d3.drag()
        .on('start drag', function () {
            var newOpacity = calcOpacityFromMousePos(overlay)
            updateLayerOpacity(layer, newOpacity)
            adjustSliderHandle(overlay, newOpacity)
        })
        .on('end', function () {
            updateShareUrl()
        }))
}

function adjustSliderHandle(overlay, newOpacity) {
    var handle = overlay.select('.opacity-slider-handle')
    handle.style('top', `${opacityScale(newOpacity)}`+'px')
}

function calcOpacityFromMousePos(overlay) {
    var yPos = d3.mouse(overlay.node())[1]
    var newOpacity = opacityScale.invert(yPos)
    return newOpacity
}
