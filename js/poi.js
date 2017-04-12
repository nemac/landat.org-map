import {
  createGraphDiv,
  createMarker,
  createGraphRemover,
  getIcon
} from './graph'
import {updateShareUrl} from './share'
import {GetMap} from './map'
import {GetActiveTab, HandleTabChange} from './tabs'

var _points_of_interest = []

export function GetAllPointsOfInterest () {
  return _points_of_interest
}

export function AddPointOfInterestToTracker (lat, lng) {
  var poi = {
    lat: lat,
    lng: lng
  }
  _points_of_interest.push(poi)
  return poi
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
  Array.prototype.push.apply(_points_of_interest, pois)
}

export function RemovePointOfInterestFromTracker(poiToRemove) {
  _points_of_interest = _points_of_interest.filter(poi => {
    return !(poi === poiToRemove)
  })
}

export function SetupPointOfInterestUI (map, poi) {
    var div = createGraphDiv(poi);
    var marker = createMarker(map, poi.lat, poi.lng);
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
  triggerGraphBackgroundAnimation(poi)
}

function triggerGraphBackgroundAnimation (poi) {
  poi.graphDiv.getElementsByClassName('pan-to-marker-btn')[0].classList.add('animate')
}

function scrollToPointOfInterestGraph (poi) {
  var rightPanel = document.getElementById('right-panel')
  var header = document.getElementById('right-panel-header')
  rightPanel.scrollTop = poi.graphDiv.offsetTop + header.scrollHeight
}

export function RemovePointOfInterestUI (map, div, marker) {
    var list = document.getElementById('graph-list');
    list.removeChild(div);
    map.removeLayer(marker);
    updateShareUrl()
}

