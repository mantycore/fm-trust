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
        //TODO: better replication
        // console.log("PEER", fromUint8Array(id))
        Object.keys(state$.value.common.kushu).forEach(haikuKey => {
          peer.send(id, {type: 'haiku', haiku: state$.value.common.kushu[haikuKey]})
        })
        subscriber.next(commonSlice.actions.peer({id: id.toString('hex')}))
      })

      peer.on('message', (data, from) => {
        const mantra = assertType<Mantra>(data)
        if (mantra.type === 'haiku') {
          // console.log("MESG", fromUint8Array(from), data)
          if (!(mantra.haiku.publicKey in state$.value.common.kushu)) {
            subscriber.next(commonSlice.actions.haiku(mantra.haiku))
          }
        }
      })

    }))
  ),

  (action$, state$) => action$.pipe(
    filter(broadcast.match),
    mergeMap(action => {
      Object.keys(state$.value.common.peers).forEach(peerId => {
        peer.send(Buffer.from(peerId, 'hex'), {type: 'haiku', haiku: action.payload})      
      });
      return EMPTY
    })
  )

)