/**
 * Applies the saved theme before the first paint.
 *
 * This runs as a blocking inline script on purpose: reading the preference in
 * an effect would show a flash of the wrong theme first. It writes only the
 * `data-theme` attribute, and a failure (storage disabled) silently leaves the
 * system preference in charge.
 */
export function ThemeScript() {
  const script = `
(function(){
  try {
    var stored = localStorage.getItem('im.theme');
    var mode = stored === 'light' || stored === 'dark' ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', mode);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
