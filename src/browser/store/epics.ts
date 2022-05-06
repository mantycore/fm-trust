import { AnyAction, createAction } from '@reduxjs/toolkit'
import { Epic, combineEpics, ofType } from "redux-observable"
import { of, EMPTY } from 'rxjs' 
import { filter, mergeMap, first } from "rxjs/operators"
import { push, replace, ROUTER_ON_LOCATION_CHANGED  } from '@lagunovsky/redux-react-router'
import { broadcast } from 'Common/store/epics'
import { browserSlice } from './slice'
import { Profile } from './state'
import { decrypt, encrypt } from '../crypto'
import { commonSlice } from 'Common/store/slice'
import { RootState } from './store'

import nacl from 'tweetnacl'
import { fromUint8Array, toUint8Array } from 'js-base64'

type BrowserEpic = Epic<AnyAction, AnyAction, RootState> //TODO: fix types

export const init = createAction<void>('browser/init')
export const updateProfile = createAction<{formData: Profile, mode: 'registration' | 'existing'}>('browser/updateProfile')
export const handleOutsideLink = createAction<string>('browser/handleOutsideLink')
export const trust = createAction<{publicKey: string, value: boolean}>('browser/trust')

const initEpic: Epic<AnyAction, AnyAction, RootState>  = 
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

const updateProfileEpic: Epic<AnyAction, AnyAction, RootState> =  
  action$ => action$.pipe(
    filter(updateProfile.match),
    mergeMap(({payload: {formData, mode}}) => {
      if (mode === 'registration') {
        const { publicKey: ownPublicKey, secretKey: ownSecretKey } = nacl.box.keyPair()
        const { publicKey: oneTimePublicKey, secretKey: oneTimeSecretKey } = nacl.box.keyPair()
  
        
        const ownPublicKeyString = fromUint8Array(ownPublicKey, true)
        const ownSecretKeyString = fromUint8Array(ownSecretKey, true)
        const oneTimeSecretKeyString = fromUint8Array(oneTimeSecretKey, true)

        const psalm = {type: 'profile', content: {...formData, publicKey: ownPublicKeyString}}
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
          browserSlice.actions.addProfile({publicKey: ownPublicKeyString, profile: formData}),
          push(`/profile/${ownPublicKeyString}`)
        )
      }
      return EMPTY
    })
  )

const haikuEpic: Epic<AnyAction, AnyAction, RootState> = (action$, state$) => action$.pipe(
  filter(commonSlice.actions.haiku.match),
  mergeMap(action => {
    if (state$.value.browser.secretKey) {
      const decrypted = decrypt(action.payload, state$.value.browser.secretKey)
      if (decrypted) {
        const {psalm, fromPublicKey} = decrypted
        if (psalm.type === 'profile') { //TODO: one user cand send another's profile!
          return of(browserSlice.actions.addProfile({publicKey: psalm.content.publicKey, profile: psalm.content}))
        }
      } else {
        // unable to dechypher, do nothing
      }
    }
    return EMPTY
  })
)

const handleOutsideLinkEpic: Epic<AnyAction, AnyAction, RootState> =
(action$, state$) => action$.pipe(
  filter(handleOutsideLink.match),
  mergeMap(action => {
    const [secretKey, publicKey] = action.payload.split('~')
    return state$.pipe(
      first (state => publicKey in state.common.kushu),
      mergeMap(state => {
        if (!state.browser.publicKey || !state.browser.secretKey) { return EMPTY }

        const haiku = state.common.kushu[publicKey]
        const decrypted = decrypt(haiku, secretKey)
        if (decrypted) {
          const {psalm} = decrypted
          if (psalm.type === 'profile') {
            const myPublicKey = toUint8Array(state.browser.publicKey)
            const mySecretKey = toUint8Array(state.browser.secretKey)
            const haiku = encrypt(psalm, myPublicKey, mySecretKey, myPublicKey)
            return of(
              browserSlice.actions.addProfile({publicKey: psalm.content.publicKey, profile: psalm.content}),
              replace(`/profile/${psalm.content.publicKey}`),
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

export const browserEpic: BrowserEpic = combineEpics(initEpic, updateProfileEpic, haikuEpic, handleOutsideLinkEpic)


  /*action$ => action$.pipe(
    ofType(ROUTER_ON_LOCATION_CHANGED),
    mergeMap(action => {
      console.log("move", action)
      return EMPTY
    })
  ),*/









