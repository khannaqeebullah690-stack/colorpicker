const DEFAULT_COLOR = '#E8E4DD';
const colorPreview = document.getElementById('colorPreview');
const hexValue = document.getElementById('hexValue');
const hexCode = document.getElementById('hexCode');
const rgbCode = document.getElementById('rgbCode');
const hslCode = document.getElementById('hslCode');
const message = document.getElementById('message');
const swatches = document.getElementById('swatches');

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  let h = 0; let s = 0; const l = (max + min) / 2; const delta = max - min;
  if (delta) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60); if (h < 0) h += 360;
  }
  return `${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

const nativePicker = document.getElementById('nativeColorPicker');

function renderColor(hex) {
  const rgb = hexToRgb(hex);
  colorPreview.style.backgroundColor = hex;
  hexValue.textContent = hex;
  hexCode.value = hex;
  rgbCode.value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  hslCode.value = rgbToHsl(rgb);
  if (nativePicker) nativePicker.value = hex;
}

function renderSwatches() {
  const recent = JSON.parse(localStorage.getItem('recentColors') || '[]');
  swatches.innerHTML = recent.length ? '' : '<span class="empty-state">Your picked colors will appear here.</span>';
  recent.forEach((color) => {
    const button = document.createElement('button');
    button.className = 'swatch'; button.type = 'button'; button.title = color;
    button.style.backgroundColor = color;
    button.addEventListener('click', () => {
      renderColor(color);
      if (nativePicker) nativePicker.value = color;
      chrome.storage.local.set({ selectedColor: color });
    });
    swatches.appendChild(button);
  });
}

function saveColor(color) {
  const recent = JSON.parse(localStorage.getItem('recentColors') || '[]');
  localStorage.setItem('recentColors', JSON.stringify([color, ...recent.filter((item) => item !== color)].slice(0, 50)));
  renderSwatches();
}

async function pickColor() {
  message.textContent = '';
  if (!window.EyeDropper) {
    message.textContent = 'Use the latest Chrome or Edge to pick a color.';
    return;
  }

  try {
    const { sRGBHex } = await new EyeDropper().open();
    const color = sRGBHex.toUpperCase();
    const { recentColors = [] } = await chrome.storage.local.get(['recentColors']);
    const updatedColors = [color, ...recentColors.filter((item) => item !== color)].slice(0, 50);
    await chrome.storage.local.set({ selectedColor: color, recentColors: updatedColors });
    localStorage.setItem('recentColors', JSON.stringify(updatedColors));
    renderColor(color);
    renderSwatches();
  } catch (error) {
    console.error(error);
  }
}

if (nativePicker) {
  nativePicker.addEventListener('input', (event) => {
    const color = event.target.value.toUpperCase();
    renderColor(color);
  });
  nativePicker.addEventListener('change', async (event) => {
    const color = event.target.value.toUpperCase();
    const { recentColors = [] } = await chrome.storage.local.get(['recentColors']);
    const updatedColors = [color, ...recentColors.filter((item) => item !== color)].slice(0, 50);
    await chrome.storage.local.set({ selectedColor: color, recentColors: updatedColors });
    localStorage.setItem('recentColors', JSON.stringify(updatedColors));
    renderColor(color);
    renderSwatches();
  });
}

hexCode.addEventListener('change', (e) => {
  const value = e.target.value.trim();
  if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(value)) {
    const fullHex = value.length === 4 ? '#' + value[1]+value[1]+value[2]+value[2]+value[3]+value[3] : value;
    saveColor(fullHex.toUpperCase());
    renderColor(fullHex.toUpperCase());
  }
});

document.getElementById('pickButton').addEventListener('click', pickColor);
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && event.target === document.body) { event.preventDefault(); pickColor(); }
});
document.querySelectorAll('.copy-button').forEach((button) => button.addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).value);
  button.textContent = 'COPIED'; button.classList.add('copied');
  setTimeout(() => { button.textContent = 'COPY'; button.classList.remove('copied'); }, 1200);
}));
document.getElementById('clearButton').addEventListener('click', () => { localStorage.removeItem('recentColors'); renderSwatches(); });

renderColor(DEFAULT_COLOR);
renderSwatches();
chrome.storage.local.get(['selectedColor', 'recentColors']).then(({ selectedColor, recentColors }) => {
  if (selectedColor) renderColor(selectedColor);
  if (recentColors) {
    localStorage.setItem('recentColors', JSON.stringify(recentColors));
    renderSwatches();
  }
});