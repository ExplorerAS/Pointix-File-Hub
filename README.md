# Pointix File Hub

**Create, connect, import and open your work from one visual hub inside Obsidian.**

Pointix File Hub is a visual workspace for notes, templates, Office documents, data files, PDFs, media and external web resources. It is designed to keep the vault as the center of the workflow while giving the user explicit choices when opening or importing files from the device.

> **Status:** public beta. Keep an up-to-date backup of important vaults while testing beta releases.

## What Pointix File Hub does

- Creates Markdown notes and structured templates.
- Creates DOCX, XLSX and PPTX files from bundled internal templates.
- Creates and edits common text/data formats such as JSON, YAML, XML, TOML, CSV, SQL, JavaScript, TypeScript, Python and others.
- Opens PDFs and compatible files already stored in the vault.
- Lets the user select **one file** from the device to preview temporarily, open with the operating system when supported, or import a copy into the vault.
- Creates companion notes for media and reading workflows.
- Creates Markdown link cards for supported web services and cloud resources.
- Provides favorites, recents, search, category ordering and hidden-card controls without moving vault files.

## What's new in 0.10.3

- Three additional AI services in the AI category: **Tencent Hunyuan**, **Baidu Wenxin** and **Tencent Yuanbao**.
- Optional **Open Pointix when Obsidian starts** setting.
- Optional **Pin Pointix tab** setting.
- Pointix access from the new-tab screen and, on desktop, the tab bar.
- Clearer subcategories for Office documents, notes/text, tables/data, configuration, contacts/bibliography, code/scripts, canvases and diagrams.
- Existing-file actions were expanded so compatible cards can work with files from the vault or a file explicitly selected from the device.
- Support and funding information is now available in documentation and plugin settings.

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

## Opening Pointix

After enabling the plugin, you can open it from:

- the Pointix icon in the Obsidian ribbon;
- the **Pointix File Hub: Open file hub** command entry (displayed by Obsidian using the plugin name plus the command label);
- the Pointix entry shown on the new-tab screen when enabled;
- the optional desktop tab-bar button;
- a file's context menu for supported non-Markdown files.

In the Spanish interface used by the current beta, the principal command label is **Abrir centro de archivos**.

## Main areas

### Home and organization

The home view provides **Recents**, **Favorites**, search and category cards. Long-press a card on touch devices or right-click it on desktop to access personalization actions.

Changing favorites, ordering or visibility only changes Pointix preferences. It does **not** move, rename or delete the user's files.

### Templates and notes

Pointix creates standard Markdown files. Built-in templates include workflows such as meetings, projects, tasks, journals, ideas, clients, incidents, invoices, reading notes, contacts, events and references.

The **My templates** folder can expose user-created Markdown templates as cards. Template files remain ordinary Markdown.

### Office documents

Pointix can create valid DOCX, XLSX and PPTX files from internal bundled templates. The generated file is stored in the selected vault folder and can then be opened with software installed on the user's device, such as Microsoft Office, WPS Office or LibreOffice.

### Data and code

Pointix includes an internal text editor for supported text-based formats. JSON and Jupyter/IPYNB content receive syntax validation before save where applicable.

### PDFs and media

Pointix can search supported vault files, open them with Obsidian or the operating system when available, and create companion notes for reading or media workflows. The original file is not rewritten merely because a companion note is created.

### Web and cloud links

Pointix can create Markdown cards that store links to supported services. These cards are references: Pointix does not sign into those services, sync their libraries or store their passwords.

## Device files and access outside the vault

Pointix File Hub can access a file **outside the vault only after the user explicitly selects that file through the device/system file picker**.

Depending on platform and file type, Pointix can:

1. show a temporary preview;
2. ask the operating system to open/share the selected file; or
3. import a copy into a user-selected vault folder.

The plugin does not request a whole external folder, crawl neighboring files or silently import multiple files. Temporary previews use the file selected by the user and are discarded when the preview closes.

On desktop, Pointix may use Obsidian/Electron system-opening capabilities to open a user-selected file or external URL with the default application. These calls are guarded to desktop environments. On mobile, Pointix uses browser/mobile capabilities when available.

## Network, privacy and security

- No client-side telemetry.
- No Pointix account is required.
- The plugin does not use `fetch`, `requestUrl` or a background API to transmit vault contents.
- External service links open only after a user action.
- The plugin does not request or save passwords for third-party services.
- Risky executable/script extensions are not opened automatically with the system application.
- Imported device files are limited in size and copied only to a path selected inside the vault.
- Absolute paths and unsafe `..` path segments are rejected by the creation/import flows.

External web services remain subject to their own privacy policies, authentication rules and availability.

## Settings

**Settings → Pointix File Hub** includes:

- default destination folder;
- My templates folder;
- open after create;
- open Pointix at startup;
- pin Pointix tab;
- show Pointix on the new-tab screen;
- show the desktop tab-bar button;
- mobile list/grid preference;
- reset catalog organization;
- enable/disable creation packs;
- support email and voluntary Ko-fi link.

Startup opening, tab pinning and extra UI entry points are **off or user-configurable** as appropriate; Pointix does not require them for normal use.

## Installation with BRAT

Pointix File Hub can be tested before Community directory approval using **BRAT**.

1. Install and enable BRAT in Obsidian.
2. Run **BRAT: Add a beta plugin for testing**.
3. Paste this repository URL:

```text
https://github.com/ExplorerAS/Pointix-File-Hub
```

4. Add the plugin.
5. Enable **Pointix File Hub** in **Settings → Community plugins**.

BRAT should install the latest GitHub release whose assets include `manifest.json`, `main.js` and `styles.css`.

## Manual installation

Download the release assets:

```text
manifest.json
main.js
styles.css
```

Place them in:

```text
<Vault>/.obsidian/plugins/pointix-file-hub/
```

Reload Obsidian, then enable **Pointix File Hub** in **Settings → Community plugins**.

## Community directory readiness

The repository is prepared for Obsidian Community review with:

- `manifest.json` in the repository root;
- `README.md` in the repository root;
- `LICENSE` in the repository root;
- `versions.json` for version compatibility metadata;
- release assets expected as `manifest.json`, `main.js` and `styles.css`;
- semantic version tags matching the `version` field exactly.

The current beta version is **0.10.3** and its GitHub release tag must therefore be exactly **`0.10.3`**.

## Compatibility

- Minimum declared Obsidian version: **1.5.0**.
- `isDesktopOnly` is **false**.
- The code guards Electron-specific behavior so it is used only on desktop.
- Linux and Obsidian mobile emulation have been used during beta verification.
- Real Android/iOS devices and Windows/macOS should continue to be exercised during public beta before treating all platform combinations as fully verified.

## Support

- GitHub issues: https://github.com/ExplorerAS/Pointix-File-Hub/issues
- Support guide: [SUPPORT.md](./SUPPORT.md)
- Email: **servicios.globix@gmail.com**

Please do not include passwords, tokens, private notes or entire vaults in support requests.

## Support development

If Pointix File Hub is useful to you, you can voluntarily support its development:

**Ko-fi:** https://ko-fi.com/exprorerit

Support does not unlock features and is not required to use the plugin.

## License

Pointix File Hub is released under the [MIT License](./LICENSE).