// Una partida jugada: quién, cuántos puntos, cuándo y cuánto tardó.
class Partida {
  constructor(nombre, puntos, total, fecha, segundos) {
    this.nombre = nombre;
    this.puntos = puntos;
    this.total = total;
    this.fecha = fecha;          // texto en formato ISO, por ejemplo "2026-03-15T12:00:00.000Z"
    this.segundos = segundos;
  }

  porcentaje() {
    return Math.round(this.puntos / this.total * 100);
  }

  resumen() {
    return this.nombre + ": " + this.puntos + "/" + this.total + " (" + this.porcentaje() + " %) · " +
           formatearFecha(this.fecha) + " · " + this.segundos + " s";
  }
}

function formatearFecha(textoISO) {
  const f = new Date(textoISO);
  return f.getDate() + "/" + (f.getMonth() + 1) + "/" + f.getFullYear();
}

// Las partidas se guardan en una cookie como un array en JSON.
function cargarPartidas() {
  const datos = leerCookie("partidas", []);
  // JSON solo guarda los datos: hay que reconstruir los objetos Partida para tener sus métodos
  return datos.map(d => new Partida(d.nombre, d.puntos, d.total, d.fecha, d.segundos));
}

function guardarPartida(partida) {
  const partidas = cargarPartidas();
  partidas.push(partida);
  guardarCookie("partidas", partidas.slice(-5), 30);   // solo las 5 últimas
}

function mediaPuntos(partidas) {
  if (partidas.length === 0) return 0;
  return partidas.reduce((suma, p) => suma + p.puntos, 0) / partidas.length;
}

// NUEVA FUNCIÓN: devuelve la partida con más puntos (en empate, la más rápida)
function mejorPartida(partidas) {
  if (partidas.length === 0) return null;
  return partidas.reduce((mejor, p) =>
    p.puntos > mejor.puntos || (p.puntos === mejor.puntos && p.segundos < mejor.segundos) ? p : mejor);
}
