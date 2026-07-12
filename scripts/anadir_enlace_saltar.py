#!/usr/bin/env python3
from pathlib import Path

index_path = Path("index.html")
css_path = Path("estilos.css")

html = index_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")

reemplazos_html = [
    (
        '<body class="theme-crebe wsite-theme-light">\n<header class="cabecera-crebe">',
        '<body class="theme-crebe wsite-theme-light">\n<a class="enlace-saltar" href="#contenido-principal">Saltar al contenido principal</a>\n<header class="cabecera-crebe">',
        "enlace de salto al inicio del cuerpo",
    ),
    (
        '<main class="portal-crebe">',
        '<main id="contenido-principal" class="portal-crebe" tabindex="-1">',
        "identificador del contenido principal",
    ),
]

for anterior, nuevo, etiqueta in reemplazos_html:
    cantidad = html.count(anterior)
    if cantidad != 1:
        raise SystemExit(f"Se esperaba una coincidencia para {etiqueta} y se encontraron {cantidad}")
    html = html.replace(anterior, nuevo, 1)

ancla_css = 'a{ color:var(--verde-700); }\n\n/* Cabecera */'
bloque_css = '''a{ color:var(--verde-700); }

.enlace-saltar{
  position:fixed;
  top:10px;
  left:10px;
  z-index:10000;
  padding:10px 14px;
  color:#ffffff;
  background:var(--azul-900);
  border:2px solid #ffffff;
  border-radius:8px;
  box-shadow:0 6px 18px rgba(16,42,67,.24);
  font-weight:700;
  text-decoration:none;
  transform:translateY(-160%);
  transition:transform .18s ease;
}

.enlace-saltar:focus,
.enlace-saltar:focus-visible{
  transform:translateY(0);
  outline:3px solid #facc15;
  outline-offset:3px;
}

/* Cabecera */'''

if css.count(ancla_css) != 1:
    raise SystemExit("No se encontró una única ubicación segura para los estilos del enlace de salto")
css = css.replace(ancla_css, bloque_css, 1)

if html.count('id="contenido-principal"') != 1:
    raise SystemExit("El contenido principal no quedó identificado una sola vez")
if html.count('href="#contenido-principal"') != 1:
    raise SystemExit("El enlace de salto no quedó incorporado una sola vez")
if css.count('.enlace-saltar{') != 1:
    raise SystemExit("Los estilos del enlace de salto no quedaron incorporados una sola vez")

index_path.write_text(html, encoding="utf-8", newline="\n")
css_path.write_text(css, encoding="utf-8", newline="\n")
