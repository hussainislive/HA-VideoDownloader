# Public release checklist

The repository stays private until every item below is reviewed by the owner.

## Repository and history

- [ ] Install gitleaks and scan the entire Git history from the repository root:

  ```sh
  gitleaks git --redact --log-opts="--all" .
  ```

- [ ] Review every finding; remove real secrets from current content and decide
      explicitly whether history rewriting is required before publication.
- [ ] Search tracked files and all historical commits for personal data,
      private filesystem paths, email addresses beyond the intentional public
      contact, tokens, cookies, logs, and media URLs.
- [ ] Confirm `binaries/`, `release/`, downloads, logs, and local environment
      files have never been committed.
- [ ] Review all owner-provided `design/` contents and image metadata for safe
      public redistribution.

## GitHub settings

- [ ] Set the description, homepage, and topics (`electron`, `react`, `yt-dlp`,
      `ffmpeg`, `video-downloader`, `typescript`).
- [ ] Set the detected repository license to GPL-3.0-or-later.
- [ ] Enable private vulnerability reporting and point security questions to
      `SECURITY.md`.
- [ ] Review issue templates, pull request template, code of conduct, and
      contribution guide.
- [ ] Keep Releases empty until the signed-off draft release is ready.

## Product truthfulness

- [ ] Review every README feature, platform, privacy, and performance claim
      against the final artifacts.
- [x] Confirm the owner-supplied final icon and run `npm run verify:icon`.
- [ ] Complete the Apple Silicon and Windows test guides.
- [ ] Confirm GPL notices, FFmpeg corresponding-source links, checksums, and
      disclaimer text are present in both packages and the repository.
