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

    var poi = AddPointOfInterestToTracker(lat, lng);
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

export function createGraphRemover (map, div, marker, poi) {
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

export function AddPointOfInterestToTracker (lat, lng) {
    var poi = {
        lat: lat,
        lng: lng
    }
    _points_of_interest.push(poi);
    return poi;
}

export function SetupPointsOfInterest (map, newPois) {
    AddMultiplePointsOfInterest(newPois)
    var pois = GetAllPointsOfInterest()
    var map = GetMap()
    pois.forEach(poi => {
        SetupPointOfInterestUI(map, poi)
    })
}

export function AddMultiplePointsOfInterest (pois) {
    Array.prototype.push.apply(_points_of_interest, pois);
}

export function RemovePointOfInterestFromTracker(poiToRemove) {
    _points_of_interest = _points_of_interest.filter(poi => {
        return !(poi === poiToRemove)
    });
}

export function SetupPointOfInterestUI (map, poi) {
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

export function RemovePointOfInterestUI (map, div, marker) {
    var list = document.getElementById('graph-list');
    list.removeChild(div);
    map.removeLayer(marker);
    updateShareUrl()
}
