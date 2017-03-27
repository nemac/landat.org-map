export default function BindTabEvents () {
  d3.selectAll(".panel-top-btn").on("click", handleTabHeaderBtnClick);
}

function handleTabHeaderBtnClick () {
  // If the section is already active, do nothing
  if (this.classList.contains('active')) return

  togglePanelWidth()

  d3.selectAll('.panel-top-btn, .panel-section-wrapper')
    .classed('active', function () {
      return !d3.select(this).classed('active');
    });
}


function togglePanelWidth() {
  var wrappers = d3.selectAll('#map-wrapper, #right-panel')

  var layersActive = wrappers.classed('layers-active')
  var graphsActive = wrappers.classed('graphs-active')

  wrappers
    .classed('layers-active', !layersActive)
    .classed('graphs-active', !graphsActive)
}
