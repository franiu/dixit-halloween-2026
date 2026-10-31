/* Upiorne dźwięki — syntezowane w WebAudio, bez plików. */
(function () {
  let ctx = null, master = null, ambientNodes = null;
  let enabled = true, ducked = false;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
  }

  function noiseBuffer(sec) {
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function noise(sec) { const s = ctx.createBufferSource(); s.buffer = noiseBuffer(sec); return s; }
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function ok() { return ctx && enabled; }

  // ---------- Ambient: niski dron + wiatr ----------
  function startAmbient() {
    if (!ok() || ambientNodes) return;
    const t = ctx.currentTime;
    const out = ctx.createGain(); out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.16, t + 4);
    out.connect(master);
    const nodes = [out];
    [[55, 'sine'], [55.6, 'triangle'], [82.4, 'sine'], [130.8, 'sine']].forEach(([f, type], i) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 3 ? 0.08 : 0.3;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx.createGain(); lg.gain.value = g.gain.value * 0.7;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(out); o.start(); lfo.start();
      nodes.push(o, lfo);
    });
    // wiatr
    const n = noise(6); n.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.8;
    const wl = ctx.createOscillator(); wl.frequency.value = 0.08;
    const wlg = ctx.createGain(); wlg.gain.value = 350;
    wl.connect(wlg); wlg.connect(bp.frequency);
    const wg = ctx.createGain(); wg.gain.value = 0.35;
    n.connect(bp); bp.connect(wg); wg.connect(out); n.start(); wl.start();
    nodes.push(n, wl);
    ambientNodes = nodes;
  }
  function stopAmbient() {
    if (!ambientNodes) return;
    const [out, ...rest] = ambientNodes;
    try { out.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); } catch (e) {}
    setTimeout(() => rest.forEach(n => { try { n.stop(); } catch (e) {} }), 1200);
    ambientNodes = null;
  }

  // ---------- Efekty ----------
  const fx = {
    bell(pitch = 220) {
      if (!ok()) return; const t = ctx.currentTime;
      [1, 2.0, 2.4, 3.0, 4.2, 5.4].forEach((r, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = pitch * r;
        const g = ctx.createGain(); env(g, t, 0.005, 0.25 / (i + 1), 3.5 - i * 0.4);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 4);
      });
    },
    chime() {
      if (!ok()) return; const t = ctx.currentTime;
      [440, 523.25, 622.25, 739.99, 880].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const g = ctx.createGain(); env(g, t + i * 0.09, 0.01, 0.18, 1.2);
        o.connect(g); g.connect(master); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1.4);
      });
    },
    ghost() {
      if (!ok()) return; const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(620, t + 0.9);
      o.frequency.exponentialRampToValueAtTime(240, t + 2.4);
      const vib = ctx.createOscillator(); vib.frequency.value = 6;
      const vg = ctx.createGain(); vg.gain.value = 14; vib.connect(vg); vg.connect(o.frequency);
      const g = ctx.createGain(); env(g, t, 0.4, 0.22, 2.2);
      o.connect(g); g.connect(master); o.start(t); vib.start(t); o.stop(t + 2.8); vib.stop(t + 2.8);
      // szum oddechu
      const n = noise(2.5); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
      bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(1800, t + 1.2);
      bp.frequency.exponentialRampToValueAtTime(300, t + 2.4);
      const ng = ctx.createGain(); env(ng, t, 0.3, 0.25, 2);
      n.connect(bp); bp.connect(ng); ng.connect(master); n.start(t);
    },
    scream() {
      if (!ok()) return; const t = ctx.currentTime;
      [0, 7, 13].forEach(det => {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(500 + det * 10, t);
        o.frequency.exponentialRampToValueAtTime(1400 + det * 30, t + 0.25);
        o.frequency.exponentialRampToValueAtTime(900, t + 1.1);
        const vib = ctx.createOscillator(); vib.frequency.value = 11 + det / 3;
        const vg = ctx.createGain(); vg.gain.value = 60; vib.connect(vg); vg.connect(o.frequency);
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.5;
        const g = ctx.createGain(); env(g, t, 0.03, 0.18, 1.1);
        o.connect(f); f.connect(g); g.connect(master); o.start(t); vib.start(t); o.stop(t + 1.3); vib.stop(t + 1.3);
      });
      const n = noise(1); const g = ctx.createGain(); env(g, t, 0.01, 0.3, 0.8);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
      n.connect(hp); hp.connect(g); g.connect(master); n.start(t);
    },
    snap(times = 2) {
      if (!ok()) return; const t0 = ctx.currentTime;
      for (let i = 0; i < times; i++) {
        const t = t0 + i * 0.42;
        const n = noise(0.08); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
        bp.frequency.value = 2400; bp.Q.value = 1.2;
        const g = ctx.createGain(); env(g, t, 0.001, 0.9, 0.06);
        n.connect(bp); bp.connect(g); g.connect(master); n.start(t);
      }
    },
    addams() {
      // da-da-da-dum (pstryk pstryk) ×2 — klawesynowo
      if (!ok()) return; const t0 = ctx.currentTime;
      const seq = [[0, 349.2], [0.22, 392], [0.44, 440], [0.66, 466.2]];
      [0, 1.8].forEach((off, k) => {
        seq.forEach(([dt, f]) => {
          const tt = t0 + off + dt;
          const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = k ? f * 1.122 : f;
          const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
          const g = ctx.createGain(); env(g, tt, 0.004, 0.12, 0.25);
          o.connect(lp); lp.connect(g); g.connect(master); o.start(tt); o.stop(tt + 0.35);
        });
        setTimeout(() => fx.snap(2), (off + 0.95) * 1000);
      });
    },
    heartbeat(beats = 4) {
      if (!ok()) return; const t0 = ctx.currentTime;
      for (let i = 0; i < beats; i++) {
        [0, 0.22].forEach((d, j) => {
          const t = t0 + i * 0.85 + d;
          const o = ctx.createOscillator(); o.type = 'sine';
          o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
          const g = ctx.createGain(); env(g, t, 0.01, j ? 0.5 : 0.8, 0.18);
          o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
        });
      }
    },
    thunder() {
      if (!ok()) return; const t = ctx.currentTime;
      const n = noise(4); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1200, t); lp.frequency.exponentialRampToValueAtTime(120, t + 3);
      const g = ctx.createGain(); env(g, t, 0.02, 0.9, 3.5);
      n.connect(lp); lp.connect(g); g.connect(master); n.start(t);
    },
    drum() {
      if (!ok()) return; const t0 = ctx.currentTime;
      [0, 0.18, 0.36, 0.72].forEach((d, i) => {
        const t = t0 + d;
        const n = noise(0.2); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = i === 3 ? 180 : 900;
        const g = ctx.createGain(); env(g, t, 0.002, i === 3 ? 1 : 0.6, 0.15);
        n.connect(bp); bp.connect(g); g.connect(master); n.start(t);
      });
      setTimeout(() => fx.chime(), 1000);
    },
    hooves() {
      if (!ok()) return; const t0 = ctx.currentTime;
      for (let i = 0; i < 12; i++) {
        const t = t0 + i * 0.28 + (i % 2) * 0.08;
        const n = noise(0.05); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800 + (i % 3) * 200;
        const g = ctx.createGain(); env(g, t, 0.001, 0.7 * (1 - i / 13), 0.05);
        n.connect(bp); bp.connect(g); g.connect(master); n.start(t);
      }
    },
    stone() {
      if (!ok()) return; const t = ctx.currentTime;
      const n = noise(0.1); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 4;
      const g = ctx.createGain(); env(g, t, 0.001, 0.8, 0.09);
      n.connect(bp); bp.connect(g); g.connect(master); n.start(t);
      setTimeout(() => fx.bell(330), 300);
    },
    pop() {
      if (!ok()) return; const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.12);
      const g = ctx.createGain(); env(g, t, 0.003, 0.3, 0.12);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
    },
    creak() {
      if (!ok()) return; const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(60, t); o.frequency.linearRampToValueAtTime(110, t + 1.4);
      const am = ctx.createOscillator(); am.frequency.value = 28;
      const amg = ctx.createGain(); amg.gain.value = 0.5; am.connect(amg);
      const g = ctx.createGain(); g.gain.value = 0;
      amg.connect(g.gain);
      const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 700; lp.Q.value = 3;
      const out = ctx.createGain(); env(out, t, 0.1, 0.25, 1.4);
      o.connect(g); g.connect(lp); lp.connect(out); out.connect(master);
      o.start(t); am.start(t); o.stop(t + 1.6); am.stop(t + 1.6);
    }
  };
  fx.candle = () => { fx.chime(); };
  fx.balloon = () => { fx.ghost(); };
  fx.lightning = () => { fx.thunder(); };
  fx.flash = () => { fx.pop(); setTimeout(fx.ghost, 400); };
  fx.duel = () => { fx.drum(); };

  window.SpookyAudio = {
    init,
    play(name, ...args) { try { init(); fx[name] && fx[name](...args); } catch (e) { console.warn(e); } },
    startAmbient() { try { init(); startAmbient(); } catch (e) {} },
    stopAmbient,
    setEnabled(v) {
      enabled = v;
      if (master) master.gain.setTargetAtTime(v ? (ducked ? 0.2 : 0.9) : 0, ctx.currentTime, 0.1);
      if (v) startAmbient();
    },
    // ściszenie nastroju pod narrację lektora
    duck(on) {
      if (ducked === !!on) return;
      ducked = !!on;
      if (master && enabled) master.gain.setTargetAtTime(ducked ? 0.2 : 0.9, ctx.currentTime, 0.15);
    },
    get enabled() { return enabled; }
  };
})();
