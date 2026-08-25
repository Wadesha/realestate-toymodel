/* ============================================================
   VIS·LAB 共享脚本 — 画布挂载 / FPS / 循环 / 控件绑定 / 噪声
   所有实验页复用，禁止页面内重复造轮子
   ============================================================ */
(function () {
  "use strict";

  var TAU = Math.PI * 2;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) {
    if (a === undefined) return Math.random();
    if (b === undefined) return Math.random() * a;
    return a + Math.random() * (b - a);
  }
  function randi(a, b) { return Math.floor(rand(a, b + 1)); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function hsl(h, s, l, a) {
    if (a === undefined) return "hsl(" + h + "," + s + "%," + l + "%)";
    return "hsla(" + h + "," + s + "%," + l + "%," + a + ")";
  }
  function $(id) { return document.getElementById(id); }

  /* ---------- 画布挂载：DPR 自适应 + 尺寸跟随 ---------- */
  function mount(canvas) {
    var ctx = canvas.getContext("2d");
    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas._w = r.width;
      canvas._h = r.height;
    }
    resize();
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }
    return {
      canvas: canvas,
      ctx: ctx,
      get w() { return canvas._w || 1; },
      get h() { return canvas._h || 1; },
      resize: resize
    };
  }

  /* ---------- FPS 计 ---------- */
  function fps(el) {
    var last = performance.now(), frames = 0, acc = 0;
    return {
      tick: function () {
        var now = performance.now();
        acc += now - last;
        last = now;
        frames++;
        if (acc >= 500) {
          el.textContent = Math.round(frames * 1000 / acc) + " fps";
          frames = 0;
          acc = 0;
        }
      }
    };
  }

  /* ---------- rAF 主循环：fn(dt秒, t秒)，返回 false 停止 ---------- */
  function loop(fn) {
    var last = performance.now(), t0 = last;
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (fn(dt, (now - t0) / 1000) === false) return;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 控件绑定 ---------- */
  /* range：自动联动 output#id-val；cb(v) 初始即触发一次 */
  function bindRange(id, cb, fmt) {
    var input = $(id);
    if (!input) return null;
    var out = $(id + "-val");
    function apply() {
      var v = parseFloat(input.value);
      if (out) out.textContent = fmt ? fmt(v) : v;
      if (cb) cb(v);
    }
    input.addEventListener("input", apply);
    apply();
    return input;
  }

  /* 分段按钮组：点击切换 .active 并回调 data-v；初始回调当前 active */
  function bindSeg(id, cb) {
    var box = $(id);
    if (!box) return null;
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || !box.contains(b)) return;
      var btns = box.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("active", btns[i] === b);
      if (cb) cb(b.dataset.v);
    });
    var cur = box.querySelector("button.active");
    if (cur && cb) cb(cur.dataset.v);
    return box;
  }

  /* ---------- 2D Perlin 噪声（确定性实现） ---------- */
  var perm = new Uint8Array(512);
  (function () {
    var p = new Uint8Array(256);
    for (var i = 0; i < 256; i++) p[i] = i;
    for (var j = 255; j > 0; j--) {
      var k = (Math.random() * (j + 1)) | 0;
      var tmp = p[j]; p[j] = p[k]; p[k] = tmp;
    }
    for (var m = 0; m < 512; m++) perm[m] = p[m & 255];
  })();

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

  function grad(h, x, y) {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  }

  /* 返回约 [-1, 1] */
  function n2(x, y) {
    var fx = Math.floor(x), fy = Math.floor(y);
    var X = fx & 255, Y = fy & 255;
    x -= fx; y -= fy;
    var u = fade(x), v = fade(y);
    var a = perm[perm[X] + Y], b = perm[perm[X + 1] + Y];
    var c = perm[perm[X] + Y + 1], d = perm[perm[X + 1] + Y + 1];
    return lerp(
      lerp(grad(a, x, y), grad(b, x - 1, y), u),
      lerp(grad(c, x, y - 1), grad(d, x - 1, y - 1), u),
      v
    ) * 1.4;
  }

  function fbm(x, y, octaves) {
    octaves = octaves || 4;
    var s = 0, a = 1, f = 1, n = 0;
    for (var i = 0; i < octaves; i++) {
      s += a * n2(x * f, y * f);
      n += a;
      a *= 0.5;
      f *= 2;
    }
    return s / n;
  }

  window.VL = {
    TAU: TAU,
    clamp: clamp,
    lerp: lerp,
    rand: rand,
    randi: randi,
    pick: pick,
    hsl: hsl,
    $: $,
    mount: mount,
    fps: fps,
    loop: loop,
    bindRange: bindRange,
    bindSeg: bindSeg,
    noise: { n2: n2, fbm: fbm }
  };
})();
