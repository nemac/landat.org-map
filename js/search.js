import { GeoSearchControl, OpenStreetMapProvider, EsriProvider } from 'leaflet-geosearch';

export default function CreateSearch (map) {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
        provider: provider,
        showMarker: false,
        autoComplete: true,
        showPopup: false,
    });

    map.addControl(searchControl);

    console.log(searchControl.searchElement)

    L.DomEvent.on(searchControl.searchElement.elements.container, "click", function (ev) {
        L.DomEvent.stopPropagation(ev);

        //send google analytics for seacrch by address
        ga('send', 'event', {
          eventCategory: 'map',
          eventAction: 'search',
          eventLabel: 'click',
          nonInteraction: false
        });

    });

    L.DomEvent.on(searchControl.searchElement.elements.container, "keydown", function (ev) {
        L.DomEvent.stopPropagation(ev);

        if (ev.which == 13 || ev.keyCode == 13) {

          console.log('enter key pressed')
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
