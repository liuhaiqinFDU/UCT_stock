document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = ['eventid', 'window', 'PrimarySector', 'state'];
    let eventTitles = {};

    // Fetch event IDs and titles for the eventid dropdown
    fetch('json_data/event_ids.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // Parse the JSON from the response
        })
        .then(data => {
            // Extract unique eventid values and titles
            const uniqueEventIds = [...new Set(data.map(item => item.eventid))];
            eventTitles = data.reduce((acc, item) => {
                acc[item.eventid] = item.title;
                return acc;
            }, {});
            console.log("Unique Event IDs and Titles received:", uniqueEventIds, eventTitles);

            // Populate the dropdown list
            populateDropdown('eventid', uniqueEventIds);

            // Set default values
            if (uniqueEventIds.length > 0) {
                document.getElementById('eventid').value = uniqueEventIds[0];
            }

            // Fetch options for the default event ID
            fetchOptions();
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });

    // Event listener for the eventid dropdown
    document.getElementById('eventid').addEventListener('change', () => {
        fetchOptions();
        fetchData();
    });

    // Event listener for other dropdowns
    dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData);
    });

    function populateDropdown(id, options) {
        const select = document.getElementById(id);
        select.innerHTML = ''; // Clear existing options
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.text = option;
            select.add(opt);
        });
    }

    function fetchOptions() {
        const eventid = document.getElementById('eventid').value;
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
            .catch(error => console.error('Error fetching options:', error));
    }

    function fetchData() {
        const eventid = document.getElementById('eventid').value;
        const window = document.getElementById('window').value;
        const primarySector = document.getElementById('PrimarySector').value; //||null
        const state = document.getElementById('state').value; //||null

        // Fetch the data from the JSON file
        fetch(`json_data/event${eventid}.json`)
            .then(response => response.json())
            .then(data => {
                console.log("Data fetched for event:", eventid, data);

                const filteredData = data.filter(item => 
                    (item.PrimarySector === primarySector) &&
                    (item.state === state)
                );

                console.log("Filtered data:", filteredData);

                if (filteredData.length === 0) {
                    document.getElementById('chart1').innerHTML = 'No data';
                } else {
                    // Remove "No data" message if it exists
                    if (document.getElementById('chart1').innerHTML === 'No data') {
                        document.getElementById('chart1').innerHTML = '';
                    }
                    plotData(filteredData, window, 'chart1', eventTitles[eventid]);
                }
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    function plotData(data, window, chartId, title) {
        console.log("Data received for plotting:", data);
        console.log("Window:", window);

        // Filter data based on the window parameter
        let filteredData;
        if (window == 45) {
            filteredData = data.filter(item => item.dist >= -15 && item.dist <= 30);
        } else if (window == 30) {
            filteredData = data.filter(item => item.dist >= -10 && item.dist <= 20);
        } else {
            filteredData = data; // No filtering for other window values
        }

        const dist = filteredData.map(item => item.dist);
        const median = filteredData.map(item => item[`cret${window}_median`]);
        const perc_10 = filteredData.map(item => item[`cret${window}_perc_10`]);
        const perc_90 = filteredData.map(item => item[`cret${window}_perc_90`]);

        console.log("Dist:", dist);
        console.log("Median:", median);
        console.log("Perc 10:", perc_10);
        console.log("Perc 90:", perc_90);
        console.log("Title:", title);

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
            yaxis: { title: 'Cumulative Returns (%, annualized)' }
        };

        Plotly.newPlot(chartId, [traceBand, traceMedian], layout);
    }
});
