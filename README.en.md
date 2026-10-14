<div align="center">

<img src="addon/assets/icon.svg" width="100" height="100" alt="Zotero Veil logo" />

# Zotero Veil

Material colors and frosted glass for Zotero on macOS.

[简体中文](README.md) · [English](README.en.md)

[![License](https://img.shields.io/badge/license-MIT-6750A4?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/LiuAoran/zotero-veil?style=flat-square)](https://github.com/LiuAoran/zotero-veil/stargazers)

![Platform](https://img.shields.io/badge/macOS-Apple_Silicon-6750A4?style=flat-square)
![Zotero](https://img.shields.io/badge/Zotero-10-6750A4?style=flat-square)
![Appearance](https://img.shields.io/badge/theme-light_%26_dark-6750A4?style=flat-square)

[**Download XPI**](https://github.com/LiuAoran/zotero-veil/blob/main/downloads/zotero-veil-1.0.3.xpi)

[Screenshots](#screenshots) · [Installation](#installation) · [Features](#features) · [Compatibility](#compatibility) · [Development](#development)

</div>

---

A theme for Zotero 10 on macOS, preserving existing shortcuts, item operations, column resizing, and pane resizing.

## Screenshots

Real macOS screenshots. Appearance varies with your desktop background, seed color, and transparency setting. Library screenshots use Chinese; the settings interface supports both Chinese and English.

### Light library

![Light library](docs/screenshots/library-light.png)

### Dark library

![Dark library](docs/screenshots/library-dark.png)

<details>
<summary>Reader and appearance settings</summary>

**Light reader**

![Light reader](docs/screenshots/reader-light.png)

**Dark reader**

![Dark reader](docs/screenshots/reader-dark.png)

**Appearance settings**

![English appearance settings](docs/screenshots/settings-en.png)

</details>

## Installation

[Open the download folder](https://github.com/LiuAoran/zotero-veil/blob/main/downloads/zotero-veil-1.0.3.xpi), select the XPI file, then choose **Download raw file**.

1. In Zotero, open **Tools → Plugins** and choose **Install Plugin From File** from the gear menu.
2. Select the downloaded XPI.
3. Open **Settings → Veil Appearance** to configure appearance and colors.

Changes apply immediately and are saved automatically. Disabling the plugin restores Zotero's original interface while retaining your theme preferences. Veil follows Zotero’s interface language: Chinese uses Simplified Chinese, and other languages use English. Only Veil’s own labels and messages are translated; it never changes Zotero, system, or other plugin language settings. Restart Zotero after changing its interface language.

## Features

- Light, dark, and system appearance modes.
- Custom seed colors and three presets, using official Material Color Utilities.
- Consistent styling for library navigation, search, item lists, details, and reader chrome.
- Native frosted glass on Apple Silicon Mac, with an adjustable tint layer (10% at the highest transparency), full-strength native blur, and subtle sidebar separation.
- Visible selection, focus, and editing states; reduced-motion support.
- Transparent margins outside PDF pages, preserving paper, annotations, item data, and note content.

## Compatibility

Targets Zotero 10.0.*, with runtime checks on Zotero 10.0.6 and Apple Silicon macOS. **Other platforms remain untested.** The implementation falls back to solid colors when native glass is unavailable or system Reduce Transparency / Increase Contrast is enabled; this does not establish compatibility on untested platforms.

Glass is an extension combining Material colors with macOS materials, not an official Material Design 3 component. High transparency cannot guarantee text contrast over every background; lower the setting if reading becomes difficult. System menus, PDF pages, note editors, and third-party plugin areas retain their original appearance. Standalone reader windows, Intel / Rosetta, VoiceOver, and plugin combinations have not been fully verified.

There is no working automatic update service; install an XPI manually to update. Content captures do not verify native desktop blur. See the [validation notes](docs/验证说明.md) (Chinese).

## Development

Requires Node.js 22 or newer, npm, and Python 3:

```sh
npm ci --ignore-scripts
npm test
npm run build
python3 scripts/package-source.py
```

Artifacts are written to `dist/`. `addon/` contains bootstrap, settings, styles, and assets; `src/` contains colors, material handling, lifecycle management, and reader integration. Tests and development scripts are in `tests/` and `scripts/`.

Use a separate temporary profile for runtime tests. See the [testing guide](docs/测试指南.md) (Chinese). The production XPI excludes the test bridge; never install that bridge in your everyday profile.

## License

Licensed under [MIT](LICENSE). Third-party licenses and attribution are included in [licenses/](licenses/NOTICE.md).
