#!/usr/bin/env python3
"""Consolida anchos generales y cuadrículas sin alterar los valores efectivos.

El script usa reemplazos exactos y se detiene ante cualquier diferencia inesperada.
Solo modifica estilos.css. No cambia HTML, JavaScript, imágenes ni contenidos.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_PATH = ROOT / "estilos.css"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: se esperaba 1 coincidencia y se encontraron {count}")
    return text.replace(old, new, 1)


def remove_between(text: str, start_marker: str, end_marker: str, label: str) -> str:
    start_count = text.count(start_marker)
    end_count = text.count(end_marker)
    if start_count != 1 or end_count != 1:
        raise RuntimeError(
            f"{label}: marcadores inesperados (inicio={start_count}, fin={end_count})"
        )
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + text[end:]


def replace_in_region(
    text: str,
    start_marker: str,
    end_marker: str,
    old: str,
    new: str,
    label: str,
) -> str:
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    region = text[start:end]
    updated = replace_once(region, old, new, label)
    return text[:start] + updated + text[end:]


def validate_css_braces(text: str) -> None:
    depth = 0
    quote: str | None = None
    i = 0
    while i < len(text):
        char = text[i]
        if quote:
            if char == "\\":
                i += 2
                continue
            if char == quote:
                quote = None
            i += 1
            continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            if end == -1:
                raise RuntimeError("Comentario CSS sin cierre")
            i = end + 2
            continue
        if char in {'"', "'"}:
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth < 0:
                raise RuntimeError("Llave CSS de cierre sin apertura")
        i += 1
    if depth != 0:
        raise RuntimeError(f"Llaves CSS desbalanceadas: profundidad final {depth}")


def main() -> None:
    text = CSS_PATH.read_text(encoding="utf-8")
    original = text

    # 1. Variable única del ancho efectivo vigente.
    text = replace_once(
        text,
        ":root{\n  --ancho-principal:1360px;",
        ":root{\n  --ancho-principal:1360px;\n  --ancho-cuerpo-crebe:1120px;",
        "variable de ancho",
    )

    # 2. Mantener en la definición base el overflow efectivo actual.
    text = replace_once(
        text,
        "  line-height:1.6;\n  overflow-x:hidden;\n}",
        "  line-height:1.6;\n  overflow-x:hidden !important;\n}",
        "overflow del cuerpo",
    )

    # 3. Portada: trasladar el ancho final al bloque principal.
    text = replace_once(
        text,
        ".hero{\n  width:calc(100% - 36px);\n  max-width:var(--ancho-principal);\n  min-height:390px;\n  display:block;\n  margin:0 auto;",
        ".hero{\n  width:min(var(--ancho-cuerpo-crebe), calc(100% - 36px)) !important;\n  max-width:var(--ancho-cuerpo-crebe) !important;\n  min-height:390px;\n  display:block;\n  margin:0 auto;\n  margin-left:auto !important;\n  margin-right:auto !important;",
        "ancho base de la portada",
    )

    # 4. Presentación: ancho y centrado efectivos.
    text = replace_once(
        text,
        ".bloque-presentacion{\n  width:100%;\n  display:grid;",
        ".bloque-presentacion{\n  width:min(var(--ancho-cuerpo-crebe), calc(100% - 36px)) !important;\n  max-width:var(--ancho-cuerpo-crebe) !important;\n  margin-left:auto !important;\n  margin-right:auto !important;\n  display:grid;",
        "ancho del bloque de presentación",
    )

    # 5. Cuerpo y cuadrícula de módulos: una sola configuración efectiva.
    old_layout = """.cuerpo-operativo{
  width:100%;
  display:grid;
  grid-template-columns:minmax(0,1fr) 300px;
  gap:24px;
  align-items:start;
}

.tarjetas{
  width:100%;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:22px;
  align-items:stretch;
}
"""
    new_layout = """.cuerpo-operativo{
  width:min(var(--ancho-cuerpo-crebe), calc(100% - 36px)) !important;
  max-width:var(--ancho-cuerpo-crebe) !important;
  min-width:0 !important;
  display:grid !important;
  grid-template-columns:1fr !important;
  gap:28px !important;
  align-items:start !important;
  margin-left:auto !important;
  margin-right:auto !important;
}

.tarjetas{
  width:100% !important;
  max-width:100% !important;
  min-width:0 !important;
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  gap:22px !important;
  align-items:stretch !important;
}

.tarjeta-acceso,
.linea-item,
.noticia-tarjeta,
.impacto-tarjeta{
  min-width:0 !important;
}

@media (max-width:980px){
  .tarjetas{
    grid-template-columns:repeat(2,minmax(0,1fr)) !important;
  }
}

@media (max-width:680px){
  .hero,
  .bloque-presentacion,
  .cuerpo-operativo{
    width:min(100% - 24px, var(--ancho-cuerpo-crebe)) !important;
  }

  .tarjetas{
    grid-template-columns:1fr !important;
  }
}
"""
    text = replace_once(text, old_layout, new_layout, "cuerpo y cuadrícula principal")

    # 6. Eliminar las dos capas históricas que redefinían el mismo cuerpo.
    text = remove_between(
        text,
        "/* Corrección visible del panel lateral: acceso administrativo y firma tu visita */",
        "/* Ajustes finales solicitados: RA azul y panel administrativo compacto */",
        "bloque histórico del cuerpo",
    )
    text = remove_between(
        text,
        "/* ==========================================================\n   Ajuste Netlify: módulos a ancho completo y acceso administrativo compacto\n   ========================================================== */",
        "/* ==========================================================\n   Complementos UX/UI EVA: búsqueda, accesibilidad y guía rápida\n   ========================================================== */",
        "bloque histórico Netlify",
    )

    # 7. Retirar puntos de ruptura antiguos de tarjetas que estaban anulados.
    text = replace_once(
        text,
        "\n  .tarjetas{\n    grid-template-columns:repeat(2,minmax(0,1fr));\n  }\n",
        "\n",
        "cuadrícula antigua a 900 px",
    )
    text = replace_once(
        text,
        "\n  .tarjetas{\n    grid-template-columns:1fr;\n  }\n",
        "\n",
        "cuadrícula antigua a 760 px",
    )
    text = replace_once(
        text,
        "    width:calc(100% - 12px);\n    min-height:auto;",
        "    min-height:auto;",
        "ancho móvil antiguo de la portada",
    )

    # 8. Accesos complementarios: trasladar ancho y mínimo al bloque base.
    text = replace_once(
        text,
        "  width:100%;\n  max-width:1280px;\n  margin:24px auto;\n  padding:0 14px;",
        "  width:min(var(--ancho-cuerpo-crebe), calc(100% - 36px)) !important;\n  max-width:var(--ancho-cuerpo-crebe) !important;\n  min-width:0 !important;\n  margin:24px auto;\n  margin-left:auto !important;\n  margin-right:auto !important;\n  padding:0 14px;",
        "ancho de accesos complementarios",
    )
    access_mobile_anchor = """@media(max-width:640px){
  .accesos-complementarios-weebly{
    margin:22px auto;
"""
    access_mobile_new = """@media(max-width:680px){
  .accesos-complementarios-weebly{
    width:min(100% - 24px, var(--ancho-cuerpo-crebe)) !important;
  }
}

@media(max-width:640px){
  .accesos-complementarios-weebly{
    margin:22px auto;
"""
    text = replace_once(
        text,
        access_mobile_anchor,
        access_mobile_new,
        "ancho móvil de accesos complementarios",
    )

    # 9. Indicadores institucionales: mismo ancho final y móvil efectivo.
    text = replace_once(
        text,
        ".impacto-crebe{\n  width:calc(100% - 36px);\n  max-width:var(--ancho-principal);\n  margin:18px auto 0;",
        ".impacto-crebe{\n  width:min(var(--ancho-cuerpo-crebe), calc(100% - 36px)) !important;\n  max-width:var(--ancho-cuerpo-crebe) !important;\n  min-width:0 !important;\n  margin:18px auto 0;\n  margin-left:auto !important;\n  margin-right:auto !important;",
        "ancho de indicadores",
    )
    text = replace_once(
        text,
        "  .impacto-crebe{\n    width:calc(100% - 24px);\n    margin-top:12px;",
        "  .impacto-crebe{\n    margin-top:12px;",
        "ancho antiguo de indicadores a 720 px",
    )
    reduced_motion_marker = "@media(prefers-reduced-motion:reduce){"
    impacto_mobile = """@media(max-width:680px){
  .impacto-crebe{
    width:min(100% - 24px, var(--ancho-cuerpo-crebe)) !important;
  }
}

"""
    if text.count(reduced_motion_marker) != 1:
        raise RuntimeError("No se encontró de forma única el bloque de movimiento reducido")
    text = text.replace(reduced_motion_marker, impacto_mobile + reduced_motion_marker, 1)

    # 10. Carrusel de noticias: mover solo sus dimensiones efectivas al último bloque activo.
    news_start = "/* Corrección de tamaño del carrusel de noticias para navegador PC al 100% */"
    final_width_marker = "/* Ajuste final de ancho del cuerpo: alineado con header y footer */"

    text = replace_in_region(
        text,
        news_start,
        final_width_marker,
        ".noticias-destacadas{\n  width:min(1120px,calc(100% - 32px));\n  margin:18px auto 14px;",
        ".noticias-destacadas{\n  width:min(var(--ancho-cuerpo-crebe), calc(100% - 36px)) !important;\n  max-width:var(--ancho-cuerpo-crebe) !important;\n  min-width:0 !important;\n  margin:18px auto 14px;\n  margin-left:auto !important;\n  margin-right:auto !important;",
        "ancho de noticias destacadas",
    )
    text = replace_in_region(
        text,
        news_start,
        final_width_marker,
        ".noticias-carrusel{\n  width:min(1120px,100%);\n  margin:0 auto;",
        ".noticias-carrusel{\n  width:100% !important;\n  max-width:100% !important;\n  margin:0 auto;",
        "ancho interno del carrusel",
    )
    text = replace_in_region(
        text,
        news_start,
        final_width_marker,
        ".noticias-viewport{\n  width:min(1040px,calc(100% - 88px));\n  margin:0 auto;",
        ".noticias-viewport{\n  width:min(100%, 900px) !important;\n  max-width:calc(100% - 88px) !important;\n  margin:0 auto;",
        "viewport del carrusel",
    )
    text = replace_in_region(
        text,
        news_start,
        final_width_marker,
        "  flex:0 0 280px !important;",
        "  flex:0 0 260px !important;",
        "tarjeta de noticia en escritorio",
    )
    text = replace_in_region(
        text,
        news_start,
        final_width_marker,
        "  flex-basis:350px !important;",
        "  flex-basis:330px !important;",
        "noticia activa en escritorio",
    )

    old_news_980 = """@media (max-width:980px){
  .noticias-viewport{width:min(100%,calc(100% - 72px));}
  .noticia-tarjeta{flex-basis:250px !important;}
  .noticia-tarjeta.activa{flex-basis:320px !important;}
}
"""
    new_news_980 = """@media (max-width:980px){
  .noticias-viewport{
    max-width:calc(100% - 72px) !important;
  }

  .noticia-tarjeta,
  .noticia-tarjeta.activa{
    flex-basis:min(340px, calc(100vw - 112px)) !important;
  }
}
"""
    text = replace_in_region(
        text,
        news_start,
        final_width_marker,
        old_news_980,
        new_news_980,
        "noticias a 980 px",
    )

    old_news_760 = """@media (max-width:760px){
  .noticias-destacadas{width:min(100% - 16px,1120px);margin:16px auto 12px;}
  .noticias-viewport{width:min(100%,calc(100% - 58px));}
  .noticias-pista{gap:16px;}
  .noticia-tarjeta,
  .noticia-tarjeta.activa{
    flex-basis:min(330px,calc(100vw - 96px)) !important;
    transform:scale(1) !important;
  }
  .noticia-tarjeta.vecina{transform:scale(.94) !important;}
  .noticias-control{width:38px !important;height:38px !important;}
}
"""
    new_news_760 = """@media (max-width:760px){
  .noticias-destacadas{margin:16px auto 12px;}
  .noticias-pista{gap:16px;}
  .noticia-tarjeta,
  .noticia-tarjeta.activa{
    transform:scale(1) !important;
  }
  .noticia-tarjeta.vecina{transform:scale(.94) !important;}
  .noticias-control{width:38px !important;height:38px !important;}
}

@media (max-width:680px){
  .noticias-destacadas{
    width:min(100% - 24px, var(--ancho-cuerpo-crebe)) !important;
  }

  .noticias-viewport{
    max-width:calc(100% - 56px) !important;
  }

  .noticia-tarjeta,
  .noticia-tarjeta.activa{
    flex-basis:min(320px, calc(100vw - 92px)) !important;
  }
}
"""
    text = replace_in_region(
        text,
        news_start,
        final_width_marker,
        old_news_760,
        new_news_760,
        "noticias a 760 y 680 px",
    )

    # 11. El bloque final ya fue distribuido en sus definiciones base.
    text = remove_between(
        text,
        final_width_marker,
        "/* Corrección puntual: centrado real de la noticia activa */",
        "bloque final de anchos",
    )

    # 12. Comprobaciones de seguridad.
    if text.count("--ancho-cuerpo-crebe:1120px;") != 1:
        raise RuntimeError("La variable de ancho no quedó definida una sola vez")
    if final_width_marker in text:
        raise RuntimeError("Permaneció el bloque final de sobrescrituras")
    if "Ajuste Netlify: módulos a ancho completo" in text:
        raise RuntimeError("Permaneció el bloque histórico Netlify")
    if text.count(".cuerpo-operativo{") != 1:
        raise RuntimeError(
            f"Se esperó una sola definición de .cuerpo-operativo y hay {text.count('.cuerpo-operativo{')}"
        )
    if text.count("grid-template-columns:repeat(3,minmax(0,1fr)) !important;") != 1:
        raise RuntimeError("La cuadrícula de tres columnas no quedó consolidada")
    if text.count("grid-template-columns:repeat(2,minmax(0,1fr)) !important;") != 1:
        raise RuntimeError("La cuadrícula de dos columnas no quedó consolidada")
    if text.count("grid-template-columns:1fr !important;") < 2:
        raise RuntimeError("Falta una regla consolidada de una columna")

    validate_css_braces(text)

    if text == original:
        raise RuntimeError("La consolidación no produjo cambios")

    text = re.sub(r"\n{4,}", "\n\n\n", text).rstrip() + "\n"
    CSS_PATH.write_text(text, encoding="utf-8", newline="\n")
    print("Consolidación de anchos y cuadrículas completada y validada.")


if __name__ == "__main__":
    main()
