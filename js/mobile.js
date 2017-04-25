export default function BindMobileMenuEvents () {
    d3.selectAll(".mobile-menu-button").on("click", handleMobileMenuBtnClick);
}

function handleMobileMenuBtnClick () {
    var wrapper = d3.select("#wrapper");
    var status = wrapper.classed("mobile-menu-hidden");
    wrapper.classed("mobile-menu-hidden", !status);
    dispatchMobileMenuBtnClickAnalytics(!status ? "opening" : "closing");
}

function dispatchMobileMenuBtnClickAnalytics (status) {
    ga('send', 'event', {
        eventCategory: 'mobile menu',
        eventAction: 'click',
        eventLabel: 'Mobile Menu ' + status,
        nonInteraction: false
    });
}
