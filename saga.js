import { takeEvery } from 'redux-saga'
import { put, select, call } from 'redux-saga/effects'
import { change } from 'redux-form'

import * as actions from './actions'
import * as BuildRouteApi from './lib/build-route-api'

function isValidPoints(points) {
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i]
    if (point.type !== 'Point') {
      console.warn(`cant build route for geometry type: ${point.type}`)
      return false
    }
  }
  return true
}

const BUILD_ROUTE_ERROR = new Error('Failed to build route')

function* buildRoute(action) {
  const { feature, propertyKeys, success, failure } = action
  const routeFeatureIds = propertyKeys.map(x => feature.properties[x]) // todo fix it
  const points = yield select(state => routeFeatureIds.map(id => state.features[id].geometry))

  if (!isValidPoints(points)) return

  // todo строить по полигонам тоже
  // function getCoordsByFeatureGuids(knex, guids) {
//   return Promise.all(guids.map(guid => {
//     return Feature.find(knex, guid).then(feature => {
//       let res
//       if (feature.geometry.type == 'Polygon') {
//         res = turf.centroid(feature).geometry.coordinates
//       } else {
//         res = feature.geometry.coordinates
//       }
//       return res
//     })
//   }))
// }

  const coords = points.map(point => point.coordinates)
  const route = yield call(BuildRouteApi.buildRoute, coords)
  if (route != null) {
    yield put(actions.buildRouteSuccess(feature, route, success))
    yield put(change('feature', 'geometry', { type: 'LineString', coordinates: route }))
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
