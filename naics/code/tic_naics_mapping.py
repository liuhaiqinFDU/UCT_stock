import pandas as pd

# 读取tickers.txt文件

tickers_txt_path =  "/Users/jay/Desktop/tickers.txt"
excel_file_path ="/Users/jay/Desktop/tic_naics.xlsx"  
output_file_path = '/Users/jay/Desktop/filtered_tic_naics.xlsx'
unmatched_file_path = '/Users/jay/Desktop/unmatched_tic.txt'

# 读取文件
with open(tickers_txt_path, 'r') as file:
    tickers = file.read().splitlines()

# 读取并筛选Excel文件的相关列
tic_naics_df = pd.read_excel(excel_file_path, usecols=['tic', 'naics'])

# 筛选出tickers.txt中包含的ticker并保留首次出现的tic-naics对应关系
filtered_df = tic_naics_df[tic_naics_df['tic'].isin(tickers)]
unique_filtered_df = filtered_df.drop_duplicates(subset=['tic'], keep='first')

# 按首字母排序
unique_filtered_df = unique_filtered_df.sort_values(by=['tic'])

# 保存筛选后的结果到新的Excel文件
unique_filtered_df.to_excel(output_file_path, index=False)

# 统计匹配到的ticker，并按首字母排序
matched_tickers = unique_filtered_df['tic'].unique()
matched_count = len(matched_tickers)

# 找出未匹配到的ticker，并按首字母排序
unmatched_tickers = list(set(tickers) - set(matched_tickers))
unmatched_tickers_sorted = sorted(unmatched_tickers)
unmatched_count = len(unmatched_tickers_sorted)

# 保存未匹配到的ticker到新的txt文件
with open(unmatched_file_path, 'w') as file:
    file.write('\n'.join(unmatched_tickers_sorted))


# 输出结果
print('matched count:', matched_count)
print('unmatched count:', unmatched_count)