// ============================================================
// src/App.tsx
// Root component — router + global provider setup.
// ============================================================

import React, { useEffect, useState } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";

// Pages
import Splash        from "./pages/Splash";
import Home          from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart          from "./pages/Cart";
import Wishlist      from "./pages/Wishlist";
import Checkout      from "./pages/Checkout";
import TrackOrder    from "./pages/TrackOrder";
import Profile       from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import AddAddress    from "./pages/AddAddress";
import EditProfile from "./pages/EditProfile";

// Global state
import { AppProvider, useAppDispatch, login } from "./store";
import {
  API_BASE,
  getRefreshToken,
  getAccessToken,
  setTokens,
  clearTokens,
} from "./api/client";

// UI
import Toast from "./components/common/Toast";

// Styles
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "./theme/variables.css";

import { ROUTES } from "./utils/constants";

setupIonicReact();

// ── Auth restore on startup ───────────────────────────────────
// Runs once when app mounts. If refreshToken exists in localStorage,
// get a fresh accessToken and restore user from /api/auth/me.

const AuthRestore: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const restore = async () => {
      const refresh = getRefreshToken();

      // No refresh token → user was never logged in or explicitly logged out
      if (!refresh) { onDone(); return; }

      try {
        // Step 1: get a fresh access token (sessionStorage gets cleared on refresh)
        let access = getAccessToken();
        if (!access) {
          const rr = await fetch(`${API_BASE}/api/auth/refresh`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ refreshToken: refresh }),
          });
          if (!rr.ok) { clearTokens(); onDone(); return; }
          const rd = await rr.json();
          access = rd.data?.accessToken ?? rd.accessToken;
          if (!access) { clearTokens(); onDone(); return; }
          // also persist the same refreshToken
          setTokens(access, refresh);
        }

        // Step 2: fetch user profile
        const mr = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (!mr.ok) { clearTokens(); onDone(); return; }
        const md = await mr.json();
        const user = md.data ?? md.user ?? md;

        dispatch(login({
          id:     user.uid ?? user._id ?? user.id ?? "",
          name:   user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          email:  user.email ?? "",
          avatar: user.avatar ?? "",
        }));
      } catch {
        clearTokens();
      } finally {
        onDone();
      }
    };

    restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

// ── Inner app (needs to be inside AppProvider to access dispatch) ─
const InnerApp: React.FC = () => {
  const [authReady, setAuthReady] = useState(false);

  return (
    <>
      <AuthRestore onDone={() => setAuthReady(true)} />
      {authReady && (
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path={ROUTES.SPLASH}        component={Splash}        />
            <Route exact path={ROUTES.HOME}          component={Home}          />
            <Route exact path={ROUTES.PRODUCT}       component={ProductDetail} />
            <Route exact path={ROUTES.CART}          component={Cart}          />
            <Route exact path={ROUTES.WISHLIST}      component={Wishlist}      />
            <Route exact path={ROUTES.CHECKOUT}      component={Checkout}      />
            <Route exact path={ROUTES.TRACK}         component={TrackOrder}    />
            <Route exact path={ROUTES.PROFILE}       component={Profile}       />
            <Route exact path={ROUTES.NOTIFICATIONS} component={Notifications} />
            <Route exact path={ROUTES.LOGIN}         component={Login}         />
            <Route exact path={ROUTES.REGISTER}      component={Register}      />
            <Route exact path={ROUTES.ADD_ADDRESS}   component={AddAddress}    />
            <Route exact path={ROUTES.EDIT_PROFILE}  component={EditProfile}   />
            <Redirect exact from="/" to={ROUTES.SPLASH} />
          </IonRouterOutlet>
        </IonReactRouter>
      )}
      <Toast />
    </>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <IonApp>
      <InnerApp />
    </IonApp>
  </AppProvider>
);

export default App;
