# Pentaglyph

Static site – the `public/` folder is the whole website. No build step. Cloudflare Pages: build command empty, output directory `public`.

## Go-live checklist
1. **Domain:** replace `https://example.com` in `public/index.html` (canonical + og/twitter tags). Optionally set `siteUrl` in `public/config.js`.
2. **Launch date:** set `launchDate` in `public/config.js` to your launch day (puzzle #1).
3. **Privacy page:** fill the `[bracketed]` parts in `public/privacy.html` (have it reviewed).
4. **Ads:** apply for AdSense and add the site. Then in `public/config.js` set `ads.enabled: true`, `publisherId`, and slot IDs.
   Put the `ads.txt` line AdSense gives you in `public/ads.txt` and serve it from the site root.
   Serving to EEA/UK/Switzerland: turn on Google's consent message in AdSense (Privacy & messaging) and set `ads.consent: 'google'`.
5. Serve over HTTPS (needed for sharing, service worker/offline, and "add to home screen").

## Maintenance
- Word lists: edit `tools/answers.txt` / `tools/allowed_extra.txt`, then `node tools/build-words.js` and `node tools/test.js`.
  Changing `answers.txt` changes which word falls on which day – do it before launch, not after.
- Regenerate icons/social image: `python tools/make-images.py` (needs Pillow).
