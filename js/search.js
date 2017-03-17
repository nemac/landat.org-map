import { GeoSearchControl, EsriProvider } from 'leaflet-geosearch';

export default function CreateSearch (map) {
    const provider = new EsriProvider();

    const searchControl = new GeoSearchControl({
        provider: provider,
        showMarker: false,
    });

    map.addControl(searchControl);
}
