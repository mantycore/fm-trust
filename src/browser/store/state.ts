export interface Profile {
  bio: string
  publicKey?: string //TODO: better typing
}

export interface BrowserState {
  secretKey?: string,
  publicKey?: string,
  outsideProfileLink?: string,
  profiles: {[id: string]: Profile}
  trust: {[id: string]: boolean}
}

export const initialState: BrowserState = {
  profiles: {},
  trust: {}
}