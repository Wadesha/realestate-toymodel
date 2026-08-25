/* ============================================================
   VIS·LAB 门户卡片动态预览 — 11 个轻量迷你动画
   固定内部分辨率 300×188，共享单条 rAF 循环，
   IntersectionObserver 仅绘制视口内卡片
   ============================================================ */
(function () {
  "use strict";

  var W = 300, H = 188;

  function fillBg(ctx, a) {
    ctx.fillStyle = a === undefined ? "#04070d" : "rgba(4,7,13," + a + ")";
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------- 各实验的迷你动画 ---------- */
  var P = {};

  /* 01 引力弹弓：中心恒星 + 三个轨道天体 + 光轨 */
  P.nbody = function (ctx, dt, t, s) {
    fillBg(ctx, 0.16);
    var cx = W / 2, cy = H / 2;
    if (!s.orb) s.orb = [[62, 0.9, 0], [102, 0.55, 2.1], [132, 0.38, 4.2]];
    ctx.strokeStyle = "rgba(148,163,184,0.08)";
    for (var i = 0; i < s.orb.length; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, s.orb[i][0], 0, VL.TAU);
      ctx.stroke();
    }
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
    g.addColorStop(0, "#e0f7ff");
    g.addColorStop(0.4, "#22d3ee");
    g.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, VL.TAU);
    ctx.fill();
    for (var k = 0; k < s.orb.length; k++) {
      var o = s.orb[k], a = t * o[1] + o[2];
      var x = cx + Math.cos(a) * o[0], y = cy + Math.sin(a) * o[0] * 0.62;
      ctx.fillStyle = ["#a5f3fc", "#c4b5fd", "#f9a8d4"][k];
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, VL.TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  /* 02 群体智能：向心 + 分离的小箭群 */
  P.boids = function (ctx, dt, t, s) {
    fillBg(ctx, 0.2);
    if (!s.b) {
      s.b = [];
      for (var i = 0; i < 16; i++) s.b.push({ x: VL.rand(0, W), y: VL.rand(0, H), vx: 0, vy: 0 });
    }
    ctx.fillStyle = "rgba(148,163,184,0.08)";
    for (var j = 0; j < s.b.length; j++) {
      var b = s.b[j];
      var dx = W / 2 - b.x, dy = H / 2 - b.y, d = Math.hypot(dx, dy) || 1;
      b.vx += (dx / d) * 14 * dt;
      b.vy += (dy / d) * 14 * dt;
      for (var q = 0; q < s.b.length; q++) {
        if (q === j) continue;
        var o = s.b[q], ox = b.x - o.x, oy = b.y - o.y, od = Math.hypot(ox, oy);
        if (od < 26 && od > 0.01) { b.vx += (ox / od) * 40 * dt; b.vy += (oy / od) * 40 * dt; }
      }
      var sp = Math.hypot(b.vx, b.vy);
      if (sp > 46) { b.vx *= 46 / sp; b.vy *= 46 / sp; }
      b.x += b.vx * dt * 3.2; b.y += b.vy * dt * 3.2;
      b.x = VL.clamp(b.x, 2, W - 2); b.y = VL.clamp(b.y, 2, H - 2);
      var ang = Math.atan2(b.vy, b.vx);
      var hue = 186 + VL.clamp(sp / 46, 0, 1) * 90;
      ctx.fillStyle = VL.hsl(hue, 85, 70);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, 3);
      ctx.lineTo(-4, -3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  /* 03 粒子流场：噪声场漂流 */
  P.flowfield = function (ctx, dt, t, s) {
    fillBg(ctx, 0.07);
    if (!s.p) {
      s.p = [];
      for (var i = 0; i < 90; i++) s.p.push({ x: VL.rand(0, W), y: VL.rand(0, H), h: VL.rand(170, 320) });
    }
    for (var k = 0; k < s.p.length; k++) {
      var p = s.p[k];
      var a = VL.noise.n2(p.x * 0.008, p.y * 0.008 + t * 0.12) * Math.PI * 2;
      var nx = p.x + Math.cos(a) * 42 * dt, ny = p.y + Math.sin(a) * 42 * dt;
      ctx.strokeStyle = VL.hsl(p.h, 80, 64, 0.55);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      p.x = nx; p.y = ny;
      if (p.x < -4 || p.x > W + 4 || p.y < -4 || p.y > H + 4) {
        p.x = VL.rand(0, W); p.y = VL.rand(0, H);
      }
    }
  };

  /* 04 生命游戏：小网格演化 */
  P.gameoflife = function (ctx, dt, t, s) {
    var cw = 6, gw = Math.floor(W / cw), gh = Math.floor(H / cw);
    if (!s.g) {
      s.g = [];
      for (var i = 0; i < gw * gh; i++) s.g.push(Math.random() < 0.28 ? VL.randi(1, 8) : 0);
      s.acc = 0;
    }
    s.acc += dt;
    if (s.acc > 0.12) {
      s.acc = 0;
      var ng = new Array(s.g.length);
      for (var x = 0; x < gw; x++) {
        for (var y = 0; y < gh; y++) {
          var n = 0;
          for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
              if (!dx && !dy) continue;
              var xx = (x + dx + gw) % gw, yy = (y + dy + gh) % gh;
              if (s.g[yy * gw + xx]) n++;
            }
          }
          var idx = y * gw + x, alive = !!s.g[idx];
          ng[idx] = alive ? (n === 2 || n === 3 ? Math.min(9, s.g[idx] + 1) : 0) : (n === 3 ? 1 : 0);
        }
      }
      s.g = ng;
    }
    fillBg(ctx);
    for (var c = 0; c < s.g.length; c++) {
      if (!s.g[c]) continue;
      var cx = c % gw, cy = (c / gw) | 0;
      var age = s.g[c];
      ctx.fillStyle = age < 3 ? "#22d3ee" : age < 6 ? "#a78bfa" : "#f472b6";
      ctx.fillRect(cx * cw + 0.5, cy * cw + 0.5, cw - 1.4, cw - 1.4);
    }
  };

  /* 05 奇异吸引子：洛伦兹点云 */
  P.attractors = function (ctx, dt, t, s) {
    if (!s.pts) {
      s.pts = [];
      var x = 0.1, y = 0, z = 0, h = 0.006;
      for (var i = 0; i < 900; i++) {
        var dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
        x += dx * h; y += dy * h; z += dz * h;
        s.pts.push([x, y, z]);
      }
      s.n = 0;
    }
    fillBg(ctx);
    var cx = W / 2, cy = H / 2 + 8, sc = 2.6, yaw = t * 0.35, sy = Math.sin(yaw), cyy = Math.cos(yaw);
    s.n = Math.min(s.pts.length, s.n + 5);
    for (var k = 0; k < s.n; k++) {
      var p = s.pts[k];
      var rx = p[0] * cyy - p[1] * sy, ry = p[0] * sy + p[1] * cyy;
      var px = cx + rx * sc, py = cy - (p[2] - 25) * sc * 0.9 + ry * sc * 0.18;
      var hue = 190 + (k / s.pts.length) * 130;
      ctx.fillStyle = VL.hsl(hue, 85, 65, 0.6);
      ctx.fillRect(px, py, 1.3, 1.3);
    }
  };

  /* 06 分形深潜：低分辨率 Mandelbrot + 呼吸缩放 */
  P.fractal = function (ctx, dt, t, s) {
    if (!s.off) {
      var rw = 90, rh = 56, c = document.createElement("canvas");
      c.width = rw; c.height = rh;
      var octx = c.getContext("2d"), img = octx.createImageData(rw, rh);
      var d = img.data;
      for (var py = 0; py < rh; py++) {
        for (var px = 0; px < rw; px++) {
          var cr = (px / rw - 0.72) * 3.4, ci = (py / rh - 0.5) * 2.4;
          var zr = 0, zi = 0, n = 0;
          while (zr * zr + zi * zi < 4 && n < 40) {
            var t2 = zr * zr - zi * zi + cr;
            zi = 2 * zr * zi + ci;
            zr = t2;
            n++;
          }
          var o = (py * rw + px) * 4;
          if (n >= 40) { d[o] = 4; d[o + 1] = 6; d[o + 2] = 12; }
          else {
            var m = Math.pow(n / 40, 0.55);
            d[o] = 8 + m * 20;
            d[o + 1] = 20 + m * 160;
            d[o + 2] = 40 + m * 210;
          }
          d[o + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      s.off = c;
    }
    fillBg(ctx);
    var z = 1 + Math.sin(t * 0.5) * 0.06;
    var dw = W * 1.14 * z, dh = H * 1.14 * z;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(s.off, (W - dw) / 2, (H - dh) / 2, dw, dh);
  };

  /* 07 波的干涉：双点源 */
  P.waves = function (ctx, dt, t, s) {
    fillBg(ctx);
    var gw = 75, gh = 47, cw = W / gw, ch = H / gh;
    var s1 = { x: gw * 0.34, y: gh * 0.5 }, s2 = { x: gw * 0.66, y: gh * 0.5 };
    for (var gy = 0; gy < gh; gy++) {
      for (var gx = 0; gx < gw; gx++) {
        var v1 = Math.hypot(gx - s1.x, gy - s1.y) * 0.9 - t * 10;
        var v2 = Math.hypot(gx - s2.x, gy - s2.y) * 0.9 - t * 10;
        var v = Math.sin(v1) + Math.sin(v2);
        var m = (v + 2) / 4;
        if (m < 0.46 || m > 0.54) {
          ctx.fillStyle = VL.hsl(188 + m * 60, 85, 18 + m * 42, Math.abs(v) * 0.16);
          ctx.fillRect(gx * cw, gy * ch, cw + 0.5, ch + 0.5);
        }
      }
    }
    ctx.fillStyle = "#67e8f9";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(s1.x * cw, s1.y * ch, 2.4, 0, VL.TAU);
    ctx.arc(s2.x * cw, s2.y * ch, 2.4, 0, VL.TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  /* 08 傅里叶画波：三圆链 + 波形轨迹 */
  P.fourier = function (ctx, dt, t, s) {
    fillBg(ctx, 0.24);
    if (!s.trace) s.trace = [];
    var x = 52, y = H / 2, cx = x, cy = y;
    ctx.strokeStyle = "rgba(148,163,184,0.28)";
    ctx.lineWidth = 1;
    for (var i = 1; i <= 3; i++) {
      var r = 34 / i, ph = t * 2.4 * i;
        cy = y;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, VL.TAU);
        ctx.stroke();
        var nx = x + Math.cos(ph) * r, ny = y + Math.sin(ph) * r;
        ctx.strokeStyle = "rgba(34,211,238,0.5)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.strokeStyle = "rgba(148,163,184,0.28)";
        x = nx; y = ny;
    }
    s.trace.unshift([x, y]);
    if (s.trace.length > 130) s.trace.pop();
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var k = 0; k < s.trace.length; k++) {
      var p = s.trace[k];
      var px = 100 + k * 1.5, py = H / 2 + (p[1] - H / 2);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(244,114,182,0.25)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(100, H / 2 + (s.trace[0][1] - H / 2));
    ctx.stroke();
  };

  /* 09 排序之舞：慢速冒泡 */
  P.sorting = function (ctx, dt, t, s) {
    fillBg(ctx, 0.3);
    var n = 22;
    if (!s.a) { s.a = []; s.i = 0; s.j = 0; for (var q = 0; q < n; q++) s.a.push(0.15 + Math.random() * 0.85); }
    s.acc = (s.acc || 0) + dt;
    if (s.acc > 0.09) {
      s.acc = 0;
      if (s.j >= n - 1 - s.i) { s.j = 0; s.i++; if (s.i >= n) { s.i = 0; s.j = 0; s.a = []; for (var r = 0; r < n; r++) s.a.push(0.15 + Math.random() * 0.85); } }
      else {
        if (s.a[s.j] > s.a[s.j + 1]) {
          var tmp = s.a[s.j]; s.a[s.j] = s.a[s.j + 1]; s.a[s.j + 1] = tmp;
          s.hot = s.j + 1;
        }
        s.j++;
      }
    }
    var bw = W / n;
    for (var b = 0; b < n; b++) {
      var h = s.a[b] * (H - 20);
      ctx.fillStyle = b === s.hot ? "#e0f7ff" : VL.hsl(190 + b * 6, 85, 62);
      ctx.fillRect(b * bw + 1, H - h - 6, bw - 2, h);
    }
  };

  /* 10 迷宫：预生成迷宫 + 路径光点 */
  P.maze = function (ctx, dt, t, s) {
    fillBg(ctx);
    if (!s.maze) {
      var cw = 12, gw = 24, gh = 15;
      var cells = [];
      for (var i = 0; i < gw * gh; i++) cells.push({ v: false, w: [true, true, true, true] });
      var stack = [0];
      cells[0].v = true;
      var dirs = [[1, 0, 1, 3], [-1, 0, 3, 1], [0, 1, 2, 0], [0, -1, 0, 2]];
      while (stack.length) {
        var cur = stack[stack.length - 1];
        var cxp = cur % gw, cyp = (cur / gw) | 0;
        var opts = [];
        for (var d2 = 0; d2 < 4; d2++) {
          var nx = cxp + dirs[d2][0], ny = cyp + dirs[d2][1];
          if (nx >= 0 && nx < gw && ny >= 0 && ny < gh && !cells[ny * gw + nx].v) opts.push(d2);
        }
        if (!opts.length) { stack.pop(); continue; }
        var d = opts[(Math.random() * opts.length) | 0];
        var nx2 = cxp + dirs[d][0], ny2 = cyp + dirs[d][1], ni = ny2 * gw + nx2;
        cells[cur].w[dirs[d][2]] = false;
        cells[ni].w[dirs[d][3]] = false;
        cells[ni].v = true;
        stack.push(ni);
      }
      s.maze = { cells: cells, gw: gw, gh: gh, cw: cw };
      var ox = (W - gw * cw) / 2, oy = (H - gh * cw) / 2;
      s.ox = ox; s.oy = oy;
    }
    var m = s.maze;
    ctx.strokeStyle = "rgba(34,211,238,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var y = 0; y < m.gh; y++) {
      for (var x = 0; x < m.gw; x++) {
        var c = m.cells[y * m.gw + x], px = s.ox + x * m.cw, py = s.oy + y * m.cw;
        if (c.w[0]) { ctx.moveTo(px, py); ctx.lineTo(px + m.cw, py); }
        if (c.w[3]) { ctx.moveTo(px, py); ctx.lineTo(px, py + m.cw); }
      }
    }
    ctx.moveTo(s.ox, s.oy + m.gh * m.cw);
    ctx.lineTo(s.ox + m.gw * m.cw, s.oy + m.gh * m.cw);
    ctx.lineTo(s.ox + m.gw * m.cw, s.oy);
    ctx.stroke();
    /* 光点沿左上到右下走（直接沿格子连线简化） */
    var ph = (t * 0.14) % 1;
    var gx = ph * (m.gw - 1), gy = ph * (m.gh - 1);
    var lx = s.ox + (gx + 0.5) * m.cw, ly = s.oy + (gy + 0.5) * m.cw;
    var g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 10);
    g.addColorStop(0, "rgba(244,114,182,0.9)");
    g.addColorStop(1, "rgba(244,114,182,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lx, ly, 10, 0, VL.TAU);
    ctx.fill();
  };

  /* 11 力导向网络：微力布局的环网 */
  P.graph = function (ctx, dt, t, s) {
    fillBg(ctx, 0.26);
    if (!s.n) {
      s.n = [];
      var nn = 9;
      for (var i = 0; i < nn; i++) {
        var a = (i / nn) * VL.TAU;
        s.n.push({ x: W / 2 + Math.cos(a) * 70, y: H / 2 + Math.sin(a) * 48, r: VL.rand(3, 6), c: i % 3 });
      }
      s.e = [];
      for (var j = 0; j < nn; j++) {
        s.e.push([j, (j + 1) % nn]);
        if (j % 2 === 0) s.e.push([j, (j + 4) % nn]);
      }
    }
    ctx.strokeStyle = "rgba(148,163,184,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var k = 0; k < s.e.length; k++) {
      var a2 = s.n[s.e[k][0]], b2 = s.n[s.e[k][1]];
      ctx.moveTo(a2.x, a2.y);
      ctx.lineTo(b2.x, b2.y);
    }
    ctx.stroke();
    var cols = ["#22d3ee", "#a78bfa", "#f472b6"];
    for (var q = 0; q < s.n.length; q++) {
      var p = s.n[q];
      var ang = t * 0.4 + q;
      p.x += Math.cos(ang) * 0.06;
      p.y += Math.sin(ang * 1.3) * 0.05;
      p.x = VL.clamp(p.x, 14, W - 14);
      p.y = VL.clamp(p.y, 14, H - 14);
      ctx.fillStyle = cols[p.c];
      ctx.shadowColor = cols[p.c];
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, VL.TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  /* ---------- 调度：共享循环 + 视口裁剪 ---------- */
  var items = [];
  var canvases = document.querySelectorAll("canvas[data-preview]");

  for (var i = 0; i < canvases.length; i++) {
    (function (cv) {
      var fn = P[cv.dataset.preview];
      if (!fn) return;
      cv.width = W;
      cv.height = H;
      var ctx = cv.getContext("2d");
      var item = { visible: true, state: {}, fn: fn, ctx: ctx };
      items.push(item);
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries) {
          item.visible = entries[entries.length - 1].isIntersecting;
        }, { rootMargin: "80px" }).observe(cv);
      }
    })(canvases[i]);
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var t = now / 1000;
    for (var i = 0; i < items.length; i++) {
      if (!items[i].visible) continue;
      try { items[i].fn(items[i].ctx, dt, t, items[i].state); }
      catch (err) { /* 单卡异常不影响整页 */ }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
