document.addEventListener('DOMContentLoaded', () => {

    // initialize global variables that can't be reassigned
    const appState = {
        dropdowns: ['eventid', 'window', 'PrimarySector', 'state', 'SIC4', 'city', 'conml'],
        eventTitles: {},
        eventDates: {},
        eventTics: {},
        eventDistToLabels: {},
        cachedEventData: {},
        initialDropdownData: {}
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
                if (!appState.eventTitles[item.eventid]) {
                    uniqueEventIds.push(item.eventid);
                    appState.eventTitles[item.eventid] = item.title;
                    appState.eventDates[item.eventid] = item.date;
                    appState.eventTics[item.eventid] = item.tic;
                    appState.eventDistToLabels[item.eventid] = item.dist_to_labels;
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

    function populateDropdown(id, options, selectedValue = '') {
        const select = document.getElementById(id);
        select.innerHTML = '<option value="">-- Select --</option>';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.text = option;
            select.add(opt);
        });
        if (selectedValue) {
            select.value = selectedValue;
        }
    }

    async function fetchOptions() {
        const eventid = document.getElementById('eventid').value;
        try {
            const data = await fetchJSON(`json_data/event${eventid}.json`);
            appState.cachedEventData[eventid] = data;
            updateDropdowns(data);
            await fetchData();
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    }

    function updateDropdowns(data) {
        const primarySectors = new Set();
        const states = new Set();

        data.forEach(item => {
            primarySectors.add(item.PrimarySector);
            states.add(item.state);
        });

        const selectedPrimarySector = document.getElementById('PrimarySector').value;
        const selectedState = document.getElementById('state').value;

        populateDropdown('PrimarySector', Array.from(primarySectors), selectedPrimarySector);
        populateDropdown('state', Array.from(states), selectedState);

        // Store initial dropdown data for city, SIC4, and conml
        appState.initialDropdownData = data;
        updateCityDropdown(data, selectedPrimarySector, selectedState);
    }

    async function fetchData() {
        const eventid = document.getElementById('eventid').value;
        const window = document.getElementById('window').value;
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        const city = document.getElementById('city').value;
        const sic4 = document.getElementById('SIC4').value;
        const conml = document.getElementById('conml').value;

        if (appState.cachedEventData[eventid]) {
            processData(appState.cachedEventData[eventid], 
                primarySector, state, city, sic4, conml, window, eventid);
        } else {
            try {
                const data = await fetchJSON(`json_data/event${eventid}.json`);
                appState.cachedEventData[eventid] = data;
                processData(data, primarySector, state, city, sic4, conml, window, eventid);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    }

    function processData(data, primarySector, state, city, sic4, conml, window, eventid) {
        let filteredData = data.filter(item =>
            (!primarySector || item.PrimarySector === primarySector) &&
            (!state || item.state === state) &&
            (!city || item.city === city) &&
            (!sic4 || item.SIC4 === sic4) &&
            (!conml || item.conml === conml)
        );

        // Filter data based on the window parameter
        if (window == 45) {
            filteredData = filteredData.filter(item => item.dist >= -15 && item.dist <= 30);
        } else if (window == 30) {
            filteredData = filteredData.filter(item => item.dist >= -10 && item.dist <= 20);
        }

        const chartElement = document.getElementById('chart1');
        if (filteredData.length === 0) {
            chartElement.innerHTML = 'No data';
        } else {
            if (chartElement.innerHTML === 'No data') {
                chartElement.innerHTML = '';
            }
            const stats = calculateStatistics(filteredData, window);
            plotData(stats, 'chart1', appState.eventTitles[eventid], 
                appState.eventDates[eventid], appState.eventTics[eventid], 
                appState.eventDistToLabels[eventid]);
        }
    }

    function updateCityDropdown(data, primarySector, state) {
        const cities = new Set();

        data.forEach(item => {
            if ((!primarySector || item.PrimarySector === primarySector) &&
                (!state || item.state === state)) {
                cities.add(item.city);
            }
        });

        const selectedCity = document.getElementById('city').value;
        populateDropdown('city', Array.from(cities), selectedCity);
        updateSIC4Dropdown(data, primarySector, state, selectedCity);
    }

    function updateSIC4Dropdown(data, primarySector, state, city) {
        const sic4s = new Set();

        data.forEach(item => {
            if ((!primarySector || item.PrimarySector === primarySector) &&
                (!state || item.state === state) &&
                (!city || item.city === city)) {
                sic4s.add(item.SIC4);
            }
        });

        const selectedSIC4 = document.getElementById('SIC4').value;
        populateDropdown('SIC4', Array.from(sic4s), selectedSIC4);
        updateCompanyDropdown(data, primarySector, state, city, selectedSIC4);
    }

    function updateCompanyDropdown(data, primarySector, state, city, sic4) {
        const conmls = new Set();

        data.forEach(item => {
            if ((!primarySector || item.PrimarySector === primarySector) &&
                (!state || item.state === state) &&
                (!city || item.city === city) &&
                (!sic4 || item.SIC4 === sic4)) {
                conmls.add(item.conml);
            }
        });

        const selectedConml = document.getElementById('conml').value;
        populateDropdown('conml', Array.from(conmls), selectedConml);
    }
    
    function calculateStatistics(data, window) {
        const cretKey = `cret${window}`;
        const distMap = new Map();

        data.forEach(item => {
            if (!distMap.has(item.dist)) {
                distMap.set(item.dist, []);
            }
            distMap.get(item.dist).push(item[cretKey]);
        });

        const dist = [];
        const median = [];
        const perc_10 = [];
        const perc_90 = [];

        distMap.forEach((values, key) => {
            values.sort((a, b) => a - b);
            const mid = Math.floor(values.length / 2);
            const medianValue = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
            const perc10Value = values[Math.floor(values.length * 0.1)];
            const perc90Value = values[Math.floor(values.length * 0.9)];

            dist.push(key);
            median.push(medianValue);
            perc_10.push(perc10Value);
            perc_90.push(perc90Value);
        });

        return { dist, median, perc_10, perc_90 };
    }

    function plotData(stats, chartId, title, date, tic, eventDistToLabel) {

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

        let { dist, median, perc_10, perc_90 } = stats;
        
        // Check if dist = 0 exists in the data
        const hasDistZero = dist.includes(0);
        if (!hasDistZero) {
            dist.push(0);
            median.push(0); //null
            perc_10.push(0);
            perc_90.push(0);

            // Sort dist and keep the same order for other arrays
            const sortedIndices = dist.map((value, index) => [value, index])
                                      .sort(([a], [b]) => a - b)
                                      .map(([, index]) => index);

            dist = sortedIndices.map(index => dist[index]);
            median = sortedIndices.map(index => median[index]);
            perc_10 = sortedIndices.map(index => perc_10[index]);
            perc_90 = sortedIndices.map(index => perc_90[index]);

            // Insert "0": eventTime into eventDistToLabel
            eventDistToLabel[0] = eventTime;
        }

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

    appState.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData);
    });

    document.getElementById('eventid2').addEventListener('change', fetchOptions2);

    document.getElementById('PrimarySector').addEventListener('change', () => {
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        updateCityDropdown(appState.initialDropdownData, primarySector, state);
    });

    document.getElementById('state').addEventListener('change', () => {
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        updateCityDropdown(appState.initialDropdownData, primarySector, state);
    });

    document.getElementById('city').addEventListener('change', () => {
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        const city = document.getElementById('city').value;
        updateSIC4Dropdown(appState.initialDropdownData, primarySector, state, city);
    });

    document.getElementById('SIC4').addEventListener('change', () => {
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        const city = document.getElementById('city').value;
        const sic4 = document.getElementById('SIC4').value;
        updateCompanyDropdown(appState.initialDropdownData, primarySector, state, city, sic4);
    });

    initialize();
});