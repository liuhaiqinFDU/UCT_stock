import pandas as pd

unmatched_file_path = '/Users/jay/Desktop/unmatched_tic.txt'
unmatched_csv_path = '/Users/jay/Desktop/unmatched_2010-2024.csv'
existing_xlsx_path = '/Users/jay/Desktop/filtered_tic_naics.xlsx'
updated_xlsx_path = '/Users/jay/Desktop/filtered_tic_naics_updated.xlsx'
new_unmatched_txt_path = '/Users/jay/Desktop/unmatched_tic_2.txt'

# 读取之前未匹配的ticker
with open(unmatched_file_path, 'r') as file:
    unmatched_tickers = file.read().splitlines()

# 读取新的CSV文件，保留相关列
unmatched_df = pd.read_csv(unmatched_csv_path, usecols=['tic', 'naics'])

# 筛选出新的匹配结果
new_filtered_df = unmatched_df[unmatched_df['tic'].isin(unmatched_tickers)]
new_unique_filtered_df = new_filtered_df.drop_duplicates(subset=['tic'], keep='first')

# 找到仍未匹配到的ticker
new_matched_tickers = new_unique_filtered_df['tic'].unique()
still_unmatched_tickers = list(set(unmatched_tickers) - set(new_matched_tickers))
still_unmatched_tickers_sorted = sorted(still_unmatched_tickers)

# 保存仍未匹配到的ticker到新的txt文件
with open(new_unmatched_txt_path, 'w') as file:
    file.write('\n'.join(still_unmatched_tickers_sorted))

# 读取现有的filtered_tic_naics.xlsx文件
existing_df = pd.read_excel(existing_xlsx_path)

# 将新匹配的结果添加到现有的Excel中并去重排序
combined_df = pd.concat([existing_df, new_unique_filtered_df])
combined_df = combined_df.drop_duplicates(subset=['tic'], keep='first').sort_values(by=['tic'])

# 保存更新后的结果到新的Excel文件
combined_df.to_excel(updated_xlsx_path, index=False)

# 统计已匹配的ticker数量和仍未匹配的ticker数量
existing_ticker_count = len(combined_df['tic'].unique())
still_unmatched_count = len(still_unmatched_tickers_sorted)

print('existing_ticker_count:', existing_ticker_count)
print('still_unmatched_count:', still_unmatched_count)