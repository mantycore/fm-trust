import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Navigate } from 'react-router'

import { handleOutsideLink } from '../store/epics'
import { RootState } from '../store/store'

import StaticProfile from './StaticProfile'
import EditableProfile from './EditableProfile'

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
          return <HandleOutsideLink publicKey={publicKey} />
        } else if (publicKey === myPublicKey) {
          //return <StaticProfile publicKey={publicKey} />
          //TODO: редактирование профайла
          return <EditableProfile mode={mode} />
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
