#!/usr/bin/env python3
from pathlib import Path

ruta = Path("main.js")
texto = ruta.read_text(encoding="utf-8")

bloque = '''      articulo.setAttribute("role", "group");
      articulo.setAttribute("aria-roledescription", "diapositiva");
'''

if texto.count(bloque) != 1:
    raise SystemExit("No se encontró una única declaración de rol en las noticias")

texto = texto.replace(bloque, "", 1)
ruta.write_text(texto, encoding="utf-8", newline="\n")
