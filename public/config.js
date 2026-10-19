// Site settings – edit this file, nothing else needs touching.
window.PENTA_CONFIG = {
  // Public URL used in share text. Leave '' to use the page's own address.
  siteUrl: '',

  // Puzzle #1 is on this date (set to your launch day) (local time), YYYY-MM-DD.
  launchDate: '2026-10-19',

  ads: {
    // Flip to true once your AdSense account is approved and IDs are filled in.
    enabled: false,
    publisherId: '',            // e.g. 'ca-pub-1234567890123456'
    // 'builtin'  = use the banner in this site (simple; fine outside EEA/UK/CH)
    // 'google'   = you turned on Google's certified consent message in AdSense
    //              (Privacy & messaging); required for EEA/UK/CH traffic
    consent: 'builtin',
    // AdSense ad unit IDs (create "Display ads" → responsive). Leave '' to skip a slot.
    slots: {
      top: '',      // under the header, only on tall screens
      bottom: '',   // below the keyboard (scroll to see)
      side: '',     // left/right rails on wide desktop screens
      result: ''    // inside the results popup
    }
  }
};
