import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { init, updateProfile } from '../store/epics'
import { assertType } from 'typescript-is'
//import { useForm } from 'react-hook-form'
//TODO: maybe return to it later
import { CopyToClipboard } from 'react-copy-to-clipboard'
import type { ProfileFormData } from "../types"

export default function EditableProfile({mode}: {mode: 'existing' | 'registration'}) {
  const myPublicKey = useSelector((state: RootState) => state.browser.publicKey)
  const myProfile = useSelector((state: RootState) => myPublicKey ? state.browser.profiles[myPublicKey] : null )
  const outsideProfileLink = 
    `${document.location.origin}/profile/${useSelector((state: RootState) => state.browser.outsideProfileLink)}`

  const dispatch = useDispatch()

  const initial = myProfile
  ? {...myProfile, tags: myProfile.tags.join(', ')}
  : {
    nickname: '',
    about: '',
    tags: ''
  }

  const [formData, setFormData] = useState(initial)
  useEffect(() => {
    setFormData(initial)
  }, [myProfile])


  const handleSubmit = (submitEvent: any) => {
    submitEvent.preventDefault()
    console.log(formData)
    dispatch(updateProfile({
      formData: assertType<ProfileFormData>({
        ...formData,
        tags: formData.tags.trim().split(/\s*,\s*/).sort()
      }),
      mode
    }))
  } 
  

  return <div style={{marginTop: 20}}>
    <form onSubmit={handleSubmit} style={{width: 820}}>
      <section style={{marginBottom: 20}}>
        <label><input value={formData.nickname} onChange={(e: any) => setFormData({...formData, nickname: e.target.value})} placeholder="Псевдоним"/>
        <p style={{fontSize: -1}}>Используйте псевдоним, по которому вас могут узнать друзья. Не используйте паспортное имя и другие общеизвестные идентификаторы.</p></label>
      </section>
      <div style={{display: 'flex', flexDirection: 'row', gap: 20, marginBottom: 20}}>
        <section style={{width: 400}}>
          <textarea value={formData.about} onChange={(e: any) => setFormData({...formData, about: e.target.value})} style={{width: 400, height: 200}} placeholder="Напишите о себе в свободной форме."></textarea>
        </section>
        <section style={{width: 400}}>
          <textarea value={formData.tags} onChange={(e: any) => setFormData({...formData, tags: e.target.value})} style={{width: 400, height: 200}} placeholder="Перечислите через запятую теги, вас характеризующие. Это могут быть специализации, интересы, названия местностей - что угодно."></textarea>
        </section>
      </div>
      
      <button>{mode === 'registration' ? "Создать профиль" : "Обновить профиль"}</button>
    </form>
    {mode === 'existing' && outsideProfileLink && <div style={{marginTop: 20}}>
      <p>Скопируйте эту ссылку и отправьте друзьям, уже зарегистрировавшимся в системе, чтобы они подтвердили ваш профиль:</p>
      <div style={{display: 'flex', gap: 5}}>
        <CopyToClipboard text={outsideProfileLink}><button>Скопировать в буфер обмена</button></CopyToClipboard>
        <input style={{width: 900}} disabled value={outsideProfileLink} />
      </div>
    </div>}
  </div>
}
