import { createSlice } from '@reduxjs/toolkit'
import Cookies from 'js-cookie'

// ---------------------------------------------------------------------------
// SSR-safety: the initial value MUST be identical on the server and the client.
//
// It used to be `Cookies.get('user_login') ?? 0` evaluated at MODULE SCOPE. That runs
// once when the module is first imported: on the server there is no cookie, so the
// value was `0`, while in the browser it was the JWT string. `initialState` therefore
// differed between the two environments, and any component reading `state.login.value`
// rendered different text during SSR vs the first client render -> "Hydration failed
// because the server rendered text didn't match the client" in Header.jsx.
//
// The cookie is now read AFTER hydration, via the `hydrateLogin` action dispatched from
// Commonlayout's useEffect. Until that runs, every environment renders "Login / Register".
// ---------------------------------------------------------------------------
const initialState = {
    value: 0,      // 0 = logged out. A JWT string once hydrated.
    hydrated: false, // true once the cookie has been read on the client.
}

export const loginSlice = createSlice({
    name: 'login',
    initialState,
    reducers: {
        // Reads the cookie and syncs state to it. Client-only (called from an effect).
        // No-ops if there is no cookie, leaving the logged-out state intact.
        hydrateLogin: (state) => {
            const token = Cookies.get('user_login')
            state.value = token || 0
            state.hydrated = true
        },
        login: (state, action) => {
            state.value = action.payload;
            state.hydrated = true;
            Cookies.set('user_login', action.payload);
        },
        register: (state, action) => {
            state.value = action.payload;
            state.hydrated = true;
            Cookies.set('user_login', action.payload);
        },
        logout: (state, action) => {
            state.value = 0;
            state.hydrated = true;
            Cookies.remove('user_login');
        },
    },
})

// Action creators are generated for each case reducer function
export const { login, register, logout, hydrateLogin } = loginSlice.actions

export default loginSlice.reducer