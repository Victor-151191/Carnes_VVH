// =====================================================
// VERIFICAR SESIÓN ACTIVA
// =====================================================

async function verificarSesion() {

  try {

    const response = await fetch(
      "/api/admin/session",
      {
        credentials: "same-origin"
      }
    );

    if (response.ok) {

      window.location.replace(
        "/admin"
      );

    }

  } catch (error) {

    console.error(
      "Error al verificar sesión:",
      error
    );

  }

}

// =====================================================
// MENSAJES
// =====================================================

function mostrarMensaje(
  texto,
  tipo = "error"
) {

  const mensaje =
    document.getElementById(
      "loginMessage"
    );

  mensaje.textContent =
    texto;

  mensaje.className =
    `login-message ${tipo}-message`;

}

// =====================================================
// LOGIN
// =====================================================

async function iniciarSesion(
  event
) {

  event.preventDefault();

  const boton =
    document.getElementById(
      "loginButton"
    );

  const username =
    document
      .getElementById(
        "username"
      )
      .value
      .trim();

  const password =
    document
      .getElementById(
        "password"
      )
      .value;

  if (
    !username ||
    !password
  ) {

    mostrarMensaje(
      "Completa usuario y contraseña."
    );

    return;

  }

  boton.disabled = true;

  boton.textContent =
    "Validando...";

  mostrarMensaje(
    "",
    ""
  );

  try {

    const response =
      await fetch(
        "/api/admin/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          credentials:
            "same-origin",

          body:
            JSON.stringify({
              username,
              password
            })
        }
      );

    const data =
      await response
        .json()
        .catch(
          () => null
        );

    if (!response.ok) {

      mostrarMensaje(
        data?.detail ||
        "Credenciales incorrectas."
      );

      return;

    }

    mostrarMensaje(
      "Acceso correcto.",
      "success"
    );

    window.location.replace(
      "/admin"
    );

  } catch (error) {

    console.error(
      error
    );

    mostrarMensaje(
      "No fue posible conectar con el servidor."
    );

  } finally {

    boton.disabled = false;

    boton.textContent =
      "Iniciar sesión";

  }

}

// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    verificarSesion();

    document
      .getElementById(
        "loginForm"
      )
      .addEventListener(
        "submit",
        iniciarSesion
      );

  }
);