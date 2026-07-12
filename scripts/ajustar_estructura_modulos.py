#!/usr/bin/env python3
from pathlib import Path

ruta = Path("index.html")
texto = ruta.read_text(encoding="utf-8")

apertura_anterior = '''      <section aria-label="Plataformas digitales CREBE" class="tarjetas">
        <h2 style="grid-column:1/-1;margin:0 0 4px;">Módulos del Ecosistema Virtual Accesible</h2>'''

apertura_nueva = '''      <section class="modulos-eva" aria-labelledby="titulo-modulos-eva">
        <h2 id="titulo-modulos-eva" style="margin:0 0 4px;">Módulos del Ecosistema Virtual Accesible</h2>
        <div class="tarjetas">'''

cierre_anterior = '''        <a class="tarjeta repositorio destacada" href="https://crebeucayali.github.io/repositorio-accesible/" rel="noopener" target="_blank">
          <div class="numero">RA</div><h3>Repositorio Accesible</h3>
          <p>Espacio destinado a organizar y compartir recursos accesibles, materiales adaptados, textos en braille, orientaciones y apoyos complementarios para la comunidad educativa inclusiva.</p>
          <span class="boton">Ingresar al repositorio</span>
        </a>
      </section>'''

cierre_nuevo = '''        <a class="tarjeta repositorio destacada" href="https://crebeucayali.github.io/repositorio-accesible/" rel="noopener" target="_blank">
          <div class="numero">RA</div><h3>Repositorio Accesible</h3>
          <p>Espacio destinado a organizar y compartir recursos accesibles, materiales adaptados, textos en braille, orientaciones y apoyos complementarios para la comunidad educativa inclusiva.</p>
          <span class="boton">Ingresar al repositorio</span>
        </a>
        </div>
      </section>'''

for anterior, nuevo, etiqueta in [
    (apertura_anterior, apertura_nueva, "apertura del bloque de módulos"),
    (cierre_anterior, cierre_nuevo, "cierre del bloque de módulos"),
]:
    cantidad = texto.count(anterior)
    if cantidad != 1:
        raise SystemExit(f"Se esperaba una coincidencia para {etiqueta} y se encontraron {cantidad}")
    texto = texto.replace(anterior, nuevo, 1)

if texto.count('id="titulo-modulos-eva"') != 1:
    raise SystemExit("El título de módulos no quedó identificado una sola vez")
if texto.count('<div class="tarjetas">') != 1:
    raise SystemExit("La cuadrícula de módulos no quedó creada una sola vez")

ruta.write_text(texto, encoding="utf-8", newline="\n")
