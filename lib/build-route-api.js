import R from 'ramda'
import 'core/shared/lib/ramdaExtension' // todo fix it, не должно здесь этого быть

function buildRequestBody(points) {
  const p = points.slice(0)
  p.pop()
  p.shift()

  const insertion = p.map(x => `<xls:ViaPoint>
    <xls:Position>
    <gml:Point xmlns:gml="http://www.opengis.net/gml">
    <gml:pos srsName="EPSG:4326">${pointForBody(x)}</gml:pos>
    </gml:Point>
    </xls:Position>
    </xls:ViaPoint>`)

/* eslint-disable */
  return `<xls:XLS xmlns:xls="http://www.opengis.net/xls" xsi:schemaLocation="http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/RouteService.xsd" xmlns:sch="http://www.ascc.net/xml/schematron" xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1" xls:lang="en">
	<xls:RequestHeader>
	</xls:RequestHeader>
	<xls:Request methodName="RouteRequest" version="1.1" requestID="00" maximumResponses="15">
		<xls:DetermineRouteRequest>
			<xls:RoutePlan>
				<xls:RoutePreference>Car</xls:RoutePreference>
				<xls:ExtendedRoutePreference>
					<xls:WeightingMethod>Fastest</xls:WeightingMethod>
				</xls:ExtendedRoutePreference>
				<xls:WayPointList>
					<xls:StartPoint>
						<xls:Position>
							<gml:Point xmlns:gml="http://www.opengis.net/gml">
								<gml:pos srsName="EPSG:4326">${pointForBody(points[0])}</gml:pos>
							</gml:Point>
						</xls:Position>
					</xls:StartPoint>
          ${ insertion.join('') }
					<xls:EndPoint>
						<xls:Position>
							<gml:Point xmlns:gml="http://www.opengis.net/gml">
								<gml:pos srsName="EPSG:4326">${pointForBody(points[points.length - 1])}</gml:pos>
							</gml:Point>
						</xls:Position>
					</xls:EndPoint>
				</xls:WayPointList>
				<xls:AvoidList />
			</xls:RoutePlan>
			<xls:RouteInstructionsRequest provideGeometry="true" />
			<xls:RouteGeometryRequest>
			</xls:RouteGeometryRequest>
		</xls:DetermineRouteRequest>
	</xls:Request>
</xls:XLS>`
  /* eslint-enable */
}

const roundCoordinate = R.round(4)

function pointForBody(coord) {
  return `${roundCoordinate(coord[0])} ${roundCoordinate(coord[1])}`
}

const URL = 'http://openls.geog.uni-heidelberg.de/routing?api_key=eb85f2a6a61aafaebe7e2f2a89b102f5'
const headers = { 'Content-Type': 'text/xml' }

const regexp = /<xls:RouteGeometry>\s+<gml:LineString.*>((?:\s+<gml:pos>.*<\/gml:pos>)+)\s+<\//
const subregexp = /<gml:pos>.*<\/gml:pos>/g

export async function buildRoute(coords) {
  const body = buildRequestBody(coords)

  return fetch(URL, { body, headers, method: 'POST' })
    .then((response) => {
      if (!response.ok) return new Error(response.error)
      return response.text()
    })
    .then((text) => {
      if (text && text.match(regexp)) {
        const pmatch = text.match(regexp)[1]
        const matches = pmatch.match(subregexp)

        return matches.map((match) => {
          const ms = match.match(/<gml:pos>(.*)\s(.*)<\/gml:pos>/)
          return [parseFloat(ms[1]), parseFloat(ms[2])]
        })
      }

      return null
    })
}
