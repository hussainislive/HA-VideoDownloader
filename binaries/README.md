# Local engine binaries

Binary payloads are owner-provided development inputs and are intentionally
excluded from Git. Only this provenance record is tracked.

## Expected layout

```text
binaries/
├── macos-x64/
│   ├── yt-dlp
│   └── ffmpeg
├── macos-arm64/
│   ├── yt-dlp
│   └── ffmpeg
└── win/
    ├── yt-dlp.exe
    └── ffmpeg.exe
```

The resolver always selects the folder matching `process.arch`. There is no
cross-architecture or legacy-folder fallback.

## Provenance and checksums

All six files were downloaded on 2026-10-12. Run `npm run verify:binaries`
after replacing any file.

| File                 | Version / architecture                       | Provider                                                                                  | SHA-256                                                            |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `macos-x64/ffmpeg`   | FFmpeg 9.0.2, x86_64                         | [Martin Riedl static release build](https://ffmpeg.martin-riedl.de/)                      | `b25689cf2211c0582d317e849912769a1f1c93904fe102c485b5364a425633d1` |
| `macos-arm64/ffmpeg` | FFmpeg 9.0.2, arm64                          | [Martin Riedl static release build](https://ffmpeg.martin-riedl.de/)                      | `2e11c6f90993cdb79fff84d3f90044d28316b310e75b3e030cfc9a54f2c9d384` |
| `macos-x64/yt-dlp`   | yt-dlp 2026.08.19, universal2 `yt-dlp_macos` | [official yt-dlp release](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.08.19)       | `0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202` |
| `macos-arm64/yt-dlp` | yt-dlp 2026.08.19, universal2 `yt-dlp_macos` | [official yt-dlp release](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.08.19)       | `0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202` |
| `win/ffmpeg.exe`     | FFmpeg 9.0.2 essentials build, x86_64        | [Gyan Windows build linked by FFmpeg](https://www.ffmpeg.org/download.html#build-windows) | `3256173f3f8bffd7df12227c68adf68025edb1832273a9530688a7bb1ed8edec` |
| `win/yt-dlp.exe`     | yt-dlp 2026.08.19, x86_64                    | [official yt-dlp release](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.08.19)       | `66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a` |

The verifier checks file presence and size, executable permissions, Mach-O or
PE architecture, macOS signatures, macOS dynamic dependencies, versions on
the host architecture, and static FFmpeg metadata for a non-runnable target.
It also confirms that both macOS FFmpeg builds have the same version and both
macOS folders contain the same universal yt-dlp file.

## Getting binaries for building from source

1. Download `yt-dlp_macos` and `yt-dlp.exe` from the matching official yt-dlp
   release. Rename `yt-dlp_macos` to `yt-dlp` in both macOS folders. Verify the
   release checksum before copying it.
2. Download the matching Intel and Apple Silicon FFmpeg release ZIPs from
   Martin Riedl's build server. Use the same FFmpeg release for both folders.
3. Obtain the Windows x64 essentials build from the Windows builds link on the
   official FFmpeg download page. The current file identifies itself as a Gyan
   build.
4. On macOS, run `chmod +x` on both tools and remove quarantine from the local
   `binaries` directory if needed. These are manual setup steps; project npm
   scripts do not assume POSIX tools on Windows.
5. Run `npm run verify:binaries`. Compare every SHA-256 with the upstream
   checksum before packaging.

FFmpeg build flags and corresponding-source information are recorded in
`THIRD_PARTY_NOTICES.md`.
