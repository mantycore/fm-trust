declare module "peer-relay" {
  interface PeerRelayType {
    new (options: import('./types').PeerRelayOptions): import('./types').PeerRelayType
  }
  const PeerRelay: PeerRelayType
  export = PeerRelay
}
