import {updateShareUrl} from './share'
import {SetupPointOfInterestUI} from './graph'

var _points_of_interest = []
/*
  {
    lat: lat,
    lng: lng,
    graphElem: d3 selection (classed 'graph-elem')
    marker: leaflet marker
  }
*/

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

export function BindPointsOfInterest (map, newPois) {
  AddMultiplePointsOfInterest(newPois)

  d3.select("graph-list")
}

export function AddMultiplePointsOfInterest (pois) {
  Array.prototype.push.apply(_points_of_interest, pois)
}

