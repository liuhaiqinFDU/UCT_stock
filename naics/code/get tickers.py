import os
import json

# 定义文件目录路径
directory_path = "/Users/jay/Desktop/UCT_stock/winner_loser"  # 替换为存储 JSON 文件的实际路径
output_file_path = "/Users/jay/Desktop/tickers.txt"

# 存储唯一的 ticker 值
tickers = set()

# 遍历目录中的所有文件
for i in range(1, 119):  # 从 1 到 118 遍历文件编号
    file_path = os.path.join(directory_path, f"event{i}.json")
    if os.path.exists(file_path):  # 检查文件是否存在
        with open(file_path, "r") as file:
            try:
                data = json.load(file)
                for item in data:
                    if "ticker" in item:
                        tickers.add(item["ticker"])
            except json.JSONDecodeError:
                print(f"Error decoding JSON in file: {file_path}")

# 将唯一的 ticker 写入到输出文件中
with open(output_file_path, "w") as output_file:
    for ticker in sorted(tickers):
        output_file.write(f"{ticker}\n")

# 打印 ticker 的数量
print(f"Unique tickers count: {len(tickers)}")

# 输出结果路径
output_file_path