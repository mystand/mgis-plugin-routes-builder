import { takeEvery } from 'redux-saga'
import { put, select, call } from 'redux-saga/effects'
import { change } from 'redux-form'
import turf from 'turf'

import * as actions from './actions'
import * as BuildRouteApi from './lib/build-route-api'

function convertGeometryToRoutePoint(geometry) {
  const type = geometry.type
  if (type === 'Point') return geometry.coordinates
  if (type === 'Polygon') return turf.centroid({ type: 'Feature', geometry }).geometry.coordinates
  console.warn(`cant build route for geometry type: ${type}`)
  return null
}

const BUILD_ROUTE_ERROR = new Error('Failed to build route')
const FEATURE_FORM_KEY = 'feature' // todo use feature form key from core

function* buildRoute(action) {
  const { feature, propertyKeys, success, failure } = action
  const routeFeatureIds = yield select(state =>
    propertyKeys.map(propertyKey => state.form[FEATURE_FORM_KEY].properties[propertyKey].value)
  )
  const featureGeometries = yield select(state =>
    routeFeatureIds
      .map(id => state.features[id])
      .filter(f => f != null)
      .map(f => f.geometry)
  )

  if (featureGeometries.length < 2) {
    console.warn(`Route of "${feature.properties.name} (${feature.id}) should have at least 2 checkpoints"`)
    yield put(actions.buildRouteFailure(feature, BUILD_ROUTE_ERROR, failure))
    return
  }

  const coords = featureGeometries.map(convertGeometryToRoutePoint)
  if (coords.includes(null)) {
    console.warn(`Route for feature "${feature.properties.name} (${feature.id}) wasn't built"`)
    yield put(actions.buildRouteFailure(feature, BUILD_ROUTE_ERROR, failure))
    return
  }

  let route = null
  try {
    route = yield call(BuildRouteApi.buildRoute, coords)
  } catch (e) {
    console.error(`Route for feature "${feature.properties.name} (${feature.id}) wasn't built. Request error: ${e}"`)
    yield put(actions.buildRouteFailure(feature, BUILD_ROUTE_ERROR, failure))
    return
  }

  if (route != null) {
    yield put(actions.buildRouteSuccess(feature, route, success))
    yield put(change(FEATURE_FORM_KEY, 'geometry', { type: 'LineString', coordinates: route }))
  } else {
    yield put(actions.buildRouteFailure(feature, BUILD_ROUTE_ERROR, failure))
  }
}

function* callCallback(action) {
  if (action.callback) action.callback(action)
}

export default function* saga() {
  yield [
    takeEvery(actions.BUILD_ROUTE_REQUEST, buildRoute),
    takeEvery(actions.BUILD_ROUTE_SUCCESS, callCallback),
    takeEvery(actions.BUILD_ROUTE_FAILURE, callCallback)
  ]
}
