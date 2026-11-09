(() => {
  "use strict";

  const WHATSAPP_NUMBER = "520000000000";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mqDesktop = window.matchMedia("(min-width: 1024px)");

  /* ---------- Page ready (fade-in) ---------- */
  const markReady = () => document.body.classList.add("is-ready");
  if (document.readyState === "complete") {
    requestAnimationFrame(markReady);
  } else {
    window.addEventListener("load", () => requestAnimationFrame(markReady), { once: true });
    // Fallback si load tarda (fuentes externas)
    setTimeout(markReady, 1200);
  }

  /* ---------- Year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Hero orchestration ---------- */
  const hero = document.getElementById("inicio");
  const particles = hero?.querySelector(".hero__particles");

  const startHero = () => {
    if (!hero) return;
    hero.classList.add("is-orchestrated");
  };

  if (reduceMotion) {
    hero?.classList.add("is-orchestrated");
  } else {
    requestAnimationFrame(() => requestAnimationFrame(startHero));
  }

  /* Pausar partículas fuera de vista / pestaña oculta */
  const setParticlesPaused = (paused) => {
    particles?.classList.toggle("is-paused", paused);
  };

  if (hero && particles && "IntersectionObserver" in window) {
    const heroIO = new IntersectionObserver(
      ([entry]) => setParticlesPaused(!entry.isIntersecting || document.hidden),
      { threshold: 0.05 }
    );
    heroIO.observe(hero);
  }

  document.addEventListener("visibilitychange", () => {
    setParticlesPaused(document.hidden);
  });

  /* ---------- Header: scroll + hide on down ---------- */
  const header = document.getElementById("header");
  let lastY = window.scrollY;
  let ticking = false;

  const onScrollFrame = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("header--scrolled", y > 24);

      // No ocultar si el menú móvil está abierto
      const locked = document.body.classList.contains("is-scroll-locked");
      if (!reduceMotion && !locked) {
        const goingDown = y > lastY && y > 120;
        header.classList.toggle("header--hidden", goingDown);
      } else {
        header.classList.remove("header--hidden");
      }
    }

    // Parallax sutil solo desktop
    if (hero && mqDesktop.matches && !reduceMotion) {
      const offset = Math.min(y * 0.12, 48);
      hero.style.setProperty("--parallax-y", `${offset}px`);
    } else if (hero) {
      hero.style.setProperty("--parallax-y", "0px");
    }

    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    },
    { passive: true }
  );
  onScrollFrame();

  /* ---------- Mobile nav + scroll lock ---------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("nav-toggle");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  const syncScrollLock = () => {
    const locked =
      Boolean(nav?.classList.contains("is-open")) ||
      Boolean(lightbox && !lightbox.hidden);
    document.body.classList.toggle("is-scroll-locked", locked);
  };

  const setNavOpen = (open) => {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    syncScrollLock();
    if (!open) header?.classList.remove("header--hidden");
  };

  if (navToggle) {
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = navToggle.getAttribute("aria-expanded") !== "true";
      setNavOpen(open);
    });
  }

  document.querySelectorAll(".nav__link, .header__cta").forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  // Cerrar al clic fuera
  document.addEventListener("click", (e) => {
    if (!nav?.classList.contains("is-open")) return;
    const t = e.target;
    if (nav.contains(t) || navToggle?.contains(t)) return;
    setNavOpen(false);
  });

  /* ---------- Reveal + stagger ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  // Agrupa hermanos para stagger 60–120ms
  const applyStagger = () => {
    const parents = new Set();
    revealEls.forEach((el) => {
      if (el.parentElement) parents.add(el.parentElement);
    });
    parents.forEach((parent) => {
      const siblings = Array.from(parent.children).filter((c) => c.classList.contains("reveal"));
      siblings.forEach((el, i) => {
        const delay = Math.min(i * 80, 400);
        el.style.setProperty("--reveal-delay", `${delay}ms`);
      });
    });
  };
  applyStagger();

  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Lightbox ---------- */
  let lastFocus = null;
  let touchStartX = 0;

  const openLightbox = (src, alt) => {
    if (!lightbox || !lightboxImg) return;
    lastFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "Imagen ampliada";
    lightbox.hidden = false;
    syncScrollLock();
    lightbox.querySelector(".lightbox__close")?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImg) return;
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    lightboxImg.alt = "";
    syncScrollLock();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  document.querySelectorAll(".gallery__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const full = btn.getAttribute("data-full");
      const img = btn.querySelector("img");
      if (!full || !img) return;
      openLightbox(full, img.alt);
    });
  });

  lightbox?.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", closeLightbox);
  });

  // Swipe down / sideways para cerrar en móvil
  lightboxImg?.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );

  lightboxImg?.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 70) closeLightbox();
    },
    { passive: true }
  );

  /* ---------- Testimonials carousel + swipe ---------- */
  const carousel = document.getElementById("carousel");
  const slides = carousel ? Array.from(carousel.querySelectorAll(".carousel__slide")) : [];
  const dotsWrap = document.getElementById("carousel-dots");
  const statusEl = document.getElementById("carousel-status");
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");

  let current = 0;
  let timer = null;
  const INTERVAL = 7000;
  let swipeX = 0;

  const announce = (index) => {
    if (!statusEl) return;
    statusEl.textContent = `Testimonio ${index + 1} de ${slides.length}`;
  };

  const goTo = (index) => {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    dotsWrap?.querySelectorAll(".carousel__dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
      dot.setAttribute("aria-selected", String(i === current));
    });

    announce(current);
  };

  const stopAutoplay = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const startAutoplay = () => {
    if (reduceMotion || slides.length < 2 || document.hidden) return;
    stopAutoplay();
    timer = window.setInterval(() => goTo(current + 1), INTERVAL);
  };

  if (slides.length && dotsWrap) {
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `carousel__dot${i === 0 ? " is-active" : ""}`;
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Ir al testimonio ${i + 1}`);
      dot.setAttribute("aria-selected", String(i === 0));
      dot.addEventListener("click", () => {
        goTo(i);
        startAutoplay();
      });
      dotsWrap.appendChild(dot);
    });
  }

  prevBtn?.addEventListener("click", () => {
    goTo(current - 1);
    startAutoplay();
  });

  nextBtn?.addEventListener("click", () => {
    goTo(current + 1);
    startAutoplay();
  });

  if (carousel) {
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(current - 1);
        startAutoplay();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(current + 1);
        startAutoplay();
      }
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", (e) => {
      if (!carousel.contains(e.relatedTarget)) startAutoplay();
    });

    carousel.addEventListener(
      "touchstart",
      (e) => {
        swipeX = e.changedTouches[0].clientX;
        stopAutoplay();
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - swipeX;
        if (dx > 50) goTo(current - 1);
        else if (dx < -50) goTo(current + 1);
        startAutoplay();
      },
      { passive: true }
    );
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  goTo(0);
  startAutoplay();

  /* ---------- Global Escape ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (lightbox && !lightbox.hidden) {
      closeLightbox();
      return;
    }
    setNavOpen(false);
  });

  /* ---------- Contact form → WhatsApp ---------- */
  const form = document.getElementById("contact-form");

  const setError = (name, message) => {
    const field = form?.querySelector(`[name="${name}"]`)?.closest(".form__field");
    const error = form?.querySelector(`[data-error-for="${name}"]`);
    if (field) field.classList.toggle("is-invalid", Boolean(message));
    if (error) error.textContent = message || "";
  };

  const validators = {
    nombre: (v) => (v.trim().length < 2 ? "Ingresa tu nombre." : ""),
    telefono: (v) => (v.trim().length < 8 ? "Ingresa un teléfono válido." : ""),
    servicio: (v) => (!v ? "Selecciona un servicio." : ""),
    fecha: (v) => (!v ? "Elige una fecha preferida." : ""),
    mensaje: (v) => (v.trim().length < 5 ? "Escribe un mensaje breve." : ""),
  };

  if (form) {
    Object.keys(validators).forEach((name) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      input.addEventListener("input", () => setError(name, ""));
      input.addEventListener("change", () => setError(name, ""));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = {
        nombre: form.nombre.value,
        telefono: form.telefono.value,
        servicio: form.servicio.value,
        fecha: form.fecha.value,
        mensaje: form.mensaje.value,
      };

      let valid = true;
      Object.entries(validators).forEach(([name, fn]) => {
        const msg = fn(data[name]);
        setError(name, msg);
        if (msg) valid = false;
      });

      if (!valid) {
        form
          .querySelector(".form__field.is-invalid input, .form__field.is-invalid select, .form__field.is-invalid textarea")
          ?.focus();
        return;
      }

      const text = [
        "Hola ZAMÁ, quiero reservar una cita.",
        "",
        `Nombre: ${data.nombre.trim()}`,
        `Teléfono: ${data.telefono.trim()}`,
        `Servicio: ${data.servicio}`,
        `Fecha preferida: ${data.fecha}`,
        `Mensaje: ${data.mensaje.trim()}`,
      ].join("\n");

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
})();
