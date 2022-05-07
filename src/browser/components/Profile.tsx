import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams, Navigate } from 'react-router'
import { assertType } from 'typescript-is'

import { handleOutsideLink, updateProfile, updateTrust } from '../store/epics'
import type { ProfileFormData } from "../types"
import { AppDispatch, RootState } from '../store/store'
import { whoTrustsAmongMyTrusted } from '../store/selectors'

import StaticProfile from './StaticProfile'

function EditableProfile({mode}: {mode: 'existing' | 'registration'}) {
  const myPublicKey = useSelector((state: RootState) => state.browser.publicKey)
  const myProfile = useSelector((state: RootState) => myPublicKey ? state.browser.profiles[myPublicKey] : null )

  const dispatch = useDispatch<AppDispatch>()
  const { register, handleSubmit } = useForm(!myProfile ? {} : {
    defaultValues: myProfile
  })
  const onSubmit = (formData: {[x: string]: any}) =>
    dispatch(updateProfile({formData: assertType<ProfileFormData>(formData), mode}))

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
          //return <StaticProfile publicKey={publicKey} />
          //TODO: редактирование профайла
          console.log('own')
          return <EditableProfile mode={mode} />
        } else {
          console.log('others')
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
    console.log('registration')
    return <EditableProfile mode={mode} />
  }
  return null
}
