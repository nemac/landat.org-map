import {
  createGraphDiv,
  createMarker,
  createGraphRemover,
  getIcon
} from './graph'
import {updateShareUrl} from './share'
import {GetMap} from './map'

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
    return !Object.is(poi, poiToRemove)
  })
}

export function SetupPointOfInterestUI (map, poi) {
    var div = createGraphDiv(poi.lat, poi.lng);
    var marker = createMarker(map, poi.lat, poi.lng);

    d3.select(div).on("mouseenter", function (e) {
        marker.setIcon(getIcon('hover'));
      }
    )
    d3.select(div).on("mouseleave", function () {
        marker.setIcon(getIcon('graph'));
      }
    )
    createGraphRemover(map, div, marker, poi);
}

export function RemovePointOfInterestUI (map, div, marker) {
    var list = document.getElementById("graph-list");
    list.removeChild(div);
    map.removeLayer(marker);
    updateShareUrl()
}

