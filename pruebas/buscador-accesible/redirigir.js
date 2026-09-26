"use strict";

const destino = new URL("/buscar/", window.location.origin);
destino.search = window.location.search;
destino.hash = window.location.hash;

const enlace = document.querySelector("#enlace-destino");
if (enlace) {
  enlace.href = destino.href;
}

window.location.replace(destino.href);
