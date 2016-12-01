export const BUILD_ROUTE_REQUEST = 'BUILD_ROUTE_REQUEST'
export const BUILD_ROUTE_SUCCESS = 'BUILD_ROUTE_SUCCESS'
export const BUILD_ROUTE_FAILURE = 'BUILD_ROUTE_FAILURE'

export const buildRoute = (feature, propertyKeys, success = null, failure = null) => ({
  type: BUILD_ROUTE_REQUEST,
  feature,
  propertyKeys,
  success,
  failure
})

export const buildRouteSuccess = (feature, route, callback = null) => ({
  type: BUILD_ROUTE_SUCCESS,
  feature,
  route,
  callback
})

export const buildRouteFailure = (feature, error, callback = null) => ({
  type: BUILD_ROUTE_FAILURE,
  feature,
  error,
  callback
})

