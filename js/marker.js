export function createMarker (lat, lng) {
    return L.marker([lat, lng], {icon: graphIcon});
}

export function getIcon (type) {
    return type === 'hover' ? hoverIcon : graphIcon;
}

var baseIcon = L.Icon.extend({});

var graphIcon = new baseIcon({
    iconUrl: 'imgs/blue_icon.png',
    shadowUrl: 'imgs/marker_shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var hoverIcon = new baseIcon({
    iconUrl: 'imgs/orange_icon.png',
    shadowUrl: 'imgs/marker_shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
