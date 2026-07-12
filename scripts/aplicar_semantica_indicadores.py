#!/usr/bin/env python3
from pathlib import Path

ruta = Path("index.html")
texto = ruta.read_text(encoding="utf-8")

anterior = '<div class="impacto-carrusel" aria-label="Carrusel automático de indicadores institucionales">'
nuevo = '<div class="impacto-carrusel" role="region" aria-roledescription="carrusel" aria-labelledby="impacto-crebe-titulo">'

if texto.count(anterior) != 1:
    raise RuntimeError("No se encontró exactamente un contenedor de indicadores esperado")
texto = texto.replace(anterior, nuevo, 1)

duplicado = '<article class="impacto-tarjeta" aria-hidden="true">'
duplicado_nuevo = '<article class="impacto-tarjeta" aria-hidden="true" role="presentation">'

if texto.count(duplicado) != 6:
    raise RuntimeError(f"Se esperaban 6 indicadores duplicados y se encontraron {texto.count(duplicado)}")
texto = texto.replace(duplicado, duplicado_nuevo)

if texto.count('role="region" aria-roledescription="carrusel" aria-labelledby="impacto-crebe-titulo"') != 1:
    raise RuntimeError("La región del carrusel no quedó definida correctamente")
if texto.count('aria-hidden="true" role="presentation"') != 6:
    raise RuntimeError("Los indicadores duplicados no quedaron excluidos correctamente")

ruta.write_text(texto, encoding="utf-8", newline="\n")
print("Semántica del carrusel de indicadores aplicada y validada.")
