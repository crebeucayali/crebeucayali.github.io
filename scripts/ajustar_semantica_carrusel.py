#!/usr/bin/env python3
from pathlib import Path


def reemplazar_unico(texto: str, anterior: str, nuevo: str, etiqueta: str) -> str:
    cantidad = texto.count(anterior)
    if cantidad != 1:
        raise RuntimeError(f"{etiqueta}: se esperaba 1 coincidencia y se encontraron {cantidad}")
    return texto.replace(anterior, nuevo, 1)


index_path = Path("index.html")
index = index_path.read_text(encoding="utf-8")

index = reemplazar_unico(
    index,
    '<div class="noticias-carrusel" aria-label="Carrusel automático de noticias destacadas" data-news-source="https://crebeucayali.github.io/accesos-complementarios/noticias-destacadas.json" data-fallback-source="noticias-destacadas.json">',
    '<div class="noticias-carrusel" role="region" aria-roledescription="carrusel" aria-labelledby="noticias-destacadas-titulo" data-news-source="https://crebeucayali.github.io/accesos-complementarios/noticias-destacadas.json" data-fallback-source="noticias-destacadas.json">',
    "Región del carrusel",
)
index = reemplazar_unico(
    index,
    '<button class="noticias-control noticias-anterior" type="button" aria-label="Ver noticia anterior"><span aria-hidden="true">&#10094;</span></button>',
    '<button class="noticias-control noticias-anterior" type="button" aria-label="Ver noticia anterior" aria-controls="noticias-pista"><span aria-hidden="true">&#10094;</span></button>',
    "Control anterior",
)
index = reemplazar_unico(
    index,
    '<button class="noticias-control noticias-siguiente" type="button" aria-label="Ver noticia siguiente"><span aria-hidden="true">&#10095;</span></button>',
    '<button class="noticias-control noticias-siguiente" type="button" aria-label="Ver noticia siguiente" aria-controls="noticias-pista"><span aria-hidden="true">&#10095;</span></button>',
    "Control siguiente",
)
index_path.write_text(index, encoding="utf-8", newline="\n")

main_path = Path("main.js")
main = main_path.read_text(encoding="utf-8")

main = reemplazar_unico(
    main,
    '''    const crearTarjeta = (noticia) => {\n      const articulo = document.createElement("article");\n      articulo.className = "noticia-tarjeta";''',
    '''    const crearTarjeta = (noticia, indice, total) => {\n      const articulo = document.createElement("article");\n      articulo.className = "noticia-tarjeta";\n      articulo.setAttribute("role", "group");\n      articulo.setAttribute("aria-roledescription", "diapositiva");\n      articulo.setAttribute("aria-label", `Noticia ${indice + 1} de ${total}: ${noticia.titulo}`);\n      articulo.setAttribute("aria-hidden", "true");''',
    "Semántica de cada noticia",
)
main = reemplazar_unico(
    main,
    '      pista.appendChild(crearTarjeta(noticia));',
    '      pista.appendChild(crearTarjeta(noticia, indice, noticias.length));',
    "Creación de noticias",
)
main = reemplazar_unico(
    main,
    '''        if (diferencia === 0) {\n          slide.classList.add("activa");\n        } else if (Math.abs(diferencia) === 1) {\n          slide.classList.add("vecina", diferencia < 0 ? "vecina-izquierda" : "vecina-derecha");\n        } else {\n          slide.classList.add("lejana");\n        }''',
    '''        const estaActiva = diferencia === 0;\n        if (estaActiva) {\n          slide.classList.add("activa");\n        } else if (Math.abs(diferencia) === 1) {\n          slide.classList.add("vecina", diferencia < 0 ? "vecina-izquierda" : "vecina-derecha");\n        } else {\n          slide.classList.add("lejana");\n        }\n\n        slide.setAttribute("aria-hidden", estaActiva ? "false" : "true");\n        const enlaceNoticia = slide.querySelector("a");\n        if (enlaceNoticia) {\n          if (estaActiva) enlaceNoticia.removeAttribute("tabindex");\n          else enlaceNoticia.setAttribute("tabindex", "-1");\n        }''',
    "Estado accesible de las noticias",
)
main_path.write_text(main, encoding="utf-8", newline="\n")

print("Semántica del carrusel de noticias aplicada correctamente.")
