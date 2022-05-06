import { Haiku } from 'Common/types'

export interface CommonState {
  peers: {[id: string]: true}
  kushu: {[hash: string]: Haiku} // cyphertexts
}

export const initialState: CommonState = {
  peers: {},
  kushu: {}
}