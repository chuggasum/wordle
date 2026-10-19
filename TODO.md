# Pentaglyph – before launch

- [ ] **Domain:** buy a custom domain (AdSense is unlikely to approve a shared free subdomain), then replace `https://example.com` in `index.html` (canonical, og:*, twitter tags). Optionally set `siteUrl` in `config.js`.
- [ ] **Launch date:** set `launchDate` in `config.js` to your launch day (it is currently 2026-10-19). That day becomes puzzle #1.
- [ ] **Privacy page:** fill in the `[bracketed]` parts of `privacy.html` (name, email, date) and have it reviewed.
- [x] **Hosting:** live at https://wordle.charliesummerfield01.workers.dev (Cloudflare, auto-HTTPS).
- [ ] **Auto-deploy:** connect the Cloudflare project to the `chuggasum/wordle` GitHub repo (Settings → Builds), build command empty, output folder `public`, so pushes to `main` go live.
- [ ] **Attach the custom domain** to the Cloudflare project (Settings → Domains & Routes).
- [ ] **AdSense:** apply and add the site. Once approved, in `config.js` set `ads.enabled: true`, `publisherId`, and the slot IDs (`top`, `bottom`, `side`, `result`).
- [ ] **ads.txt:** paste the line AdSense gives you into `ads.txt` and make sure it is served at the site root (`yourdomain.com/ads.txt`).
- [ ] **EU/UK/Switzerland traffic:** turn on Google's consent message in AdSense (Privacy & messaging) and set `ads.consent: 'google'` in `config.js`.
- [ ] **Word lists (optional):** review `tools/answers.txt` and `tools/allowed_extra.txt` for odd entries, then run `node tools/build-words.js` and `node tools/test.js`. Do this before launch, since changing answers changes which word falls on which day.
- [ ] **Real-device check:** try it on a phone, including the TikTok and Instagram in-app browsers, and test the share and story-image buttons.
- [ ] **Do not enable Zero Trust / Cloudflare Access** on the project – it would put a login wall in front of the public game.
- [ ] **Check `/privacy`:** `privacy.html` redirects to `/privacy` on Cloudflare; confirm the footer link works after changing the domain.
