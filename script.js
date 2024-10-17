document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = ['eventid', 'window', 'PrimarySector', 'state'];
    let eventTitles = {};
    let eventDates = {};
    let eventTics = {};
    let eventDistToLabels = {}; 
    // Add this global variable to store the dist_to_labels mapping


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
                    eventDistToLabels[item.eventid] = item.dist_to_labels;
                }
            });
            console.log("Event Titles:", eventTitles);
            console.log("Event Dates:", eventDates);
            console.log("Event Tics:", eventTics);
            console.log("Event Labels:", eventDistToLabels);

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
            plotData(filteredData, window, 'chart1', eventTitles[eventid], eventDates[eventid]
                , eventTics[eventid], eventDistToLabels[eventid]);
        }
    }
    /*
    function generateXLabels(eventDate, eventTic, distArray) {
        const tradingStart = 9 * 60 + 30; // 9:30 AM in minutes
        const tradingEnd = 16 * 60; // 4:00 PM in minutes
        const tradingMinutesPerDay = tradingEnd - tradingStart;
    
        // Convert eventDate and eventTic to a Date object
        const [year, month, day] = eventDate.split('-').map(Number);
        const eventTime = new Date(year, month - 1, day, Math.floor(eventTic / 60), eventTic % 60);
    
        function addTradingMinutes(date, minutes) {
            let currentMinutes = date.getHours() * 60 + date.getMinutes();
            let daysToAdd = 0;
    
            while (minutes !== 0) {
                if (currentMinutes >= tradingStart && currentMinutes < tradingEnd) {
                    const remainingMinutesToday = tradingEnd - currentMinutes;
                    if (minutes > 0) {
                        if (minutes <= remainingMinutesToday) {
                            currentMinutes += minutes;
                            minutes = 0;
                        } else {
                            minutes -= remainingMinutesToday;
                            currentMinutes = tradingEnd;
                        }
                    } else {
                        const minutesSinceStart = currentMinutes - tradingStart;
                        if (Math.abs(minutes) <= minutesSinceStart) {
                            currentMinutes += minutes;
                            minutes = 0;
                        } else {
                            minutes += minutesSinceStart;
                            currentMinutes = tradingStart;
                        }
                    }
                }
    
                if (currentMinutes >= tradingEnd || currentMinutes < tradingStart) {
                    daysToAdd += minutes > 0 ? 1 : -1;
                    currentMinutes = minutes > 0 ? tradingStart : tradingEnd;
                    if (date.getDay() === 5 && minutes > 0) daysToAdd += 2; // Skip to Monday
                    if (date.getDay() === 1 && minutes < 0) daysToAdd -= 2; // Skip to Friday
                }
            }
    
            date.setDate(date.getDate() + daysToAdd);
            date.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60);
            return date;
        }
    
        return distArray.map(dist => {
            const labelDate = new Date(eventTime);
            addTradingMinutes(labelDate, dist);
            return labelDate.toISOString().replace('T', ' ').substring(0, 16);
        });
    }
    */

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

    function plotData(data, window, chartId, title, date, tic, eventDistToLabel) {
        //console.log("Data received for plotting:", data);
        //console.log("Window:", window);
        
        console.log("Title:", title);
        console.log("Date:", date);
        console.log("Time:", tic);

        // Calculate and display the event time (hour and minute from tic)
        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
        const eventTime = `${date} ${hour}:${minute < 10 ? '0' + minute : minute}`;
        
        // Set the time in a separate text box or div
        const timeBox = document.getElementById('eventTime'); // Assumes you have an element with ID 'eventTime'
        timeBox.innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}`;
        
        
        // Insert line breaks into the title
        title = insertLineBreaks(title, 100);
        

        // Filter data based on the window parameter
        let filteredData;
        if (window == 45) {
            filteredData = data.filter(item => item.dist >= -15 && item.dist <= 30);
        } else if (window == 30) {
            filteredData = data.filter(item => item.dist >= -10 && item.dist <= 20);
        } else {
            filteredData = data; // No filtering for other window values
        }

        // Check if dist = 0 exists in the data
        const hasDistZero = filteredData.some(item => item.dist === 0);
            
        if (!hasDistZero) {
            filteredData.push({
                dist: 0,
                [`cret${window}_median`]: null,
                [`cret${window}_perc_10`]: null,
                [`cret${window}_perc_90`]: null
            });
            filteredData.sort((a, b) => a.dist - b.dist); 
            // Ensure data is sorted by dist

            // Insert "0": eventTime into eventDistToLabel
            eventDistToLabel[0] = eventTime;
        }

        const dist = [], median = [], perc_10 = [], perc_90 = [];
        filteredData.forEach(item => {
            dist.push(item.dist);
            median.push(item[`cret${window}_median`] / 982.8);
            perc_10.push(item[`cret${window}_perc_10`] / 982.8);
            perc_90.push(item[`cret${window}_perc_90`] / 982.8);
        });

        const xLabels = dist.map(d => eventDistToLabel[d] || d);

        const traceMedian = {
            x: xLabels,
            y: median,
            mode: 'lines',
            name: 'Median',
            line: { color: 'blue' }
        };

        const traceBand = {
            x: [...xLabels, ...xLabels.slice().reverse()],
            y: [...perc_90, ...perc_10.slice().reverse()],
            fill: 'toself',
            fillcolor: 'lightgrey',
            line: { color: 'transparent' },
            name: '10%-90%'
        };

        // Create shapes for vertical lines when date changes
        const shapes = [
            { // plot the red dash line at dist=0
                type: 'line',
                x0: xLabels[dist.indexOf(0)],
                y0: Math.min(...perc_10),
                x1: xLabels[dist.indexOf(0)],
                y1: Math.max(...perc_90),
                line: {
                    color: 'red',
                    width: 2,
                    dash: 'dashdot'
                }
            }
        ];

        // Add gray vertical lines when date changes
        for (let i = 1; i < xLabels.length; i++) {
            const prevDate = xLabels[i - 1].split(' ')[0];
            const currDate = xLabels[i].split(' ')[0];
            if (prevDate !== currDate) {
                shapes.push({
                    type: 'line',
                    x0: xLabels[i-1],
                    y0: Math.min(...perc_10),
                    x1: xLabels[i-1],
                    y1: Math.max(...perc_90),
                    line: {
                        color: 'gray',
                        width: 1,
                        dash: 'dot'
                    }
                });
            }
        }

        const layout = {
            title: title,
            xaxis: {
                title: '',
                //tickformat: '%Y-%m-%d %H:%M', >>> can't do this otw it's identified as time
                tickangle: 45,
                type: 'category',
                tickvals: xLabels.filter((_, i) => i % 3 === 0), // Show every 5th label
                tickfont: {
                    size: 10 // Reduce font size
                }
            },
            yaxis: { title: 'Cumulative Minutely Returns (%)' },
            shapes: shapes /*[
                { // plot the red dash line at dist=0
                    type: 'line',
                    x0: xLabels[dist.indexOf(0)],
                    y0: Math.min(...perc_10),
                    x1: xLabels[dist.indexOf(0)],
                    y1: Math.max(...perc_90),
                    line: {
                        color: 'red',
                        width: 2,
                        dash: 'dashdot'
                    }
                }
            ] */
        };

        Plotly.newPlot(chartId, [traceBand, traceMedian], layout);
    }

    // Fetch options for the second tab
    function fetchOptions2() {
        const eventid = document.getElementById('eventid2').value;
        const figuresContainer = document.getElementById('figuresContainer');
        figuresContainer.innerHTML = ''; // Clear existing figures

        // Assuming the figures are stored in the 'figures' folder
        const figurePrefix = `cret${eventid}`;
        const maxFigures = 10; // Adjust this number based on the maximum expected number of figures

        for (let i = 1; i <= maxFigures; i++) {
            const img = document.createElement('img');
            img.src = `figures/${figurePrefix}_${i}.png`;
            img.alt = `Figure for event ID ${eventid}`;
            img.onerror = () => img.style.display = 'none'; // Hide image if not found
            figuresContainer.appendChild(img);
        }
    }
    
});
