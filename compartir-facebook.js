(() => {
  const enlaces = document.querySelectorAll("[data-compartir-facebook]");
  if (!enlaces.length) return;

  const actual = new URL(window.location.href);
  actual.hash = "";
  const destino =
    "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(actual.href);

  enlaces.forEach((enlace) => {
    enlace.href = destino;
  });
})();
