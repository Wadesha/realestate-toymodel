# -*- coding: utf-8 -*-
"""
全国小区房价数据分析 · 入门教程 —— 完整代码合集
====================================================
使用方法：
  1. 把本文件和 toy_realestate_sample.csv 放在同一个文件夹里
  2. 安装依赖：python -m pip install pandas matplotlib
  3. 运行：python complete_analysis.py
  4. 所有图表会保存在当前文件夹的 charts/ 目录下

这是教程 8 课所有代码的"合体版"，按课程顺序分节，可以整体运行，
也可以挑某一段复制到自己的脚本里单独玩。
"""
import os

import matplotlib
matplotlib.use("Agg")  # 不弹窗，直接存文件；想弹窗看图就注释掉这一行
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# ---------- 中文字体（Windows: 微软雅黑 / Mac: 苹方）----------
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "PingFang SC", "SimHei"]
plt.rcParams["axes.unicode_minus"] = False

BLUE, RED, ORANGE, GREEN, GRAY = "#2563eb", "#dc2626", "#f59e0b", "#16a34a", "#6b7280"
os.makedirs("charts", exist_ok=True)

# ============================================================
# 第 1-2 课：读数据 + 清洗
# ============================================================
df = pd.read_csv("toy_realestate_sample.csv", encoding="utf-8-sig")
print("原始数据：", df.shape)

df = df.drop_duplicates()                              # 去重（-250 行）
df = df[df["synthetic"] == 0]                          # 去合成数据（-44 行）
df = df[df["price"].notna() & (df["price"] > 0)]       # 去无价格行（-17 行）
df["district_clean"] = (                               # "2023历下" → "历下"
    df["district"].astype(str).str.replace(r"^\d{4}", "", regex=True)
)

def parse_change(v):
    """'0.28%'→0.28；'持平'/'模拟'→0.0；其他→NaN"""
    if pd.isna(v):
        return np.nan
    s = str(v)
    if s in ("持平", "模拟"):
        return 0.0
    try:
        return float(s.replace("%", ""))
    except ValueError:
        return np.nan

df["price_change_pct"] = df["price_change"].apply(parse_change)
print("清洗完成：", df.shape)

# ============================================================
# 第 3 课：全国房价总览
# ============================================================
print("\n价格摸底：")
print(df["price"].describe())

data = df.loc[df["price"] <= 3, "price"]
fig, ax = plt.subplots(figsize=(8, 4.2))
ax.hist(data, bins=40, color=BLUE, edgecolor="white", linewidth=0.5)
ax.axvline(df["price"].median(), color=RED, ls="--", lw=1.5,
           label=f'中位数 {df["price"].median():.2f} 万')
ax.axvline(df["price"].mean(), color=ORANGE, ls="--", lw=1.5,
           label=f'平均数 {df["price"].mean():.2f} 万')
ax.set_xlabel("挂牌均价（万/㎡）")
ax.set_ylabel("小区数量（个）")
ax.set_title(f"全国 {len(df):,} 个小区的挂牌单价分布（≤3万/㎡，覆盖 92%）")
ax.legend()
fig.tight_layout()
fig.savefig("charts/price_dist.png", dpi=150)
plt.close(fig)

print("\n最贵小区 Top10：")
print(df.nlargest(10, "price")[
    ["city", "community_name", "price", "year_built", "secondhand_count"]
].to_string(index=False))

# ============================================================
# 第 4 课：城市对比
# ============================================================
city_stat = (
    df.groupby("city")
      .agg(n=("community_name", "count"),
           median_price=("price", "median"),
           mean_price=("price", "mean"),
           min_price=("price", "min"),
           max_price=("price", "max"))
      .sort_values("median_price", ascending=False)
      .reset_index()
)

def barh_cities(sub, fname, title, color):
    fig, ax = plt.subplots(figsize=(8, 4.6))
    names, vals = sub["city"].iloc[::-1], sub["median_price"].iloc[::-1]
    ax.barh(names, vals, color=color, height=0.62)
    for i, v in enumerate(vals):
        ax.text(v + vals.max() * 0.01, i, f"{v:.2f}", va="center", fontsize=10)
    ax.set_xlabel("中位挂牌单价（万/㎡）")
    ax.set_title(title)
    ax.set_xlim(0, vals.max() * 1.12)
    fig.tight_layout()
    fig.savefig(f"charts/{fname}", dpi=150)
    plt.close(fig)

barh_cities(city_stat.head(15), "city_top15.png",
            "城市房价天花板：中位单价最贵的 15 城（万/㎡）", BLUE)
barh_cities(city_stat.tail(10).iloc[::-1], "city_bottom10.png",
            "城市房价地板：中位单价最低的 10 城（万/㎡）", GREEN)

# ============================================================
# 第 5 课：成都区县对比（示例城市，可换成任何城市）
# ============================================================
cd = (
    df[df["city"] == "成都"]
      .groupby("district_clean")
      .agg(n=("community_name", "count"), median_price=("price", "median"))
      .query("n >= 5")
      .sort_values("median_price", ascending=False)
      .reset_index()
)
fig, ax = plt.subplots(figsize=(8, 4.2))
ax.bar(cd["district_clean"], cd["median_price"], color=BLUE, width=0.6)
for i, v in enumerate(cd["median_price"]):
    ax.text(i, v + cd["median_price"].max() * 0.02, f"{v:.2f}", ha="center")
ax.set_ylabel("中位挂牌单价（万/㎡）")
ax.set_xlabel("区县")
ax.set_title("成都各区县中位挂牌单价（样例 ≥5 个小区）")
ax.set_ylim(0, cd["median_price"].max() * 1.15)
fig.tight_layout()
fig.savefig("charts/chengdu_district.png", dpi=150)
plt.close(fig)

# 数据体检彩蛋：西安的区县居然是吕梁的
print("\n数据体检 - 西安的区县分布：")
print(df[df["city"] == "西安"]["district_clean"].value_counts())

# ============================================================
# 第 6 课：楼龄与房价
# ============================================================
aged = df.dropna(subset=["year_built"]).copy()
bins = [0, 1990, 2000, 2010, 2020, 2030]
labels = ["1990前", "1990-1999", "2000-2009", "2010-2019", "2020后"]
aged["era"] = pd.cut(aged["year_built"], bins=bins, labels=labels, right=False)
era_stat = (
    aged.groupby("era", observed=True)
        .agg(n=("community_name", "count"), median_price=("price", "median"))
        .reset_index()
)
print("\n年代-价格：")
print(era_stat.to_string(index=False))
print("年份与价格相关系数：", round(aged["year_built"].corr(aged["price"]), 3))
sh = aged[aged["city"] == "上海"]
print("上海内部相关系数：", round(sh["year_built"].corr(sh["price"]), 3), "n =", len(sh))

fig, ax = plt.subplots(figsize=(8, 4.2))
ax.bar(era_stat["era"].astype(str), era_stat["median_price"],
      color=[GRAY, BLUE, BLUE, BLUE, RED], width=0.55)
for i, v in enumerate(era_stat["median_price"]):
    ax.text(i, v + era_stat["median_price"].max() * 0.02, f"{v:.2f}", ha="center")
ax.set_ylabel("中位挂牌单价（万/㎡）")
ax.set_xlabel("小区建成年代")
ax.set_title("不同年代小区的中位挂牌单价")
ax.set_ylim(0, era_stat["median_price"].max() * 1.15)
fig.tight_layout()
fig.savefig("charts/era_price.png", dpi=150)
plt.close(fig)

# ============================================================
# 第 7 课：供需分析
# ============================================================
city_supply = (
    df.groupby("city")
      .agg(secondhand=("secondhand_count", "sum"),
           rent=("rent_count", "sum"),
           median_price=("price", "median"))
      .reset_index()
)
print("\n二手挂牌 vs 租房挂牌 相关系数：",
      round(city_supply["secondhand"].corr(city_supply["rent"]), 3))

top = city_supply.sort_values("secondhand", ascending=False).head(15).iloc[::-1]
fig, ax = plt.subplots(figsize=(8, 4.6))
ax.barh(top["city"], top["secondhand"], color=BLUE, height=0.62, label="二手房挂牌（套）")
ax.barh(top["city"], top["rent"], color=ORANGE, height=0.62, label="租房挂牌（套）")
ax.set_xlabel("样本内挂牌总数（套）")
ax.set_title("各城市样本内挂牌量 Top15（注意：非全城总量）")
ax.legend(loc="lower right")
fig.tight_layout()
fig.savefig("charts/supply_top15.png", dpi=150)
plt.close(fig)

# ============================================================
# 第 8 课：地理可视化（星空图）
# ============================================================
geo = df.dropna(subset=["longitude", "latitude"]).copy()
fig, ax = plt.subplots(figsize=(8.6, 5.4))
sc = ax.scatter(geo["longitude"], geo["latitude"],
                c=np.log10(geo["price"]), cmap="viridis",
                s=2.2, alpha=0.55, linewidths=0)
cbar = fig.colorbar(sc, ax=ax, shrink=0.85)
cbar.set_label("挂牌单价（万/㎡，对数刻度）")
ax.set_xlabel("经度")
ax.set_ylabel("纬度")
ax.set_title(f"{len(geo):,} 个小区的地理分布（颜色越亮越贵）")
ax.set_xlim(73, 136)
ax.set_ylim(18, 54)
fig.tight_layout()
fig.savefig("charts/geo_scatter.png", dpi=150)
plt.close(fig)

print(f"\n全部完成！共 {len(geo):,} 个坐标点。图表都保存在 charts/ 文件夹里：")
for fn in sorted(os.listdir("charts")):
    print("  -", fn)
