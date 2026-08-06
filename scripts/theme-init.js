(function () {
  try {
    var stored = localStorage.getItem("theme-preference");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (err) {
  }
})();