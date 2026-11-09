"""T-019 营养成分对比：从美国农业部 FoodData Central 的 SR Legacy 数据包（CC0）里取 3 种食物每 100 克的营养成分，写成 assets/nutrients.csv。

    python3 T-019/fdc.py

数据包约 6 MB，下载到 samples/out/dl/（不进仓库）；只留下面 3 个食物、7 项营养素。
"""
import csv
import io
import urllib.request
import zipfile
from pathlib import Path

URL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip"
UA = "AI-Coding-Video-sample-builder/0.1 (https://github.com/Chans-gh/AI-Coding-Video)"
FOODS = {171688: ("苹果", "Apples, raw, with skin"), 173944: ("香蕉", "Bananas, raw"), 171705: ("牛油果", "Avocados, raw, all commercial varieties")}
NUTS = {1008: ("热量", "kcal"), 1004: ("脂肪", "g"), 1005: ("碳水", "g"), 2000: ("糖", "g"), 1079: ("膳食纤维", "g"), 1003: ("蛋白质", "g"), 1092: ("钾", "mg")}
HERE = Path(__file__).resolve().parent


def main():
    dl = HERE.parent / "out" / "dl" / "fdc_sr_legacy_2018-04.zip"
    if not dl.exists():
        dl.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": UA}), timeout=300) as r:
            dl.write_bytes(r.read())
    z = zipfile.ZipFile(dl)
    name = next(n for n in z.namelist() if n.endswith("food_nutrient.csv"))
    val = {}
    for row in csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8")):
        f, n = int(row["fdc_id"]), int(row["nutrient_id"])
        if f in FOODS and n in NUTS:
            val[f, n] = float(row["amount"])
    out = HERE / "assets" / "nutrients.csv"
    with open(out, "w", encoding="utf-8", newline="") as fp:
        w = csv.writer(fp)
        fp.write("# 每 100 克可食部分（fdc_id 是 FoodData Central 的食物编号：" + "、".join(f"{k} {v[1]}" for k, v in FOODS.items()) + "）；来源 USDA FoodData Central SR Legacy（2018-04），CC0 1.0\n")
        w.writerow(["fdc_id", "food"] + [f"{NUTS[n][0]}({NUTS[n][1]})" for n in NUTS])
        for f, (zh, en) in FOODS.items():
            w.writerow([f, zh] + [val.get((f, n), "") for n in NUTS])
    print(out.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
