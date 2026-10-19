# AdSense checklist (for a real website)

Based on general AdSense requirements as I understand them. Check Google's current program policies before applying.

## Account and legal
- [ ] 18 or older, with a Google account
- [ ] Identity, address and payment details ready (Google may post a PIN to your address)
- [ ] Tax details ready for the AdSense payments settings (have your ABN handy if you operate as a business; check abr.gov.au "Do I need an ABN?")
- [ ] Bank account for payouts (payment threshold is roughly US$100)

## The site
- [ ] Own domain (free shared subdomains like workers.dev rarely get approved)
- [ ] Real, original content. Thin or empty sites are the most common rejection reason
- [ ] Privacy policy that mentions ads and cookies, with no placeholder text
- [ ] About page and a contact page or email address
- [ ] Easy navigation, works well on phones
- [ ] Nothing that breaks Google's AdSense program policies (no copied or adult content)
- [ ] Live for a few weeks with some real visitors before applying (not required, but it helps)

## Technical
- [ ] HTTPS (Cloudflare provides this)
- [ ] `ads.txt` at the site root with the line AdSense gives you
- [ ] Consent for EEA, UK and Switzerland: turn on Google's consent message in AdSense and set `ads.consent: 'google'` in `public/config.js`
- [ ] Add the AdSense site-verification code to your pages
- [ ] In `public/config.js` set `ads.enabled: true`, `publisherId`, and the slot IDs

## While you wait for review (days to a few weeks)
- [ ] Do not click your own ads or ask others to
- [ ] Keep the site live and don't change the domain
- [ ] Keep adding useful content
