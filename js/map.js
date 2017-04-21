var map;

export function CreateMap (mapConfig) {
    console.log(mapConfig)
    var id = mapConfig.id || "map";
    var options = mapConfig.options || {"scrollWheelZoom" : false};
    var initialCenter = mapConfig.center || ["38.5", "-81"];
    var initialZoom = mapConfig.zoom || 6;

    map = L.map(id, options).setView(initialCenter, initialZoom);
    L.control.attribution().addTo(map)

    var leafletZoomIn = document.getElementsByClassName("leaflet-control-zoom-in")[0];

    leafletZoomIn.addEventListener("click", function(){
      //send google analytics for seacrch by address
      ga('send', 'event', {
        eventCategory: 'map',
        eventAction: 'click button',
        eventLabel: 'zoom in',
        nonInteraction: false
      });
    })

    var leafletZoomOut = document.getElementsByClassName("leaflet-control-zoom-out")[0];

    leafletZoomOut.addEventListener("click", function(){
      //send google analytics for seacrch by address
      ga('send', 'event', {
        eventCategory: 'map',
        eventAction: 'click button',
        eventLabel: 'zoom out',
        nonInteraction: false
      });
    })

    map.on("dragend", function(e){
      //send google analytics for drag (pan) end
      ga('send', 'event', {
        eventCategory: 'map',
        eventAction: 'drag',
        eventLabel: JSON.stringify(map.getBounds()),
        nonInteraction: true
      });
    })

    map.on("zoomend", function(e){
      //send google analytics for zoom end
      ga('send', 'event', {
        eventCategory: 'map',
        eventAction: 'zoom',
        eventLabel: JSON.stringify(map.getBounds()),
        nonInteraction: true
      });
    })
    return map;
}

export function GetMap () {
    return map;
}
