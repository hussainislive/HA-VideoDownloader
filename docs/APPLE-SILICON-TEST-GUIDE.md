# Apple Silicon test guide

Use this checklist on a physical M-series Mac for the arm64 release candidate.
Send the completed checklist and diagnostic text back to the developer.

## Install and identify the build

1. Download `HA-Premium-Video-Downloader-1.0.0-mac-arm64.dmg` and its published
   `SHA256SUMS` entry. Confirm the checksum with
   `shasum -a 256 <downloaded-dmg>`.
2. Open the DMG and drag the app to Applications.
3. Because this build is unsigned/not notarized, first try Control-clicking the
   app, choosing **Open**, then confirming **Open**. If macOS still blocks it,
   run `xattr -cr "/Applications/HA Premium Video Downloader.app"` and try
   again.
4. Open Terminal, run `uname -m`, and record the result. It must be `arm64`.
5. Launch the app and confirm the title bar says **Engine Ready**. In Settings,
   record the yt-dlp and FFmpeg versions.

## Functional checks

- [ ] Paste a public URL, wait for its real preview, download a short 480p or
      720p video, and play the completed file.
- [ ] Download a short audio item as MP3 and play it.
- [ ] Start a slower video, pause after progress begins, quit/relaunch if
      practical, resume it, and confirm the completed file works.
- [ ] Cancel a partial download and confirm no related `.part`, `.ytdl`, temp,
      or fragment files remain.
- [ ] Verify notifications, Dock badge, traffic lights, resize, fullscreen, and
      close-with-active-download confirmation.

## Confirm native execution

While a download is active, open Activity Monitor. Add or inspect the **Kind**
column for the app, yt-dlp, and FFmpeg processes. Each must show **Apple**, not
**Intel**. If anything shows Intel, stop and report which process and artifact
was used.

Finally choose **Help → Copy diagnostic info**, paste the redacted report into
the test response, and send it with the checksum, macOS version, Mac model, and
completed checklist. Do not send media URLs or downloaded files.
