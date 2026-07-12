#!/usr/bin/env python3
"""Elimina únicamente reglas CSS asociadas a componentes administrativos sin uso.

La operación se detiene si cualquiera de las clases candidatas aparece como token
independiente en un archivo HTML o JavaScript del repositorio. No modifica reglas
compartidas: una regla solo se retira cuando cada selector de la lista contiene al
menos una clase candidata.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_PATH = ROOT / "estilos.css"

CANDIDATE_CLASSES = {
    "acceso-admin",
    "ventana-admin",
    "barra-admin",
    "campo-simulado",
    "boton-lateral",
    "boton-admin",
    "campo-admin",
    "mensaje-admin",
    "admin-compacto",
    "admin-opciones",
    "tarjeta-administracion",
    "cabecera-simple-admin",
    "marca-logo-texto",
    "zona-admin-main",
    "zona-admin-hero",
    "zona-admin-grid",
    "zona-admin-card",
    "zona-admin-icono",
    "zona-admin-alerta",
    "etiqueta-admin",
    "fila-admin",
    "panel-lateral",
    "acceso-modulos",
    "accesos-secundarios",
    "lateral-card",
    "firma-visita",
}

TEXT_EXTENSIONS = {".html", ".htm", ".js", ".mjs", ".cjs"}
CLASS_RE = re.compile(r"\.([A-Za-z_][\w-]*)")


def token_pattern(name: str) -> re.Pattern[str]:
    return re.compile(rf"(?<![A-Za-z0-9_-]){re.escape(name)}(?![A-Za-z0-9_-])")


def verify_candidates_are_unused() -> None:
    references: dict[str, list[str]] = {}

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        if ".git" in path.parts:
            continue

        text = path.read_text(encoding="utf-8", errors="ignore")
        relative = str(path.relative_to(ROOT))

        for name in sorted(CANDIDATE_CLASSES):
            if token_pattern(name).search(text):
                references.setdefault(name, []).append(relative)

    if references:
        print("Depuración cancelada: se encontraron clases candidatas todavía utilizadas.")
        for name, files in sorted(references.items()):
            print(f"- {name}: {', '.join(sorted(set(files)))}")
        raise SystemExit(2)


def find_matching_brace(text: str, opening: int) -> int:
    depth = 1
    i = opening + 1
    quote: str | None = None

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
                return len(text) - 1
            i = end + 2
            continue

        if char in {'"', "'"}:
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1

    raise ValueError("Llave CSS sin cierre")


def next_top_level_delimiter(text: str, start: int) -> tuple[int, str] | None:
    i = start
    quote: str | None = None
    parentheses = 0
    brackets = 0

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
                return None
            i = end + 2
            continue

        if char in {'"', "'"}:
            quote = char
        elif char == "(":
            parentheses += 1
        elif char == ")" and parentheses:
            parentheses -= 1
        elif char == "[":
            brackets += 1
        elif char == "]" and brackets:
            brackets -= 1
        elif parentheses == 0 and brackets == 0 and char in "{;":
            return i, char
        i += 1

    return None


def split_selectors(prelude: str) -> list[str]:
    selectors: list[str] = []
    start = 0
    quote: str | None = None
    parentheses = 0
    brackets = 0
    i = 0

    while i < len(prelude):
        char = prelude[i]
        if quote:
            if char == "\\":
                i += 2
                continue
            if char == quote:
                quote = None
        elif char in {'"', "'"}:
            quote = char
        elif char == "(":
            parentheses += 1
        elif char == ")" and parentheses:
            parentheses -= 1
        elif char == "[":
            brackets += 1
        elif char == "]" and brackets:
            brackets -= 1
        elif char == "," and parentheses == 0 and brackets == 0:
            selectors.append(prelude[start:i].strip())
            start = i + 1
        i += 1

    selectors.append(prelude[start:].strip())
    return [selector for selector in selectors if selector]


def rule_is_obsolete(prelude: str) -> bool:
    cleaned = re.sub(r"/\*.*?\*/", " ", prelude, flags=re.S).strip()
    if not cleaned or cleaned.startswith("@"):
        return False

    selectors = split_selectors(cleaned)
    if not selectors:
        return False

    return all(
        any(class_name in CANDIDATE_CLASSES for class_name in CLASS_RE.findall(selector))
        for selector in selectors
    )


def process_block(text: str, removed: list[str]) -> str:
    output: list[str] = []
    cursor = 0

    while cursor < len(text):
        found = next_top_level_delimiter(text, cursor)
        if found is None:
            output.append(text[cursor:])
            break

        delimiter_index, delimiter = found
        prelude = text[cursor:delimiter_index]

        if delimiter == ";":
            output.append(text[cursor:delimiter_index + 1])
            cursor = delimiter_index + 1
            continue

        closing = find_matching_brace(text, delimiter_index)
        inner = text[delimiter_index + 1:closing]
        stripped = re.sub(r"/\*.*?\*/", " ", prelude, flags=re.S).strip()

        if stripped.startswith("@"):
            processed_inner = process_block(inner, removed)
            output.append(prelude)
            output.append("{")
            output.append(processed_inner)
            output.append("}")
        elif rule_is_obsolete(prelude):
            removed.append(stripped)
        else:
            output.append(text[cursor:closing + 1])

        cursor = closing + 1

    return "".join(output)


def main() -> int:
    if not CSS_PATH.exists():
        print("No se encontró estilos.css", file=sys.stderr)
        return 1

    verify_candidates_are_unused()

    original = CSS_PATH.read_text(encoding="utf-8")
    removed: list[str] = []
    cleaned = process_block(original, removed)

    if not removed:
        print("No se encontraron reglas obsoletas que cumplan los criterios de seguridad.")
        return 0

    cleaned = re.sub(r"\n{5,}", "\n\n\n", cleaned).rstrip() + "\n"
    CSS_PATH.write_text(cleaned, encoding="utf-8", newline="\n")

    print(f"Reglas eliminadas: {len(removed)}")
    for selector in removed:
        one_line = " ".join(selector.split())
        print(f"- {one_line}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
