import {createGraphDiv} from './graph';
import {createMarker, getIcon} from './marker';
import {updateShareUrl} from './share';
import {GetMap} from './map';
import {GetActiveTab, HandleTabChange} from './tabs';
import {updatePanelDragOverlayHeight} from './panel';

var _points_of_interest = []

export function BindGraphEvents (map) {
    map.on("click", handleMapClick);
}

function handleMapClick (e) {
    var map = this;
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;

    var poi = createPOI(lat, lng, null);
    AddPointOfInterestToTracker(poi);
    SetupPointOfInterestUI(map, poi);
    updateShareUrl();

    //send google analytics event click on map
    ga('send', 'event', {
      eventCategory: 'map',
      eventAction: 'click',
      eventLabel: 'add point',
      nonInteraction: false
    });
}

function createGraphRemover (map, div, marker, poi) {
    var elem = createGraphRemoverElem();
    div.getElementsByClassName("graph-elem-header")[0].appendChild(elem);
    d3.select(elem).on("click", function () {

        //send google analytics remove graph
        ga('send', 'event', {
          eventCategory: 'graph',
          eventAction: 'click',
          eventLabel: 'remove',
          nonInteraction: false
        });

        RemovePointOfInterestFromTracker(poi)
        RemovePointOfInterestUI(map, div, marker)
        updatePanelDragOverlayHeight()
        updateShareUrl()
    });
}

function createGraphRemoverElem () {
    var elem = document.createElement("button");
    elem.className = "remove-graph";
    elem.innerText = String.fromCharCode("10005");
    elem.setAttribute("title", "Remove graph");
    return elem;
}

export function GetAllPointsOfInterest () {
    return _points_of_interest;
}

export function createPOI (lat, lng, plots) {
    return {
        lat: lat,
        lng: lng,
        plots: plots || ["baseline", "2015", "thresholds"]
    }
}

function AddPointOfInterestToTracker (poi) {
    _points_of_interest.push(poi);
}

export function SetupPointsOfInterest (map, newPois) {
    AddMultiplePointsOfInterest(newPois)
    var pois = GetAllPointsOfInterest()
    var map = GetMap()
    pois.forEach(poi => {
        SetupPointOfInterestUI(map, poi)
    })
}

function AddMultiplePointsOfInterest (pois) {
    Array.prototype.push.apply(_points_of_interest, pois);
}

function RemovePointOfInterestFromTracker(poiToRemove) {
    _points_of_interest = _points_of_interest.filter(poi => {
        return !(poi === poiToRemove)
    });
}

function SetupPointOfInterestUI (map, poi) {
    var div = createGraphDiv(poi);
    var marker = createMarker(poi.lat, poi.lng);
    poi.graphDiv = div
    poi.marker = marker
    marker.addTo(map)
    createGraphRemover(map, div, marker, poi);

    d3.select(div).on("mouseenter", function (e) {
        marker.setIcon(getIcon('hover'));
    })
    d3.select(div).on("mouseleave", function () {
        marker.setIcon(getIcon('graph'));
    })
    marker.on('click dblclick', function (e) {
        handleMarkerMouseEvent(e, poi)
    })
    marker.on('mouseover', function (e) {
        marker.setIcon(getIcon('hover'))
    })
    marker.on('mouseout', function (e) {
        marker.setIcon(getIcon('graph'))
        poi.graphDiv.getElementsByClassName('pan-to-marker-btn')[0].classList.remove('animate')
    })
}

function handleMarkerMouseEvent (e, poi) {
    e.originalEvent.stopPropagation()
    HandleTabChange('graphs-active')
    scrollToPointOfInterestGraph(poi)
    triggerGraphAnimation(poi)
}

function triggerGraphAnimation (poi) {
    poi.graphDiv.getElementsByClassName('pan-to-marker-btn')[0].classList.add('animate')
}

function scrollToPointOfInterestGraph (poi) {
    var rightPanel = document.getElementById('right-panel');
    rightPanel.scrollTop = poi.graphDiv.offsetTop;
}

function RemovePointOfInterestUI (map, div, marker) {
    var list = document.getElementById('graph-list');
    list.removeChild(div);
    map.removeLayer(marker);
    updateShareUrl()
}
