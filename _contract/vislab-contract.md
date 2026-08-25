# VIS·LAB 可视化探索实验室 — Design Contract（v1.0 · FROZEN）

## 0. 项目概要
- 1 个门户首页 + 11 个独立「实验子网站」，主题：探索可视化。
- 交付目录：`/workspace/vislab/`，所有文件平铺于该目录，相对路径引用，**双击 index.html 即可离线运行**。
- 技术栈：vanilla HTML + CSS + Canvas 2D JS。**零依赖、零外链、无构建**。
- 页面顺序（编号同时用于导航环与首页卡片序号）：

| # | 文件 | 中文名 | 英文副题 | 分类 |
|---|------|--------|----------|------|
| 01 | nbody.html | 引力弹弓 | N-Body Gravity | 粒子与模拟 sim |
| 02 | boids.html | 群体智能 | Boids Flocking | 粒子与模拟 sim |
| 03 | flowfield.html | 粒子流场 | Perlin Flow Field | 粒子与模拟 sim |
| 04 | gameoflife.html | 生命游戏 | Game of Life | 粒子与模拟 sim |
| 05 | attractors.html | 奇异吸引子 | Strange Attractors | 数学与信号 math |
| 06 | fractal.html | 分形深潜 | Mandelbrot Set | 数学与信号 math |
| 07 | waves.html | 波的干涉 | Wave Interference | 数学与信号 math |
| 08 | fourier.html | 傅里叶画波 | Fourier Epicycles | 数学与信号 math |
| 09 | sorting.html | 排序之舞 | Sorting Visualized | 算法与结构 algo |
| 10 | maze.html | 迷宫实验室 | Maze Generation & Solve | 算法与结构 algo |
| 11 | graph.html | 力导向网络 | Force-Directed Graph | 算法与结构 algo |

prev/next 导航环：01→02→…→11→01（首尾相接）。

## 1. Style Tier & Aesthetic
- style: **tech-dark「深空观测站」**，retro-futuristic observatory。
- tone: 冷静、克制、数据感。暗色宇宙底 + 青色主光 + 等宽数字读数 + 发光轨迹 + 坐标纸网格。
- 视觉母题：每一页都像一台“观测仪器”：深色画布 + HUD 读数 + 控制台面板。

## 2. Design Tokens（唯一来源 styles.css，禁止另造）
```
--bg:#060a13  --bg2:#0a101f  --stage-bg:#04070d
--surface:rgba(148,163,184,.055)  --surface-strong:rgba(148,163,184,.09)
--border:rgba(148,163,184,.14)     --border-strong:rgba(148,163,184,.24)
--text:#e6edf7  --muted:#8b96ad  --faint:#5b667d
--cyan:#22d3ee(主色) --violet:#a78bfa --pink:#f472b6 --amber:#fbbf24 --green:#34d399
分类色: sim=cyan  algo=violet  math=pink
字体: body=PingFang SC/Microsoft YaHei/Noto Sans CJK SC 栈; mono=ui-monospace 栈（所有数字读数用 mono）
字号: 11/12/13/15/20/28/clamp 大标题   圆角: 6/10/16   间距: 4 的倍数
```
- 主色系 ≤3 族：cyan 主导，violet/pink 仅作分类与点缀。渐变克制（仅青→紫低调用于标题文字/滑轨）。

## 3. App Shell（11 个实验页**逐字节粘贴**，只替换 `{…}` 占位，禁止重写结构/增删节点）
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{中文名} · VIS·LAB</title>
<link rel="stylesheet" href="styles.css">
</head>
<body data-page="{page-key}">
<header class="topbar">
  <a class="brand" href="index.html"><span class="brand-dot" aria-hidden="true"></span><span class="brand-name">VIS·LAB</span><span class="brand-sub">可视化探索实验室</span></a>
  <nav class="exp-nav">
    <a class="exp-link" href="{prev}.html" title="上一个：{prev中文名}"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg><span class="exp-link-label">{prev中文名}</span></a>
    <span class="exp-current"><span class="exp-no">{NN}</span><em>/11</em><b>{中文名}</b></span>
    <a class="exp-link next" href="{next}.html" title="下一个：{next中文名}"><span class="exp-link-label">{next中文名}</span><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></a>
  </nav>
</header>
<main class="page">
  <section class="page-head">
    <div class="page-head-text">
      <h1>{中文名}<span class="h-en">{英文副题}</span></h1>
      <p class="page-desc">{一句话描述（≤40字）}</p>
    </div>
    <div class="tags"><span class="tag tag-{cat}">{分类名}</span><span class="tag">Canvas</span></div>
  </section>
  <section class="lab">
    <div class="stage-wrap">
      <canvas id="stage"></canvas>
      <div class="stage-hud"><span class="hud-item" id="hud-fps">-- fps</span><span class="hud-item" id="hud-stat">—</span></div>
      <div class="stage-tip">{鼠标交互提示}</div>
    </div>
    <aside class="panel">
      <div class="panel-title">控制台<span>CONSOLE</span></div>
      <div class="panel-body">
        <!-- 页面专属控件：.control-group（range）/ .seg（分段）/ .check（开关）/ .btn-row -->
        <div class="btn-row">
          <button class="btn primary" id="btn-run">暂停</button>
          <button class="btn ghost" id="btn-reset">重置</button>
        </div>
        <div class="panel-note"><b>原理</b>{一两句原理科普}</div>
      </div>
    </aside>
  </section>
</main>
<footer class="footer"><span>VIS·LAB — 浏览器里的计算美学</span><span class="footer-sep">·</span><span>纯前端 · 零依赖 · 可离线</span></footer>
<script src="shared.js"></script>
<script>
/* 页面专属脚本 */
</script>
</body>
</html>
```
- 位置规则：topbar 为 fixed 高 56px，`.page` 统一 padding-top，任何页面不得改动。
- 控件规范（标准结构，全部已有 CSS）：
  - range：`<div class="control-group"><div class="cg-head"><label for="x">名称</label><output class="val" id="x-val">1.0</output></div><input type="range" id="x" …></div>`（output id 必须 = input id + `-val`）
  - 分段：`<div class="control-group"><div class="cg-head"><label>名称</label></div><div class="seg" id="x"><button type="button" data-v="a" class="active">A</button>…</div></div>`
  - 开关：`<div class="check"><input type="checkbox" id="x"><label for="x">名称</label></div>`
  - 按钮：`.btn.primary`（主操作，如 暂停/运行）与 `.btn.ghost`（重置/清空）。btn-run 初始文案「暂停」，点击在 暂停/继续 间切换（静止型实验可改为 运行/重置）。
- 图标：仅模板中给定的两个内联 SVG chevron；**禁止 emoji 图标、禁止引入其他图标**。

## 4. 各实验页规格（实现要求）

### 01 nbody.html 引力弹弓（主控已实现，作为范例）
牛顿引力多体模拟：softening 平方反比 + 半隐式欧拉。预设：双星/恒星行星/三体(figure-8)/星团对撞；点击拖拽发射天体（拖拽向量=初速度，另有质量滑杆）；碰撞合并（动量守恒）；HUD 显示天体数。

### 02 boids.html 群体智能
- 画布：~200 只 boid，三角形箭头，速度→色相（慢=青、快=粉），可开关拖尾（低透明度 fade 或清屏）。
- 控件：分离/对齐/聚拢三个权重滑杆（0–2）、数量（50–400）、视距（20–120）、鼠标模式分段（关闭/吸引/排斥）、拖尾开关、暂停/重置。
- 交互：鼠标按下时按模式吸引/排斥；HUD：`N=200`。
- 原理注：Reynolds 三规则——分离、对齐、聚拢，无需领导者即可涌现群体秩序。

### 03 flowfield.html 粒子流场
- 画布：1500–3000 粒子沿 Perlin 噪声场（VL.noise.n2）漂流，拖尾 fade（透明度由滑杆控制），按位置/角度着色。
- 控件：粒子数（500–4000）、噪声尺度（0.5–5×基础）、流速（0.2–3）、拖尾（0–0.98）、调色板分段（极光/熔岩/深海/霓虹，各 4–5 色）、暂停/重置。
- 交互：鼠标位置对附近粒子施加径向扰动（漩涡感）；HUD：粒子数。
- 原理注：每帧粒子读取噪声向量场方向前进，留下发光轨迹，如铁屑显磁感线。

### 04 gameoflife.html 生命游戏
- 画布：网格元胞自动机（cell≈8px 自适应），活细胞按存活世代着色（新生=青→长寿=紫→古老=粉），死细胞极暗底色。
- 控件：速度（1–60 代/秒）、初始密度（5–80%）、规则分段（经典 B3/S23、HighLife B36/S23、Day&Night B3678/S34678）、图案库分段（随机/滑翔机枪/脉冲星/R-五格）、边界环绕开关、暂停·步进/清空/随机。
- 交互：鼠标拖拽绘制/擦除（左键画、Shift+拖 或右键拖擦除）；HUD：`第 N 代 · 存活 M`。
- 原理注：四条简单规则在网格上迭代，能涌现滑翔机、振荡器乃至图灵完备。

### 05 attractors.html 奇异吸引子
- 画布：三维混沌吸引子点云（3D→2D 手写透视投影，无 three.js）。每帧沿轨迹追加若干点，自转（yaw 缓慢增加），拖拽改变视角（dx→yaw、dy→pitch，松手恢复自转）。点按轨迹参数着色（青→紫→粉循环）。
- 吸引子分段（必做 4 个，含公式参数）：
  - Lorenz: dx=σ(y−x), dy=x(ρ−z)−y, dz=xy−βz；σ=10 ρ=28 β=8/3；初值 (0.1,0,0)，尺度 z∈[0,50]→画布。
  - Aizawa: a=0.95,b=0.7,c=0.6,d=3.5,e=0.25,f=0.1；dx=(z−b)x−d y; dy=d x+(z−b)y; dz=c+a z−z³/3−(x²+y²)(1+e z)+f z x³。
  - Thomas: dx=sin y−b x; dy=sin z−b y; dz=sin x−b z; b=0.19，尺度约 ×24。
  - Halvorsen: dx=−a x−4y−4z−y²−z², dy=−a y−4z−4x−z²−x², dz=−a z−4x−4y−x²−y², a=1.89。
- 控件：吸引子分段、自转速度（0–2）、点数/帧（1–20）、辉光开关（lighter 混合）、暂停/重置（清点云重播）。
- HUD：已绘制点数。
- 原理注：混沌系统对初值极端敏感——吸引子永不自交却永不出走。

### 06 fractal.html 分形深潜（Mandelbrot）
- 画布：escape-time 逐像素计算，ImageData 写入；**分块渐进渲染**（每 rAF 渲染若干行，HUD 显示进度百分比），交互时取消旧任务重启。
- 坐标：复平面初始 center=(-0.6,0), scale 使宽≈3.2；平滑着色 μ = n+1−log₂log₂|z|，调色板分段（深空青/经典/熔岩/灰度）。
- 控件：最大迭代（64–1024，默认 256）、调色板分段、渲染精度分段（0.5×/0.75×/1× 内部分辨率，默认 0.75）、重置视图。
- 交互：滚轮以鼠标为中心缩放（×0.5/×2）；拖拽平移；双击放大；HUD：坐标+缩放倍数+渲染进度。
- 原理注：z←z²+c 的迭代不发散点集，边界处蕴藏无限自相似结构。

### 07 waves.html 波的干涉
- 画布：2D 标量波场模拟（两步有限差分波方程，网格≈160×100 低分辨率，ImageData 上采样绘制），可拖拽波源。
- 控件：波源频率（0.2–3）、波速（0.1–0.9，稳定上限 CFL<0.7）、阻尼（0–0.5）、显示模式分段（高度着色/相位彩虹/等高线）、暂停/重置/清空波源（默认双点源）。
- 交互：点击空白处添加点源；拖动已有波源；HUD：波源数。
- 原理注：双点源同频相干——相位差决定建设性/破坏性干涉条纹。

### 08 fourier.html 傅里叶画波
- 画布：左侧 epicycles 圆链（N 个矢量首尾相接旋转），末端笔尖画出目标波形；右侧滚动波形轨迹（历史推进）。
- 控件：谐波数 N（1–64）、基频速度（0.2–3）、波形分段（方波/锯齿/三角/梯形）、显示分量圆开关、暂停/重置。
- HUD：N 项。
- 原理注：任意周期信号=正弦谐波叠加；N 越大，圆链末端越逼近目标波形（Gibbs 现象可见）。

### 09 sorting.html 排序之舞
- 画布：竖条阵列（高度=值，彩虹色映射），**generator 步进器**驱动动画：每帧执行 K 步（速度滑杆），比较时两根条高亮（白），交换时闪青。
- 控件：算法分段（冒泡/插入/选择/希尔/归并/快速/堆，至少 6 种）、数量（16–160）、速度（1–400 步/帧）、数据分布分段（随机/近有序/逆序/少量重复值）、重新生成/暂停。
- 统计：HUD 显示 比较次数 / 交换（写入）次数；完成时 HUD 文案「完成 · 比较 N · 写入 M」。
- 原理注：不同策略在比较次数上的数量级差异，动画里一目了然。

### 10 maze.html 迷宫实验室
- 画布：完美迷宫（生成保证连通无环）。两阶段：生成动画（每帧雕刻 K 格）→ 完成后可求解动画（每帧走 K 步）。墙体发光描边，通路头部彩虹渐变。
- 控件：生成算法分段（递归回溯/随机 Prim）、求解分段（BFS/A*/DFS 深搜）、尺寸（15–61）、生成速度、求解速度、显示探索前沿开关、新迷宫/立即求解。
- 交互：点击任意两点设为起终点（默认左上→右下）；HUD：状态（生成中/求解中/路径长 L · 探索格数）。
- 原理注：DFS 生成深窄廊道，Prim 生成短分枝灌木；BFS 保最短路，A* 用曼哈顿启发更快聚焦。

### 11 graph.html 力导向网络
- 画布：~80 节点网络布局（斥力+边弹簧+中心引力，速度衰减冷却），节点大小=度数，颜色=社区（随机分组染色），边半透明。悬停节点：高亮邻接（其余降透明度）+ HUD 显示 id/度/社区。
- 控件：网络预设分段（随机 ER/树/网格/小世界/四社区）、斥力（0.2–5）、弹簧长度（40–200）、中心引力（0–0.2）、重新生成/暂停。
- 交互：拖拽节点（按住跟随鼠标，布局实时响应）；HUD：节点/边数。
- 原理注：模拟物理系统弛豫到低能量态，网络社团结构自然浮现。

## 5. shared.js API（唯一共享脚本，页面必须复用，勿重造）
```js
VL.$(id)                      // getElementById
VL.TAU, VL.clamp(v,a,b), VL.lerp(a,b,t), VL.rand(a,b), VL.randi(a,b), VL.pick(arr)
VL.hsl(h,s,l,a)                // → 'hsla(...)' 字符串
VL.mount(canvas)               // DPR 自适应 + ResizeObserver → {canvas, ctx, w, h, resize}（w/h 为 CSS 逻辑像素，getter 实时）
VL.fps(el)                     // → {tick()}，每 ~0.5s 更新 el 文本为 "60 fps"
VL.loop(fn)                    // rAF 循环，fn(dt 秒, t 秒)；fn 返回 false 停止
VL.bindRange(id, cb, fmt)      // 自动绑定 input+output(id+'-val')，初始触发一次，fmt(v)→显示文本
VL.bindSeg(id, cb)             // 分段按钮组，点击切换 .active 并回调 data-v；初始回调当前 active
VL.noise.n2(x,y)               // 2D Perlin，返回约 [-1,1]
VL.noise.fbm(x,y,octaves)      // 分形噪声
```
- 画布约定：`const st = VL.mount(VL.$('stage')); const {ctx} = st;` 每帧用 `st.w/st.h`；画布底色统一 `#04070d`。
- 事件：pointerdown/move/up（统一 pointer events），坐标 `e.clientX - rect.left`。

## 6. 通用实现规约
- 全部中文 UI 文案（数字/单位可用英文）；注释中文；无 alert/confirm；无 console.log 残留。
- 所有控件必须真实生效并即时反映到画布；初始值即最佳观感（打开页面 3 秒内就能看到美）。
- 移动端（<960px）：.lab 单列，面板在画布下方，触控基本可用（pointer events 已兼容）。
- 页面标题 `<title>{中文名} · VIS·LAB</title>`；`data-page` 用文件名去扩展名。
- 性能：主循环 rAF；重计算（fractal/waves）用低内部分辨率+分块，保证不掉帧。
- 禁止：外链资源、重写 shell、新造颜色字号、emoji 图标、undefined 变量/未绑定事件、TODO 残留。

## 7. 门户 index.html（主控实现）
- hero（大标题「把数学与算法，放进你的浏览器」+ 统计 11 实验/0 依赖/60fps）、分类筛选 chips（全部/粒子与模拟/算法与结构/数学与信号）、11 张卡片网格（每卡内嵌 300×188 动态 canvas 预览 + 序号 + 标题 + 描述 + 分类 tag），卡片 staggered 入场、hover 上浮发光。
- previews.js 为卡片提供轻量动画预览（IntersectionObserver 视口内才运行，单 rAF 共享循环）。
