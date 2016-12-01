import R from 'ramda'

import BuildRouteButton from '../components/build-route-button/BuildRouteButton'
import saga from '../saga'

function buildFieldsOptions(options) {
  const { values, fieldPath, directories: { layers } } = options
  const layerKeyPath = [fieldPath[0], fieldPath[1], 'layerKey']
  const layerKeyValue = R.path(layerKeyPath, values)

  if (R.isNil(layerKeyValue)) return []

  const layer = R.find(x => x.key === layerKeyValue, layers)
  const attributes = layer && R.pickBy(value => value.type === 'Relation', layer.attributes)
  return R.keys(attributes).map(key => ({ value: key, label: attributes[key].label }))
}

export default {
  form: {
    fields: [
      {
        key: 'layers',
        label: 'Список слоев',
        input: 'array',
        item: {
          fields: [
            { key: 'layerKey', label: 'Слой', input: 'select', inputOptions: { options: 'layers' } },
            {
              key: 'properties',
              label: 'Точки маршрута',
              input: 'array',
              item: {
                fields: [
                  { key: 'property', label: 'Поле', input: 'select', inputOptions: { options: buildFieldsOptions } }
                ]
              }
            }
          ]
        }
      }
    ]
  },
  components: [
    { component: BuildRouteButton, position: 'cardBottom' }
  ],
  saga
}
