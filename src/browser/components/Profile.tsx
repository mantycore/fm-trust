import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams, Navigate } from 'react-router'
import { replace } from '@lagunovsky/redux-react-router'

import { handleOutsideLink, updateProfile, trust } from '../store/epics'
import { Profile } from "../store/state"
import { AppDispatch, RootState } from '../store/store'

function StaticProfile({publicKey}: {publicKey: string}) {
  const profile: Profile = useSelector((state: RootState) => state.browser.profiles[publicKey])
  const myPublicKey = useSelector((state: RootState) => state.browser.publicKey)
  const trusted = useSelector((state: RootState) => state.browser.trust[[myPublicKey, publicKey].join(':')])
  const dispatch = useDispatch()

  if (profile) {
    return <>
      <div style={{padding: 20}}>{profile.bio}</div>
      {(publicKey !== myPublicKey) && 
        <div
          onClick={_ => dispatch(trust({publicKey, value: !trusted}))}
          style={{width: 400, height: 70, padding: 20, cursor: 'pointer', backgroundColor: trusted ? 'palegreen' : 'palegoldenrod'}}
        >
        {trusted
          ? "Кликните здесь, чтобы отозвать доверие. Информация, которой вы уже поделились с человеком, - ваш профиль и профили других людей, которым вы доверяете - останется у него!"
          : "Кликните здесь, чтобы выразить доверие этому человеку. Он получит информацию вашего профиля и профили тех людей, кому вы уже доверяете!"}
        </div>
      }
    </>
  } else {
    return <>Профиля с таким ключом нет в системе, или он ещё не получен от других узлов.</>
  }
}

function EditableProfile({mode}: {mode: 'existing' | 'registration'}) {
  const dispatch = useDispatch<AppDispatch>()
  const { register, handleSubmit } = useForm()
  const onSubmit = (formData: {[x: string]: any}) =>
    dispatch(updateProfile({formData: formData as Profile, mode}))

  return <>
    <form onSubmit={handleSubmit(onSubmit)} style={{
      display: 'flex',
      flexDirection: 'column',
      width: 550
    }}>
      <textarea {...register('bio')}></textarea>
      <button>{mode === 'registration' ? "Создать профиль" : "Обновить профиль"}</button>
    </form>
  </>
}

function HandleOutsideLink({publicKey}: {publicKey: string}) {
  const dispatch = useDispatch()
  useEffect(() => { dispatch(handleOutsideLink(publicKey)) }, [])
  return <>Ожидаю получение и расшифровку профиля</>
}

export default function Profile({mode}: {mode: 'existing' | 'registration'}) {
  const myPublicKey = useSelector((state: RootState) => state.browser.publicKey)
  const { publicKey } = useParams()

  if (mode === 'existing') {
    if (myPublicKey) {
      if (publicKey) {
        if (publicKey.includes('~')) {
          // handle outside link
          // maybe handle it right in the epic?
          console.log("outside")
          return <HandleOutsideLink publicKey={publicKey} />
        } else if (publicKey === myPublicKey) {
          return <StaticProfile publicKey={publicKey} />
          //TODO: редактирование профайла
          // return <EditableProfile mode={mode} />
        } else {
          return <StaticProfile publicKey={publicKey} />
        }
      } else {
        // incorrect url? redirect to somewhere safe
      }
    } else {
      // my key is not yet loaded
    }
  } else if (mode === 'registration') {
    if (myPublicKey) {
      return <Navigate replace to={`/profile/${myPublicKey}`} />
    }
    return <EditableProfile mode={mode} />
  }
  return null
}
