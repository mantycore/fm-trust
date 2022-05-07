import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState } from './state'
import { Profile, Trust } from '../types'

export const browserSlice = createSlice({
  name: 'browser',
  initialState,
  reducers: {
    setSecretKey(state, action: PayloadAction<string>) {
      state.secretKey = action.payload
    },
    setPublicKey(state, action: PayloadAction<string>) {
      state.publicKey = action.payload
    },
    setOutsideProfileLink(state, action: PayloadAction<string>) {
      state.outsideProfileLink = action.payload
    },
    setProfile(state, action: PayloadAction<Profile>) {
      if (!(action.payload.publicKey in state.profiles)
      || state.profiles[action.payload.publicKey].timestamp < action.payload.timestamp) {
        state.profiles[action.payload.publicKey] = action.payload
      }
    },
    setTrust(state, action: PayloadAction<Trust>) {
      const id = [action.payload.from, action.payload.to].join(':')
      if (!(id in state.trust)
      || state.trust[id].timestamp < action.payload.timestamp) {
        state.trust[id] = action.payload
        console.log("actually setted it in the general table")

        //TODO: maybe optimize somehow?
        if (action.payload.value) {
          if (!(action.payload.from in state.trustFrom)) {
            state.trustFrom[action.payload.from] = {}
          }
          state.trustFrom[action.payload.from][action.payload.to] = true
          console.log('setted in FROM')
          if (!(action.payload.to in state.trustTo)) {
            state.trustTo[action.payload.to] = {}
          }
          state.trustTo[action.payload.to][action.payload.from] = true
          console.log('setted in TO')
        } else {
          if ((action.payload.from in state.trustFrom)) {
            delete state.trustFrom[action.payload.from][action.payload.to]
            console.log('unsetted in FROM')
          }
          if ((action.payload.to in state.trustTo)) {
            delete state.trustTo[action.payload.to][action.payload.from]
            console.log('unsetted in TO')
          }
          
        }
      }
    }
  }
})

export const browserReducer = browserSlice.reducer
