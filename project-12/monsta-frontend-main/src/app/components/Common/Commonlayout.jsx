'use client'
import { store } from '@/ReduxToolkit/ReduxStore'
import { hydrateLogin } from '@/ReduxToolkit/LoginSlice'
import React, { useEffect } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { ToastContainer, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './AppToast.css'

// The cookie can only be read in the browser, so `loginSlice` starts logged-out on BOTH
// the server and the client (see LoginSlice.jsx). Reading the cookie in an effect -- i.e.
// after the first client render has already matched the server HTML -- is what keeps the
// markup hydration-safe.
//
// This must live inside <Provider> so useDispatch has the store in context, which is why
// it is a separate child component rather than a hook in Commonlayout itself.
function LoginHydrator() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(hydrateLogin())
  }, [dispatch])

  return null
}

export default function Commonlayout({ children }) {
  return (
    <>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      pauseOnHover
      draggable
      limit={3}
      theme="light"
      transition={Slide}
    />
        <Provider store={ store }>
            <LoginHydrator />
            { children }
        </Provider>
    </>
  )
}
