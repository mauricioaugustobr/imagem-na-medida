const $ = (selector) => document.querySelector(selector);
const file = $('#file'), canvas = $('#preview'), frame = $('#crop-frame'), empty = $('#empty');
const widthInput = $('#width'), heightInput = $('#height'), zoomInput = $('#zoom');
const ctx = canvas.getContext('2d');
let image = null, imageUrl = null, x = .5, y = .5, drag = null;

function dimensions() {
  const width = Number(widthInput.value), height = Number(heightInput.value);
  const valid = Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && width <= 8000 && height <= 8000 && width * height <= 32000000;
  widthInput.setCustomValidity(valid ? '' : 'Use valores entre 1 e 8000, com até 32 milhões de pixels.');
  heightInput.setCustomValidity(valid ? '' : 'Use valores entre 1 e 8000, com até 32 milhões de pixels.');
  $('#download').disabled = !image || !valid;
  if (!valid) { $('#size-label').textContent = 'Tamanho inválido'; return null; }
  $('#size-label').textContent = `${width} × ${height} px`;
  return { width, height };
}
function draw() {
  const size = dimensions(); if (!size) return;
  const ratio = size.width / size.height;
  const maxW = Math.min(300, Math.max(100, $('#drop-zone').clientWidth - 48));
  const maxH = 370;
  const w = Math.min(maxW, maxH * ratio), h = w / ratio;
  frame.style.width = `${w}px`; frame.style.height = `${h}px`;
  canvas.width = Math.max(1, Math.round(w * devicePixelRatio)); canvas.height = Math.max(1, Math.round(h * devicePixelRatio));
  if (image) render(ctx, canvas.width, canvas.height);
}
function render(context, w, h) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * Number(zoomInput.value) / 100;
  const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
  context.clearRect(0, 0, w, h);
  context.drawImage(image, -(iw - w) * x, -(ih - h) * y, iw, ih);
}
function loadFile(selected) {
  if (!selected) return;
  if (!['image/jpeg','image/png','image/webp'].includes(selected.type)) { $('#status').textContent = 'Escolha uma imagem JPG, PNG ou WebP.'; alert('Escolha uma imagem JPG, PNG ou WebP.'); return; }
  const url = URL.createObjectURL(selected), next = new Image();
  next.onload = () => { if (imageUrl) URL.revokeObjectURL(imageUrl); imageUrl = url; image = next; x = y = .5; zoomInput.value = 100; $('#zoom-value').textContent = '100%'; zoomInput.disabled = false; empty.hidden = true; $('#replace').hidden = false; $('#status').textContent = 'Imagem carregada. Arraste a prévia para ajustar o corte.'; draw(); };
  next.onerror = () => { URL.revokeObjectURL(url); alert('Não foi possível abrir esta imagem. Escolha outro arquivo.'); };
  next.src = url;
}
$('#choose').addEventListener('click', () => file.click());
$('#replace').addEventListener('click', () => file.click());
file.addEventListener('change', () => { loadFile(file.files[0]); file.value = ''; });
$('#presets').addEventListener('click', event => { const button = event.target.closest('.preset'); if (!button) return; document.querySelectorAll('.preset').forEach(item => item.classList.toggle('active', item === button)); widthInput.value = button.dataset.width; heightInput.value = button.dataset.height; x = y = .5; draw(); });
[widthInput,heightInput].forEach(input => input.addEventListener('input', () => { document.querySelectorAll('.preset').forEach(item => item.classList.toggle('active', item.dataset.width === widthInput.value && item.dataset.height === heightInput.value)); draw(); }));
zoomInput.addEventListener('input', () => { $('#zoom-value').textContent = `${zoomInput.value}%`; draw(); });
canvas.addEventListener('pointerdown', event => { if (!image) return; drag = { px:event.clientX, py:event.clientY, x, y }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', event => { if (!drag || !image) return; const rect = canvas.getBoundingClientRect(); const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight) * Number(zoomInput.value) / 100; const overflowX = image.naturalWidth * scale - rect.width, overflowY = image.naturalHeight * scale - rect.height; if (overflowX > 0) x = Math.max(0, Math.min(1, drag.x - (event.clientX - drag.px) / overflowX)); if (overflowY > 0) y = Math.max(0, Math.min(1, drag.y - (event.clientY - drag.py) / overflowY)); draw(); });
canvas.addEventListener('pointerup', () => { drag = null; }); canvas.addEventListener('pointercancel', () => { drag = null; });
const zone = $('#drop-zone'); ['dragenter','dragover'].forEach(type => zone.addEventListener(type, event => { event.preventDefault(); zone.classList.add('dragging'); })); ['dragleave','drop'].forEach(type => zone.addEventListener(type, event => { event.preventDefault(); zone.classList.remove('dragging'); })); zone.addEventListener('drop', event => loadFile(event.dataTransfer.files[0]));
$('#download').addEventListener('click', () => { const size = dimensions(); if (!image || !size) return; const output = document.createElement('canvas'); output.width = size.width; output.height = size.height; render(output.getContext('2d'), size.width, size.height); output.toBlob(blob => { if (!blob) { alert('Não foi possível gerar a imagem. Tente um tamanho menor.'); return; } const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `imagem-na-medida-${size.width}x${size.height}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'image/png'); });
window.addEventListener('resize', draw); draw();
