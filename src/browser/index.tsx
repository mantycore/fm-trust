import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { Provider } from 'react-redux'
import { ReduxRouter } from '@lagunovsky/redux-react-router'
import { store } from "./store/store"
import { init as commonInit } from 'Common/store/epics'
import { init as browserInit } from './store/epics'
import { browserHistory } from "./history"
import AppRoutes from './routes'


ReactDOM.render(
  <Provider store={store}>
    <ReduxRouter
      history={browserHistory}
      store={store}
      children={<AppRoutes />}
    />
  </Provider>,
  document.getElementById('app-root'),
)

store.dispatch(commonInit({bootstrap: ['ws://localhost:7001']}))
store.dispatch(browserInit())

