import React from "react"
import {createRoot} from "react-dom/client"
import "terminal.css"
import {BrowserRouter as Router, Route, Routes} from "react-router-dom"
import {RecoilRoot} from "recoil"
import {ExtensionPools, ExtensionPool} from "./pools"
import {ExtensionMember} from "./members"
import {useLocalStorage} from "@rehooks/local-storage"
import {TonhubConnectProvider} from "react-ton-x"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"

dayjs.extend(duration)

String.prototype.toShort = function (ends = 4) {
  return this.substr(0, ends) + "…" + this.substr(0 - ends)
}

const
  App = () => {
    const
      [state, setstate] = useLocalStorage("connection", {type: "initing"})
    return <RecoilRoot>
      <TonhubConnectProvider
        name={"STAKER"}
        debug={true}
        network={"mainnet"}
        url={"https://tonhub.com/app/te6cckEBAwEAKwACAcgCAQAMU1RBS0VSADhodHRwczovL3N0YWtlci50b24uc2hpa3NoYS9l7dEm_g"}
        connectionState={state}
        setConnectionState={setstate}>
      <Router>
        <Routes>
          <Route path={"/e"} element={<ExtensionPools />} />
          <Route path={"/e/:pool"} element={<ExtensionPool />} />
          <Route path={"/e/m/:pool"} element={<ExtensionMember />} />
        </Routes>
      </Router>
      </TonhubConnectProvider>
    </RecoilRoot>
  },
  root = createRoot(document.getElementById("app"))

root.render(
  <App />
)
