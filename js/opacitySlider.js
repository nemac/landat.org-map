import {updateShareUrl} from './share'

/*
  The viewBox for the opacity slider svg container is constructed so that
  the visible slider track line can have an x1 of 0 and x2 of 100,
  to reflect the range for layer opacity.

  The width and height reflect the dimensions of the bounding box
  within which a mouse event is captured and interpreted as a "drag" event.
*/

const MAX_OPACITY_LOC = 100
const CIRCLE_RADIUS = 2

var viewBox = {
    xMin: -CIRCLE_RADIUS,
    yMin: 0,
    width: MAX_OPACITY_LOC + CIRCLE_RADIUS*2,
    height: CIRCLE_RADIUS*2,
}

var opacityScale = d3.scaleLinear()
    .domain([0, MAX_OPACITY_LOC])
    .range([0, 1])
    .clamp(true);

export function makeOpacitySlider (layer, layerDiv) {

    var layerOpacity = layer.opacity !== undefined ? layer.opacity : 1
    
    var opacitySliderWrapper = layerDiv.append('div')
        .attr('class', 'opacity-slider-wrapper')
        .classed('active', layer.active);

    var opacitySliderSvg = opacitySliderWrapper
        .append('svg')
            .attr('viewBox', `${viewBox.xMin} ${viewBox.yMin} ${viewBox.width} ${viewBox.height}`)
            //.attr('preserveAspectRatio', 'none')
        .append('g')
            .attr('class', 'opacity-slider')
            .attr('transform', `translate(0, ${CIRCLE_RADIUS})`)

    makeSliderTrack(opacitySliderSvg, layer, layerOpacity)
    setDragEventListener(opacitySliderSvg, layer)
}

function makeOpacityIndicator(wrapper, layerOpacity) {

}

function setDragEventListener(svg, layer) {
    svg.selectAll('*')
        .call(d3.drag()
        .on('start drag', function () {
            updateOpacity(layer, this.parentNode, d3.event.x);
        })
        .on('end', function () {
            updateShareUrl();
        }));
}

function makeSliderTrack(svg, layer, layerOpacity) {
    svg.append('line')
        .attr('class', 'opacity-slider-track')
        .attr('x1', 0).attr('x2', MAX_OPACITY_LOC)
        .attr('stroke', '#666')
        .attr('stroke-width', '.5px');

    // Invisible box for capturing mouse events
    svg.append('line')
        .attr('class', 'opacity-slider-track-overlay')
        .attr('x1', `${viewBox.xMin}`)
        .attr('x2', `${viewBox.width - CIRCLE_RADIUS}`)
        .attr('stroke', '#000000')
        .attr('stroke-width', `${CIRCLE_RADIUS*2}px`)
        .attr('stroke-opacity', '0.0')

    svg.append('circle')
        .attr('r', CIRCLE_RADIUS)
        .attr('cx', `${opacityScale.invert(layerOpacity)}px` )
        .attr('class', 'opacity-slider-circle');
}

function updateOpacity(layer, slider, xPos) {
  // clamp the x position to be within the scale's domain
  var xPos = opacityScale.invert(opacityScale(xPos))
  slider = d3.select(slider)

  slider.select('circle').attr('cx', xPos)
  slider.select('text').text(parseInt(opacityScale(xPos)*100, 10) + '%')
  layer.mapLayer.setOpacity(opacityScale(d3.event.x))
}