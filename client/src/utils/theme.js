const THEME_STORAGE_KEY = "tryvoxel-theme";
const THEME_MODES = ["system", "light", "dark"];

export function getThemeMode() {
  const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  return THEME_MODES.includes(savedMode) ? savedMode : "light";
}

export function applyTheme(mode) {
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const resolvedTheme =
    mode === "system" ? (prefersLight ? "light" : "dark") : mode;

  document.documentElement.dataset.theme = resolvedTheme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolvedTheme === "light" ? "#fcfcfe" : "#090a0f");
  return resolvedTheme;
}

export function setThemeMode(mode) {
  if (!THEME_MODES.includes(mode)) {
    throw new Error(`Unsupported theme mode: ${mode}`);
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
}

export function initializeTheme() {
  applyTheme(getThemeMode());

  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
  const syncSystemTheme = () => {
    if (getThemeMode() === "system") applyTheme("system");
  };
  mediaQuery.addEventListener("change", syncSystemTheme);
}
