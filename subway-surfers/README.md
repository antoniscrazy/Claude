# Subway Surfers New York — Local Build Archive

This folder contains a local, self-contained copy of the "Subway Surfers New York"
HTML5 game build, including all referenced scripts, fonts, audio, 3D models, and
texture assets. It was assembled for local testing/inspection purposes.

## Folder structure

```
subway-surfers-newyork/
├── index.html                  Main entry point
├── NewYorkIcon.png              Favicon / app icon
├── js/
│   ├── boot.js                  Dynamic loader (injects main.js/vendor.js at runtime)
│   ├── main.js                  Game bundle (webpack output)
│   ├── vendor.js                Third-party/vendor bundle (webpack output)
│   ├── inflate.min.js           Decompression library
│   ├── games_lib/
│   │   └── ludiAdapter.js       Platform/SDK adapter
│   └── workers/
│       └── worker.21cc18ec46e616e4eed8.js   Web Worker bundle
└── assets/
    ├── audio/                   Sound effects and music (.ogg)
    ├── data/                    Game configuration and string tables (.json)
    ├── font/                    Web fonts (.css + .woff2)
    ├── game/                    In-game models (.fbx) and textures (.png)
    ├── idle/                    Idle/menu-screen models and textures
    ├── placeholder/             Character selection icons (.png)
    ├── preload/                 Splash screen image
    └── ui/                      UI sprite sheet and layout data
```

Total: 85 files, ~19 MB.

## Running locally

This is a static site — no build step or server-side code is required. Any
static file server will work, for example:

**VS Code Live Server extension**
1. Open this folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.

**Python's built-in server**
```bash
cd subway-surfers-newyork
python -m http.server 8000
```
Then open `http://localhost:8000` in a browser.

### Known local-serving quirks

- `index.html` loads `js/boot.js`, which dynamically injects `<script>` tags for
  `main.js` and `vendor.js` with a cache-busting query string. Do **not** add a
  second hardcoded `<script src="js/main.js">` tag — this causes a
  `"only one instance of babel-polyfill is allowed"` runtime crash from double
  execution of the bundle.
- Some internal references use root-relative paths (e.g. `/js/main.js`,
  `/assets/font/...`). On the original hosting (GitHub Pages), the site lived at
  the domain root, so these resolved correctly. When serving from a local server
  where this folder is *not* the server root, add a `<base>` tag inside
  `<head>` pointing at the folder, e.g.:
  ```html
  <base href="/subway-surfers-newyork/">
  ```

## Notes

- All game assets (audio, 3D models, textures, UI art) are the intellectual
  property of their original creators/publisher and are included here only for
  local technical testing. This archive should not be redistributed or
  published as original work.
- Console warnings about deprecated meta tags, "slow network" font fallback,
  and Canvas2D `willReadFrequently` hints are informational only and do not
  affect gameplay.