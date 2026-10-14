/* ====== 兩個小遊戲共用：內容資料、音效、語音、小特效 ====== */
(function (global) {
  'use strict';

  // ---------- 內容資料 ----------
  const LETTERS = [
    ['A', 'Apple', '🍎'], ['B', 'Banana', '🍌'], ['C', 'Cat', '🐱'], ['D', 'Dog', '🐶'],
    ['E', 'Elephant', '🐘'], ['F', 'Fish', '🐟'], ['G', 'Grapes', '🍇'], ['H', 'Hat', '🎩'],
    ['I', 'Ice cream', '🍦'], ['J', 'Juice', '🧃'], ['K', 'Kite', '🪁'], ['L', 'Lion', '🦁'],
    ['M', 'Monkey', '🐵'], ['N', 'Nose', '👃'], ['O', 'Orange', '🍊'], ['P', 'Pig', '🐷'],
    ['Q', 'Queen', '👸'], ['R', 'Rabbit', '🐰'], ['S', 'Sun', '☀️'], ['T', 'Tiger', '🐯'],
    ['U', 'Umbrella', '☂️'], ['V', 'Violin', '🎻'], ['W', 'Watermelon', '🍉'], ['X', 'Xylophone', '🎶'],
    ['Y', 'Yo-yo', '🪀'], ['Z', 'Zebra', '🦓'],
  ];
  const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const NUMBER_NOUNS = ['apple', 'chicks', 'balloons', 'stars', 'strawberries', 'fish', 'flowers', 'cookies', 'frogs', 'cars'];
  const NUMBER_PICS  = ['🍎', '🐥', '🎈', '⭐', '🍓', '🐟', '🌸', '🍪', '🐸', '🚗'];
  // 格式統一成 [字, 單字, 圖]，數字的「單字」是英文數字
  const NUMBERS = NUMBER_WORDS.map((w, i) => [String(i + 1), w, NUMBER_PICS[i]]);

  // 每一頁輪流換的背景色（高飽和、配白字）
  const COLORS = ['#ef5350', '#ff7043', '#ffa726', '#66bb6a', '#26a69a', '#29b6f6', '#5c6bc0', '#ab47bc', '#ec407a', '#8d6e63'];

  // ---------- 音效：Web Audio 合成，不需音檔 ----------
  let audioCtx = null;
  function ensureAudio() {
    // 行動瀏覽器要有使用者手勢後才允許建立/恢復 AudioContext，所以每次點擊都呼叫一次
    if (!audioCtx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  function tone(freq, duration, type, gainValue, when) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime + (when || 0);
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(gainValue || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }
  const sfx = {
    tap()   { tone(880, 0.12, 'triangle', 0.25); },
    pop()   { tone(1200, 0.08, 'square', 0.12); },
    swipe() { tone(520, 0.1, 'sine', 0.2); tone(780, 0.12, 'sine', 0.2, 0.08); },
    start() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.2, i * 0.1)); },
    // 答對：上行小旋律；答錯：低而短、不刺耳
    yay()   { [659, 784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.22, i * 0.09)); },
    nope()  { tone(300, 0.18, 'sine', 0.15); },
  };

  // ---------- 語音：Web Speech API，英文 ----------
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in global)) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    voice = voices.find(v => /^en[-_]US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in global) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function speak(text) {
    if (!('speechSynthesis' in global)) return;
    speechSynthesis.cancel();   // 連點時打斷上一句，不排隊
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    u.rate = 0.85;   // 稍慢，小小孩聽得清楚
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  }
  function stopSpeak() {
    if ('speechSynthesis' in global) speechSynthesis.cancel();
  }

  // ---------- 小特效 ----------
  function bounce(el) {
    el.classList.remove('bounce');
    void el.offsetWidth;   // 強制 reflow 讓動畫可重播
    el.classList.add('bounce');
  }
  function spawnStars(x, y, count) {
    const n = count || 6;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.textContent = ['⭐', '✨', '🌟'][i % 3];
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      const ang = (Math.PI * 2 * i) / n;
      s.style.setProperty('--dx', Math.cos(ang) * 160 + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * 160 + 'px');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  // 避免 iOS 雙擊放大
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch < 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

  global.Baby = { LETTERS, NUMBERS, NUMBER_WORDS, NUMBER_NOUNS, COLORS, ensureAudio, sfx, speak, stopSpeak, bounce, spawnStars };
})(window);
