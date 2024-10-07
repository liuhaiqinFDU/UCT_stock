document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = ['eventid', 'window', 'PrimarySector', 'state'];
    let eventTitles = {};
    let eventDates = {};
    let eventTics = {};

    // Fetch event IDs and titles, timings for the eventid dropdown
    fetch('json_data/event_ids.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // Parse the JSON from the response
        })
        .then(data => {
            // Extract unique eventid values and map eventid to titles and tics in a single pass
            const uniqueEventIds = [];
            //const eventTitles = {};
            //const eventDates = {};
            //const eventTics = {};
    
            data.forEach(item => {
                if (!eventTitles[item.eventid]) { // Process only if not already processed
                    uniqueEventIds.push(item.eventid);
                    eventTitles[item.eventid] = item.title;
                    eventDates[item.eventid] = item.date;
                    eventTics[item.eventid] = item.tic;
                }
            });
            console.log("Event Titles:", eventTitles);
            console.log("Event Dates:", eventDates);
            console.log("Event Tics:", eventTics);

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
    
    // Fetch the list of event IDs for the second tab
    fetch('json_data/event_ids_questionable.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // Parse the JSON from the response
        })
        .then(data => {
            const uniqueEventIds = [...new Set(data.map(item => item.eventid))];
            populateDropdown('eventid2', uniqueEventIds);
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
    
    // Event listener for the second tab
    document.getElementById('eventid2').addEventListener('change', () => {
        fetchOptions2(); // only need to fetch figures
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
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json(); // Parse the JSON from the response
            })
            .then(data => {
                const primarySectors = new Set();  // Use Set to get unique values
                const states = new Set();
    
                // Single iteration to collect both PrimarySector and state
                data.forEach(item => {
                    primarySectors.add(item.PrimarySector);
                    states.add(item.state);
                });
    
                // Convert Sets to Arrays for the dropdowns
                const primarySectorsArray = Array.from(primarySectors);
                const statesArray = Array.from(states);
    
                console.log("Options received:", { primarySectorsArray, statesArray });
    
                populateDropdown('PrimarySector', primarySectorsArray);
                populateDropdown('state', statesArray);
    
                // Set default values (null or first element can be chosen here)
                document.getElementById('PrimarySector').value = null;
                document.getElementById('state').value = null;
    
                // Fetch data after setting options
                fetchData();
            })
            .catch(error => {
                console.error('Error fetching options:', error);
            });
    }

    let cachedEventData = {};  // Cache object to store fetched event data

    function fetchData() {
        const eventid = document.getElementById('eventid').value;
        const window = document.getElementById('window').value;
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;

        // Check if data is cached
        if (cachedEventData[eventid]) {
            processData(cachedEventData[eventid], primarySector, state, window, eventid);
        } else {
            // Fetch the data only if it's not cached
            fetch(`json_data/event${eventid}.json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    // Cache the data for future use
                    cachedEventData[eventid] = data;
                    console.log("Data fetched for event:", eventid, data);
                    processData(data, primarySector, state, window, eventid);
                })
                .catch(error => console.error('Error fetching data:', error));
        }
    }

    function processData(data, primarySector, state, window, eventid) {
        // Filter data only if necessary
        const filteredData = data.filter(item =>
            (item.PrimarySector === primarySector) && //!primarySector || 
            (item.state === state) //!state || 
        );

        console.log("Filtered data:", filteredData);

        const chartElement = document.getElementById('chart1');

        if (filteredData.length === 0) {
            chartElement.innerHTML = 'No data';
        } else {
            // Remove "No data" message if it exists
            if (chartElement.innerHTML === 'No data') {
                chartElement.innerHTML = '';
            }
            // Plot data
            plotData(filteredData, window, 'chart1', eventTitles[eventid], eventDates[eventid], eventTics[eventid]);
        }
    }

    function plotData(data, window, chartId, title, date, tic) {
        //console.log("Data received for plotting:", data);
        //console.log("Window:", window);
        
        // Set the time in a separate text box or div
        const timeBox = document.getElementById('eventTime'); // Assumes you have an element with ID 'eventTime'
        timeBox.innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}`;
        
        // Filter data based on the window parameter
        let filteredData;
        if (window == 45) {
            filteredData = data.filter(item => item.dist >= -15 && item.dist <= 30);
        } else if (window == 30) {
            filteredData = data.filter(item => item.dist >= -10 && item.dist <= 20);
        } else {
            filteredData = data; // No filtering for other window values
        }
    
        // Combine map calls into a single iteration to reduce overhead
        const dist = [], median = [], perc_10 = [], perc_90 = [];
        filteredData.forEach(item => {
            dist.push(item.dist);
            median.push(item[`cret${window}_median`]/982.8);
            perc_10.push(item[`cret${window}_perc_10`]/982.8);
            perc_90.push(item[`cret${window}_perc_90`]/982.8);
        });
    
        console.log("Dist:", dist);
        console.log("Median:", median);
        console.log("Perc 10:", perc_10);
        console.log("Perc 90:", perc_90);
        console.log("Title:", title);
        console.log("Date:", date);
        console.log("Time:", tic);
    
        // Function to insert <br> tags for long titles
        function insertLineBreaks(str, maxLineLength) {
            const words = str.split(' ');
            let result = '';
            let currentLineLength = 0;
    
            words.forEach(word => {
                if (currentLineLength + word.length > maxLineLength) {
                    result += '<br>';
                    currentLineLength = 0;
                }
                result += word + ' ';
                currentLineLength += word.length + 1;
            });
    
            return result.trim();
        }
    
        // Insert line breaks into the title
        title = insertLineBreaks(title, 100);
    
        // Plotly traces
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
    
        // Plotly layout
        const layout = {
            title: title,
            xaxis: { title: 'Minutes to the Event' },
            yaxis: { title: 'Cumulative Minutely Returns (%)' }
        };
    
        // Render the chart
        Plotly.newPlot(chartId, [traceBand, traceMedian], layout);
    
        // Calculate and display the event time (hour and minute from tic)
        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
    
    }

    
    // Fetch options for the second tab
    function fetchOptions2() {
        const eventid = document.getElementById('eventid2').value;
        const figuresContainer = document.getElementById('figuresContainer');
        figuresContainer.innerHTML = ''; // Clear existing figures

        // Assuming the figures are stored in the 'figures' folder
        const figurePrefix = `cret${eventid}`;
        const figureExtensions = ['.png', '.jpg', '.jpeg']; // Add other extensions if needed

        figureExtensions.forEach(extension => {
            const img = document.createElement('img');
            img.src = `figures/${figurePrefix}${extension}`;
            img.alt = `Figure for event ID ${eventid}`;
            img.onerror = () => img.style.display = 'none'; // Hide image if not found
            figuresContainer.appendChild(img);
        });
    }
    
});
