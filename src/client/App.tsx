import React, { useState, useContext } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom"
import { createMuiTheme, ThemeProvider as ThemeProviderMaterialUI } from '@material-ui/core'
import { ThemeProvider as ThemeProviderEmotion } from '@emotion/react'
import { UserContext } from './utils/userContext'
import Landing from './pages/Landing'
import GamesList from './pages/GamesList'
import Game from './pages/Game'
import './App.css'

function PrivateRoute({ children, path, exact }: { children: React.ReactNode, path: string, exact?: boolean }) {
  const user = useContext(UserContext)

  if (!user.id)
    return (
      <Redirect
        to={{
          pathname: "/",
        }}
      />
    )
  else
    return (
      <Route
        path={path}
        exact={exact}
        render={() => children}
      />
    )
}

function App() {

  const [user, setUser] = useState({
    username: '',
    id: ''
  })

  const themeMaterial = createMuiTheme({
    typography: {
      fontFamily: 'Audiowide, cursive',
    },
    palette: {
      primary: {
        main: '#ff0000'
      }
    }
  })

  const themeEmotion = {
    colors: {
      primary: '#ff0000',
      text1: 'white',
      text2: '#ff0000',
      light: 'white',
      dark: '#151515',
      lightGrey: '#d8d8d8',
      darkGrey: '#202020',
      error: 'ff0000'
    }
  }

  return (
    <ThemeProviderMaterialUI theme={themeMaterial}>
      <ThemeProviderEmotion theme={themeEmotion}>
        <UserContext.Provider value={user}>
          <Router >
            <Switch>
              <PrivateRoute exact path="/games">
                <GamesList />
              </PrivateRoute>
              <PrivateRoute path="/game">
                <Game />
              </PrivateRoute>
              <Route path="/">
                <Landing setUser={setUser} />
              </Route>
            </Switch>
          </Router>
        </UserContext.Provider>
      </ThemeProviderEmotion>
    </ThemeProviderMaterialUI>
  )
}

export default App