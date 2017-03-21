export default function BindTabEvents () {
    d3.selectAll(".panel-top-btn").on("click", handleTabHeaderBtnClick);
}

function handleTabHeaderBtnClick () {
    // If the section is already active, do nothing
    if (this.classList.contains('active')) return

    [
        d3.selectAll('.panel-top-btn'),
        d3.selectAll('.panel-section-wrapper')
    ].forEach((selection) => {
        selection.classed('active', function () {
            return !d3.select(this).classed('active');
        });
    });
}
