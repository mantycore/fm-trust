import { store } from "./store"
import { init } from "Common/store/epics"

store.dispatch(init({port: 7001}))
