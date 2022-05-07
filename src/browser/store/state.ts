import { Profile, Trust } from '../types'

export interface BrowserState {
  secretKey?: string,
  publicKey?: string,
  outsideProfileLink?: string,
  profiles: {[id: string]: Profile}
  trust: {[id: string]: Trust}
  trustFrom: {[id: string]: {[id: string]: true}}
  trustTo: {[id: string]: {[id: string]: true}}
}

export const initialState: BrowserState = {
  profiles: {},
  trust: {},
  trustFrom: {},
  trustTo: {}
}