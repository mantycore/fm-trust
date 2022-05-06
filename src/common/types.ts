/*
export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>
*/

export interface PeerRelayOptions {
  port?: number
  bootstrap?: string[]
}

export interface PeerRelayType {
  on(messageType: 'peer', handler: (id: Buffer) => void): void
  on(messageType: 'message', handler: (data: any, from: Buffer) => void): void
  send(id: Buffer, data: any): void
  id: Buffer
}

export interface Haiku {
  box: string
  nonce: string
  publicKey: string
}

export type Mantra = {
  type: 'haiku'
  haiku: Haiku
}

export interface Psalm {
  type: string
  content: any
}
