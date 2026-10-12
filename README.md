# Electronic On-Ramp W.L.L. — website

Static, bilingual (English + Arabic) one-page site. No build step: plain HTML, CSS and JS, deployed on Vercel.

| File | What it is |
|---|---|
| `index.html` | English page |
| `ar/index.html` | Arabic page (RTL) |
| `styles.css` | All styles. Colour tokens at the top: white, navy `#0B1F3A`, orange `#F26B1D`, plus dark mode |
| `main.js` | Theme toggle, mobile menu, scroll reveal and the **Get a quote** planner |
| `assets/l10n/ar.js` | Arabic strings for the planner |

## Get a quote planner
Visitors pick services, answer short questions per service, add their details, and the site opens WhatsApp with
everything written out. There is no backend. Services and questions live in `main.js` (English) and
`assets/l10n/ar.js` (Arabic); the `id`s must match the `data-pick` links on the service cards.

## Placeholders to replace before launch
- WhatsApp number: `WHATSAPP` in `main.js`, and the visible `+973 0000 0000` in both HTML files
- Email: `info@your-domain.com` in both HTML files
- Office: `Manama, Bahrain` / `المنامة، البحرين`
- Optional booking link: `BOOKING_URL` in `main.js`
- Domain: `electronic-onramp.vercel.app` in both HTML heads, `robots.txt` and `sitemap.xml`

## Local preview
```
python3 -m http.server 8080
```
