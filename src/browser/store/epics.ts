import { AnyAction, createAction } from '@reduxjs/toolkit'
import { Epic, combineEpics, ofType } from "redux-observable"
import { of, EMPTY } from 'rxjs' 
import { filter, mergeMap, first } from "rxjs/operators"
import { push, replace, ROUTER_ON_LOCATION_CHANGED  } from '@lagunovsky/redux-react-router'
import { commonSlice } from 'Common/store/slice'
import { broadcast } from 'Common/store/epics'
import { Profile, ProfileFormData, Trust, Psalm } from '../types'
import { Haiku } from 'Common/types'
import { decrypt, encrypt } from '../crypto'
import { browserSlice } from './slice'
import { RootState } from './store'

import nacl from 'tweetnacl'
import { fromUint8Array, toUint8Array } from 'js-base64'

type BrowserEpic = Epic<AnyAction, AnyAction, RootState> //TODO: fix types

export const init = createAction<void>('browser/init')
export const updateProfile = createAction<{formData: ProfileFormData, mode: 'registration' | 'existing'}>('browser/updateProfile')
export const handleOutsideLink = createAction<string>('browser/handleOutsideLink')
export const updateTrust = createAction<{publicKey: string, value: boolean}>('browser/updateTrust')

const initEpic: BrowserEpic  = 
  action$ => action$.pipe(
    filter(init.match),
    mergeMap(() => {
      const secretKey = localStorage.getItem('secretKey')
      const publicKey = localStorage.getItem('publicKey')
      const outsideProfileLink = localStorage.getItem('outsideProfileLink')

      if (secretKey === null || publicKey === null || outsideProfileLink === null) {
        return of(replace('/registration')) //TODO: save previous URL to return to after the registration?
      } else {
        return of(
          browserSlice.actions.setPublicKey(publicKey),
          browserSlice.actions.setSecretKey(secretKey),
          browserSlice.actions.setOutsideProfileLink(outsideProfileLink)
        )       
      }
    })
  )

const updateProfileEpic: BrowserEpic =  
  (action$, state$) => action$.pipe(
    filter(updateProfile.match),
    mergeMap(({payload: {formData, mode}}) => {
      if (mode === 'registration') {
        const { publicKey: ownPublicKey, secretKey: ownSecretKey } = nacl.box.keyPair()
        const { publicKey: oneTimePublicKey, secretKey: oneTimeSecretKey } = nacl.box.keyPair()
  
        const ownPublicKeyString = fromUint8Array(ownPublicKey, true)
        const ownSecretKeyString = fromUint8Array(ownSecretKey, true)
        const oneTimeSecretKeyString = fromUint8Array(oneTimeSecretKey, true)

        const profile: Profile = {...formData, publicKey: ownPublicKeyString, timestamp: new Date().valueOf()}
        const psalm: Psalm = {type: 'profile', profile}
        const ownHaiku = encrypt(psalm, ownPublicKey, ownSecretKey, ownPublicKey)
        const oneTimeHaiku = encrypt(psalm, oneTimePublicKey, ownSecretKey, ownPublicKey)

        const outsideProfileLink = [oneTimeSecretKeyString, oneTimeHaiku.publicKey].join('~')

        localStorage.setItem('secretKey', ownSecretKeyString)
        localStorage.setItem('publicKey', ownPublicKeyString)
        localStorage.setItem('outsideProfileLink', outsideProfileLink)
        return of(
          broadcast(ownHaiku),
          broadcast(oneTimeHaiku),
          browserSlice.actions.setSecretKey(ownSecretKeyString),
          browserSlice.actions.setPublicKey(ownPublicKeyString),
          browserSlice.actions.setOutsideProfileLink(outsideProfileLink),
          browserSlice.actions.setProfile(profile),
          push(`/profile/${ownPublicKeyString}`)
        )
      } else if (mode === 'existing') {
        const state = state$.value

        const { publicKey: ownPublicKeyString, secretKey: ownSecretKeyString } = state.browser
        if (!ownPublicKeyString || !ownSecretKeyString) { return EMPTY }
        const { publicKey: oneTimePublicKey, secretKey: oneTimeSecretKey } = nacl.box.keyPair()
  
        const ownPublicKey = toUint8Array(ownPublicKeyString)
        const ownSecretKey = toUint8Array(ownSecretKeyString)
        const oneTimeSecretKeyString = fromUint8Array(oneTimeSecretKey, true)

        const profile: Profile = {...formData, publicKey: ownPublicKeyString, timestamp: new Date().valueOf()}
        const psalm: Psalm = {type: 'profile', profile}
        const ownHaiku = encrypt(psalm, ownPublicKey, ownSecretKey, ownPublicKey)
        const oneTimeHaiku = encrypt(psalm, oneTimePublicKey, ownSecretKey, ownPublicKey)

        const trustedKeysObject = state.browser.trustFrom[ownPublicKeyString] || {}
        const trustedPublicKeys = Object.keys(trustedKeysObject)

        const broadcastObjects = trustedPublicKeys.map(key => {
          console.log("sending for", key, psalm )
          return broadcast(
            encrypt(psalm, key, ownSecretKey, ownPublicKey)
          )
        })

        const outsideProfileLink = [oneTimeSecretKeyString, oneTimeHaiku.publicKey].join('~')

        //TODO: maybe not regenerate the outsid profile link each time? Do it on user's request?
        localStorage.setItem('outsideProfileLink', outsideProfileLink)
        return of(
          broadcast(ownHaiku),
          broadcast(oneTimeHaiku),
          ...broadcastObjects,
          browserSlice.actions.setOutsideProfileLink(outsideProfileLink),
          browserSlice.actions.setProfile(profile)
        )
      }
      return EMPTY
    })
  )

const haikuEpic: BrowserEpic = (action$, state$) =>
  action$.pipe(
    filter(commonSlice.actions.haiku.match),
    mergeMap(action => {
      const state = state$.value
      if (state.browser.secretKey) {
        const decrypted = decrypt(action.payload, state.browser.secretKey)
        if (decrypted) {
          const {psalm, fromPublicKey} = decrypted
          if (psalm.type === 'profile') { //TODO: check that fromPublicKey is among trusted? what about the outside link?
            console.log("incoming profile", psalm.profile)
            return of(browserSlice.actions.setProfile(psalm.profile))
          } else if (psalm.type === 'trust' && fromPublicKey === psalm.trust.from) {
            return of(browserSlice.actions.setTrust(psalm.trust))
          }
        } else {
          // unable to dechypher, do nothing
        }
      }
      return EMPTY
    })
  )

const handleOutsideLinkEpic: BrowserEpic =
  (action$, state$) => action$.pipe(
    filter(handleOutsideLink.match),
    mergeMap(action => {
      const [oneTimeSecretKey, oneTimePublicKey] = action.payload.split('~')
      return state$.pipe(
        first (state => oneTimePublicKey in state.common.kushu),
        mergeMap(state => {
          if (!state.browser.publicKey || !state.browser.secretKey) { return EMPTY }

          const haiku = state.common.kushu[oneTimePublicKey]
          const decrypted = decrypt(haiku, oneTimeSecretKey)
          if (decrypted) {
            const {psalm} = decrypted
            if (psalm.type === 'profile') {
              const myPublicKey = state.browser.publicKey
              const mySecretKey = state.browser.secretKey
              const haiku = encrypt(psalm, myPublicKey, mySecretKey, myPublicKey)
              return of(
                browserSlice.actions.setProfile(psalm.profile),
                replace(`/profile/${psalm.profile.publicKey}`),
                broadcast(haiku)
              )
            }
          } else {
            // unable to dechypher, TODO: warn user
          }
          return EMPTY
        })
      )
    })
  )

const updateTrustEpic: BrowserEpic =
  (action$, state$) => action$.pipe(
    filter(updateTrust.match),
    mergeMap(action => {
      const state = state$.value
      const myPublicKey = state.browser.publicKey
      const mySecretKey = state.browser.secretKey
      if (!myPublicKey || !mySecretKey) { return EMPTY }
      if (myPublicKey === action.payload.publicKey) { return EMPTY }

      const trust: Trust = {
        from: myPublicKey,
        to: action.payload.publicKey,
        value: action.payload.value,
        timestamp: new Date().valueOf()
      }

      const trustedKeysObject = state.browser.trustFrom[myPublicKey] || {}
      const trustedPublicKeys = Object.keys(trustedKeysObject)
      const theirPublicKeys = Object.keys(trustedKeysObject)
      if (!(action.payload.publicKey in trustedKeysObject)) {
        theirPublicKeys.push(action.payload.publicKey)
      }
      theirPublicKeys.push(myPublicKey)

      //type BC = ReturnType<typeof broadcast>
      const kushu: Haiku[] = theirPublicKeys.map(theirPublicKey => encrypt({type: 'trust', trust}, theirPublicKey, mySecretKey, myPublicKey))
        .concat(trustedPublicKeys.filter(key => key !== action.payload.publicKey).map(trustedPublicKey => encrypt(
          {
            type: 'trust',
            trust: {
              from: myPublicKey,
              to: trustedPublicKey,
              value: true,
              timestamp: new Date().valueOf()
            }
          },
          action.payload.publicKey,
          mySecretKey,
          myPublicKey
        )))
        .concat([
          encrypt({type: 'profile', profile: state.browser.profiles[myPublicKey]}, action.payload.publicKey, mySecretKey, myPublicKey)
        ])

      return of(
        ...(kushu.map(haiku => broadcast(haiku))),
        browserSlice.actions.setTrust(trust)
      )
    })
  )

export const browserEpic = combineEpics(
  initEpic,
  updateProfileEpic,
  haikuEpic,
  handleOutsideLinkEpic,
  updateTrustEpic
)


  /*action$ => action$.pipe(
    ofType(ROUTER_ON_LOCATION_CHANGED),
    mergeMap(action => {
      console.log("move", action)
      return EMPTY
    })
  ),*/









