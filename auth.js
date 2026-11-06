"use strict";

(() => {
  const element = id => document.getElementById(id);
  const config = window.IEOP_AUTH_CONFIG;
  const dialog = element("authDialog");
  const form = element("authForm");
  const message = element("authMessage");
  const accountStatus = element("accountStatus");
  const passwordInput = element("authPassword");

  let client;
  let mode = "signin";
  let pending = false;
  let signedIn = false;

  function updateButtons() {
    element("showSignIn").hidden = signedIn;
    element("showSignUp").hidden = signedIn;
    element("signOut").hidden = !signedIn;

    [
      "showSignIn",
      "showSignUp",
      "signOut",
      "authSubmit",
      "authSwitchMode"
    ].forEach(id => {
      element(id).disabled = pending || !client;
    });

    element("authEmail").disabled = pending;
    passwordInput.disabled = pending;
    element("authCancel").disabled = pending;
  }

  function renderSession(session) {
    signedIn = Boolean(session?.user);

    accountStatus.textContent = signedIn
      ? `Signed in as ${session.user.email || "your account"}. Projects remain on this device.`
      : "Not signed in. Projects remain on this device.";

    updateButtons();
  }

  function setMode(nextMode) {
    mode = nextMode;
    const registering = mode === "signup";

    element("authDialogTitle").textContent = registering
      ? "Create account"
      : "Sign in";

    element("authSubmit").textContent = registering
      ? "Create account"
      : "Sign in";

    element("authSwitchMode").textContent = registering
      ? "Already have an account? Sign in"
      : "Create an account instead";

    passwordInput.autocomplete = registering
      ? "new-password"
      : "current-password";

    passwordInput.minLength = registering ? 8 : 1;
    passwordInput.value = "";
    message.textContent = "";
  }

  function openDialog(nextMode) {
    if (!client || pending) return;

    setMode(nextMode);

    if (!dialog.open) {
      dialog.showModal();
    }

    element("authEmail").focus();
  }

  element("showSignIn").addEventListener("click", () => {
    openDialog("signin");
  });

  element("showSignUp").addEventListener("click", () => {
    openDialog("signup");
  });

  element("authSwitchMode").addEventListener("click", () => {
    if (!pending) {
      setMode(mode === "signin" ? "signup" : "signin");
    }
  });

  element("authCancel").addEventListener("click", () => {
    if (!pending) dialog.close();
  });

  dialog.addEventListener("cancel", event => {
    if (pending) event.preventDefault();
  });

  dialog.addEventListener("close", () => {
    passwordInput.value = "";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!client || pending || !form.reportValidity()) return;

    const email = element("authEmail").value.trim();
    const password = passwordInput.value;
    const registering = mode === "signup";

    pending = true;
    message.textContent = registering
      ? "Creating account…"
      : "Signing in…";
    updateButtons();

    try {
      const result = registering
        ? await client.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: config.redirectUrl
            }
          })
        : await client.auth.signInWithPassword({
            email,
            password
          });

      if (result.error) throw result.error;

      passwordInput.value = "";

      if (result.data.session) {
        renderSession(result.data.session);
        dialog.close();
      } else if (registering) {
        message.textContent =
          "Check your email for a confirmation link. " +
          "If you already have an account, use Sign in.";
      } else {
        message.textContent =
          "Sign-in did not return a session. Please try again.";
      }
    } catch (error) {
      message.textContent =
        error.message || "Unable to connect. Please try again.";
    } finally {
      pending = false;
      updateButtons();
    }
  });

  element("signOut").addEventListener("click", async () => {
    if (!client || pending) return;

    pending = true;
    updateButtons();

    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;

      renderSession(null);
    } catch (error) {
      accountStatus.textContent =
        error.message || "Sign-out failed. Please try again.";
    } finally {
      pending = false;
      updateButtons();
    }
  });

  async function initialize() {
    try {
      if (!config?.supabaseUrl || !config?.publishableKey) {
        throw new Error("Account connection settings are missing.");
      }

      if (!window.supabase?.createClient) {
        throw new Error(
          "The sign-in library could not load. Refresh to try again."
        );
      }

      client = window.supabase.createClient(
        config.supabaseUrl,
        config.publishableKey,
        {
          auth: {
            storageKey: "ieop-studio-auth",
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

      client.auth.onAuthStateChange((_event, session) => {
        renderSession(session);
      });

      // Used later when connecting authenticated compilation.
      window.IEOP_AUTH = Object.freeze({
        async getAccessToken() {
          const { data, error } = await client.auth.getSession();

          if (error) throw error;
          return data.session?.access_token || null;
        }
      });

      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      renderSession(data.session);
    } catch (error) {
      client = null;
      accountStatus.textContent =
        error.message || "Sign-in is unavailable.";
      updateButtons();
    }
  }

  initialize();
})();
