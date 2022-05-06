import { AnyAction, Reducer, configureStore, combineReducers } from '@reduxjs/toolkit'
import { commonReducer } from 'Common/store/slice'
import { commonEpic } from 'Common/store/epics'
import { browserReducer } from './slice'
import { browserEpic } from './epics'
import { createRouterMiddleware, createRouterReducer, ReduxRouterState } from '@lagunovsky/redux-react-router'
import { browserHistory } from '../history'
import { createEpicMiddleware, combineEpics } from 'redux-observable'

const routerMiddleware = createRouterMiddleware(browserHistory)

const reducer = combineReducers({
  common: commonReducer,
  browser: browserReducer,
  router: createRouterReducer(browserHistory) as Reducer<ReduxRouterState, AnyAction> // hack
})

type ReducerRootState = ReturnType<typeof reducer>

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, ReducerRootState>()

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({thunk: false}).concat([routerMiddleware, epicMiddleware])
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

epicMiddleware.run(combineEpics<AnyAction, AnyAction, RootState>(commonEpic, browserEpic))
