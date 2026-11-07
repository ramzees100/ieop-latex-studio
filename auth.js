"use strict";

(() => {
  const element = id => document.getElementById(id);
  const config = window.IEOP_AUTH_CONFIG;
  const dialog = element("authDialog");
  const form = element("authForm");
  const message = element("authMessage");
  const accountStatus = element("accountStatus");
  const emailInput = element("authEmail");
  const passwordInput = element("authPassword");
  const passwordHint = element("passwordHint");
  const forgotButton = element("forgotPassword");
  const passwordRow = passwordInput.closest("p");
  const emailRow = emailInput.closest("p");

  let client;
  let mode = "signin";
  let pending = false;
  let signedIn = false;
  let recoveryReady = false;

  // Remove the temporary "being connected" note from index.html.
  const temporaryNote = forgotButton.parentElement.querySelector("small");
  if (temporaryNote) temporaryNote.remove();
  forgotButton.removeAttribute("title");

  function show(node, visible) {
    node.hidden = !visible;
    node.style.display = visible ? "" : "none";
  }

  function updateButtons() {
    show(element("showSignIn"), !signedIn || recoveryReady);
    show(element("showSignUp"), !signedIn && !recoveryReady);
    show(element("signOut"), signedIn);

    element("showSignIn").textContent = recoveryReady
      ? "Set new password"
      : "Sign in";

    [
      "showSignIn",
      "showSignUp",
      "signOut",
      "authSubmit",
      "authSwitchMode",
      "forgotPassword"
    ].forEach(id => {
      element(id).disabled = pending || !client;
    });

    emailInput.disabled = pending || mode === "update";
    emailInput.required = mode !== "update";

    passwordInput.disabled = pending || mode === "reset";
    passwordInput.required = mode !== "reset";

    element("authCancel").disabled = pending;
  }

  function renderSession(session) {
    signedIn = Boolean(session?.user);

    accountStatus.textContent = signedIn
      ? `Signed in as ${session.user.email || "your account"}. Projects remain in this browser.`
      : "Not signed in. Projects remain in this browser.";

    updateButtons();
  }

  function setMode(nextMode) {
    mode = nextMode;
    passwordInput.value = "";
    passwordInput.setCustomValidity("");
    message.textContent = "";

    const titles = {
      signin: "Sign in",
      signup: "Create account",
      reset: "Reset your password",
      update: "Choose a new password"
    };

    const submitLabels = {
      signin: "Sign in",
      signup: "Create account",
      reset: "Send reset email",
      update: "Save new password"
    };

    element("authDialogTitle").textContent = titles[mode];
    element("authSubmit").textContent = submitLabels[mode];

    element("authSwitchMode").textContent =
      mode === "signin"
        ? "Create an account instead"
        : "Back to sign in";

    show(emailRow, mode !== "update");
    show(passwordRow, mode !== "reset");
    show(forgotButton.parentElement, mode === "signin");
    show(element("authSwitchMode"), mode !== "update");

    const choosingPassword = mode === "signup" || mode === "update";

    passwordInput.autocomplete = choosingPassword
      ? "new-password"
      : "current-password";

    passwordInput.minLength = choosingPassword ? 8 : 1;

    const label = form.querySelector('label[for="authPassword"]');
    label.textContent = mode === "update" ? "New password" : "Password";

    if (passwordHint) {
      passwordHint.textContent = "Use at least 8 characters.";
      show(passwordHint, choosingPassword);
      if (choosingPassword) passwordHint.style.display = "block";
    }

    updateButtons();
  }

  function openDialog(nextMode) {
    if (!client || pending) return;

    setMode(recoveryReady ? "update" : nextMode);

    if (!dialog.open) dialog.showModal();

    if (mode === "update") {
      passwordInput.focus();
    } else {
      emailInput.focus();
    }
  }

  function readableError(error) {
    if (/failed to fetch|network/i.test(error?.message || "")) {
      return "Could not reach the sign-in service. Check your connection and try again.";
    }

    return error?.message || "Something went wrong. Please try again.";
  }

  element("showSignIn").addEventListener("click", () => {
    openDialog("signin");
  });

  element("showSignUp").addEventListener("click", () => {
    openDialog("signup");
  });

  element("authSwitchMode").addEventListener("click", () => {
    if (pending) return;
    setMode(mode === "signin" ? "signup" : "signin");
  });

  forgotButton.addEventListener("click", () => {
    if (!client || pending) return;

    setMode("reset");
    message.textContent =
      "Enter your account email. We’ll send a link to choose a new password.";
    emailInput.focus();
  });

  element("authCancel").addEventListener("click", () => {
    if (!pending) dialog.close();
  });

  dialog.addEventListener("cancel", event => {
    if (pending) event.preventDefault();
  });

  dialog.addEventListener("close", () => {
    passwordInput.value = "";
    passwordInput.setCustomValidity("");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!client || pending || !form.reportValidity()) return;

    const submittedMode = mode;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (
      (submittedMode === "signup" || submittedMode === "update") &&
      password.length < 8
    ) {
      message.textContent = "Use a password with at least 8 characters.";
      passwordInput.focus();
      return;
    }

    pending = true;
    message.textContent = "Please wait…";
    updateButtons();

    try {
      if (submittedMode === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: config.redirectUrl
        });

        if (error) throw error;

        message.textContent =
          "If an account exists for this email, you’ll receive a reset link. " +
          "Check your inbox and spam folder.";
        return;
      }

      if (submittedMode === "update") {
        if (!recoveryReady) {
          throw new Error(
            "Open a fresh password-reset link from your email first."
          );
        }

        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;

        recoveryReady = false;
        passwordInput.value = "";
        dialog.close();
        accountStatus.textContent =
          "Password updated successfully. Projects remain in this browser.";
        return;
      }

      const result = submittedMode === "signup"
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
      } else if (submittedMode === "signup") {
        message.textContent =
          "Check your email for a confirmation link. " +
          "If you already have an account, use Sign in.";
      } else {
        message.textContent =
          "No sign-in session was returned. Please try again.";
      }
    } catch (error) {
      message.textContent = readableError(error);
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

      recoveryReady = false;
      passwordInput.value = "";
      if (dialog.open) dialog.close();
      renderSession(null);
    } catch (error) {
      accountStatus.textContent = readableError(error);
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
            detectSessionInUrl: true,
            flowType: "implicit"
          }
        }
      );

      client.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") recoveryReady = false;
        renderSession(session);

        if (event === "PASSWORD_RECOVERY" && session) {
          recoveryReady = true;

          // Open the form after the authentication callback finishes.
          setTimeout(() => {
            if (!recoveryReady) return;
            pending = false;
            openDialog("update");
            message.textContent =
              "Enter a new password with at least 8 characters.";
          }, 0);
        }
      });

      // Prepared for the later compiler integration.
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

      const fragment = new URLSearchParams(location.hash.slice(1));
      if (fragment.has("error_description")) {
        accountStatus.textContent =
          "The email link could not be used. Request a new link and try again.";
      }
    } catch (error) {
      client = null;
      accountStatus.textContent = readableError(error);
      updateButtons();
    }
  }

  initialize();
})();
