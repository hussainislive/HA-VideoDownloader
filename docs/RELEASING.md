# Manual release process

Releases are intentionally manual in v1. No CI workflow publishes artifacts.

## 1. Prepare

1. Complete `docs/QA-CHECKLIST.md`, including Apple Silicon and Windows guides.
2. Run `npm ci`, `npm run verify:binaries`, `npm run check`,
   `npm run test:e2e:live`, the finite performance checks, and `npm audit`.
3. Confirm zero high/critical advisories and review any remaining lower-severity
   development-only findings.
4. Confirm and verify the owner-supplied final icon. Recheck GPL notices, the disclaimer,
   screenshots, known limitations, and all owner-verification items.
5. Bump `package.json` and `package-lock.json` to `X.Y.Z`; move Unreleased
   changelog entries into `[X.Y.Z] - YYYY-MM-DD`.
6. Commit the release and create the local annotated tag:

   ```sh
   git tag -a vX.Y.Z -m "HA Premium Video Downloader vX.Y.Z"
   ```

## 2. Build on the native hosts

On the Intel MacBook, run `npm run dist:mac`. This creates and package-verifies:

- `HA-Premium-Video-Downloader-X.Y.Z-mac-x64.dmg`
- `HA-Premium-Video-Downloader-X.Y.Z-mac-arm64.dmg`

On the Windows x64 laptop, run `npm ci`, `npm run check`, then
`npm run dist:win` to create:

- `HA-Premium-Video-Downloader-X.Y.Z-win-x64.exe`

Do not cross-build the Windows installer on macOS. Smoke-install every artifact
on its target hardware. Confirm binaries, licenses, shortcuts, unsigned-app
instructions, and uninstall behavior.

## 3. Checksums

Place the three artifacts together and compute `SHA256SUMS` on a trusted host.
On macOS/Linux:

```sh
shasum -a 256 HA-Premium-Video-Downloader-X.Y.Z-* > SHA256SUMS
```

On PowerShell, use `Get-FileHash -Algorithm SHA256` for each artifact and write
the same `<hash>  <filename>` format. Verify the file once on each host.

## 4. Draft and publish

1. Push the reviewed commit and `vX.Y.Z` tag only after owner approval.
2. Create a **draft GitHub Release** from that tag.
3. Paste and update `docs/RELEASE-NOTES-TEMPLATE.md`, including the download
   table, unsigned macOS/Windows steps, limitations, and corresponding source.
4. Upload both DMGs, the Windows installer, and `SHA256SUMS`.
5. Link the exact source tag, re-download and checksum every attachment, then
   publish only after the QA matrix has no unexplained failures.
