var map;

export function CreateMap (mapConfig) {
    var id = mapConfig.id || "map";
    var options = mapConfig.options || {"scrollWheelZoom" : false};
    var initialCenter = mapConfig.center || ["38.5", "-81"];
    var initialZoom = mapConfig.zoom || 6;

    map = L.map(id, options).setView(initialCenter, initialZoom);
    L.control.attribution().addTo(map)
    return map;
}

export function GetMap () {
    return map;
}

