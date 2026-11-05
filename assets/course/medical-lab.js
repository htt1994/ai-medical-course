/* Deterministic synthetic-image thresholding exercise. No patient data or ML model. */
(() => {
  'use strict';
  const size = 160;
  const threshold = document.getElementById('threshold');
  const noise = document.getElementById('noise');
  const reference = document.getElementById('show-reference');
  const contexts = ['input-image', 'prediction-image', 'comparison-image'].map(id => document.getElementById(id).getContext('2d'));
  const samples = [];
  let seed = 2026;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - 80) / 59, dy = (y - 80) / 66;
      const inBody = dx * dx + dy * dy < 1;
      const region = ((x - 96) / 19) ** 2 + ((y - 67) / 15) ** 2 < 1;
      const distance = Math.sqrt(((x - 96) / 19) ** 2 + ((y - 67) / 15) ** 2);
      const blob = 112 * Math.exp(-distance * distance * .74);
      const texture = 8 * Math.sin(x * .17) * Math.cos(y * .13);
      const distractor = 65 * Math.exp(-(((x - 56) / 7) ** 2 + ((y - 98) / 15) ** 2));
      samples.push({inside:inBody, truth:region, intensity:inBody ? 63 + texture + blob + distractor : 8, jitter:random() + random() + random() - 1.5});
    }
  }
  const truthAt = (x, y) => x >= 0 && y >= 0 && x < size && y < size && samples[y * size + x].truth;
  function render() {
    const cut = Number(threshold.value), amplitude = Number(noise.value);
    document.getElementById('threshold-value').textContent = cut;
    document.getElementById('noise-value').textContent = amplitude;
    const images = contexts.map(ctx => ctx.createImageData(size, size));
    let tp = 0, fp = 0, fn = 0;
    samples.forEach((s, i) => {
      const intensity = Math.max(0, Math.min(255, Math.round(s.intensity + s.jitter * amplitude)));
      const positive = intensity >= cut;
      if (positive && s.truth) tp++;
      else if (positive) fp++;
      else if (s.truth) fn++;
      let color = [intensity, intensity, intensity];
      if (positive && s.truth) color = [66, 182, 133];
      else if (positive) color = [232, 173, 88];
      else if (s.truth) color = [200, 121, 150];
      const x = i % size, y = Math.floor(i / size);
      const boundary = s.truth && (!truthAt(x-1,y) || !truthAt(x+1,y) || !truthAt(x,y-1) || !truthAt(x,y+1));
      const pixels = [[intensity, intensity, intensity], positive ? [240, 245, 238] : [14, 24, 20], color];
      if (reference.checked && boundary) pixels[0] = [105, 222, 162];
      pixels.forEach((rgb, k) => {
        images[k].data.set([...rgb, 255], i * 4);
      });
    });
    contexts.forEach((ctx, i) => ctx.putImageData(images[i], 0, 0));
    const dice = 2 * tp / (2 * tp + fp + fn);
    const iou = tp / (tp + fp + fn);
    document.getElementById('dice-value').textContent = dice.toFixed(3);
    document.getElementById('iou-value').textContent = iou.toFixed(3);
    document.getElementById('fp-value').textContent = fp.toLocaleString('zh-CN');
    document.getElementById('fn-value').textContent = fn.toLocaleString('zh-CN');
    document.getElementById('lab-feedback').textContent = `当前阈值 ${cut}，噪声幅度 ${amplitude}：重叠 ${tp} 像素，误分 ${fp} 像素，漏分 ${fn} 像素。${fp > fn ? '当前误分多于漏分，可尝试提高阈值并观察变化。' : '当前漏分不少于误分，可尝试降低阈值并观察变化。'}`;
    // Counts exposed as data attributes for inspection and reproducible checks.
    document.getElementById('dice-value').dataset.tp = tp;
    document.getElementById('dice-value').dataset.fp = fp;
    document.getElementById('dice-value').dataset.fn = fn;
  }
  threshold.addEventListener('input', render);
  noise.addEventListener('input', render);
  reference.addEventListener('change', render);
  document.getElementById('reset-lab').addEventListener('click', () => {
    threshold.value = 140;
    noise.value = 12;
    reference.checked = true;
    render();
  });
  render();
})();
