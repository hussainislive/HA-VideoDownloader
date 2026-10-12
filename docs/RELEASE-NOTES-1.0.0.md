# HA Premium Video Downloader v1.0.0

## Highlights

- Paste a supported media link, inspect a real preview, choose video or audio
  output, and download without opening a terminal.
- Manage persistent concurrent work with real progress, pause/resume, cancel,
  retry, restart recovery, native notifications, and safe partial cleanup.
- Search and manage a real Library, configure effective preferences, and update
  the writable yt-dlp engine on demand.
- Native Intel and Apple Silicon macOS packages plus a Windows 10/11 x64
  installer configuration, with no analytics or background update traffic.

## Which download is for me?

| Your computer                                  | Download                                          |
| ---------------------------------------------- | ------------------------------------------------- |
| Mac showing “Chip: Apple M…” in About This Mac | `HA-Premium-Video-Downloader-1.0.0-mac-arm64.dmg` |
| Mac showing “Processor: Intel…”                | `HA-Premium-Video-Downloader-1.0.0-mac-x64.dmg`   |
| Windows 10/11 64-bit                           | `HA-Premium-Video-Downloader-1.0.0-win-x64.exe`   |

The x64 Mac build can run on Apple Silicon through Rosetta, but arm64 is the
recommended native build.

## Install unsigned builds

On macOS, move the app to Applications, then Control-click it and choose
**Open**. If it remains blocked, run:

```sh
xattr -cr "/Applications/HA Premium Video Downloader.app"
```

On Windows, verify the SHA-256 first; SmartScreen may require **More info → Run
anyway** because the installer does not yet have a publisher certificate.

## Verification status

The Intel macOS build is exercised on the development machine. The arm64 app
and Windows installer must complete their hardware guides before this draft is
published. Consult `docs/QA-CHECKLIST.md` for the live matrix.

## Checksums, source, and license

Verify artifacts with the attached `SHA256SUMS`. Source corresponds to tag
`v1.0.0`. The application is GPL-3.0-or-later; bundled-engine license and
corresponding-source details are in `THIRD_PARTY_NOTICES.md`.
