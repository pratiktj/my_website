document.querySelectorAll('nav a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    if (this.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const reminderShown = sessionStorage.getItem('reminder_shown');
      document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Registration reminder popup
  const popup = document.getElementById("registrationReminder");
  if (popup) {
    setTimeout(() => {
      popup.style.display = "block";
    }, 2000); // 2 second delay for smoother experience
  }

  // Colleges page: search/filter
  const collegesForm = document.getElementById('collegesSearch');
  const collegeQueryInput = document.getElementById('collegeQuery');
  const degreeFilter = document.getElementById('degreeFilter');
  const collegeResults = document.getElementById('collegeResults');
  const collegeEmpty = document.getElementById('collegeEmptyState');
  if (collegesForm && collegeResults) {
    function applyCollegeFilter(e) {
      if (e) e.preventDefault();
      const q = (collegeQueryInput?.value || '').trim().toLowerCase();
      const deg = (degreeFilter?.value || '').trim().toLowerCase();
      const cards = Array.from(collegeResults.querySelectorAll('.college-card'));
      let visible = 0;
      cards.forEach(card => {
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const degrees = (card.getAttribute('data-degrees') || '').toLowerCase();
        const text = card.textContent.toLowerCase();
        const matchesText = !q || name.includes(q) || text.includes(q);
        const matchesDeg = !deg || degrees.split(/\s+/).includes(deg);
        const show = matchesText && matchesDeg;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (collegeEmpty) collegeEmpty.style.display = visible ? 'none' : '';
    }

    let debounceTimer;
    function debouncedFilter() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => applyCollegeFilter(), 180);
    }

    collegesForm.addEventListener('submit', applyCollegeFilter);
    collegeQueryInput?.addEventListener('input', debouncedFilter);
    degreeFilter?.addEventListener('change', applyCollegeFilter);
  }

  // Search Programs form handling
  const searchForm = document.getElementById('searchProgramsForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = (document.getElementById('searchQuery')?.value || '').trim();
      const country = (document.getElementById('searchCountry')?.value || '').trim();
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (country) params.set('country', country);
      // Redirect to colleges page with filters (can be changed later)
      const targetUrl = 'colleges.html' + (params.toString() ? ('?' + params.toString()) : '');
      window.location.href = targetUrl;
    });
  }

  // Testimonials slider
  const slider = document.querySelector('.testimonial-slider');
  const track = document.querySelector('.ts-track');
  const prevBtn = document.querySelector('.ts-control.prev');
  const nextBtn = document.querySelector('.ts-control.next');
  const dotsWrap = document.querySelector('.ts-dots');
  if (slider && track && !slider.classList.contains('ticker')) {
    const slides = Array.from(track.children);
    let index = 0;
    let slideWidth = 0;
    let autoTimer = null;

    function setSlideWidths() {
      slideWidth = slider.clientWidth;
      slides.forEach(s => {
        s.style.minWidth = slideWidth + 'px';
      });
      update();
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      update();
    }

    function update() {
      const offset = -index * slideWidth;
      track.style.transform = `translateX(${offset}px)`;
      if (dotsWrap) {
        dotsWrap.querySelectorAll('button').forEach((b, bi) => {
          b.classList.toggle('active', bi === index);
        });
      }
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => goTo(index + 1), 6000);
    }

    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    }

    // Build dots
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.addEventListener('click', () => { goTo(i); startAuto(); });
        dotsWrap.appendChild(b);
      });
    }

    // Controls
    prevBtn?.addEventListener('click', () => { goTo(index - 1); startAuto(); });
    nextBtn?.addEventListener('click', () => { goTo(index + 1); startAuto(); });

    // Resize handling
    window.addEventListener('resize', setSlideWidths);
    setSlideWidths();
    startAuto();
  }

  // Testimonials ticker (continuous marquee)
  const ticker = document.querySelector('.testimonial-slider.ticker');
  if (ticker && track) {
    // duplicate slides until width exceeds container * 2 for seamless looping
    function duplicateSlides() {
      const containerWidth = ticker.clientWidth;
      let totalWidth = track.scrollWidth;
      const original = Array.from(track.children).map(n => n.cloneNode(true));
      while (totalWidth < containerWidth * 2) {
        original.forEach(node => track.appendChild(node.cloneNode(true)));
        totalWidth = track.scrollWidth;
      }
    }

    duplicateSlides();

    let offset = 0;
    let speed = 1.2; // faster: pixels per frame (~72px/s at 60fps)
    let running = true;
    let rafId = null;

    function step() {
      if (!running) { rafId = requestAnimationFrame(step); return; }
      offset -= speed;
      const first = track.children[0];
      if (first) {
        const firstWidth = first.getBoundingClientRect().width + 16; // include margin-right from CSS
        if (-offset >= firstWidth) {
          // move first to end and adjust offset
          track.appendChild(first);
          offset += firstWidth;
        }
      }
      track.style.transform = `translateX(${offset}px)`;
      rafId = requestAnimationFrame(step);
    }

    // Pause on hover
    // Pause/resume on hover/pointer/touch
    const pause = () => { running = false; };
    const resume = () => { running = true; };
    ticker.addEventListener('mouseenter', pause);
    ticker.addEventListener('mouseleave', resume);
    ticker.addEventListener('pointerenter', pause);
    ticker.addEventListener('pointerleave', resume);
    ticker.addEventListener('touchstart', pause, { passive: true });
    ticker.addEventListener('touchend', resume, { passive: true });

    // Adjust on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // reset
        offset = 0;
        track.style.transform = 'translateX(0px)';
        // Remove clones beyond first set to avoid explosion
        const cards = Array.from(track.querySelectorAll('.testimonial-card'));
        // Keep first 6 original (approx) to avoid removing all
        if (cards.length > 6) {
          const keep = cards.slice(0, 6);
          track.innerHTML = '';
          keep.forEach(n => track.appendChild(n));
        }
        duplicateSlides();
      }, 150);
    });

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(step);
  }
});

function closeReminderPopup() {
  const popup = document.getElementById("registrationReminder");
  if (popup) popup.style.display = "none";
}