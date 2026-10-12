# Release QA checklist

Mark each line **verified**, **failed**, or **not available** and attach the
artifact SHA-256 plus **Help → Copy diagnostic info** output.

## Platform matrix

| Platform            | Build/install | Core download                     | OS integration                        | Status                        |
| ------------------- | ------------- | --------------------------------- | ------------------------------------- | ----------------------------- |
| macOS Intel         | x64 DMG       | video, audio, pause/resume/cancel | traffic lights, Dock, notification    | Automated smoke/live verified |
| macOS Apple Silicon | arm64 DMG     | video, audio, pause/resume/cancel | native Kind=Apple, Dock, notification | Needs owner/friend            |
| Windows 10 x64      | NSIS x64      | video, audio, pause/resume/cancel | controls, taskbar, notification       | Needs owner                   |
| Windows 11 x64      | NSIS x64      | video, audio, pause/resume/cancel | Snap, controls, taskbar, notification | Needs owner                   |

## Every platform

- [ ] Paste/drop URL → preview → all available video qualities and MP4/MKV.
- [ ] MP3, M4A, WAV; bitrate disabled for WAV; metadata behavior correct.
- [ ] Queue progress/speed/ETA, pause, resume, cancel, retry, relaunch recovery.
- [ ] Library search/filter/sort/play/reveal and both delete choices.
- [ ] Settings persist and every preference has a real effect.
- [ ] About links, email copy, Licenses, legal notice, and version are correct.
- [ ] Invalid/private/unsupported/offline/disk/folder errors are friendly and
      never expose raw stderr or query strings.
- [ ] Keyboard-only walkthrough, visible focus, 200% zoom, screen reader labels,
      reduced motion, and contrast.
- [ ] 850×600, 1280×800, and 1920×1080 layouts have no horizontal overflow.
- [ ] No console windows, zombies, or unrelated partial-file deletion.
- [ ] Unsigned-app warning instructions match the actual OS wording.

## Release package

- [ ] Filename, version, architecture, size, and SHA-256 are correct.
- [ ] Fresh install and uninstall succeed; user downloads remain after uninstall.
- [ ] GPL `LICENSE`, `THIRD_PARTY_NOTICES.md`, target engine, and icon are present.
- [ ] Package smoke verifier reports only the expected engine architecture.
