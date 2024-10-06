# -*- coding: utf-8 -*-
"""
Created on Sun Oct  6 16:15:47 2024

@author: Haiqin Liu 

convert stata file to json 

This file will collapse all the data to median/percentiles by industry/state groups
"""
import os
import pandas as pd
import json

# 定义数据文件夹路径
data_folder = 'stata_data'
output_file = 'json_data/event_ids.json'

# 创建一个集合来存储所有的 event_id
event_ids = []

# 遍历数据文件夹中的所有 .dta 文件
for file_name in os.listdir(data_folder):
    if file_name.endswith('.dta'):
        
        # 提取 event_id 并添加到集合中
        event_ids.append(file_name.replace(".dta","").replace("event",""))

# 将集合转换为列表并排序
event_ids = sorted(list(event_ids))

# 将 event_ids 列表写入 JSON 文件
with open(output_file, 'w') as json_file:
    json.dump(event_ids, json_file)

print(f"Event IDs have been written to {output_file}")



import os
import pandas as pd
import json

# 定义数据文件夹路径
data_file = 'crets_full.dta'
output_folder = 'json_data'

# 创建输出文件夹（如果不存在）
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# 读取 .dta 文件
df = pd.read_stata(data_file)

# 获取所有唯一的 eventid
event_ids = df['eventid'].unique()

# 遍历每个 eventid
for event_id in event_ids:
    # 过滤出当前 eventid 的数据
    event_data = df[df['eventid'] == event_id]
    title = str(event_data['events'].iloc[0])
    
    # 计算每个 (PrimarySector, state, dist) 组合的统计量
    grouped = event_data.groupby(['PrimarySector', 'state', 'dist']).agg({
        'cret30': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)],
        'cret45': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)],
        'cret60': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)]
    }).reset_index()

    # 重命名列
    grouped.columns = [
        'PrimarySector', 'state', 'dist',
        'cret30_median', 'cret30_perc_10', 'cret30_perc_90',
        'cret45_median', 'cret45_perc_10', 'cret45_perc_90',
        'cret60_median', 'cret60_perc_10', 'cret60_perc_90'
    ]
    
    grouped = grouped[(grouped['PrimarySector'] != '') & (grouped['state'] != '')]
    
    grouped = grouped.assign(title=title)
    
    
    
    
    # a. PrimarySector=null, compute distribution within each state 
    summary = event_data.groupby(['state', 'dist']).agg({
        'cret30': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)],
        'cret45': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)],
        'cret60': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)]
    }).reset_index()
    summary.columns = [
        'state','dist',
        'cret30_median', 'cret30_perc_10', 'cret30_perc_90',
        'cret45_median', 'cret45_perc_10', 'cret45_perc_90',
        'cret60_median', 'cret60_perc_10', 'cret60_perc_90'
    ]
    summary=summary[(summary['state'] != '')]
    summary['PrimarySector'] = None
    summary['title'] = title
    grouped = pd.concat([grouped, summary], ignore_index=True)
    
    
    
    # b. state=null, PrimarySector 遍历除了空值以外的所有取值
    summary = event_data.groupby(['PrimarySector', 'dist']).agg({
        'cret30': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)],
        'cret45': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)],
        'cret60': ['median', lambda x: x.quantile(0.1), lambda x: x.quantile(0.9)]
    }).reset_index()
    summary.columns = [
        'PrimarySector','dist',
        'cret30_median', 'cret30_perc_10', 'cret30_perc_90',
        'cret45_median', 'cret45_perc_10', 'cret45_perc_90',
        'cret60_median', 'cret60_perc_10', 'cret60_perc_90'
    ]
    summary=summary[(summary['PrimarySector'] != '')]
    summary['state'] = None
    summary['title'] = title
    grouped = pd.concat([grouped, summary], ignore_index=True)
    
    

    # c. PrimarySector=null, state=null = full sample (不排除sector or state为空)
    overall_summary = event_data.groupby('dist').agg({
        'cret30': ['median', lambda x: x.quantile(0.1), 
                             lambda x: x.quantile(0.9)],
        'cret45': ['median', lambda x: x.quantile(0.1), 
                             lambda x: x.quantile(0.9)],
        'cret60': ['median', lambda x: x.quantile(0.1), 
                             lambda x: x.quantile(0.9)]
    }).reset_index(drop=False)
    overall_summary.columns = [
        'dist',
        'cret30_median', 'cret30_perc_10', 'cret30_perc_90',
        'cret45_median', 'cret45_perc_10', 'cret45_perc_90',
        'cret60_median', 'cret60_perc_10', 'cret60_perc_90'
    ]
    overall_summary['PrimarySector'] = None
    overall_summary['state'] = None
    overall_summary['title'] = title
    grouped = pd.concat([grouped, overall_summary], ignore_index=True)
    
    # 将 DataFrame 转换为 JSON 格式
    json_data = grouped.to_json(orient='records')

    # 定义输出 JSON 文件路径
    json_file_path = os.path.join(output_folder, f'event{event_id}.json')

    # 将 JSON 数据写入文件
    with open(json_file_path, 'w') as json_file:
        json_file.write(json_data)

    print(f"Processed event ID {event_id} and saved to {json_file_path}")

print("All event IDs have been processed.")