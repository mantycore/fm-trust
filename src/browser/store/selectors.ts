import { RootState } from "./store";

export function whoTrusts(state: RootState, theirPublicKey: string) {
  const myPublicKey = state.browser.publicKey
  if (!myPublicKey) { return [] }
  return Object.keys(state.browser.trustTo[theirPublicKey] || {})
}

export function whoTrustsAmongMyTrusted(state: RootState, theirPublicKey: string) {
  const myPublicKey = state.browser.publicKey
  if (!myPublicKey) { return [] }
  const trustTo = Object.keys(state.browser.trustTo[theirPublicKey] || {})
  const iTrust = Object.keys(state.browser.trustFrom[myPublicKey] || {})
  return trustTo.filter(publicKey => iTrust.includes(publicKey))
}