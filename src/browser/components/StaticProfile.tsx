import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { whoTrustsAmongMyTrusted } from '../store/selectors'
import { updateTrust } from '../store/epics'

export default function StaticProfile({publicKey}: {publicKey: string}) {
  const profile = useSelector((state: RootState) => state.browser.profiles[publicKey])
  const myPublicKey = useSelector((state: RootState) => state.browser.publicKey)
  const {value: trusted} = useSelector((state: RootState) =>
    state.browser.trust[[myPublicKey, publicKey].join(':')] || ({value: false}))
  const whoTrustsList = useSelector((state: RootState) => whoTrustsAmongMyTrusted(state, publicKey))
  const dispatch = useDispatch()

  if (profile) {
    return <>
      <div style={{display: 'flex', flexDirection: 'row', gap: 20}}>
        <div
          onClick={_ => dispatch(updateTrust({publicKey, value: !trusted}))}
          style={{width: 400, height: 70, padding: 10, cursor: 'pointer', backgroundColor: trusted ? 'palegreen' : 'palegoldenrod'}}
        >
        {trusted
          ? "Кликните здесь, чтобы отозвать доверие. Информация, которой вы уже поделились с человеком, - ваш профиль и профили других людей, которым вы доверяете - останется у него!"
          : "Кликните здесь, чтобы выразить доверие этому человеку. Он получит информацию вашего профиля и профили тех людей, кому вы уже доверяете!"}
        </div>
        <div style={{height: 70, width: 70, padding: 10, cursor: 'pointer', backgroundColor: whoTrustsList.length > 0 ? 'palegreen' : 'palegoldenrod', fontSize: 60, textAlign: 'center'}}>
          {whoTrustsList.length}
        </div>
      </div>
      <h2>{profile.nickname}</h2>
      <div style={{padding: 20}}>{profile.about}</div>
      <div style={{padding: 20}}>{profile.tags.join(', ')}</div>
    </>
  } else {
    return <>Профиля с таким ключом нет в системе, или он ещё не получен от других узлов.</>
  }
}