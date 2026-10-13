# HA Premium Video Downloader v1.0.1

This release corrects the slow macOS preview and Queue preparation experience
without changing the application's local-only, no-tracking model.

## What changed

- The macOS packages include yt-dlp's official unpackaged runtime, avoiding
  the supplied one-file executable's measured 26–28-second startup on each
  preview and download. The original executable remains a fallback.
- A fresh preview is reused by the first download attempt, with an automatic
  ordinary-link retry if the cached media source is rejected.
- Queue says **Preparing source…** until actual transfer progress starts,
  instead of showing a misleading 0% download that suddenly completes.
- The pasted URL stays with the job even if a site reports another canonical
  URL, so Instagram and Facebook can use the same fast path.

The owner-provided Facebook, Instagram, and YouTube links passed real Electron
Playwright preview-to-file checks. One measured run appears in
`docs/PERFORMANCE.md`; third-party site timing is variable and not guaranteed.
The retired 30-minute soak was not run and is not a release gate.

## Choose a Mac installer

| About This Mac shows | Installer                                         |
| -------------------- | ------------------------------------------------- |
| Chip: Apple M-series | `HA-Premium-Video-Downloader-1.0.1-mac-arm64.dmg` |
| Processor: Intel     | `HA-Premium-Video-Downloader-1.0.1-mac-x64.dmg`   |

Open the DMG and drag the app to Applications. If macOS asks, choose
**Replace** to replace v1.0.0; the build itself does not change the installed
app or your downloaded files. These local release candidates are unsigned and
not notarized. On first launch, Control-click the app and choose **Open**.
The initial native-runtime security scan may take longer; later launches reuse
the prepared runtime.

The Intel package is run on the development host. The arm64 package is built
and statically checked here, but still needs a physical Apple Silicon smoke
before public release. A Windows 1.0.1 installer must be built and tested on a
Windows machine; macOS is not used for Windows cross-packaging. See
`docs/QA-CHECKLIST.md`.

## Integrity and source

Check the SHA-256 values in the accompanying release checksum file before
installing. The application is GPL-3.0-or-later; see `LICENSE` and
`THIRD_PARTY_NOTICES.md` for bundled-engine notices and source obligations.
