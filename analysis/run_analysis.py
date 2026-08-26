# -*- coding: utf-8 -*-
"""
房价数据入门教程 —— 配套分析脚本
这份脚本就是教程里所有代码的"合体版"，跑完会在 site/assets/charts/ 下生成图表，
并把关键数字存进 results.json。
"""
import json
import os

import matplotlib
matplotlib.use("SVG")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np
import pandas as pd

# ---------- 全局设置：中文字体 + 输出风格 ----------
FONT_PATH = "/workspace/site/assets/fonts/NotoSansSC.ttf"
fm.fontManager.addfont(FONT_PATH)
font_name = fm.FontProperties(fname=FONT_PATH).get_name()
plt.rcParams.update({
    "font.family": font_name,
    "svg.fonttype": "path",          # 把文字转成路径，浏览器打开不依赖字体文件
    "axes.unicode_minus": False,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "axes.edgecolor": "#d1d5db",
    "axes.grid": True,
    "grid.color": "#e5e7eb",
    "grid.linewidth": 0.6,
    "axes.axisbelow": True,
    "font.size": 11,
    "axes.titlesize": 13,
    "axes.titleweight": "bold",
})

CHART_DIR = "/workspace/site/assets/charts"
os.makedirs(CHART_DIR, exist_ok=True)
BLUE = "#2563eb"
RED = "#dc2626"
ORANGE = "#f59e0b"
GREEN = "#16a34a"
GRAY = "#6b7280"

results = {}

# ============================================================
# 第 1 步：读数据
# ============================================================
df = pd.read_csv("toy_realestate_sample.csv", encoding="utf-8-sig")
results["raw_shape"] = list(df.shape)
results["raw_cols"] = list(df.columns)
results["missing"] = {c: int(n) for c, n in df.isna().sum().items() if n > 0}
results["n_cities"] = int(df["city"].nunique())
results["n_duplicated"] = int(df.duplicated().sum())

# ============================================================
# 第 2 步：清洗
# ============================================================
# 2.1 去掉重复行
df = df.drop_duplicates().copy()
results["shape_after_dedup"] = list(df.shape)

# 2.2 去掉合成数据（synthetic=1 是补位的假数据）
df = df[df["synthetic"] == 0].copy()

# 2.3 去掉 price 缺失的行（分析价格必须要有价格）
df = df[df["price"].notna() & (df["price"] > 0)].copy()
results["shape_clean"] = list(df.shape)

# 2.4 从 district 里剥出"纯区县名"（如 2023历下 -> 历下）
df["district_clean"] = (
    df["district"].astype(str).str.replace(r"^\d{4}", "", regex=True)
)

# 2.5 price_change 解析成数字（"持平"->0，"0.28%"->0.28）
def parse_change(v):
    if pd.isna(v):
        return np.nan
    s = str(v)
    if s in ("持平", "模拟"):
        return 0.0
    s = s.replace("%", "")
    try:
        return float(s)
    except ValueError:
        return np.nan

df["price_change_pct"] = df["price_change"].apply(parse_change)
results["n_price_change_ok"] = int(df["price_change_pct"].notna().sum())

# 2.6 楼龄列（2026 - year_built）
df["age"] = 2026 - df["year_built"]

results["clean_median_price"] = float(df["price"].median())
results["clean_mean_price"] = float(df["price"].mean())
results["geo_coverage"] = float(df["longitude"].notna().mean())

# ============================================================
# 第 3 课：全国房价总览
# ============================================================
results["price_describe"] = {
    k: round(v, 4) for k, v in df["price"].describe().items()
}
under3 = float((df["price"] <= 3).mean())
results["under3_ratio"] = under3

fig, ax = plt.subplots(figsize=(8, 4.2))
data = df.loc[df["price"] <= 3, "price"]
ax.hist(data, bins=40, color=BLUE, edgecolor="white", linewidth=0.5)
ax.axvline(df["price"].median(), color=RED, linestyle="--", linewidth=1.5,
           label=f'中位数 {df["price"].median():.2f} 万')
ax.axvline(df["price"].mean(), color=ORANGE, linestyle="--", linewidth=1.5,
           label=f'平均数 {df["price"].mean():.2f} 万')
ax.set_xlabel("挂牌均价（万/㎡）")
ax.set_ylabel("小区数量（个）")
ax.set_title(f"全国 {len(df):,} 个小区的挂牌单价分布（≤3万/㎡，覆盖 {under3:.0%} 的小区）")
ax.legend(frameon=False)
fig.tight_layout()
fig.savefig(f"{CHART_DIR}/price_dist.svg")
plt.close(fig)

# 最贵小区 Top10
top_comm = df.nlargest(10, "price")[
    ["city", "community_name", "price", "year_built", "secondhand_count"]
]
results["top10_communities"] = top_comm.to_dict("records")

# ============================================================
# 第 4 课：城市对比
# ============================================================
city_stat = (
    df.groupby("city")
    .agg(
        n=("community_name", "count"),
        median_price=("price", "median"),
        mean_price=("price", "mean"),
        min_price=("price", "min"),
        max_price=("price", "max"),
    )
    .sort_values("median_price", ascending=False)
    .reset_index()
)
results["city_table_all"] = city_stat.to_dict("records")
results["top15_cities"] = city_stat.head(15).to_dict("records")
results["bottom10_cities"] = city_stat.tail(10).iloc[::-1].to_dict("records")

def barh_cities(sub, filename, title, color):
    fig, ax = plt.subplots(figsize=(8, 4.6))
    names = sub["city"].iloc[::-1]
    vals = sub["median_price"].iloc[::-1]
    ax.barh(names, vals, color=color, height=0.62)
    for i, v in enumerate(vals):
        ax.text(v + vals.max() * 0.01, i, f"{v:.2f}", va="center", fontsize=10, color="#374151")
    ax.set_xlabel("中位挂牌单价（万/㎡）")
    ax.set_title(title)
    ax.set_xlim(0, vals.max() * 1.12)
    fig.tight_layout()
    fig.savefig(f"{CHART_DIR}/{filename}")
    plt.close(fig)

barh_cities(city_stat.head(15), "city_top15.svg",
            "城市房价天花板：中位单价最贵的 15 城（万/㎡）", BLUE)
barh_circles = city_stat.tail(10).iloc[::-1]
barh_cities(barh_circles, "city_bottom10.svg",
            "城市房价地板：中位单价最低的 10 城（万/㎡）", GREEN)

# 省会 vs 非省会不好判断，改成一线/新一线演示没有 —— 用城市内价格分化：max/min
city_stat["spread_ratio"] = city_stat["max_price"] / city_stat["min_price"]
results["most_polarized"] = (
    city_stat.sort_values("spread_ratio", ascending=False)
    .head(10)[["city", "min_price", "max_price", "spread_ratio"]]
    .to_dict("records")
)

# ============================================================
# 第 5 课：成都城市内部（区县对比）
# ============================================================
cd_ = df[df["city"] == "成都"]
cd = (
    cd_.groupby("district_clean")
    .agg(n=("community_name", "count"), median_price=("price", "median"))
    .query("n >= 5")
    .sort_values("median_price", ascending=False)
    .reset_index()
)
results["chengdu_districts"] = cd.to_dict("records")

fig, ax = plt.subplots(figsize=(8, 4.2))
ax.bar(cd["district_clean"], cd["median_price"], color=BLUE, width=0.6)
for i, v in enumerate(cd["median_price"]):
    ax.text(i, v + cd["median_price"].max() * 0.02, f"{v:.2f}", ha="center", fontsize=10, color="#374151")
ax.set_ylabel("中位挂牌单价（万/㎡）")
ax.set_xlabel("区县")
ax.set_title("成都各区县中位挂牌单价（样例 ≥5 个小区）")
ax.set_ylim(0, cd["median_price"].max() * 1.15)
fig.tight_layout()
fig.savefig(f"{CHART_DIR}/chengdu_district.svg")
plt.close(fig)

# 数据体检彩蛋：西安的区县竟然是吕梁的？
xa = df[df["city"] == "西安"]["district_clean"].value_counts()
results["xian_anomaly"] = {k: int(v) for k, v in xa.items()}

# ============================================================
# 第 6 课：楼龄与房价
# ============================================================
bins = [0, 1990, 2000, 2010, 2020, 2030]
labels = ["1990前", "1990-1999", "2000-2009", "2010-2019", "2020后"]
agedf = df.dropna(subset=["year_built"]).copy()
agedf["era"] = pd.cut(agedf["year_built"], bins=bins, labels=labels, right=False)
era_stat = (
    agedf.groupby("era", observed=True)
    .agg(n=("community_name", "count"), median_price=("price", "median"))
    .reset_index()
)
results["era_table"] = era_stat.to_dict("records")

fig, ax = plt.subplots(figsize=(8, 4.2))
bars = ax.bar(era_stat["era"].astype(str), era_stat["median_price"],
              color=[GRAY, BLUE, BLUE, BLUE, RED], width=0.55)
for i, v in enumerate(era_stat["median_price"]):
    ax.text(i, v + era_stat["median_price"].max() * 0.02, f"{v:.2f}",
            ha="center", fontsize=10, color="#374151")
ax.set_ylabel("中位挂牌单价（万/㎡）")
ax.set_xlabel("小区建成年代")
ax.set_title("不同年代小区的中位挂牌单价（2020后 = 次新/期房）")
ax.set_ylim(0, era_stat["median_price"].max() * 1.15)
fig.tight_layout()
fig.savefig(f"{CHART_DIR}/era_price.svg")
plt.close(fig)

results["corr_age_price_city"] = {}
# 用年份原值算相关（仅控制说明用，粗略）
sub = agedf[["year_built", "price"]]
results["corr_year_price"] = float(sub["year_built"].corr(sub["price"]))

# ============================================================
# 第 7 课：供需（挂牌量）
# ============================================================
city_supply = (
    df.groupby("city")
    .agg(secondhand=("secondhand_count", "sum"),
         rent=("rent_count", "sum"),
         median_price=("price", "median"))
    .reset_index()
)
results["supply_top15"] = (
    city_supply.sort_values("secondhand", ascending=False)
    .head(15)[["city", "secondhand", "rent", "median_price"]]
    .to_dict("records")
)
results["corr_second_rent"] = float(
    city_supply["secondhand"].corr(city_supply["rent"])
)

fig, ax = plt.subplots(figsize=(8, 4.6))
top = city_supply.sort_values("secondhand", ascending=False).head(15).iloc[::-1]
ax.barh(top["city"], top["secondhand"], color=BLUE, height=0.62,
        label="二手房挂牌（套）")
ax.barh(top["city"], top["rent"], color=ORANGE, height=0.62,
        label="租房挂牌（套）")
ax.set_xlabel("挂牌总数（套）")
ax.set_title("哪些城市在大量卖房：二手房+租房挂牌量 Top15")
ax.legend(frameon=False, loc="lower right")
fig.tight_layout()
fig.savefig(f"{CHART_DIR}/supply_top15.svg")
plt.close(fig)

# 租赁活跃度：租房挂牌 / 二手房挂牌（只看有二手挂牌的城市）
valid = city_supply[city_supply["secondhand"] > 0].copy()
valid["rent_ratio"] = valid["rent"] / valid["secondhand"]
results["rent_ratio_top10"] = (
    valid.sort_values("rent_ratio", ascending=False)
    .head(10)[["city", "rent_ratio", "median_price"]]
    .to_dict("records")
)

# ============================================================
# 第 8 课：地理分布
# ============================================================
geo = df.dropna(subset=["longitude", "latitude"]).copy()
results["geo_n"] = len(geo)

fig, ax = plt.subplots(figsize=(8.6, 5.4))
sc = ax.scatter(
    geo["longitude"], geo["latitude"],
    c=np.log10(geo["price"]), cmap="viridis", s=2.2, alpha=0.55, linewidths=0,
)
cbar = fig.colorbar(sc, ax=ax, shrink=0.85)
ticks = [-1, 0, 1, 1.5]
cbar.set_ticks(ticks)
cbar.set_ticklabels([f"{10**t:.1f}" for t in ticks])
cbar.set_label("挂牌单价（万/㎡，对数刻度）")
ax.set_xlabel("经度")
ax.set_ylabel("纬度")
ax.set_title(f"{len(geo):,} 个小区在地图上的位置（颜色=价格，越亮越贵）")
ax.set_xlim(73, 136)
ax.set_ylim(18, 54)
fig.tight_layout()
fig.savefig(f"{CHART_DIR}/geo_scatter.svg")
plt.close(fig)

# ============================================================
# 输出 JSON
# ============================================================
def default(o):
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return float(o)
    return str(o)

with open("/workspace/analysis/results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2, default=default)

print("OK 图表与结果已生成：")
for fn in sorted(os.listdir(CHART_DIR)):
    print("  -", fn)
print("\n关键数字预览：")
print("清洗后行数:", results["shape_clean"])
print("中位价:", results["clean_median_price"])
print("最贵城市 Top5:", [r["city"] for r in results["top15_cities"][:5]])
print("最便宜城市 Bottom5:", [r["city"] for r in results["bottom10_cities"][:5]])
