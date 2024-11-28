import pandas as pd

# 定义文件路径
filtered_xlsx_path = '/Users/jay/Desktop/filtered_tic_naics_updated.xlsx'
naics_codes_xlsx_path = '/Users/jay/Desktop/2-6 digit_2022_Codes.xlsx'
output_xlsx_path = '/Users/jay/Desktop/cis_naics_mapping.xlsx'

# 读取现有的filtered_tic_naics_updated.xlsx文件
filtered_df = pd.read_excel(filtered_xlsx_path)

# 读取NAICS代码和描述的Excel文件
naics_codes_df = pd.read_excel(naics_codes_xlsx_path, usecols=['NAICS_Code', '2022_Title'])

# 将NAICS代码和描述合并成一列
naics_codes_df['naics_dsp'] = naics_codes_df['NAICS_Code'].astype(str) + '-' + naics_codes_df['2022_Title']

# 将描述信息合并到原始数据中
merged_df = filtered_df.merge(naics_codes_df[['NAICS_Code', 'naics_dsp']],
                              left_on='naics',
                              right_on='NAICS_Code',
                              how='left')

# 删除辅助列，并保留需要的三列
final_df = merged_df[['tic', 'naics', 'naics_dsp']]
final_df = final_df.sort_values(by=['tic'])

# 保存最终结果到新的Excel文件
final_df.to_excel(output_xlsx_path, index=False)

# 输出保存路径
output_xlsx_path