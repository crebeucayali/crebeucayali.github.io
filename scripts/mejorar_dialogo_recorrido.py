#!/usr/bin/env python3
from pathlib import Path

ruta = Path("main.js")
texto = ruta.read_text(encoding="utf-8")

reemplazos = [
    (
        '    panel.setAttribute("aria-labelledby", "guia-titulo");',
        '    panel.setAttribute("aria-labelledby", "guia-titulo");\n    panel.setAttribute("aria-describedby", "guia-texto");',
        "descripción accesible del diálogo",
    ),
    (
        '  let ultimoFoco = null;\n',
        '  let ultimoFoco = null;\n\n  const regionesFondo = () => [\n    document.querySelector("header"),\n    document.querySelector("main"),\n    document.querySelector("footer")\n  ].filter(Boolean);\n',
        "regiones de fondo",
    ),
    (
        '''    document.body.classList.add("guia-activa");\n    overlay.hidden = false;''',
        '''    document.body.classList.add("guia-activa");\n    regionesFondo().forEach((region) => region.setAttribute("inert", ""));\n    overlay.hidden = false;''',
        "bloqueo del fondo al abrir",
    ),
    (
        '''    document.body.classList.remove("guia-activa");\n    if (overlay) overlay.hidden = true;''',
        '''    document.body.classList.remove("guia-activa");\n    regionesFondo().forEach((region) => region.removeAttribute("inert"));\n    if (overlay) overlay.hidden = true;''',
        "restauración del fondo al cerrar",
    ),
    (
        '''  document.addEventListener("keydown", (evento) => {\n    if (!panel || panel.hidden) return;\n    if (evento.key === "Escape") cerrarGuia();\n    if (evento.key === "ArrowRight") avanzarGuia();\n    if (evento.key === "ArrowLeft") retrocederGuia();\n  });''',
        '''  document.addEventListener("keydown", (evento) => {\n    if (!panel || panel.hidden) return;\n\n    if (evento.key === "Tab") {\n      const controles = Array.from(panel.querySelectorAll('button:not([disabled])'));\n      if (!controles.length) return;\n      const primero = controles[0];\n      const ultimo = controles[controles.length - 1];\n\n      if (evento.shiftKey && document.activeElement === primero) {\n        evento.preventDefault();\n        ultimo.focus();\n      } else if (!evento.shiftKey && document.activeElement === ultimo) {\n        evento.preventDefault();\n        primero.focus();\n      }\n      return;\n    }\n\n    if (evento.key === "Escape") cerrarGuia();\n    if (evento.key === "ArrowRight") avanzarGuia();\n    if (evento.key === "ArrowLeft") retrocederGuia();\n  });''',
        "contención del foco",
    ),
]

for anterior, nuevo, etiqueta in reemplazos:
    cantidad = texto.count(anterior)
    if cantidad != 1:
        raise SystemExit(f"Se esperaba una coincidencia para {etiqueta} y se encontraron {cantidad}")
    texto = texto.replace(anterior, nuevo, 1)

ruta.write_text(texto, encoding="utf-8", newline="\n")
