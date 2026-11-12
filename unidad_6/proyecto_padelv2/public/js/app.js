import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword, // autenticación con correo y contraseña
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


const estado = document.getElementById("estado");
const acceso = document.getElementById("acceso");
const panel = document.getElementById("panel");

const formulario = document.getElementById("form-acceso");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const usuarioEmail = document.getElementById("usuario-email");

const btnIngresar = document.getElementById("btn-ingresar");
const btnRegistrar = document.getElementById("btn-registrar");
const btnSalir = document.getElementById("btn-salir");

function cambiarEstadoBotones(procesando) {
  btnIngresar.disabled = procesando;
  btnRegistrar.disabled = procesando;
  btnSalir.disabled = procesando;
}

function mostrarError(error) {
  const mensajes = {
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/missing-password": "Ingresá una contraseña.",
    "auth/weak-password":
      "La contraseña no cumple los requisitos de seguridad del proyecto.",
    "auth/password-does-not-meet-requirements":
      "La contraseña no cumple la política configurada.",
    "auth/email-already-in-use":
      "No se pudo crear la cuenta con ese correo. Probá iniciar sesión.",
    "auth/invalid-credential":
      "No se pudo iniciar sesión. Revisá el correo y la contraseña.",
    "auth/user-not-found":
      "No se pudo iniciar sesión. Revisá el correo y la contraseña.",
    "auth/wrong-password":
      "No se pudo iniciar sesión. Revisá el correo y la contraseña.",
    "auth/operation-not-allowed":
      "El acceso con correo y contraseña no está habilitado.",
    "auth/network-request-failed":
      "No se pudo conectar. Revisá tu conexión a Internet.",
    "auth/too-many-requests":
      "Se realizaron demasiados intentos. Probá nuevamente más tarde."
  };

  estado.textContent =
    mensajes[error.code] ??
    "No se pudo completar la operación. Revisá la consola.";

  console.error("Error de autenticación:", error.code);
}

async function autenticar(tipo) {
  if (!formulario.reportValidity()) {
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  cambiarEstadoBotones(true);
  estado.textContent = "Procesando…";

  try {
    if (tipo === "registro") {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }

    formulario.reset();
  } catch (error) {
    mostrarError(error);
  } finally {
    cambiarEstadoBotones(false);
  }
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  autenticar("ingreso");
});

btnRegistrar.addEventListener("click", () => {
  autenticar("registro");
});

btnSalir.addEventListener("click", async () => {
  cambiarEstadoBotones(true);

  try {
    await signOut(auth);
  } catch (error) {
    mostrarError(error);
  } finally {
    cambiarEstadoBotones(false);
  }
});

const tablaJugadores = document.getElementById("tabla-jugadores");
const estadoListado = document.getElementById("estado-listado");

let cancelarEscuchaJugadores = null;

function detenerListadoJugadores() {
  if (cancelarEscuchaJugadores) {
    cancelarEscuchaJugadores();
    cancelarEscuchaJugadores = null;
  }

  tablaJugadores.replaceChildren();
  estadoListado.textContent = "";
}

function escucharJugadores(usuarioId) {
  detenerListadoJugadores();

  estadoListado.textContent = "Cargando jugadores…";

  const consulta = query(
    collection(db, "jugadores"),
    where("propietarioId", "==", usuarioId)
  );

  cancelarEscuchaJugadores = onSnapshot(
    consulta,
    (snapshot) => {
      tablaJugadores.replaceChildren();

      if (snapshot.empty) {
        estadoListado.textContent =
          "Todavía no registraste jugadores.";
        return;
      }

      const jugadores = snapshot.docs.map((documento) => ({
        ...documento.data(),
        id: documento.id
      }));

      jugadores.sort((a, b) => {
        const comparacionApellido =
          a.apellido.localeCompare(b.apellido, "es");

        return comparacionApellido ||
          a.nombre.localeCompare(b.nombre, "es");
      });

      const fragmento = document.createDocumentFragment();

      for (const jugador of jugadores) {
        const fila = document.createElement("tr");

        for (const valor of [
          jugador.nombre,
          jugador.apellido,
          jugador.lado
        ]) {
          const celda = document.createElement("td");

          celda.textContent = valor;
          fila.appendChild(celda);
        }

        // Botones de acción
        const celdaAcciones = document.createElement("td");

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.textContent = "Editar";

        botonEditar.addEventListener("click", () => {
          editarJugador(jugador);
        });

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", () => {
          eliminarJugador(jugador);
        });

        celdaAcciones.append(
          botonEditar,
          document.createTextNode(" "),
          botonEliminar
        );

        fila.appendChild(celdaAcciones);

        fragmento.appendChild(fila);
      }

      tablaJugadores.appendChild(fragmento);

      estadoListado.textContent =
        `Jugadores registrados: ${jugadores.length}`;
    },
    (error) => {
      tablaJugadores.replaceChildren();

      console.error("Error al listar jugadores:", error.code);

      estadoListado.textContent =
        error.code === "permission-denied"
          ? "No tenés permiso para consultar los jugadores. Revisá las reglas."
          : "No se pudo cargar el listado. Revisá la consola.";
    }
  );
}


// Escucha cambios en el estado de autenticación
onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    acceso.hidden = true;
    panel.hidden = false;

    usuarioEmail.textContent = usuario.email ?? "";
    estado.textContent = "Sesión iniciada correctamente.";

    escucharJugadores(usuario.uid);
  } else {
    detenerListadoJugadores();

    acceso.hidden = false;
    panel.hidden = true;

    usuarioEmail.textContent = "";
    estado.textContent = "Ingresá o creá una cuenta para continuar.";

    reiniciarFormularioJugador();
    mensajeJugador.textContent = "";
  }
});

// Función para agregar un documento a Firestore
const formJugador = document.getElementById("form-jugador");
const nombreInput = document.getElementById("nombre");
const apellidoInput = document.getElementById("apellido");
const ladoInput = document.getElementById("lado");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btn-cancelar");
const mensajeJugador = document.getElementById("mensaje-jugador");

let jugadorEnEdicionId = null;
let operacionEnCurso = false;

function reiniciarFormularioJugador() {
  formJugador.reset();
  jugadorEnEdicionId = null;

  btnGuardar.textContent = "Guardar jugador";
  btnCancelar.hidden = true;
}

function cambiarEstadoFormulario(procesando) {
  operacionEnCurso = procesando;

  nombreInput.disabled = procesando;
  apellidoInput.disabled = procesando;
  ladoInput.disabled = procesando;
  btnGuardar.disabled = procesando;
  btnCancelar.disabled = procesando;
}

function editarJugador(jugador) {
  if (operacionEnCurso || !auth.currentUser) {
    return;
  }

  jugadorEnEdicionId = jugador.id;

  nombreInput.value = jugador.nombre;
  apellidoInput.value = jugador.apellido;
  ladoInput.value = jugador.lado;

  btnGuardar.textContent = "Guardar cambios";
  btnCancelar.hidden = false;

  mensajeJugador.textContent =
    `Editando a ${jugador.nombre} ${jugador.apellido}.`;

  nombreInput.focus();
}

btnCancelar.addEventListener("click", () => {
  reiniciarFormularioJugador();
  mensajeJugador.textContent = "Edición cancelada.";
});

formJugador.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (operacionEnCurso) {
    return;
  }

  const usuario = auth.currentUser;

  if (!usuario) {
    mensajeJugador.textContent =
      "Debés iniciar sesión para continuar.";
    return;
  }

  const nombre = nombreInput.value.trim();
  const apellido = apellidoInput.value.trim();
  const lado = ladoInput.value;

  if (
    !nombre ||
    !apellido ||
    nombre.length > 80 ||
    apellido.length > 80 ||
    !["Drive", "Revés"].includes(lado)
  ) {
    mensajeJugador.textContent =
      "Completá nombre y apellido de hasta 80 caracteres, y seleccioná un lado.";
    return;
  }

  const idAEditar = jugadorEnEdicionId;

  cambiarEstadoFormulario(true);
  mensajeJugador.textContent = "Guardando…";

  try {
    if (idAEditar) {
      await updateDoc(doc(db, "jugadores", idAEditar), {
        nombre,
        apellido,
        lado
      });
    } else {
      await addDoc(collection(db, "jugadores"), {
        nombre,
        apellido,
        lado,
        propietarioId: usuario.uid,
        creadoEn: serverTimestamp()
      });
    }

    if (auth.currentUser?.uid === usuario.uid) {
      reiniciarFormularioJugador();

      mensajeJugador.textContent = idAEditar
        ? "Jugador actualizado correctamente."
        : "Jugador guardado correctamente.";
    }
  } catch (error) {
    console.error("Error al guardar jugador:", error.code);

    if (auth.currentUser?.uid === usuario.uid) {
      mensajeJugador.textContent =
        error.code === "permission-denied"
          ? "No tenés permiso para realizar esta operación."
          : error.code === "not-found"
            ? "El jugador ya no existe. Cancelá la edición y revisá el listado."
            : "No se pudo guardar. Revisá la conexión y la consola.";
    }
  } finally {
    cambiarEstadoFormulario(false);
  }
});

async function eliminarJugador(jugador) {
  if (operacionEnCurso) {
    return;
  }

  const usuario = auth.currentUser;

  if (!usuario) {
    return;
  }

  const confirmado = window.confirm(
    `¿Eliminar a ${jugador.nombre} ${jugador.apellido}? Esta acción no se puede deshacer.`
  );

  if (!confirmado) {
    return;
  }

  cambiarEstadoFormulario(true);
  mensajeJugador.textContent = "Eliminando jugador…";

  try {
    await deleteDoc(doc(db, "jugadores", jugador.id));

    if (auth.currentUser?.uid === usuario.uid) {
      if (jugadorEnEdicionId === jugador.id) {
        reiniciarFormularioJugador();
      }

      mensajeJugador.textContent =
        "Jugador eliminado correctamente.";
    }
  } catch (error) {
    console.error("Error al eliminar jugador:", error.code);

    if (auth.currentUser?.uid === usuario.uid) {
      mensajeJugador.textContent =
        error.code === "permission-denied"
          ? "No tenés permiso para eliminar este jugador."
          : "No se pudo eliminar el jugador. Revisá la consola.";
    }
  } finally {
    cambiarEstadoFormulario(false);
  }
}