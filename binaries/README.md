# Local engine binaries

Binary payloads are owner-provided development inputs and are intentionally
excluded from Git. Only this file is tracked.

## Expected layout

```text
binaries/
├── macos/
│   ├── yt-dlp
│   └── ffmpeg
└── win/
    ├── yt-dlp.exe
    └── ffmpeg.exe
```

Phase 1 found `yt-dlp` 2026.08.19 as a universal macOS binary and FFmpeg
9.0.2-tessus as x86_64-only. Windows binaries are PE32+ x86-64. Until a native
arm64 FFmpeg build is supplied, macOS packaging is limited to x64.

Obtain yt-dlp from its official GitHub releases and an FFmpeg build whose
redistribution license is understood. Verify published checksums before use;
then run `npm run verify:binaries`.
