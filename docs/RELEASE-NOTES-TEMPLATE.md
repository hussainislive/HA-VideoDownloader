# HA Premium Video Downloader vX.Y.Z

## Highlights

- A polished local interface for yt-dlp and FFmpeg with no ads, accounts,
  telemetry, or background network checks.
- Video and audio downloads, persistent Queue, searchable Library, real
  Settings, native notifications, and friendly recovery.

## Which download is for me?

| Your computer                                  | Download                                          |
| ---------------------------------------------- | ------------------------------------------------- |
| Mac showing “Chip: Apple M…” in About This Mac | `HA-Premium-Video-Downloader-X.Y.Z-mac-arm64.dmg` |
| Mac showing “Processor: Intel…”                | `HA-Premium-Video-Downloader-X.Y.Z-mac-x64.dmg`   |
| Windows 10/11 64-bit                           | `HA-Premium-Video-Downloader-X.Y.Z-win-x64.exe`   |

The x64 Mac build also runs on Apple Silicon through Rosetta, but arm64 is the
recommended native build.

## Install unsigned builds

macOS: open the DMG and move the app to Applications. Control-click the app,
choose **Open**, then confirm. If it is still blocked, run:

```sh
xattr -cr "/Applications/HA Premium Video Downloader.app"
```

Windows: SmartScreen may show an unknown-publisher warning. For an artifact
whose SHA-256 you verified, choose **More info → Run anyway**.

## Checksums

Verify the download against the attached `SHA256SUMS` file before installing.

## Changes

### Added

-

### Fixed

-

## Known limitations

- Packages are not code-signed or notarized yet.
- Platform items not completed in `docs/QA-CHECKLIST.md` remain pending.

## Source and license

Source for this release is the `vX.Y.Z` tag. The application is GPL-3.0-or-later;
third-party and FFmpeg corresponding-source details are in
`THIRD_PARTY_NOTICES.md`.
