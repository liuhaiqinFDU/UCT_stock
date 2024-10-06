document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = ['eventid', 'window', 
        'PrimarySector','state'];  //,'SIC4', 'city', 'conml'
    /*
    const dropdowns2 = ['eventid2', 
        'PrimarySector2']; //'SIC42','state2', 'city2', 'conml2'
    */

    // Fetch event IDs for the eventid dropdown
    // fetch('/get_event_ids')
    fetch('json_data/event_ids.json')
        .then(response => response.json())
        .then(event_ids => {
            console.log("Event IDs received:", event_ids);
            populateDropdown('eventid', event_ids);
            //populateDropdown('eventid2', event_ids);

            // Set default values
            document.getElementById('eventid').value = 1; //event_ids[0]
            document.getElementById('window').value = 45;
            //document.getElementById('eventid2').value = 1;

            // Fetch options for the default event ID
            fetchOptions();
            //fetchOptions2();
        })
        .catch(error => console.error('Error fetching event IDs:', 
            error));

    // Event listener for the eventid dropdown
    document.getElementById('eventid').addEventListener('change', () => {
        fetchOptions();
        fetchData();  // must put it here otw it won't allow you to fetch after changing options
    });
    //document.getElementById('eventid2').addEventListener('change', fetchOptions2);

    // Event listener for other dropdowns
    dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', 
            fetchData);
    });
    /*
    dropdowns2.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', 
        fetchData2);
    });
    */

    function populateDropdown(id, options) {
        const select = document.getElementById(id);
        select.innerHTML = ''; // Clear existing options
        if (select) {
            select.innerHTML = ''; // Clear existing options
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.text = option;
                select.add(opt);
            });
        } else {
            console.warn(`Dropdown with id ${id} does not exist`);
        }
    }

    function fetchOptions() {
        const eventid = document.getElementById('eventid').value;
        /* instead of calling backend calculation in python
        use pre-calculated figure data
        fetch('/get_options', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ eventid })
        })
        */
        fetch(`json_data/event${eventid}.json`)
        .then(response => response.json())
        .then(data => {
            const primarySectors = [...new Set(data.map(item => item.PrimarySector))];
            const states = [...new Set(data.map(item => item.state))];
            console.log("Options received:", { primarySectors, states });
            populateDropdown('PrimarySector', primarySectors);
            populateDropdown('state', states);

            // Set default values
            document.getElementById('PrimarySector').value = primarySectors[0];
            document.getElementById('state').value = states[0];

            fetchData(); // Fetch data after setting options
        })
        .then(options => {
            console.log("Options received:", options);
            populateDropdown('window', options.window);
            populateDropdown('PrimarySector', options.PrimarySector);
            //populateDropdown('SIC4', options.SIC4);
            populateDropdown('state', options.state);
            //populateDropdown('city', options.city);
            //populateDropdown('conml', options.conml);
            
            // Set a more dynamic default
            const primarySectorDefault = null; //options.PrimarySector[0] || "Information Technology"; 
            const stateDefault = null; //options.PrimarySector[0] || "CA"; 

            // Set default value for PrimarySector
            document.getElementById('PrimarySector').value = primarySectorDefault;
            //document.getElementById('SIC4').value = null;
            document.getElementById('state').value = stateDefault;
            //document.getElementById('city').value = null;
            //document.getElementById('conml').value = null;

            // Fetch data and plot the chart with default values
            fetchData();
        })
        .catch(error => {
            console.error('Error fetching event IDs:', error);
            alert('There was an error fetching the event IDs. Please try again later.');
        });
    }
    /*
    function fetchOptions2() {
        const eventid = document.getElementById('eventid2').value;
        fetch('/get_options', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ eventid })
        })
        .then(response => response.json())
        .then(options => {
            console.log("Options received:", options);
            populateDropdown('PrimarySector2', options.PrimarySector);
            //populateDropdown('conml2', options.conml);
            //populateDropdown('city2', options.city);
            //populateDropdown('state2', options.state);
            //populateDropdown('SIC42', options.SIC4);

            // Set default value for PrimarySector
            document.getElementById('PrimarySector2').value = "Information Technology";
            //document.getElementById('SIC4').value = null;
            //document.getElementById('state').value = null;
            //document.getElementById('city').value = null;
            //document.getElementById('conml').value = null;

            // Fetch data and plot the chart with default values
            fetchData2();
        })
        .catch(error => console.error('Error fetching options:', error));
    }
    */
    function fetchData() {
        const data = {
            eventid: document.getElementById('eventid').value,
            window: document.getElementById('window').value,
            PrimarySector: document.getElementById('PrimarySector').value || null,
            //conml: document.getElementById('conml').value || null,
            //city: document.getElementById('city').value || null,
            state: document.getElementById('state').value || null
            //SIC4: document.getElementById('SIC4').value || null
        };

        // Fetch the data from the API (no, change it to json)
        /*
        fetch('/get_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        */
        fetch(`json_data/event${eventid}.json`)
        .then(response => response.json())
        .then(data => {
            const filteredData = data.filter(item => 
                //item.window == window && 
                (!primarySector || item.PrimarySector === primarySector) &&
                (!state || item.state === state)
            );

            if (filteredData.length === 0) {
                document.getElementById('chart1').innerHTML = 'No data';
            } else {
                // Remove "No data" message if it exists
                if (document.getElementById('chart1').innerHTML === 'No data') {
                    document.getElementById('chart1').innerHTML = '';
                }
                plotData(filteredData, window, 'chart1');
            }
        })
        .catch(error => console.error('Error fetching data:', error));
    }

    /*
    function fetchData2() {
        const data = {
            eventid: document.getElementById('eventid2').value,
            PrimarySector: document.getElementById('PrimarySector2').value || null
            //conml: document.getElementById('conml2').value || null,
            //city: document.getElementById('city2').value || null,
            //state: document.getElementById('state2').value || null,
            //SIC4: document.getElementById('SIC42').value || null,
        };

        // Fetch the data from the API
        fetch('/get_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            plotHistogram(data, 'chart2');
        })
        .catch(error => console.error('Error fetching data:', error));
    */
    
    function plotData(data, window, chartId) {

        const dist = data.map(item => item.dist);
        const median = data.map(item => item[`cret${window}_median`]);
        const perc_10 = data.map(item => item[`cret${window}_perc_10`]);
        const perc_90 = data.map(item => item[`cret${window}_perc_90`]);
        let title = data[0].title;

        // Function to insert <br> tags for long titles
        function insertLineBreaks(str, maxLineLength) {
            let result = '';
            let lineLength = 0;

            for (let i = 0; i < str.length; i++) {
                result += str[i];
                lineLength++;

                if (lineLength >= maxLineLength && str[i] === ' ') {
                    result += '<br>';
                    lineLength = 0;
                }
            }

            return result;
        }

        // Insert line breaks into the title
        title = insertLineBreaks(title, 100); 

        const traceMedian = {
            x: dist,
            y: median,
            mode: 'lines',
            name: 'Median',
            line: { color: 'blue' }
        };

        const traceBand = {
            x: [...dist, ...dist.slice().reverse()],
            y: [...perc_90, ...perc_10.slice().reverse()],
            fill: 'toself',
            fillcolor: 'lightgrey',
            line: { color: 'transparent' },
            name: '10%-90% Range'
        };

        const layout = {
            title: title,
            xaxis: { title: 'Minutes to the Event' },
            yaxis: { title: 'Cumulative Returns' }
        };

        Plotly.newPlot(chartId, [traceBand, traceMedian], layout);
    }

    /*
    function plotHistogram(data, chartId) {
        const srp30 = data.srp30;
        const srp45 = data.srp45;
        const srp60 = data.srp60;

        const trace30 = {
            x: srp30,
            type: 'histogram',
            name: '30M',
            opacity: 0.5,
            marker: { color: 'blue' }
        };

        const trace45 = {
            x: srp45,
            type: 'histogram',
            name: '45M',
            opacity: 0.5,
            marker: { color: 'green' }
        };

        const trace60 = {
            x: srp60,
            type: 'histogram',
            name: '60M',
            opacity: 0.5,
            marker: { color: 'red' }
        };

        const layout = {
            title: 'Distribution of Surprises',
            barmode: 'overlay',
            xaxis: { title: 'Surprise' },
            yaxis: { title: 'Count' }
        };

        Plotly.newPlot(chartId, [trace30, trace45, trace60], layout);
    }
    */
});