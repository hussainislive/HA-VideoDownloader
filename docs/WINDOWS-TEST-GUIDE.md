# Windows test guide

Run this on fresh Windows 10 and Windows 11 x64 machines. Phase 5 prepares the
code and installer but does not cross-build Windows from macOS.

## Build on Windows

1. Install Git and Node.js 24 LTS (npm 11 or newer).
2. Clone the repository and check out the release tag.
3. Place official `yt-dlp.exe` and the approved x64 `ffmpeg.exe` under
   `binaries\win\` as described in `binaries\README.md`.
4. In PowerShell, run `npm ci`.
5. Run `npm run verify:binaries` and keep its output.
6. Run `npm run check`.
7. Run `npm run dev` and complete the smoke checklist below.
8. Run `npm run dist:win`; do not build the Windows installer on macOS.
9. Install `release\HA-Premium-Video-Downloader-1.0.0-win-x64.exe`. For an
   unsigned build, SmartScreen may require **More info → Run anyway**.

## Manual checklist

- [ ] Minimize, maximize/restore, close, double-click title bar, resize floor,
      and Windows 11 Snap Layout behavior are correct.
- [ ] Taskbar progress and notifications reflect active/completed work.
- [ ] Probe, download, merge, audio conversion, and engine update show **no
      console-window flash**.
- [ ] Pause/resume terminates the whole tree and retains the partial; cancel
      removes only that job's partials after Windows releases file locks.
- [ ] Downloads work in a long path containing spaces, Arabic/non-Latin text,
      and emoji.
- [ ] Titles related to reserved names (`CON`, `NUL`, `COM1`, `LPT1`) and names
      ending in spaces/dots save safely.
- [ ] Windows Defender scans cleanly; record any alert and do not bypass a
      malware detection. Record SmartScreen wording for the unsigned installer.
- [ ] Help → Copy diagnostic info and Licenses both work.
- [ ] Uninstall removes the app and shortcuts but leaves downloaded media
      untouched.

Record Windows edition/build, display scale (100%, 125%, 150%, or 200%),
artifact SHA-256, installer size, and every unchecked item.
