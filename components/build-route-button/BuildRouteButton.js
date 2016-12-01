import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import R from 'ramda'
import { autobind } from 'core-decorators'

import Button from 'core/frontend/components/shared/button/Button'
import Loading from 'core/frontend/components/shared/loading/Loading'

import manifest from '../../entry/manifest'
import styles from './build-route-button.styl'
import * as actions from '../../actions'

class BuildRouteButton extends React.Component {
  constructor() {
    super()
    // todo реализовать глобальный лоадинг через state.interface
    this.state = { loading: false }
  }

  @autobind
  onClick() {
    const { buildRoute, routePropertyKeys, feature } = this.props
    buildRoute(feature, routePropertyKeys, this.buildSuccess, this.buildFailure)
    this.setState({ loading: true })
  }

  @autobind
  buildSuccess() {
    this.setState({ loading: false })
  }

  @autobind
  buildFailure(action) {
    this.setState({ loading: false })
    console.error(action.error)
  }

  render() {
    const { skip } = this.props
    const { loading } = this.state
    if (skip) return null

    return (
      <div className={ styles.container }>
        { loading && <Loading global /> }
        <Button onClick={ this.onClick }>Построить маршрут</Button>
      </div>
    )
  }
}

BuildRouteButton.propTypes = {
  skip: PropTypes.bool.isRequired,
  routePropertyKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  buildRoute: PropTypes.func.isRequired,
  feature: PropTypes.object
}

export default connect(
  (state, props) => {
    const { layer } = props
    const config = state.pluginConfigs[manifest.key]
    const layerConfig = R.find(x => x.layerKey === layer.key, config.layers || [])
    return {
      skip: layerConfig === undefined,
      routePropertyKeys: layerConfig.properties.map(x => x.property)
    }
  },
  dispatch => ({
    buildRoute: bindActionCreators(actions.buildRoute, dispatch)
  })
)(BuildRouteButton)
