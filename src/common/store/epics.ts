import { AnyAction, createAction } from '@reduxjs/toolkit'
import type { PeerRelayType, PeerRelayOptions } from 'Common/types'
import { Epic, combineEpics } from "redux-observable"
import { Observable, EMPTY } from 'rxjs'
import { filter, mergeMap } from "rxjs/operators"
import PeerRelay from 'peer-relay';
import { commonSlice} from './slice'
import { CommonState } from './state'
import { assertType } from 'typescript-is'
import { Mantra, Haiku } from 'Common/types'
import { fromUint8Array, toUint8Array } from 'js-base64'

let peer: PeerRelayType

export const init = createAction<PeerRelayOptions>('common/init')
export const broadcast = createAction<Haiku>('common/broadcast')
type CommonEpic = Epic<AnyAction, AnyAction, {common: CommonState}> //TODO: fix types

export const commonEpic: CommonEpic = combineEpics(

  (action$, state$) => action$.pipe(
    filter(init.match),
    mergeMap(action => new Observable<AnyAction>(subscriber => {
      peer = new PeerRelay(action.payload)
      // console.log("INIT", fromUint8Array(peer.id))

      peer.on('peer', id => {
        //TODO: dispatch separate epic!
        //TODO: better replication
        const idString = fromUint8Array(id, true)
        console.log("PEER", idString)

        Object.keys(state$.value.common.kushu).forEach(haikuKey => {
          peer.send(id, {type: 'haiku', haiku: state$.value.common.kushu[haikuKey]})
        })

        Object.keys(state$.value.common.peers).forEach(oldPeer => {
          peer.send(Buffer.from(toUint8Array(oldPeer)), {type: 'peer', peer: idString})
        })
        
        subscriber.next(commonSlice.actions.peer({id: idString}))
      })

      peer.on('message', (data, from) => {
        const mantra = assertType<Mantra>(data)
        console.log("MESG", fromUint8Array(from, true), data)
        if (mantra.type === 'haiku') {
          if (!(mantra.haiku.publicKey in state$.value.common.kushu)) {
            subscriber.next(commonSlice.actions.haiku(mantra.haiku))
          }
        } else if (mantra.type === 'peer') {
          peer.connect(Buffer.from(toUint8Array(mantra.peer)))
          subscriber.next(commonSlice.actions.peer({id: mantra.peer}))
        }
      })

    }))
  ),

  (action$, state$) => action$.pipe(
    filter(broadcast.match),
    mergeMap(action => {
      Object.keys(state$.value.common.peers).forEach(peerId => {
        peer.send(Buffer.from(toUint8Array(peerId)), {type: 'haiku', haiku: action.payload})      
      });
      return EMPTY
    })
  )

)