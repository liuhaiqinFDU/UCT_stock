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

    const appState2 = {
        dropdowns: ['eventid2', 'window2', 'PrimarySector2', 'state2', 'SIC42', 'city2', 'conml2'],
        eventTitles: {},
        eventDates: {},
        eventTics: {},
        eventDistToLabels: {},
        cachedEventData: {},
        initialDropdownData: {}
    };

    async function fetchJSON(url){
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

    async function initialize(){
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
            populateDropdown('eventid_question', uniqueEventIds);
        } catch (error) {
            console.error('Error fetching questionable event IDs:', error);
        }

        try {
            const eventData2 = await fetchJSON('winner_loser/event_ids.json');
            const uniqueEventIds2 = [];
            eventData2.forEach(item => {
                if (!appState2.eventTitles[item.eventid]) {
                    uniqueEventIds2.push(item.eventid);
                    appState2.eventTitles[item.eventid] = item.title;
                    appState2.eventDates[item.eventid] = item.date;
                    appState2.eventTics[item.eventid] = item.tic;
                    appState2.eventDistToLabels[item.eventid] = item.dist_to_labels;
                }
            });
            populateDropdown('eventid2', uniqueEventIds2);
            if (uniqueEventIds2.length > 0) {
                document.getElementById('eventid2').value = uniqueEventIds2[0];
                document.getElementById('window2').value = 45;
            }
            await fetchOptions2();
        } catch (error) {
            console.error('Initialization error:', error);
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

    async function fetchOptions2() {
        const eventid2 = document.getElementById('eventid2').value;
        try {
            const data2 = await fetchJSON(`winner_loser/event${eventid2}.json`);
            appState2.cachedEventData[eventid2] = data2;
            updateDropdowns2(data2);
            await fetchData2();
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

    function updateDropdowns2(data2) {
        const primarySectors2 = new Set();
        const states2 = new Set();

        data2.forEach(item => {
            primarySectors2.add(item.PrimarySector);
            states2.add(item.state);
        });

        const selectedPrimarySector2 = document.getElementById('PrimarySector2').value;
        const selectedState2 = document.getElementById('state2').value;

        populateDropdown('PrimarySector2', Array.from(primarySectors2), selectedPrimarySector2);
        populateDropdown('state2', Array.from(states2), selectedState2);

        // Store initial dropdown data for city, SIC4, and conml
        appState2.initialDropdownData = data2;
        updateCityDropdown(data2, selectedPrimarySector2, selectedState2);
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

    async function fetchData2() {
        const eventid2 = document.getElementById('eventid2').value;
        const window2 = document.getElementById('window2').value;
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        const city2 = document.getElementById('city2').value;
        const sic42 = document.getElementById('SIC42').value;
        const conml2 = document.getElementById('conml2').value;

        if (appState2.cachedEventData[eventid2]) {
            processData2(appState2.cachedEventData[eventid2], 
                primarySector2, state2, city2, sic42, conml2, window2, eventid2);
        } else {
            try {
                const data2 = await fetchJSON(`winner_loser/event${eventid2}.json`);
                appState2.cachedEventData[eventid2] = data2;
                processData2(data2,primarySector2,state2,city2,sic42,conml2,window2,eventid2);
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

    function processData2(data2, primarySector2, state2, city2, sic42, conml2, window2, eventid2) {
        let filteredData2 = data2.filter(item =>
            (!primarySector2 || item.PrimarySector === primarySector2) &&
            (!state2 || item.state === state2) &&
            (!city2 || item.city === city2) &&
            (!sic42 || item.SIC4 === sic42) &&
            (!conml2 || item.conml === conml2)
        );

        // Filter data based on the window parameter
        if (window2 == 45) {
            filteredData2 = filteredData2.filter(item => item.dist >= -15 && item.dist <= 30);
        } else if (window2 == 30) {
            filteredData2 = filteredData2.filter(item => item.dist >= -10 && item.dist <= 20);
        }

        const chartElement2 = document.getElementById('chart2');
        if (filteredData2.length === 0) {
            chartElement2.innerHTML = 'No data';
        } else {
            if (chartElement2.innerHTML === 'No data') {
                chartElement2.innerHTML = '';
            }
            const stats2 = calculateStatistics(filteredData2, window2); 
            // I use the same function but not plot the same data
            plotData2(filteredData2, window2, stats2, 'chart2', appState2.eventTitles[eventid2], 
                appState2.eventDates[eventid2], appState2.eventTics[eventid2], 
                appState2.eventDistToLabels[eventid2]);
            plotData3(filteredData2, window2, stats2, 'chart3', 
                appState2.eventDates[eventid2], appState2.eventTics[eventid2], 
                appState2.eventDistToLabels[eventid2]);
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

    function updateCityDropdown2(data2, primarySector2, state2) {
        const cities2 = new Set();

        data2.forEach(item => {
            if ((!primarySector2 || item.PrimarySector === primarySector2) &&
                (!state2 || item.state === state2)) {
                cities2.add(item.city);
            }
        });

        const selectedCity2 = document.getElementById('city2').value;
        populateDropdown('city2', Array.from(cities2), selectedCity2);
        updateSIC4Dropdown2(data2, primarySector2, state2, selectedCity2);
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

    function updateSIC4Dropdown2(data2, primarySector2, state2, city2) {
        const sic4s2 = new Set();

        data2.forEach(item => {
            if ((!primarySector2 || item.PrimarySector === primarySector2) &&
                (!state2 || item.state === state2) &&
                (!city2 || item.city === city2)) {
                sic4s2.add(item.SIC4);
            }
        });

        const selectedSIC42 = document.getElementById('SIC42').value;
        populateDropdown('SIC42', Array.from(sic4s2), selectedSIC42);
        updateCompanyDropdown2(data2, primarySector2, state2, city2, selectedSIC42);
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
    
    function updateCompanyDropdown2(data2, primarySector2, state2, city2, sic42) {
        const conmls2 = new Set();

        data2.forEach(item => {
            if ((!primarySector2 || item.PrimarySector === primarySector2) &&
                (!state2 || item.state === state2) &&
                (!city2 || item.city === city2) &&
                (!sic42 || item.SIC4 === sic42)) {
                conmls2.add(item.conml);
            }
        });

        const selectedConml2 = document.getElementById('conml2').value;
        populateDropdown('conml2', Array.from(conmls2), selectedConml2);
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

        //console.log("Title:", title);
        //console.log("Date:", date);
        //console.log("Time:", tic);

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

    function plotData2(filteredData, window2, stats, chartId, title, date, tic, eventDistToLabel) {

        // Calculate and display the event time (hour and minute from tic)
        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
        const eventTime = `${date} ${hour}:${minute < 10 ? '0' + minute : minute}`;
        // Insert line breaks into the title
        title = insertLineBreaks(title, 100);
        document.getElementById('eventTime2').innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}, ${title}`;
    
    
        let { dist, perc_10, perc_90 } = stats;
        
        // Check if dist = 0 exists in the data
        const hasDistZero = dist.includes(0);
        if (!hasDistZero) {
            dist.push(0);
            perc_10.push(0);
            perc_90.push(0);
    
            // Sort dist and keep the same order for other arrays
            const sortedIndices = dist.map((value, index) => [value, index])
                                      .sort(([a], [b]) => a - b)
                                      .map(([, index]) => index);
    
            dist = sortedIndices.map(index => dist[index]);
            perc_10 = sortedIndices.map(index => perc_10[index]);
            perc_90 = sortedIndices.map(index => perc_90[index]);
    
            // Insert "0": eventTime into eventDistToLabel
            eventDistToLabel[0] = eventTime;
        }
    
        const xLabels = dist.map(d => eventDistToLabel[d] || d);
        
        // Group data by firm name (conml)
        const groupedData = filteredData.reduce((acc, row) => {
            if (!acc[row.conml]) {
                 acc[row.conml] = [];
            }
            acc[row.conml].push(row);
            return acc;
        }, {});
        
        // Create traces for each firm
        const traces = Object.keys(groupedData).map(firmName => {
            const firmData = groupedData[firmName];
            // Sort firmData by dist
            firmData.sort((a, b) => a.dist - b.dist);
            return {
                x: firmData.map(row => row.dist),
                y: firmData.map(row => row[`cret${window2}_abnormal`]),
                mode: 'lines+markers',
                name: firmName,
                hoverinfo: 'name',
                opacity: 0.6 // Set initial opacity
            };
        });
        console.log("traces:", traces); 
    
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
            title: 'Cumulative Abnormal Returns (Minutely, %)',
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
            yaxis: { title: '' },
            shapes: shapes,
            hovermode: 'closest', // Highlight the closest point
            hoverlabel: {
                bgcolor: 'white',
                font: { color: 'black' }
            },
            showlegend: false // Disable the legend
        };
    
        Plotly.newPlot(chartId, traces, layout);

        // Add hover event to change opacity of other lines
        const plotElement = document.getElementById(chartId);
        plotElement.on('plotly_hover', function(data) {
            const update = {
                opacity: traces.map((_, i) => i === data.points[0].curveNumber ? 1 : 0.2)
            };
            Plotly.restyle(chartId, update);
        });

        plotElement.on('plotly_unhover', function(data) {
            const update = {
                opacity: traces.map(() => 0.6)
            };
            Plotly.restyle(chartId, update);
        });
    }

    function plotData3(filteredData, window2, stats, chartId, date, tic, eventDistToLabel) {

        // Calculate and display the event time (hour and minute from tic)
        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
        const eventTime = `${date} ${hour}:${minute < 10 ? '0' + minute : minute}`;
        //document.getElementById('eventTime2').innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}`;
    
        // Insert line breaks into the title
        //title = insertLineBreaks(title, 100);
    
        let { dist, perc_10, perc_90 } = stats;
        
        // Check if dist = 0 exists in the data
        const hasDistZero = dist.includes(0);
        if (!hasDistZero) {
            dist.push(0);
            perc_10.push(0);
            perc_90.push(0);
    
            // Sort dist and keep the same order for other arrays
            const sortedIndices = dist.map((value, index) => [value, index])
                                      .sort(([a], [b]) => a - b)
                                      .map(([, index]) => index);
    
            dist = sortedIndices.map(index => dist[index]);
            perc_10 = sortedIndices.map(index => perc_10[index]);
            perc_90 = sortedIndices.map(index => perc_90[index]);
    
            // Insert "0": eventTime into eventDistToLabel
            eventDistToLabel[0] = eventTime;
        }
    
        const xLabels = dist.map(d => eventDistToLabel[d] || d);
        
        // Group data by firm name (conml)
        const groupedData = filteredData.reduce((acc, row) => {
            if (!acc[row.conml]) {
                 acc[row.conml] = [];
            }
            acc[row.conml].push(row);
            return acc;
        }, {});
        
        // Create traces for each firm
        const traces = Object.keys(groupedData).map(firmName => {
            const firmData = groupedData[firmName];
            // Sort firmData by dist
            firmData.sort((a, b) => a.dist - b.dist);
            return {
                x: firmData.map(row => row.dist),
                y: firmData.map(row => row[`cret${window2}_absolute`]),
                mode: 'lines+markers',
                name: firmName,
                hoverinfo: 'name',
                opacity: 0.6 // Set initial opacity
            };
        });
        console.log("traces:", traces); 
    
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
            title: 'Cumulative Absolute Returns (Minutely, %)',
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
            yaxis: { title: '' },
            shapes: shapes,
            hovermode: 'closest', // Highlight the closest point
            hoverlabel: {
                bgcolor: 'white',
                font: { color: 'black' }
            },
            showlegend: false // Disable the legend
        };
    
        Plotly.newPlot(chartId, traces, layout);

        // Add hover event to change opacity of other lines
        const plotElement = document.getElementById(chartId);
        plotElement.on('plotly_hover', function(data) {
            const update = {
                opacity: traces.map((_, i) => i === data.points[0].curveNumber ? 1 : 0.2)
            };
            Plotly.restyle(chartId, update);
        });

        plotElement.on('plotly_unhover', function(data) {
            const update = {
                opacity: traces.map(() => 0.6)
            };
            Plotly.restyle(chartId, update);
        });
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
    
    document.getElementById('eventid').addEventListener('change', () => {
        fetchOptions();
        fetchData();
    });

    document.getElementById('eventid2').addEventListener('change', () => {
        fetchOptions2();
        fetchData2();
    });
    
    // Event listener for the second tab
    document.getElementById('eventid_question').addEventListener('change', () => {
        fetchOptions_question(); // only need to fetch figures
    });

    appState.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData);
    });

    appState2.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData2);
    });


    document.getElementById('PrimarySector').addEventListener('change', () => {
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        updateCityDropdown(appState.initialDropdownData, primarySector, state);
    });

    document.getElementById('PrimarySector2').addEventListener('change', () => {
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        updateCityDropdown2(appState2.initialDropdownData, primarySector2, state2);
    });

    document.getElementById('state').addEventListener('change', () => {
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        updateCityDropdown(appState.initialDropdownData, primarySector, state);
    });

    document.getElementById('state2').addEventListener('change', () => {
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        updateCityDropdown2(appState2.initialDropdownData, primarySector2, state2);
    });

    document.getElementById('city').addEventListener('change', () => {
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        const city = document.getElementById('city').value;
        updateSIC4Dropdown(appState.initialDropdownData, primarySector, state, city);
    });

    document.getElementById('city2').addEventListener('change', () => {
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        const city2 = document.getElementById('city2').value;
        updateSIC4Dropdown2(appState2.initialDropdownData, primarySector2, state2, city2);
    });

    document.getElementById('SIC4').addEventListener('change', () => {
        const primarySector = document.getElementById('PrimarySector').value;
        const state = document.getElementById('state').value;
        const city = document.getElementById('city').value;
        const sic4 = document.getElementById('SIC4').value;
        updateCompanyDropdown(appState.initialDropdownData, primarySector, state, city, sic4);
    });

    document.getElementById('SIC42').addEventListener('change', () => {
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        const city2 = document.getElementById('city2').value;
        const sic42 = document.getElementById('SIC42').value;
        updateCompanyDropdown2(appState2.initialDropdownData, primarySector2, state2, city2, sic42);
    });

    // Fetch options for the second tab
    function fetchOptions_question() {
        const eventid = document.getElementById('eventid_question').value;
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

    initialize();
});