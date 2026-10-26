// QuizDAW · lógica de la página
let usuario = null;
let preguntas = [];
let indice = 0;
let puntos = 0;
let inicio = 0;
let respondida = false;

/* ---------- Usuario y apariencia ---------- */
function pedirNombre() {
  const respuesta = prompt("¿Cómo te llamas?");
  return (respuesta || "").trim() || "invitado";
}

function aplicarTema() {
  document.body.classList.toggle("oscuro", usuario.tema === "oscuro");
}

function cambiarTema() {
  usuario.tema = usuario.tema === "oscuro" ? "claro" : "oscuro";
  guardarCookie("usuario", usuario, 30);
  aplicarTema();
}

/* ---------- Datos del navegador ---------- */
function datosDelNavegador() {
  return {
    ventana: window.innerWidth + " × " + window.innerHeight,
    idioma: navigator.language,
    pagina: document.title,
    ruta: location.pathname
  };
}

function pintarInfo() {
  const d = datosDelNavegador();
  document.getElementById("info").textContent =
    "Ventana: " + d.ventana + " · Idioma: " + d.idioma + " · Página: " + d.pagina + " · Ruta: " + d.ruta;
}

/* ---------- Preguntas al azar ---------- */
function elegirPreguntas(todas, cuantas) {
  const disponibles = [...todas];
  const elegidas = [];
  while (elegidas.length < Math.min(cuantas, todas.length)) {
    const posicion = Math.floor(Math.random() * disponibles.length);
    elegidas.push(disponibles.splice(posicion, 1)[0]);
  }
  return elegidas;
}

/* ---------- La partida ---------- */
function mostrarSeccion(id, visible) {
  document.getElementById(id).hidden = !visible;
}

function iniciarPartida() {
  preguntas = elegirPreguntas(PREGUNTAS, 5);
  indice = 0;
  puntos = 0;
  inicio = Date.now();
  mostrarSeccion("inicio", false);
  mostrarSeccion("final", false);
  mostrarSeccion("juego", true);
  mostrarPregunta();
}

function mostrarPregunta() {
  const q = preguntas[indice];
  respondida = false;
  document.title = "QuizDAW · " + (indice + 1) + "/" + preguntas.length;
  document.getElementById("textoPregunta").textContent = (indice + 1) + "/" + preguntas.length + " · " + q.pregunta;

  const contenedor = document.getElementById("opciones");
  contenedor.innerHTML = "";
  q.opciones.forEach((texto, i) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "opcion";
    boton.textContent = texto;
    boton.dataset.i = i;
    contenedor.appendChild(boton);
  });

  document.getElementById("feedback").textContent = "";
  document.getElementById("btnSiguiente").hidden = true;
  document.getElementById("marcador").textContent = "Puntos: " + puntos;
}

function manejarOpcion(evento) {
  const dato = evento.target.dataset.i;
  if (dato === undefined || respondida) return;
  responder(Number(dato));   // dataset siempre es texto
}

function responder(i) {
  respondida = true;
  const q = preguntas[indice];
  const botones = document.getElementById("opciones").children;
  const acierto = i === q.correcta;
  if (acierto) puntos++;

  botones[q.correcta].className = "opcion ok";
  if (!acierto) botones[i].className = "opcion mal";
  document.getElementById("feedback").textContent =
    acierto ? "¡Correcto!" : "Incorrecto. La respuesta era: " + q.opciones[q.correcta];
  document.getElementById("marcador").textContent = "Puntos: " + puntos;

  const siguiente = document.getElementById("btnSiguiente");
  siguiente.textContent = indice === preguntas.length - 1 ? "Ver resultado" : "Siguiente";
  siguiente.hidden = false;
}

function siguiente() {
  indice++;
  if (indice < preguntas.length) mostrarPregunta();
  else terminar();
}

function terminar() {
  const segundos = Math.round((Date.now() - inicio) / 1000);
  const partida = new Partida(usuario.nombre, puntos, preguntas.length, new Date().toISOString(), segundos);
  guardarPartida(partida);

  mostrarSeccion("juego", false);
  mostrarSeccion("final", true);
  document.title = "QuizDAW";
  document.getElementById("textoFinal").textContent = partida.resumen();
  document.getElementById("nuevoRecord").textContent = comprobarRecord(partida) ? "🎉 ¡Nuevo récord!" : "";
  if (!document.getElementById("record").hidden) pintarRecord();
  pintarPartidas();
}

/* ---------- Lista de partidas y ventana de resultados ---------- */
function pintarPartidas() {
  const partidas = cargarPartidas();
  const lista = document.getElementById("listaPartidas");
  lista.innerHTML = "";
  for (const p of partidas) {
    const li = document.createElement("li");
    li.textContent = p.resumen();
    lista.appendChild(li);
  }
  document.getElementById("media").textContent =
    partidas.length > 0 ? "Media: " + mediaPuntos(partidas).toFixed(1) + " puntos" : "Aún no hay partidas.";
}

/* ---------- NUEVA FUNCIÓN: récord personal ---------- */
// El récord se guarda en su propia cookie (quiz_record) como JSON,
// así no se pierde aunque la partida deje de estar entre las 5 últimas.
function cargarRecord() {
  const d = leerCookie("record", null);
  return d ? new Partida(d.nombre, d.puntos, d.total, d.fecha, d.segundos) : null;
}

// Devuelve true si la partida supera el récord guardado (y lo guarda)
function comprobarRecord(partida) {
  const actual = cargarRecord();
  const mejor = actual ? mejorPartida([actual, partida]) : partida;
  if (mejor !== partida) return false;
  guardarCookie("record", partida, 30);
  return true;
}

// Escribe el récord con etiquetas creadas desde código
function pintarRecord() {
  const r = cargarRecord();
  const caja = document.getElementById("record");
  caja.innerHTML = "";
  const titulo = document.createElement("h2");
  titulo.textContent = "🏆 Tu récord";
  caja.appendChild(titulo);

  if (r === null) {
    const p = document.createElement("p");
    p.textContent = "Aún no tienes récord. ¡Juega una partida!";
    caja.appendChild(p);
    return;
  }
  const datos = [                                  // array de objetos
    { etiqueta: "Jugador", valor: r.nombre },
    { etiqueta: "Puntos", valor: r.puntos + "/" + r.total },
    { etiqueta: "Acierto", valor: r.porcentaje() + " %" },
    { etiqueta: "Tiempo", valor: r.segundos + " s" },
    { etiqueta: "Fecha", valor: formatearFecha(r.fecha) }
  ];
  const lista = document.createElement("ul");
  for (const d of datos) {
    const li = document.createElement("li");
    const fuerte = document.createElement("strong");
    fuerte.textContent = d.etiqueta + ": ";
    li.appendChild(fuerte);
    li.appendChild(document.createTextNode(d.valor));
    lista.appendChild(li);
  }
  caja.appendChild(lista);
}

function alternarRecord() {
  const caja = document.getElementById("record");
  if (caja.hidden) pintarRecord();
  caja.hidden = !caja.hidden;
  document.getElementById("btnRecord").textContent = caja.hidden ? "Ver récord" : "Ocultar récord";
}

function abrirResultados() {
  window.open("resultados.html", "resultados", "popup=yes,width=520,height=460");
}

function manejarBorrar() {
  if (confirm("¿Borrar todos tus datos del quiz?")) {
    borrarCookie("usuario");
    borrarCookie("partidas");
    borrarCookie("record");
    document.getElementById("record").hidden = true;
    pintarPartidas();
    document.getElementById("saludo").textContent = "Datos borrados. Recarga la página.";
  }
}

/* ---------- Arranque ---------- */
function iniciar() {
  usuario = leerCookie("usuario", null);
  if (usuario === null) {
    usuario = { nombre: pedirNombre(), tema: "claro" };
    guardarCookie("usuario", usuario, 30);
  }
  document.getElementById("saludo").textContent = "Hola, " + usuario.nombre;
  aplicarTema();
  pintarPartidas();
  pintarInfo();

  document.getElementById("btnEmpezar").addEventListener("click", iniciarPartida);
  document.getElementById("btnOtra").addEventListener("click", iniciarPartida);
  document.getElementById("btnSiguiente").addEventListener("click", siguiente);
  document.getElementById("opciones").addEventListener("click", manejarOpcion);
  document.getElementById("btnTema").addEventListener("click", cambiarTema);
  document.getElementById("btnResultados").addEventListener("click", abrirResultados);
  document.getElementById("btnBorrar").addEventListener("click", manejarBorrar);
  document.getElementById("btnRecord").addEventListener("click", alternarRecord);
}
document.addEventListener("DOMContentLoaded", iniciar);
