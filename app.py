from flask import Flask, render_template, request, jsonify
import pandas as pd
import os

app = Flask(__name__)

# Function to get all event IDs from the data folder
def get_event_ids(data_folder='data'):
    event_ids = []
    for file in os.listdir(data_folder):
        if file.endswith('.dta'):
            event_ids.extend([file.replace('.dta','').replace('event','')])
    return sorted(set(event_ids))

# Function to get options for a specific event ID
def get_options_for_event(event_id, data_folder='data'):
    df = pd.read_stata(os.path.join(data_folder, 
                                    'event{}.dta'.format(event_id)))
    return {
        'PrimarySector': df['PrimarySector'].unique().tolist(),
        # 'conml': df['conml'].unique().tolist(),
        # 'city': df['city'].unique().tolist(),
         'state': df['state'].unique().tolist()
        # 'SIC4': df['SIC4'].unique().tolist(),
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_event_ids', methods=['GET'])
def get_event_ids_route():
    try:
        event_ids = get_event_ids()
        print("Event IDs:", event_ids)
        return jsonify(event_ids)
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)})

@app.route('/get_options', methods=['POST'])
def get_options():
    try:
        request_data = request.get_json()
        event_id = request_data.get('eventid')
        options = get_options_for_event(event_id)
        #print("Options for event ID {}: {}".format(event_id, options))
        return jsonify(options)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/get_data', methods=['POST'])
def get_data():
    
    try:
        request_data = request.get_json()
        event_id = request_data.get('eventid')
        window = request_data.get('window')
        primary_sector = request_data.get('PrimarySector')
        state = request_data.get('state')
        '''
        sic = request_data.get('SIC4')
        city = request_data.get('city')
        firm = request_data.get('conml')
        '''
        
        # Load the specific Stata file for the event ID
        data_folder = 'data'
        filtered_data = pd.read_stata(os.path.join(data_folder,
                                        f'event{event_id}.dta'))
        # Get the first entry in the 'event' column
        title = str(filtered_data['event'].iloc[0])

        # Remove rows with missing values in the 'cret{window}' column
        filtered_data = filtered_data.dropna(subset=[f'cret{window}'])
        if primary_sector:
            filtered_data = filtered_data[filtered_data['PrimarySector'] == primary_sector]
        if state:
            filtered_data = filtered_data[filtered_data['state'] == state]
        '''
        if firm:
            filtered_data = filtered_data[filtered_data['conml'] == firm]
        elif city and sic:
            filtered_data = filtered_data[(filtered_data['city'] == city) & (filtered_data['SIC4'] == sic)]
        elif state and primary_sector:
            filtered_data = filtered_data[(filtered_data['state'] == state) & (filtered_data['PrimarySector'] == primary_sector)]
        elif state:
            filtered_data = filtered_data[filtered_data['state'] == state]
        elif primary_sector:
            filtered_data = filtered_data[filtered_data['PrimarySector'] == primary_sector]
        '''

        if filtered_data.empty:
            print("no data!")
            return jsonify([])
        
        # Group by 'dist' and calculate the median, 10% and 90% quantiles for each group
        grouped = filtered_data.groupby('dist')[f'cret{window}'].agg(['median', 
                    lambda x: x.quantile(0.1), 
                    lambda x: x.quantile(0.9)]).reset_index()
        grouped.columns = ['dist', 'median', 'perc_10', 'perc_90']
        
        # Convert the grouped data to lists
        dist    = grouped['dist'   ].tolist()
        median  = grouped['median' ].tolist()
        perc_10 = grouped['perc_10'].tolist()
        perc_90 = grouped['perc_90'].tolist()

        plot_data = {
            'title':title,
            'dist': dist,
            'median': median,
            'perc_10': perc_10,
            'perc_90': perc_90
            #'srp30': filtered_data['srp30'].tolist(),
            #'srp45': filtered_data['srp45'].tolist(),
            #'srp60': filtered_data['srp60'].tolist()
        }
        #print(plot_data)
        return jsonify(plot_data)
    except Exception as e:
        print("something wrong")
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)