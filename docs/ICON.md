# Application icon

`resources/icon.png` is the owner-supplied single source for packaged
application branding. The Phase 5 asset is a verified 1024×1024 RGBA PNG.

## Required file

- PNG, square, 1024×1024 recommended and 512×512 minimum;
- roughly 10% transparent margin around the artwork;
- no alternate source icon checked into the project.

electron-builder derives the macOS app/DMG icon and Windows executable,
installer, uninstaller, Start Menu, and desktop shortcut icons from this PNG.
The same file is copied into application resources for the Windows
`BrowserWindow`, development macOS Dock icon, and native notifications.

The title-bar glyph is deliberately independent at
`src/renderer/src/assets/logo.svg`; replacing the application icon must not
change or break the in-app shell.

## Replacing it

1. Overwrite `resources/icon.png` with the final file.
2. Run `npm run verify:icon`.
3. Remove old generated `release/` output before the next build if you are
   comparing icons; electron-builder regenerates its icon cache.
4. Run `npm run dist:mac` on macOS or `npm run dist:win` on Windows.
5. Inspect the app, installer/DMG, shortcuts, Dock/taskbar, and a notification.
