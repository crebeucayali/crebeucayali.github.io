#!/usr/bin/env python3
from pathlib import Path

ruta = Path("main.js")
texto = ruta.read_text(encoding="utf-8")

anterior_etiqueta = '      indicador.setAttribute("aria-label", `Ir a la noticia ${indice + 1}`);'
nueva_etiqueta = '      indicador.setAttribute("aria-label", `Mostrar noticia ${indice + 1} de ${noticias.length}: ${noticia.titulo}`);'

anterior_estado = '''        punto.classList.toggle("activo", indice === indiceActual);
        punto.setAttribute("aria-pressed", indice === indiceActual ? "true" : "false");'''
nuevo_estado = '''        const estaSeleccionado = indice === indiceActual;
        punto.classList.toggle("activo", estaSeleccionado);
        if (estaSeleccionado) punto.setAttribute("aria-current", "true");
        else punto.removeAttribute("aria-current");
        punto.removeAttribute("aria-pressed");'''

if texto.count(anterior_etiqueta) != 1:
    raise SystemExit("No se encontró una única etiqueta de indicador para actualizar")
if texto.count(anterior_estado) != 1:
    raise SystemExit("No se encontró un único bloque de estado de indicadores para actualizar")

texto = texto.replace(anterior_etiqueta, nueva_etiqueta, 1)
texto = texto.replace(anterior_estado, nuevo_estado, 1)

ruta.write_text(texto, encoding="utf-8", newline="\n")
