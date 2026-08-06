const STORAGE_KEY = "theme-preference";

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredTheme(value) {
  try {
    if (value === "auto") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
  }
}

function applyTheme(value) {
  if (value === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", value);
  }
}

function buildPicker(current) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "theme-picker";

  const legend = document.createElement("legend");
  legend.textContent = "Theme";
  fieldset.append(legend);

  const options = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "auto", label: "Auto" },
  ];

  for (const { value, label } of options) {
    const id = `theme-${value}`;

    const wrapper = document.createElement("label");
    wrapper.setAttribute("for", id);
    wrapper.className = "theme-picker__option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "theme";
    input.id = id;
    input.value = value;
    input.checked = value === current;

    input.addEventListener("change", () => {
      applyTheme(value);
      setStoredTheme(value);
    });

    const text = document.createTextNode(` ${label}`);

    wrapper.append(input, text);
    fieldset.append(wrapper);
  }

  return fieldset;
}

function init() {
  const current = getStoredTheme() ?? "auto";
  const picker = buildPicker(current);

  const mountPoint = document.querySelector("header p");
  if (mountPoint) {
    mountPoint.after(picker);
  }
}

init();