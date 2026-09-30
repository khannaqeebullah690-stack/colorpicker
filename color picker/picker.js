(() => {
  const existing = document.getElementById('color-picker-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'color-picker-overlay';
  overlay.innerHTML = `
    <div class="color-picker-card">
      <div class="color-picker-icon">+</div>
      <div><strong>Color Picker</strong><span>Click any color on this page</span></div>
      <button id="color-picker-cancel" type="button">Cancel</button>
    </div>`;
  const style = document.createElement('style');
  style.textContent = `
    #color-picker-overlay { position: fixed; z-index: 2147483647; top: 20px; left: 50%; transform: translateX(-50%); font: 600 14px Arial,sans-serif; }
    .color-picker-card { display:flex; align-items:center; gap:12px; padding:12px 14px; color:#f6f7f2; background:#18221f; border:1px solid #d7f56a; border-radius:10px; box-shadow:0 8px 30px #0006; }
    .color-picker-card strong,.color-picker-card span { display:block; }.color-picker-card span { margin-top:3px; color:#bfc7bd; font-size:11px; font-weight:400; }
    .color-picker-icon { width:25px; height:25px; display:grid; place-items:center; color:#18221f; background:#d7f56a; border-radius:50%; font-size:22px; font-weight:400; }
    #color-picker-cancel { margin-left:10px; padding:6px 9px; border:1px solid #738078; border-radius:5px; color:#f6f7f2; background:transparent; cursor:pointer; }
  `;
  document.documentElement.append(style, overlay);
  const remove = () => { style.remove(); overlay.remove(); };
  document.getElementById('color-picker-cancel').addEventListener('click', remove);

  if (!window.EyeDropper) {
    overlay.querySelector('span').textContent = 'EyeDropper needs the latest Chrome or Edge';
    return;
  }
  new EyeDropper().open().then(({ sRGBHex }) => {
    const color = sRGBHex.toUpperCase();
    return chrome.storage.local.get(['recentColors']).then(({ recentColors = [] }) => {
      chrome.storage.local.set({
        selectedColor: color,
        recentColors: [color, ...recentColors.filter((item) => item !== color)].slice(0, 10)
      });
    });
  }).finally(remove);
})();