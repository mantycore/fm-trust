import { Routes, Route, Outlet, Link } from 'react-router-dom'
import React from "react"

import { useSelector } from 'react-redux'
import { RootState } from './store/store'

import Profile from './components/Profile'

function App () {
  const myPublicKey = useSelector((state: RootState) => state.browser.publicKey)
  const outsideProfileLink = useSelector((state: RootState) => state.browser.outsideProfileLink)
  return <>
    <div style={{backgroundColor: 'wheat', padding: 20, fontSize: 8}}>Это экспериментальный прототип системы доверия для платформы Freemapping.
      <br/>Внимание!
      <ul>
        <li>На данный момент введённые данные не сохраняются на диск и исчезнут при перезагрузке системы.</li>
        <li>Все данные шифруются. Они не могут быть расшифрованы - на сервере или где-либо ещё - без вашего секретного ключа.</li>
        <li>Секретный ключ создаётся при регистрации, хранится только в вашем браузере и никуда не пересылается.</li>
        <li>Сообщая системе, что вы доверяете другому человеку, вы разрешаете ей передать ему данные вашего профиля
          и профилей других людей, которым вы доверяете. <b>Эти данные не могут быть отозваны, если вы впоследствии передумаете.
          </b> Если вы отзовёте доверие у другого человека, он не будет получать обновления ваших данных, но данные, которые он получил
          до отзыва, останутся у него.
        </li>
      </ul>
    </div>
    <div style={{backgroundColor: 'skyblue', padding: 20, fontSize: 8}}>
      Навигация:
      <ul>
        <li>{myPublicKey ? <Link to={`/profile/${myPublicKey}`}>Мой профиль</Link>
        : <Link to="/registration">Регистрация</Link>}</li>
        <li>{outsideProfileLink && <span>{outsideProfileLink}</span>}</li>
      </ul>
    </div>
    <Outlet />
  </>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} >
        <Route path="/profile/:publicKey" element={<Profile mode="existing" />} />
        <Route path="/registration" element={<Profile mode="registration" />} />
      </Route>
    </Routes>
  );
}
