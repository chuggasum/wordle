/* Pentaglyph – ads + consent. Does nothing until enabled in config.js. */
(() => {
  'use strict';
  const A = (window.PENTA_CONFIG || {}).ads || {};
  if (!A.enabled || !/^ca-pub-\d+$/.test(A.publisherId || '')) return;

  const KEY = 'pg:consent';
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ } };
  const banner = document.getElementById('consent');
  let loaded = false;

  function slotId(name) { return (A.slots || {})[name]; }

  function fill(el) {
    if (!loaded || el.dataset.init || !el.offsetParent) return;      // not visible → wait (avoids 0-width errors)
    const id = slotId(el.dataset.slot);
    if (!id) return;
    el.dataset.init = '1';
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.dataset.adClient = A.publisherId;
    ins.dataset.adSlot = id;
    ins.dataset.adFormat = 'auto';
    ins.dataset.fullWidthResponsive = 'true';
    el.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ }
    // collapse the slot if nothing fills it
    new MutationObserver((_, ob) => {
      const st = ins.getAttribute('data-ad-status');
      if (st) { el.dataset.filled = st === 'filled' ? '1' : '0'; ob.disconnect(); }
    }).observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
  }

  function fillAll(root) { (root || document).querySelectorAll('.ad-slot[data-slot]').forEach(fill); }

  function load(personalised) {
    if (loaded) return;
    loaded = true;
    window.adsbygoogle = window.adsbygoogle || [];
    if (!personalised) window.adsbygoogle.requestNonPersonalizedAds = 1;
    const s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + A.publisherId;
    s.onload = () => fillAll();
    document.head.appendChild(s);
    fillAll();
  }

  function choose(v) { set(v); banner.hidden = true; load(v === 'yes'); }

  document.body.classList.remove('ads-off');
  document.body.classList.add('ads-on');

  window.PentaAds = { refresh: el => requestAnimationFrame(() => fillAll(el)) };

  document.getElementById('btn-cookies').addEventListener('click', () => {
    if (A.consent === 'google' && window.googlefc) { window.googlefc.callbackQueue.push({ CONSENT_DATA_READY: () => window.googlefc.showRevocationMessage() }); }
    else { banner.hidden = false; }
  });
  document.getElementById('consent-yes').onclick = () => choose('yes');
  document.getElementById('consent-no').onclick = () => choose('no');

  if (A.consent === 'google') load(true);          // Google's CMP handles consent itself
  else if (get()) load(get() === 'yes');
  else banner.hidden = false;                       // nothing loads until the visitor chooses
})();
