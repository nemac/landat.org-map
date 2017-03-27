export default function renderLayerList (map, layers, layout) {

  var layerGroups = d3.select('.layer-list')
    .selectAll('.layer-group-wrapper')
    .data(layout['layer-groups-order'])
    .enter()
      .append('div')
      .attr('class', 'layer-group-wrapper')
      .attr('id', layerGroup => layerGroup.id)
      .classed('active', layerGroup => layerGroup.active)
      .each(function (layerGroup) {
        d3.select(this).append('div')
          .attr('class', 'layer-group-btn btn')
          .on('click', function (layerGroup) {
            layerGroup.active = !layerGroup.active
            d3.select(this.parentNode).classed('active', () => layerGroup.active)
          })
          .text(layerGroup.name)
      })
      .append('div').attr('class', 'layer-group')

    renderLayerSelect(layerGroups, map, layers, layout)
}

function renderLayerSelect (layerGroups, map, layers, layout) {
  layerGroups.selectAll('.layer-select')
    .data(layerGroup => layers[layerGroup.id])
    .enter().append('div')
      .attr('class', 'layer-select')
      .each(function (layer) {
        renderLayerDiv.call(this, layer, map, layout)
      })
}

function renderLayerDiv (layer, map, layout) {
  var groupName = this.parentNode.parentNode.id
  var layerDiv = d3.select(this)
  layer.active = isLayerDefaultActive(layer, groupName, layout['active-layers'])

  if (layer.active) { toggleLayer(map, layer, layerDiv) }

  // Checkbox
  layerDiv.append('input')
    .attr('type', 'checkbox')
    .attr('id', layer => layer.id)
    .attr('checked', (layer) => {
      return layer.active ? 'checked' : null
    })
    .on('click', layer => {
      layer.active = !layer.active
      toggleLayer(map, layer, layerDiv)
    })

  // Label
  layerDiv.append('label')
    .attr('for', layer => layer.id)
    .attr('class', 'layer-label')
    .html(layer => layer.name)

  // Description
  if (layer.info && layer.info !== '') {
    layerDiv.append('div')
      .attr('class', 'layer-info-btn')
      .text('(?)')
      .on('click', function () {
        d3.select(this.parentNode)
          .select('.layer-info-wrapper')
          .classed('active', function () {
            return !d3.select(this).classed('active')
          })
      })

    layerDiv.append('div')
      .attr('class', 'layer-info-wrapper')
      .text(layer => '(' + layer.info + ')')
  }

  // Legend
  var legend = layerDiv.append('div')
    .attr('class', 'legend-wrapper')
    .classed('active', layer.active)
    .append('img')
    .attr('src', 'mean_ndvi_legend.jpg')

  renderLayerOpacitySlider(layer, layerDiv)

}


function renderLayerOpacitySlider(layer, layerDiv) {

  var opacityScale = d3.scaleLinear()
    .domain([0, 80])
    .range([0, 1])
    .clamp(true)

  var opacitySliderWrapper = layerDiv.append('div')
    .attr('class', 'opacity-slider-wrapper')
    .classed('active', layer.active)

  var opacitySliderSvg = opacitySliderWrapper
    .append('svg')
    .attr('viewBox', '0 0 100 40')
    .attr('preserveAspectRatio', 'xMidYMid')
    .append('g')
      .attr('class', 'opacity-slider')
      //.attr('transform', 'translate(20, 20)')

  opacitySliderSvg.append('circle')
    .attr('r', '6')
    .attr('cx', '80')
    .attr('class', 'opacity-slider-circle')

  opacitySliderSvg.append('line')
    .attr('class', 'opacity-slider-track-overlay')
    .attr('x1', '0')
    .attr('x2', '80')
    .attr('stroke', '#000000')
    .attr('stroke-width', '20px')
    .attr('stroke-opacity', '0.0')
    .call(d3.drag()
      .on('start drag', function () {
        updateOpacity(layer, this.parentNode, opacityScale, d3.event.x)
      }))

  opacitySliderSvg.append('line')
    .attr('class', 'opacity-slider-track')
    .attr('x1', '0').attr('x2', '85')
    .attr('stroke-width', '20px')
    .attr('stroke', '#666')
    .attr('stroke-width', '2px')

  opacitySliderSvg.append('text')
    .attr('class', 'opacity-indicator')
    .attr('x', '95').attr('y', '5')
    .text(opacityScale(300)*100 + '%')
}

function updateOpacity(layer, slider, scale, xPos) {
  // clamp the x position to be within the scale's domain
  var xPos = scale.invert(scale(xPos))
  slider = d3.select(slider)

  slider.select('circle').attr('cx', xPos)
  slider.select('text').text(parseInt(scale(xPos)*100) + '%')
  layer.mapLayer.setOpacity(scale(d3.event.x))
}

function toggleLayer (map, layer, layerDiv) {
  layer.mapLayer = layer.mapLayer || makeWmsTileLayer(layer)

  layerDiv.selectAll('.legend-wrapper, .opacity-slider-wrapper')
    .classed('active', layer.active)
  if (layer.active) {
    map.addLayer(layer.mapLayer)
  } else {
    map.removeLayer(layer.mapLayer)
  }
}

function makeWmsTileLayer (layer) {
  return L.tileLayer.wms(layer.url, {
    layers: layer.id,
    transparent: true,
    version: layer.version || '1.3.0',
    crs: layer.crs || L.CRS.EPSG4326,
    format: layer.format || 'image/png'
  })
}

function isLayerDefaultActive(layer, group, activeLayers) {
  var active = false
  activeLayers.forEach(layerPath => {
    layerPath = layerPath.split(' ')
    active = active ||
      layerPath[0] === group &&
      layerPath[1] === layer.id
  })
  return active
}

