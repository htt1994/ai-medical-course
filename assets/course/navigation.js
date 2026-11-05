/* Native in-page links work without JavaScript; this adds scroll highlighting. */
(() => {
  const nav = document.querySelector('.workspace-nav');
  if (!nav) return;
  const header = document.querySelector('.site-header');
  const entries = Array.from(nav.querySelectorAll('a[href^="#"]')).map(link => ({
    link,
    target: document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))
  })).filter(entry => entry.target);
  let scheduled = false;

  function update() {
    scheduled = false;
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--course-anchor-offset', `${headerHeight + 20}px`);
    let active = entries[0];
    for (const entry of entries) {
      if (entry.target.getBoundingClientRect().top <= headerHeight + 32) active = entry;
    }
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3) {
      active = entries[entries.length - 1];
    }
    for (const entry of entries) {
      if (entry === active) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    }
  }
  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('load', schedule);
  update();
})();
