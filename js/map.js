var map;

export function CreateMap (mapConfig) {
    var id = mapConfig.id || "map";
    var options = mapConfig.options || {"scrollWheelZoom" : false};
    var initialCenter = mapConfig.initialCenter || ["38.5", "-81"];
    var initialZoom = mapConfig.initialZoom || 6;

    map = L.map(id, options).setView(initialCenter, initialZoom);
    L.control.attribution({ position: 'bottomleft' }).addTo(map)
    return map;
}

export function GetMap () {
    return map;
}
