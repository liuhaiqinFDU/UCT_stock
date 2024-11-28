import os
import json
import pandas as pd

# 定义文件路径
cis_naics_mapping_path = '/Users/jay/Desktop/naics/cis_naics_mapping.xlsx'
event_folder_path = '/Users/jay/Desktop/UCT_stock/winner_loser'
output_folder_path = '/Users/jay/Desktop/naics/winner_loser_naics'

# 创建保存修改后文件的目录
os.makedirs(output_folder_path, exist_ok=True)

# 读取cis_naics_mapping.xlsx文件
naics_mapping_df = pd.read_excel(cis_naics_mapping_path)

# 将ticker和naics_dsp列转化为字典方便查找
ticker_to_naics = dict(zip(naics_mapping_df['tic'], naics_mapping_df['naics_dsp']))

# 遍历文件夹中所有可能的JSON文件
for k in range(1, 119):  # 假设k的范围是1到118
    file_name = f"event{k}.json"
    file_path = os.path.join(event_folder_path, file_name)
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        continue

    # 读取JSON文件
    with open(file_path, 'r') as f:
        data = json.load(f)

    # 修改每个JSON对象中的"SIC4"为"naics"
    for item in data:
        ticker = item.get("ticker")
        if ticker in ticker_to_naics:
            item["naics"] = ticker_to_naics[ticker]
        if "SIC4" in item:
            del item["SIC4"]  # 删除原"SIC4"键

    # 保存修改后的JSON文件到新的目录
    output_file_path = os.path.join(output_folder_path, file_name)
    with open(output_file_path, 'w') as f:
        json.dump(data, f, indent=4)
