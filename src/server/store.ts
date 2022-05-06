import { configureStore, AnyAction, combineReducers } from '@reduxjs/toolkit'
import { commonReducer } from 'Common/store/slice'
import { commonEpic } from 'Common/store/epics'
import { createEpicMiddleware } from 'redux-observable'

const reducer = combineReducers({
  common: commonReducer,
})

type ReducerRootState = ReturnType<typeof reducer>

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, ReducerRootState>()

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({thunk: false}).concat([epicMiddleware])
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

epicMiddleware.run(commonEpic)
