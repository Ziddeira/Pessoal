/* =========================================================
   Animação de scroll com sequência de imagens em <canvas>
   Frames: frames/frame-0001.webp … frames/frame-0300.webp
   ========================================================= */
(() => {
  'use strict';

  const CONFIG = {
    frameCount: 300,
    framePath: (n) => `frames/frame-${String(n).padStart(4, '0')}.webp`,
    // Quanto menor, mais "macia" (e atrasada) é a troca de frames. 1 = sem suavização.
    smoothing: 0.16,
    // Downloads simultâneos durante o pré-carregamento
    concurrency: 6,
    // Frames carregados antes de liberar a animação (o resto continua em segundo plano)
    keyframeStep: 10,
    // Frame mostrado parado quando o usuário prefere menos movimento
    staticFrame: 1,
    // Limite de densidade de pixels: nitidez em telas retina sem pesar no celular
    maxDpr: 2,
  };

  const section = document.querySelector('.sequence');
  const canvas = document.getElementById('sequence-canvas');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  const loader = document.getElementById('loader');
  const loaderPercent = document.getElementById('loader-percent');
  const loadingChip = document.getElementById('loading-chip');
  const progressBar = document.getElementById('sequence-progress');
  const captions = Array.from(section.querySelectorAll('.caption'));
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const frames = new Array(CONFIG.frameCount).fill(null); // HTMLImageElement quando pronto
  let loadedCount = 0;
  let failedCount = 0;
  let loaderReleased = false;
  let preloadStarted = false;

  let currentFrame = 0; // posição suavizada (pode ser fracionária)
  let targetFrame = 0; // posição pedida pelo scroll
  let drawnFrame = -1;
  let rafId = 0;
  let reducedMotion = motionQuery.matches;

  /* ---------- Canvas responsivo ---------- */

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    drawnFrame = -1;
    draw(reducedMotion ? CONFIG.staticFrame - 1 : Math.round(currentFrame));
  }

  // Procura o frame pronto mais próximo, para nunca mostrar tela vazia
  function nearestLoaded(index) {
    if (frames[index]) return frames[index];
    for (let d = 1; d < CONFIG.frameCount; d++) {
      if (frames[index - d]) return frames[index - d];
      if (frames[index + d]) return frames[index + d];
    }
    return null;
  }

  // Desenha no modo "cover": preenche a tela inteira mantendo a proporção da imagem
  function draw(index) {
    const img = nearestLoaded(index);
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;

    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    drawnFrame = index;
  }

  /* ---------- Scroll ---------- */

  function scrollProgress() {
    const rect = section.getBoundingClientRect();
    const distance = section.offsetHeight - window.innerHeight;
    if (distance <= 0) return 0;
    return Math.min(Math.max(-rect.top / distance, 0), 1);
  }

  function updateOverlay(progress) {
    progressBar.style.transform = `scaleX(${progress})`;
    section.classList.toggle('is-scrolled', progress > 0.02);

    for (const caption of captions) {
      const from = parseFloat(caption.dataset.from);
      const to = parseFloat(caption.dataset.to);
      caption.classList.toggle('is-active', progress >= from && progress < to);
    }
  }

  function onScroll() {
    if (reducedMotion) return;
    const progress = scrollProgress();
    targetFrame = progress * (CONFIG.frameCount - 1);
    updateOverlay(progress);
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    rafId = 0;
    const delta = targetFrame - currentFrame;
    currentFrame = Math.abs(delta) < 0.05 ? targetFrame : currentFrame + delta * CONFIG.smoothing;

    const index = Math.round(currentFrame);
    if (index !== drawnFrame) draw(index);

    if (currentFrame !== targetFrame) rafId = requestAnimationFrame(tick);
  }

  /* ---------- Pré-carregamento ---------- */

  function loadFrame(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
        ready.then(() => {
          frames[index] = img;
          loadedCount++;
          onFrameLoaded(index);
          resolve();
        });
      };
      img.onerror = () => {
        failedCount++;
        onFrameFailed();
        resolve();
      };
      img.src = CONFIG.framePath(index + 1);
    });
  }

  // Ordem de carregamento: frame 1, depois 1 a cada N (a animação já funciona
  // "em baixa resolução de tempo"), depois todos os que faltam.
  function loadOrder() {
    const order = [0];
    for (let i = CONFIG.keyframeStep; i < CONFIG.frameCount; i += CONFIG.keyframeStep) order.push(i);
    order.push(CONFIG.frameCount - 1);
    const seen = new Set(order);
    for (let i = 0; i < CONFIG.frameCount; i++) if (!seen.has(i)) order.push(i);
    return Array.from(new Set(order));
  }

  async function preloadAll() {
    if (preloadStarted) return;
    preloadStarted = true;

    const queue = loadOrder();
    const keyframeTotal = Math.ceil(CONFIG.frameCount / CONFIG.keyframeStep) + 1;

    const worker = async () => {
      while (queue.length) {
        await loadFrame(queue.shift());
        if (!loaderReleased && loadedCount >= keyframeTotal) releaseLoader();
      }
    };
    await Promise.all(Array.from({ length: CONFIG.concurrency }, worker));

    releaseLoader();
    loadingChip.classList.remove('is-visible');
    if (failedCount) {
      console.warn(`[sequência] ${failedCount} de ${CONFIG.frameCount} frames não foram encontrados em frames/.`);
    }
  }

  function onFrameLoaded(index) {
    const percent = Math.round((loadedCount / CONFIG.frameCount) * 100);
    loaderPercent.textContent = `${percent}%`;
    if (loaderReleased && loadedCount < CONFIG.frameCount) {
      loadingChip.textContent = `Carregando ${percent}%`;
      loadingChip.classList.add('is-visible');
    }
    // Primeiro frame (ou o frame atual) chegou: desenha na hora
    if (drawnFrame === -1 || index === Math.round(currentFrame)) draw(Math.round(currentFrame));
  }

  function onFrameFailed() {
    // Se nem o primeiro lote de frames existe, a pasta provavelmente está vazia
    if (loadedCount === 0 && failedCount >= 3) showMissingFrames();
  }

  function releaseLoader() {
    if (loaderReleased || loadedCount === 0) return;
    loaderReleased = true;
    loader.classList.add('is-hidden');
    loader.classList.remove('is-error');
    onScroll();
  }

  function showMissingFrames() {
    if (loader.classList.contains('is-error')) return;
    loader.classList.add('is-error');
    loader.querySelector('.loader__label').innerHTML =
      'Não encontrei os frames. Coloque <code>frame-0001.webp</code> … <code>frame-0300.webp</code> ' +
      'dentro da pasta <code>frames/</code>, ao lado do <code>index.html</code>.';
  }

  /* ---------- Menos movimento ---------- */

  function loadStaticFrame() {
    const index = CONFIG.staticFrame - 1;
    if (frames[index]) {
      loader.classList.add('is-hidden');
      draw(index);
      return;
    }
    loadFrame(index).then(() => {
      if (frames[index]) {
        loader.classList.add('is-hidden');
        draw(index);
      } else {
        showMissingFrames();
      }
    });
  }

  function applyMotionPreference() {
    reducedMotion = motionQuery.matches;
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);

    if (reducedMotion) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      captions.forEach((c, i) => c.classList.toggle('is-active', i === 0));
      requestAnimationFrame(resizeCanvas);
      loadStaticFrame();
    } else {
      requestAnimationFrame(() => {
        resizeCanvas();
        currentFrame = targetFrame = scrollProgress() * (CONFIG.frameCount - 1);
        onScroll();
      });
      preloadAll();
    }
  }

  /* ---------- Revelação das seções e contadores ---------- */

  function setupReveal() {
    const targets = document.querySelectorAll('.section .container > *, .stat, .timeline__item');
    if (!('IntersectionObserver' in window)) return;

    targets.forEach((el) => el.classList.add('reveal'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          if (entry.target.matches('.stat')) countUp(entry.target.querySelector('[data-count]'));
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    targets.forEach((el) => observer.observe(el));
  }

  function countUp(el) {
    const end = parseInt(el.dataset.count, 10);
    if (reducedMotion || !end) return;
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  // Esconde imagens de conteúdo que não existirem (o fundo da moldura assume)
  document.querySelectorAll('.team__photo img').forEach((img) => {
    const markMissing = () => img.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) markMissing();
    else img.addEventListener('error', markMissing, { once: true });
  });

  /* ---------- Início ---------- */

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  if ('ResizeObserver' in window) {
    new ResizeObserver(resizeCanvas).observe(canvas);
  } else {
    window.addEventListener('resize', resizeCanvas);
  }

  if (motionQuery.addEventListener) motionQuery.addEventListener('change', applyMotionPreference);
  else if (motionQuery.addListener) motionQuery.addListener(applyMotionPreference);

  applyMotionPreference();
  setupReveal();
})();
