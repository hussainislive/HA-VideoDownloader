# Third-Party Notices

HA Premium Video Downloader is distributed under GNU GPL version 3 or later.
It includes or is built with the open-source projects listed below. Each project
retains its own copyright and license. This inventory was generated from the
locked 1.0.1 dependency graph and the actual bundled engine files on
2026-10-13.

## Download engines

### yt-dlp 2026.08.19

The macOS universal2 `yt-dlp_macos` fallback binary, its official unpackaged
`yt-dlp_macos.zip` runtime, and Windows x64 `yt-dlp.exe` come
from the [official yt-dlp release](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.08.19).
yt-dlp is released under the Unlicense. The PyInstaller executables also carry
the third-party licenses compiled into the upstream release; consult the
release's `THIRD_PARTY_LICENSES.txt` for that complete asset-level inventory.
The unpackaged macOS runtime includes this file under
`Contents/Resources/mac-runtime/macos-<arch>/_internal/`.
The Unlicense is GPL-compatible.

### FFmpeg 9.0.2

The Intel and Apple Silicon macOS binaries are Martin Riedl static release
builds. The Windows x64 binary is Gyan's release essentials build, obtained
through the Windows build link on FFmpeg's official download page. All three
report `--enable-gpl` and `--enable-version3`, do not report
`--enable-nonfree`, and are therefore GPLv3 builds.

macOS x64 configuration:

```text
--prefix=/Volumes/ffmpeg_amd64/out --pkg-config-flags=--static --extra-version='https://www.martin-riedl.de' --enable-gray --enable-libxml2 --enable-version3 --enable-gpl --enable-openssl --enable-libfreetype --enable-fontconfig --enable-libharfbuzz --enable-libbluray --enable-libsnappy --enable-libsrt --enable-libvmaf --enable-libass --enable-libklvanc --enable-libzimg --enable-libzvbi --enable-libaom --enable-libdav1d --enable-libopenh264 --enable-libopenjpeg --enable-librav1e --enable-libsvtav1 --enable-libvpx --enable-libvvenc --enable-libwebp --enable-libx264 --enable-libx265 --enable-libmp3lame --enable-libopus --enable-libvorbis --enable-libtheora
```

macOS arm64 configuration:

```text
--prefix=/Volumes/ffmpeg_arm64/out --pkg-config-flags=--static --extra-version='https://www.martin-riedl.de' --enable-gray --enable-libxml2 --enable-version3 --enable-gpl --enable-openssl --enable-libfreetype --enable-fontconfig --enable-libharfbuzz --enable-libbluray --enable-libsnappy --enable-libsrt --enable-libvmaf --enable-libass --enable-libklvanc --enable-libzimg --enable-libzvbi --enable-libaom --enable-libdav1d --enable-libopenh264 --enable-libopenjpeg --enable-librav1e --enable-libsvtav1 --enable-libvpx --enable-libvvenc --enable-libwebp --enable-libx264 --enable-libx265 --enable-libmp3lame --enable-libopus --enable-libvorbis --enable-libtheora
```

Windows x64 configuration:

```text
--enable-gpl --enable-version3 --enable-static --disable-w32threads --disable-autodetect --enable-cairo --enable-fontconfig --enable-iconv --enable-gnutls --enable-libxml2 --enable-gmp --enable-bzlib --enable-lzma --enable-zlib --enable-libsrt --enable-libssh --enable-libzmq --enable-avisynth --enable-sdl2 --enable-libwebp --enable-libx264 --enable-libx265 --enable-libxvid --enable-libaom --enable-libopenjpeg --enable-libvpx --enable-mediafoundation --enable-libass --enable-libfreetype --enable-libfribidi --enable-libharfbuzz --enable-libvidstab --enable-libvmaf --enable-libzimg --enable-amf --enable-cuda-llvm --enable-cuvid --enable-dxva2 --enable-d3d11va --enable-d3d12va --enable-ffnvcodec --enable-libvpl --enable-nvdec --enable-nvenc --enable-vaapi --enable-openal --enable-libgme --enable-libopenmpt --enable-libopencore-amrwb --enable-libmp3lame --enable-libtheora --enable-libvo-amrwbenc --enable-libgsm --enable-libopencore-amrnb --enable-libopus --enable-libspeex --enable-libvorbis --enable-librubberband
```

Corresponding source is available from:

- [Martin Riedl's build server](https://ffmpeg.martin-riedl.de/) and its linked
  [build script source](https://git.martin-riedl.de/ffmpeg/build-script);
- [Gyan's Windows build page](https://www.gyan.dev/ffmpeg/builds/) and its
  linked [FFmpeg 9.0.2 source commit](https://github.com/FFmpeg/FFmpeg/commit/946fcce07b);
- the upstream [FFmpeg source page](https://ffmpeg.org/download.html#build-source).

For at least three years after a binary release containing these FFmpeg builds,
Hussain Ahmed offers to provide the complete corresponding FFmpeg source used
for that release, for no more than the reasonable cost of physical transfer.
Request it at `developer.hussain125@gmail.com` and identify the app version and
artifact architecture.

## Application runtime

| Package                                | Locked version | SPDX license |
| -------------------------------------- | -------------: | ------------ |
| Electron                               |         44.7.0 | MIT          |
| React                                  |         19.3.0 | MIT          |
| React DOM                              |         19.3.0 | MIT          |
| scheduler                              |         0.28.0 | MIT          |
| @fontsource-variable/inter             |          5.3.0 | OFL-1.1      |
| @fontsource-variable/plus-jakarta-sans |          5.3.0 | OFL-1.1      |
| @tanstack/react-virtual                |        3.14.13 | MIT          |
| @tanstack/virtual-core                 |        3.17.11 | MIT          |
| @types/react                           |         19.3.0 | MIT          |
| clsx                                   |          2.1.1 | MIT          |
| csstype                                |          3.2.3 | MIT          |
| electron-log                           |          5.4.4 | MIT          |
| lucide-react                           |         1.48.0 | ISC          |
| motion                                 |         13.4.4 | MIT          |
| framer-motion                          |         13.5.1 | MIT          |
| motion-dom                             |         13.5.1 | MIT          |
| motion-utils                           |         13.5.0 | MIT          |
| tailwind-merge                         |          3.7.0 | MIT          |
| tslib                                  |          2.8.1 | 0BSD         |
| zod                                    |          4.6.5 | MIT          |
| zustand                                |         5.0.15 | MIT          |

MIT, ISC, 0BSD, and the Unlicense are permissive licenses compatible with
GPLv3. The two fonts use OFL-1.1, a free copyleft font license; it is not a
software compatibility grant and is kept as a separate license for the bundled
font files. The fonts are aggregated with the GPL application under their own
terms rather than relicensed. No runtime software dependency in the locked
graph has a known GPLv3 incompatibility.

Electron distributions include Chromium, Node.js, and their own generated
third-party notices. Those upstream notices remain within the packaged Electron
framework and are not replaced by this summary.
