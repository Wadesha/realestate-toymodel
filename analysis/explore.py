# -*- coding: utf-8 -*-
"""探索数据质量，为教程做准备"""
import pandas as pd

df = pd.read_csv('/workspace/toy_realestate_sample.csv', encoding='utf-8-sig')

print("=== 形状 ===")
print(df.shape)

print("\n=== 列名 ===")
print(list(df.columns))

print("\n=== 每列缺失值 ===")
print(df.isna().sum())

print("\n=== 前3行 ===")
print(df.head(3).to_string())

print("\n=== 城市数 ===")
print(df['city'].nunique())
print(df['city'].value_counts().head(10))

print("\n=== district 样例（看年份前缀模式） ===")
print(df['district'].dropna().astype(str).str.extract(r'^(\d{4})(.*)$')[1].value_counts().head(15))
print("无年份前缀的 district 数:", df['district'].fillna('').str.match(r'^\d{4}').sum(), "/", df['district'].notna().sum())

print("\n=== price_change 取值样例 ===")
print(df['price_change'].value_counts().head(8))

print("\n=== year_built ===")
print(df['year_built'].describe())

print("\n=== price 描述统计 ===")
print(df['price'].describe())

print("\n=== synthetic ===")
print(df['synthetic'].value_counts())

print("\n=== 重复行 ===")
print(df.duplicated().sum())

print("\n=== 有坐标的比例 ===")
print(df['longitude'].notna().mean())
