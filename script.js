document.addEventListener('DOMContentLoaded', () => {

    // initialize global variables
    const state = {
        dropdowns: ['eventid', 'window', 'PrimarySector', 'state'], //, 'SIC4', 'city'
        eventTitles: {},
        eventDates: {},
        eventTics: {},
        eventDistToLabels: {},
        cachedEventData: {}
    };


    async function fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            throw error;
        }
    }

    
    async function initialize() {
        try {
            const eventData = await fetchJSON('json_data/event_ids.json');
            const uniqueEventIds = [];
            eventData.forEach(item => {
                if (!state.eventTitles[item.eventid]) {
                    uniqueEventIds.push(item.eventid);
                    state.eventTitles[item.eventid] = item.title;
                    state.eventDates[item.eventid] = item.date;
                    state.eventTics[item.eventid] = item.tic;
                    state.eventDistToLabels[item.eventid] = item.dist_to_labels;
                }
            });
            populateDropdown('eventid', uniqueEventIds);
            if (uniqueEventIds.length > 0) {
                document.getElementById('eventid').value = uniqueEventIds[0];
                document.getElementById('window').value = 45;
            }
            await fetchOptions();
        } catch (error) {
            console.error('Initialization error:', error);
        }

        try {
            const questionableEventData = await fetchJSON('json_data/event_ids_questionable.json');
            const uniqueEventIds = [...new Set(questionableEventData.map(item => item.eventid))];
            populateDropdown('eventid2', uniqueEventIds);
        } catch (error) {
            console.error('Error fetching questionable event IDs:', error);
        }
    }

    function populateDropdown(id, options) {
        const select = document.getElementById(id);
        select.innerHTML = '';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.text = option;
            select.add(opt);
        });
    }

    async function fetchOptions() {
        const eventid = document.getElementById('eventid').value;
        try {
            const data = await fetchJSON(`json_data/event${eventid}.json`);
            const primarySectors = new Set();
            const states = new Set();
            data.forEach(item => {
                primarySectors.add(item.PrimarySector);
                states.add(item.state);
            });
            populateDropdown('PrimarySector', Array.from(primarySectors));
            populateDropdown('state', Array.from(states));
            document.getElementById('PrimarySector').value = null;
            document.getElementById('state').value = null;
            await fetchData();
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    }
    
    async function fetchData() {
        const eventid = document.getElementById('eventid').value;
        const window = document.getElementById('window').value;
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;

        if (state.cachedEventData[eventid]) {
            processData(state.cachedEventData[eventid], primarySector, state, window, eventid);
        } else {
            try {
                const data = await fetchJSON(`json_data/event${eventid}.json`);
                state.cachedEventData[eventid] = data;
                processData(data, primarySector, state, window, eventid);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    }

    function processData(data, primarySector, state, window, eventid) {
        const filteredData = data.filter(item =>
            (!primarySector || item.PrimarySector === primarySector) &&
            (!state || item.state === state)
        );

        const chartElement = document.getElementById('chart1');
        if (filteredData.length === 0) {
            chartElement.innerHTML = 'No data';
        } else {
            if (chartElement.innerHTML === 'No data') {
                chartElement.innerHTML = '';
            }
            plotData(filteredData, window, 'chart1', state.eventTitles[eventid], 
                state.eventDates[eventid], state.eventTics[eventid], 
                state.eventDistToLabels[eventid]);
        }
    }

    function plotData(data, window, chartId, title, date, tic, eventDistToLabel) {

        console.log("Title:", title);
        console.log("Date:", date);
        console.log("Time:", tic);

        // Calculate and display the event time (hour and minute from tic)
        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
        const eventTime = `${date} ${hour}:${minute < 10 ? '0' + minute : minute}`;
        document.getElementById('eventTime').innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}`;

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
                [`cret${window}_median` ]: null,
                [`cret${window}_perc_10`]: null,
                [`cret${window}_perc_90`]: null
            });
            filteredData.sort((a, b) => a.dist - b.dist);  // Ensure data is sorted by dist
            
            // Insert "0": eventTime into eventDistToLabel
            eventDistToLabel[0] = eventTime;
        }

        const dist = [], median = [], perc_10 = [], perc_90 = [];
        filteredData.forEach(item => {
            dist.push(item.dist);
            median.push( item[`cret${window}_median` ] / 982.8);
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
    
    async function fetchOptions2() {
        const eventid = document.getElementById('eventid2').value;
        const figuresContainer = document.getElementById('figuresContainer');
        figuresContainer.innerHTML = '';

        const figurePrefix = `cret${eventid}`;
        const maxFigures = 10;

        for (let i = 1; i <= maxFigures; i++) {
            const img = document.createElement('img');
            img.src = `figures/${figurePrefix}_${i}.png`;
            img.alt = `Figure for event ID ${eventid}`;
            img.onerror = () => img.style.display = 'none';
            figuresContainer.appendChild(img);
        }
    }

    document.getElementById('eventid').addEventListener('change', () => {
        fetchOptions();
        fetchData();
    });

    state.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData);
    });

    document.getElementById('eventid2').addEventListener('change', fetchOptions2);

    initialize();
});
