import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState } from './state'
import { Haiku } from 'Common/types'

export const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    peer(state, action: PayloadAction<{id: string}>) {
      state.peers[action.payload.id] = true
    },
    haiku(state, action: PayloadAction<Haiku>) {
      state.kushu[action.payload.publicKey] = action.payload
    }
  }
})

export const commonReducer = commonSlice.reducer
