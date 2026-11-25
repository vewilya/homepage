/**
 * Light or dark mode.
 *
 * The OS preference is the start. The switch writes an explicit choice to
 * `data-theme` on <html> and to localStorage; the stylesheet keys every
 * colour, the picture layers and the veil on that attribute, and the ambient
 * audio watches it too, so a switch here changes all of them.
 *
 * The choice holds until the OS preference itself changes (evening auto-dark,
 * say). Then the site follows the OS again and the stored choice is dropped.
 * To catch an OS change that happened while the tab was closed, the OS value
 * at the time of the choice is stored alongside it and compared on load.
 *
 * A tiny script in <head> (see nuxt.config) applies the same rule before the
 * first paint, so a reload never flashes the other mode.
 */
export type Theme = "light" | "dark";

export const THEME_KEY = "ub:theme";
export const THEME_OS_KEY = "ub:theme-os"; // OS preference when the choice was made

const osQuery = () => matchMedia("(prefers-color-scheme: dark)");
const osTheme = (): Theme => (osQuery().matches ? "dark" : "light");

export const useTheme = () => {
  // null until mounted: the server does not know the visitor's preference
  const theme = useState<Theme | null>("theme", () => null);

  const choose = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    theme.value = next;
    try {
      localStorage.setItem(THEME_KEY, next);
      localStorage.setItem(THEME_OS_KEY, osTheme());
    } catch {
      /* storage blocked: the choice lasts for this page view only */
    }
  };

  const followOs = () => {
    delete document.documentElement.dataset.theme; // CSS falls back to the OS query
    theme.value = osTheme();
    try {
      localStorage.removeItem(THEME_KEY);
      localStorage.removeItem(THEME_OS_KEY);
    } catch {
      /* nothing stored anyway */
    }
  };

  const toggle = () => choose(theme.value === "dark" ? "light" : "dark");

  onMounted(() => {
    const attr = document.documentElement.dataset.theme;
    theme.value = attr === "light" || attr === "dark" ? attr : osTheme();
    osQuery().addEventListener("change", followOs);
  });

  return { theme, toggle };
};
