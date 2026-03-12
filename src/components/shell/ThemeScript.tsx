/**
 * Renders a tiny inline <script> that sets data-theme on <html> before the
 * first paint — prevents a flash of the wrong theme on hard reload.
 * This is a Server Component (no "use client") so it can run in RSC context.
 */
export function ThemeScript() {
  const script = `
    try {
      const prefs = JSON.parse(localStorage.getItem('ls-prefs') || '{}');
      const theme = prefs?.state?.theme || 'CYAN';
      document.documentElement.dataset.theme = theme;
    } catch(e) {
      document.documentElement.dataset.theme = 'CYAN';
    }
  `;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
