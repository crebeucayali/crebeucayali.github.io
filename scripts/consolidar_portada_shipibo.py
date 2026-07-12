#!/usr/bin/env python3
"""Consolida únicamente las reglas CSS de la portada Shipibo.

Mantiene los valores visuales finales ya vigentes y elimina las definiciones
anteriores que quedaron anuladas por la cascada. El proceso se detiene si la
estructura esperada de estilos.css cambió, para evitar una modificación amplia
o accidental.
"""

from pathlib import Path

CSS_PATH = Path(__file__).resolve().parents[1] / "estilos.css"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"Consolidación cancelada: se esperó 1 coincidencia para {label} y se encontraron {count}."
        )
    return text.replace(old, new, 1)


def remove_between(text: str, start_marker: str, end_marker: str, label: str) -> str:
    start = text.find(start_marker)
    if start == -1:
        raise SystemExit(f"Consolidación cancelada: no se encontró el inicio de {label}.")
    end = text.find(end_marker, start)
    if end == -1:
        raise SystemExit(f"Consolidación cancelada: no se encontró el final de {label}.")
    return text[:start] + text[end:]


def main() -> int:
    original = CSS_PATH.read_text(encoding="utf-8")
    css = original

    old_hero = '''.hero{
  width:calc(100% - 36px);
  max-width:var(--ancho-principal);
  min-height:390px;
  display:block;
  margin:0 auto;
  background:
    radial-gradient(circle at 86% 66%,rgba(255,255,255,.11) 0 22%,transparent 23%),
    radial-gradient(circle at 88% 72%,rgba(255,255,255,.08) 0 36%,transparent 37%),
    linear-gradient(135deg,#0b3550 0%,#0f4f57 48%,#0f766e 100%);
  color:var(--blanco);
  padding:42px 48px 116px;
  overflow:hidden;
  position:relative;
  border-radius:30px;
  box-shadow:0 18px 42px rgba(16,42,67,.18);
}'''

    new_hero = '''.hero{
  width:calc(100% - 36px);
  max-width:var(--ancho-principal);
  min-height:390px;
  display:block;
  margin:0 auto;
  background:#4f9494 !important;
  color:var(--blanco);
  padding:42px 48px 116px;
  overflow:hidden;
  position:relative;
  border-radius:30px;
  box-shadow:0 18px 42px rgba(16,42,67,.18);
}'''
    css = replace_once(css, old_hero, new_hero, "el bloque base .hero")

    old_after = '''.hero::after{
  content:"";
  position:absolute;
  right:-130px;
  top:-78px;
  width:470px;
  height:470px;
  border-radius:50%;
  border:78px solid rgba(255,255,255,.08);
}'''

    new_after = '''.hero::after{
  display:none !important;
}

.hero .patron-portada{
  position:absolute !important;
  inset:0 !important;
  z-index:0 !important;
  pointer-events:none !important;
  background-image:
    linear-gradient(
      90deg,
      rgba(42,91,100,.78) 0%,
      rgba(63,124,128,.76) 48%,
      rgba(85,154,150,.72) 100%
    ),
    url("patron-shipibo.webp?v=verde-azulado-2") !important;
  background-repeat:no-repeat,repeat !important;
  background-size:cover,320px auto !important;
  background-position:center,center !important;
  background-blend-mode:normal,normal !important;
  opacity:1 !important;
  filter:contrast(1.08) saturate(.94) brightness(.82) !important;
}'''
    css = replace_once(css, old_after, new_after, "el pseudoelemento decorativo de .hero")

    old_content = '''.hero-contenido{
  width:100%;
  max-width:var(--ancho-principal);
  margin:0 auto;
  position:relative;
  z-index:1;
}'''

    new_content = '''.hero .hero-contenido{
  width:100%;
  max-width:var(--ancho-principal);
  margin:0 auto;
  position:relative !important;
  z-index:2 !important;
}'''
    css = replace_once(css, old_content, new_content, "el contenido de la portada")

    old_block = '''.bloque-institucional{
  display:flex;
  align-items:center;
  gap:24px;
  margin-bottom:34px;
}'''

    new_block = '''.bloque-institucional{
  display:flex;
  align-items:center;
  gap:24px;
  margin-bottom:34px;
}

.hero .bloque-institucional{
  display:none !important;
}'''
    css = replace_once(css, old_block, new_block, "la visibilidad del bloque institucional")

    old_label = '''.etiqueta{
  margin:0 0 16px;
  color:#c9f7ee;
  font-size:.90rem;
  font-weight:900;
  letter-spacing:.18em;
  text-transform:uppercase;
}'''

    new_label = '''.etiqueta{
  margin:0 0 16px;
  color:#c9f7ee;
  font-size:.90rem;
  font-weight:900;
  letter-spacing:.18em;
  text-transform:uppercase;
}

.hero .etiqueta{
  margin-top:0 !important;
}'''
    css = replace_once(css, old_label, new_label, "la etiqueta de la portada")

    old_mobile_after = '''  .hero::after{
    right:-210px;
    top:-120px;
  }

'''
    css = replace_once(css, old_mobile_after, "", "el ajuste móvil del pseudoelemento eliminado")

    css = remove_between(
        css,
        "/* Corrección de fondo decorativo Shipibo en portada Weebly */",
        "/* ==========================================================\n   Ajuste Netlify: módulos a ancho completo y acceso administrativo compacto",
        "la primera corrección histórica del patrón Shipibo",
    )

    css = remove_between(
        css,
        "/* ==========================================================\n   Ajuste solicitado: tono y escala del patrón Shipibo según referencia",
        "/* ==========================================================\n   AJUSTES SOLICITADOS: cabecera, tarjetas FV y footer",
        "las dos redefiniciones finales duplicadas de la portada",
    )

    checks = {
        ".hero .patron-portada{": 1,
        ".hero::after{": 1,
        ".hero .hero-contenido{": 1,
        ".hero .bloque-institucional{": 1,
        ".hero .etiqueta{": 1,
        'url("patron-shipibo.webp?v=verde-azulado-2")': 1,
        "background:#4f9494 !important;": 1,
    }
    for token, expected in checks.items():
        count = css.count(token)
        if count != expected:
            raise SystemExit(
                f"Consolidación cancelada: {token!r} aparece {count} veces; se esperaba {expected}."
            )

    forbidden = (
        "Corrección de fondo decorativo Shipibo en portada Weebly",
        "Ajuste solicitado: tono y escala del patrón Shipibo según referencia",
        "AJUSTE FINAL: patrón Shipibo con tono verde azulado",
        "radial-gradient(circle at 86% 66%",
    )
    for token in forbidden:
        if token in css:
            raise SystemExit(f"Consolidación cancelada: permaneció una regla histórica: {token}")

    if css == original:
        raise SystemExit("Consolidación cancelada: no se produjeron cambios.")

    CSS_PATH.write_text(css.rstrip() + "\n", encoding="utf-8", newline="\n")
    print("Portada Shipibo consolidada sin modificar sus valores visuales finales.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
