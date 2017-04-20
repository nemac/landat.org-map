import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

export default function CreateSearch (map) {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
        provider: provider,
        showMarker: false,
        autoComplete: true,
        showPopup: false,
    });

    map.addControl(searchControl);

    var searchElements = searchControl.searchElement.elements

    L.DomEvent.on(searchElements.container, "click", function (ev) {
        L.DomEvent.stopPropagation(ev);

        var searchEntries = searchElements.form
            .getElementsByClassName('results')[0].children

        for (var i=0; i<searchEntries.length; i++) {
            if (ev.target === searchEntries[i]) {
                searchElements.container.classList.remove('active')
            }
        }

        //send google analytics for search by address
        ga('send', 'event', {
            eventCategory: 'map',
            eventAction: 'search',
            eventLabel: 'click',
            nonInteraction: false
        });

    });

    L.DomEvent.on(searchElements.container, "keydown", function (ev) {
        L.DomEvent.stopPropagation(ev);

        if (ev.which == 13 || ev.keyCode == 13) {
            searchElements.container.classList.remove('active')

            //send google analytics for seacrch by address
            ga('send', 'event', {
                eventCategory: 'map',
                eventAction: 'search address',
                eventLabel: ev.target.value,
                nonInteraction: false
            });
        }
    });

}
