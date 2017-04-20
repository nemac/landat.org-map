import {updateShareUrl} from './share'
import {updateLayerOpacity} from "./layer";

// set it manually for now
const OPACITY_RANGE_MAX = 90

var opacityScale = d3.scaleLinear()
    .domain([1, 0])
    .range([0, OPACITY_RANGE_MAX])
    .clamp(true)

export function setOpacitySliderPosition (layer, sliderHandle, opacity) {
    opacity = opacity || layer.opacity
    sliderHandle.style.top = ''+opacityScale(opacity)+'px'
}

export function makeOpacitySlider (layer) {
    var layerOpacity = layer.opacity !== undefined ? layer.opacity : 1
    var wrapper = document.createElement('div')
    var sliderTrackOverlay = makeSliderTrack(layer, layerOpacity)
    var iconWrapperClosed = makeOpacityIconWrapper('closed', layer, sliderTrackOverlay)

    wrapper.classList.add('opacity-slider-wrapper')
    wrapper.appendChild(sliderTrackOverlay)
    wrapper.appendChild(iconWrapperClosed)
    return wrapper
}

function makeOpacityIconWrapper(state, layer, sliderTrackOverlay) {
    var wrapper = document.createElement('div')
    var icon = document.createElement('img')
    wrapper.classList.add('opacity-icon-wrapper')
    icon.classList.add('opacity-icon')
    icon.classList.add(state)
    icon.setAttribute('src', 'imgs/opacity-icon-'+state+'-64x64.png')
    icon.setAttribute('alt', 'Use this slider to adjust transparency for the ' + layer.name + ' layer')
    icon.setAttribute('title', 'Use this slider to adjust transparency for the ' + layer.name + ' layer')
    wrapper.appendChild(icon)
    wrapper.onclick = function (e) {
        var sliderHandle = sliderTrackOverlay.getElementsByClassName('opacity-slider-handle')[0]
        updateLayerOpacity(layer, 0)
        setOpacitySliderPosition(layer, sliderHandle, 0)
    }
    return wrapper
}

function makeSliderTrack(layer, layerOpacity) {

    var overlay = document.createElement('div')
    var track = document.createElement('div')
    var sliderHandle = document.createElement('div')

    overlay.classList.add('opacity-slider-track-overlay')
    track.classList.add('opacity-slider-track')
    sliderHandle.classList.add('opacity-slider-handle')

    overlay.appendChild(track)
    overlay.append(sliderHandle)

    if (layer.active) setOpacitySliderPosition(layer, sliderHandle)
    setDragEventListener(overlay, layer, layerOpacity)

    return overlay
}

function setDragEventListener(overlay, layer, layerOpacity) {
    d3.select(overlay).call(d3.drag()
        .on('start drag', function () {
            var sliderHandle = overlay.getElementsByClassName('opacity-slider-handle')[0]
            var newOpacity = calcOpacityFromMousePos(overlay)
            updateLayerOpacity(layer, newOpacity)
            setOpacitySliderPosition(layer, sliderHandle, newOpacity)
        })
        .on('end', function () {

          var newOpacity = calcOpacityFromMousePos(overlay)

          //send google analytics opacity slider change
          ga('send', 'event', {
            eventCategory: 'opacity slider',
            eventAction: 'change',
            eventLabel: '{"' + layer.name + '": "' + newOpacity + '"}',
            nonInteraction: false
          });

            updateShareUrl()
        })
    )
}

function calcOpacityFromMousePos(overlay) {
    var yPos = d3.mouse(overlay)[1]
    var newOpacity = opacityScale.invert(yPos)
    return newOpacity
}
