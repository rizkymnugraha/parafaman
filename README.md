<h1 align="center">ParafAman</h1>

<p align="center">
  <strong>16 PDF tools that never see your files.</strong>
</p>

<p align="center">
  A privacy-first PDF toolkit that runs 100% in your browser.<br/>
  No uploads. No accounts. No servers. Open source.
</p>

<p align="center">
  <a href="https://parafaman.com">Live</a> ·
  <a href="https://parafaman.com/whats-new">What's new</a> ·
  <a href="#features">Features</a> ·
  <a href="#privacy-by-architecture">How it works</a>
</p>

<p align="center">
  <img src="src/assets/landing.svg" alt="ParafAman" width="480">
</p>

<p align="center">
  <a href="https://github.com/rizkymnugraha/parafaman/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/rizkymnugraha/parafaman?style=social"></a>
  <a href="https://github.com/rizkymnugraha/parafaman/network/members"><img alt="GitHub forks" src="https://img.shields.io/github/forks/rizkymnugraha/parafaman?style=social"></a>
  <img alt="License" src="https://img.shields.io/github/license/rizkymnugraha/parafaman">
</p>

---

## Why ParafAman exists

Every "free" PDF SaaS site — iLovePDF, Smallpdf, and friends — asks you to upload your file to their servers. They typically:

- hold your file on their infrastructure for up to 24 hours,
- promise they "won't read it" (you're just trusting them),
- subsidize the free tier with ads, telemetry, or upsells.

For sensitive documents — contracts, IDs, payslips, medical records — that's a non-starter.

**ParafAman runs entirely in your browser.** Your file never leaves your device. Privacy isn't a policy here — it's an architectural choice you can verify in the source code.

> **Don't trust me — verify.** Open DevTools → Network tab → use any tool. You'll see no outgoing requests carrying your file. The only network traffic is the initial page load (HTML/CSS/JS).

## Features

**16 tools, all client-side.** UI is in Bahasa Indonesia.

### Sign & Annotate
- **Sign PDF** — Draw or upload signature, drag-and-drop placement, multi-page support, encrypted PDF support
- **Page Numbers** — 6 positions, 4 formats, configurable font size and start page
- **Watermark** — Text or image watermark with opacity and rotation

### Page Management
- **Split** — Extract selected pages as one PDF, or split into individual files
- **Merge** — Combine multiple PDFs with reorderable list
- **Organize** — Visual thumbnail grid: rotate, reorder, delete pages
- **Reverse** — One-click reverse page order
- **Crop** — Trim margins with live preview
- **N-up** — 2/4/6 pages per sheet for print

### Convert
- **PDF → Images** — Export each page as PNG/JPG at 1x, 2x, or 3x scale
- **Images → PDF** — Combine PNG/JPG files into one PDF with A4/Letter/auto sizing

### Optimize & Repair
- **Compress** — Three quality tiers, image-based compression with size delta
- **Repair** — Light rebuild (preserves text) or aggressive rasterize for damaged PDFs

### Security
- **Lock** — Add password protection (uses `pdf-lib-plus-encrypt`)
- **Unlock** — Remove password from encrypted PDF

### Other
- **Inspect** — View file info, edit metadata (title, author, subject, keywords)

## Privacy by architecture

| | ParafAman | Typical PDF SaaS |
|---|---|---|
| Where files are processed | Your browser | Their servers |
| Account required | No | Often yes |
| Network requests with file content | Zero | Upload + download |
| Verifiable | Open source — read the code | Privacy policy — trust them |
| Works offline (after first load) | Yes | No |
| Cost | Free forever | Free tier + paid plans |
| Source available | MIT | Proprietary |

There is no backend, no database, no API keys, and no third-party PDF service. The entire app is static files served from a CDN.

## Tech stack

- **[React 19](https://react.dev/)** + **[Vite 7](https://vite.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**
- **[Tailwind CSS 4](https://tailwindcss.com/)** + **[Radix UI](https://www.radix-ui.com/)** + **[lucide-react](https://lucide.dev/)**
- **[pdf-lib](https://pdf-lib.js.org/)** for PDF manipulation
- **[pdf-lib-plus-encrypt](https://www.npmjs.com/package/pdf-lib-plus-encrypt)** for password protection
- **[pdfjs-dist](https://mozilla.github.io/pdf.js/)** for rendering and decryption
- Deployed on **[Cloudflare Pages](https://pages.cloudflare.com/)**

## Quickstart

```bash
git clone https://github.com/rizkymnugraha/parafaman.git
cd parafaman
npm install
npm run dev
```

Open `http://localhost:5173`.

### Build for production

```bash
npm run build
npm run preview  # local preview of production build
```

## Project structure

```
src/
├── pages/                 # Route entry per tool (SignPage, SplitPage, ...)
├── features/
│   ├── _shared/           # FilePicker, ToolPageShell, usePageThumbnails
│   └── sign/              # The signature editor (canvas, sidebar, modals)
├── components/
│   ├── ui/                # Button, Card, Dialog, etc.
│   ├── Layout.tsx
│   └── PasswordInputModal.tsx
├── hooks/                 # usePdfRenderer, useOpenPdf, ...
├── store/                 # React Context providers
├── utils/pdf.ts           # loadPdfFile, savePdfWithItems, renderPageToImage
└── router/                # React Router config
```

Each tool is a self-contained page that:
1. Picks up a file via `FilePicker` (handles password modal for encrypted PDFs).
2. Operates on it client-side using `pdf-lib` and/or `pdfjs-dist`.
3. Triggers a download via `downloadBlob`.

## Roadmap

- [ ] English UI toggle
- [ ] PDF text extraction
- [ ] OCR for scanned PDFs (Tesseract.js)
- [ ] Form filling
- [ ] PWA / offline-first install
- [ ] Drag-to-crop on Crop tool

Have an idea? [Open an issue](https://github.com/rizkymnugraha/parafaman/issues).

## Contributing

Pull requests are welcome. For substantial changes, please open an issue first so we can discuss the approach.

```bash
npm run lint   # ESLint check
npm run build  # Type-check + build
```

## Support

If ParafAman saves you time, headache, or trust, please consider:

- **Starring this repo** — costs nothing, helps with discoverability
- **[Saweria](https://saweria.co/rizkymeiputra)** — direct donations
- **[Reporting bugs](https://github.com/rizkymnugraha/parafaman/issues)** — even small ones
- **Sharing it** with someone who'd rather not upload their PDFs to strangers

## License

[MIT](./LICENSE) — use it, fork it, modify it, ship it.

---

<p align="center">
  Built in Indonesia. UI dalam Bahasa Indonesia.<br/>
  <sub>If you'd like to help translate to English or other languages, see <a href="https://github.com/rizkymnugraha/parafaman/issues">issues</a>.</sub>
</p>
