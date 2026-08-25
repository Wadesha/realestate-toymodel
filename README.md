# 全国房产 toymodel 训练样例集

抓取受限（50 页反爬等）导致无法拿到每城全部小区，故本集为 **hybrid 构建**：
主体来自真实抓取的抽样，仅对完全没有数据的城市补极少量合成行。**仅作 toymodel / 方法论学"城市-区县-价格结构"用，不是权威房价基准。**

## 构成

| 项 | 数值 |
|---|---|
| 总行数 | 15,346 |
| 真实抽样 | 15,302 |
| 合成补位 | 44（`synthetic=1`） |
| 覆盖城市 | 209 |
| 带坐标 | 11,284（73.5%） |
| 价格中位数 | 0.62 万/㎡ |

## 字段

`city, community_name, district, subdistrict, road, nearby, price, price_yuan, original_price, price_change, secondhand_count, rent_count, year_built, fetch_date, detail_links, longitude, latitude, synthetic`

- `price`：挂牌均价（万/㎡）；`price_yuan`：整数元/㎡
- `synthetic`：`0`=真实抓取；`1`=合成补位（价格照同省锚城分布抽取，地址/坐标留空）
- 坐标：真实抓取的为 WGS-84

## 构建

主体 = 对真实权威集（约 19.8 万条）按城市分层抽样、优先带坐标；仅对权威集确无数据的城市每城生成 4 条合成行。合成数据与真实数据以 `synthetic` 隔离，不混入权威集。

生成脚本：`build_toymodel.py`（seed 固定，可复现）。数据抓取日期约 2026-03—08。