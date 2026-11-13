# Theme development

A portfolio theme renders the shared portfolio model with its own layout and visual language. Themes must not query D1, call GitHub, or mutate content.

## Initial themes

- Minimal: calm editorial layout and readable project cards.
- Terminal: dark developer-inspired presentation with restrained green accents.
- Editorial: warm background, expressive typography, and structured sections.

## Adding a theme

1. Add its identifier to ThemeId in src/types.ts.
2. Add a preview card in the dashboard theme gallery.
3. Add matching rendering styles in worker/render.ts.
4. Ensure every section and missing field renders safely.
5. Check phone widths, keyboard navigation, semantic headings, contrast, external links, and reduced motion.
6. Add a test for missing and populated sections.

Do not copy proprietary templates or distinctive third-party designs. Themes are free and included.