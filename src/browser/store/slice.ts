import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState, Profile } from './state'

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
    addProfile(state, action: PayloadAction<{publicKey: string, profile: Profile}>) {
      state.profiles[action.payload.publicKey] = action.payload.profile
    }
  }
})

export const browserReducer = browserSlice.reducer
