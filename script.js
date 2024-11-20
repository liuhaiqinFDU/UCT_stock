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

    const appState_question = {
        dropdowns: ['eventid_question', 'window_question', 'PrimarySector_question', 
            'state_question', 'SIC4_question', 'city_question', 'conml_question'],
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
            const eventData = await fetchJSON('winner_loser/event_ids.json');
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
            console.error('Error fetching unquestionable event IDs:', error);
        }

        try {
            const eventData_question = await fetchJSON('question_data/event_ids.json');
            const uniqueEventIds_question = [];
            eventData_question.forEach(item => {
                if (!appState_question.eventTitles[item.eventid]) {
                    uniqueEventIds_question.push(item.eventid);
                    appState_question.eventTitles[item.eventid] = item.title;
                    appState_question.eventDates[item.eventid] = item.date;
                    appState_question.eventTics[item.eventid] = item.tic;
                    appState_question.eventDistToLabels[item.eventid] = item.dist_to_labels;
                }
            });
            populateDropdown('eventid_question', uniqueEventIds_question);
            if (uniqueEventIds_question.length > 0) {
                document.getElementById('eventid_question').value = 7; //uniqueEventIds_question[0]
                document.getElementById('window_question').value = "3D";
            }
            await fetchOptions_question();
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
            console.error('Error fetching winner-loser event IDs:', error);
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
            const data = await fetchJSON(`winner_loser/event${eventid}.json`);
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

    async function fetchOptions_question() {
        const eventid_question = document.getElementById('eventid_question').value;
        try {
            const data_question = await fetchJSON(`question_data/event${eventid_question}.json`);
            appState_question.cachedEventData[eventid_question] = data_question;
            updateDropdowns_question(data_question);
            await fetchData_question();
        } catch (error) {
            console.error('Error fetching options:', error);
        }


        const figuresContainer = document.getElementById('figuresContainer');
        figuresContainer.innerHTML = ''; // Clear existing figures

        // Assuming the figures are stored in the 'figures' folder
        const figurePrefix = `cret${eventid_question}`;
        const maxFigures = 10; // Adjust this number based on the maximum expected number of figures

        for (let i = 1; i <= maxFigures; i++) {
            const img = document.createElement('img');
            img.src = `figures/${figurePrefix}_${i}.png`;
            img.alt = `Figure for event ID ${eventid_question}`;
            img.onerror = () => img.style.display = 'none'; // Hide image if not found
            figuresContainer.appendChild(img);
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
        updateCityDropdown2(data2, selectedPrimarySector2, selectedState2);
    }

    function updateDropdowns_question(data_question) {
        const primarySectors_question = new Set();
        const states_question = new Set();

        data_question.forEach(item => {
            primarySectors_question.add(item.PrimarySector);
            states_question.add(item.state);
        });

        const selectedPrimarySector_question = document.getElementById('PrimarySector_question').value;
        const selectedState_question = document.getElementById('state_question').value;

        populateDropdown('PrimarySector_question', Array.from(primarySectors_question), selectedPrimarySector_question);
        populateDropdown('state_question', Array.from(states_question), selectedState_question);

        // Store initial dropdown data for city, SIC4, and conml
        appState_question.initialDropdownData = data_question;
        updateCityDropdown_question(data_question, selectedPrimarySector_question, selectedState_question);
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
                const data = await fetchJSON(`winner_loser/event${eventid}.json`);
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

    async function fetchData_question() {
        const eventid_question = document.getElementById('eventid_question').value;
        const window_question = document.getElementById('window_question').value;
        const primarySector_question = document.getElementById('PrimarySector_question').value;
        const state_question = document.getElementById('state_question').value;
        const city_question = document.getElementById('city_question').value;
        const sic4_question = document.getElementById('SIC4_question').value;
        const conml_question = document.getElementById('conml_question').value;

        if (appState_question.cachedEventData[eventid_question]) {
            processData_question(appState_question.cachedEventData[eventid_question], 
                primarySector_question, state_question, city_question, sic4_question,
                conml_question, window_question, eventid_question);
        } else {
            try {
                const data_question = await fetchJSON(`question_data/event${eventid_question}.json`);
                appState_question.cachedEventData[eventid_question] = data_question;
                processData_question(data_question,primarySector_question,state_question,
                    city_question,sic4_question,conml_question,window_question,eventid_question);
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
            const stats = calculateStatistics(filteredData, window,'abnormal');
            const statsabs = calculateStatistics(filteredData, window,'absolute');
            plotData(stats,statsabs,'chart1','chart1abs', appState.eventTitles[eventid], 
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
            const stats2 = calculateStatistics(filteredData2, window2,'abnormal'); 
            // I use the same function but not plot the same data
            plotData2(filteredData2, window2, stats2, 'chart2', appState2.eventTitles[eventid2], 
                appState2.eventDates[eventid2], appState2.eventTics[eventid2], 
                appState2.eventDistToLabels[eventid2]);
            plotData3(filteredData2, window2, stats2, 'chart3', 
                appState2.eventDates[eventid2], appState2.eventTics[eventid2], 
                appState2.eventDistToLabels[eventid2]);
        }
    }

    function processData_question(data_question, primarySector_question, state_question, city_question, sic4_question, conml_question, window_question, eventid_question) {
        let filteredData_question = data_question.filter(item =>
            (!primarySector_question || item.PrimarySector === primarySector_question) &&
            (!state_question || item.state === state_question) &&
            (!city_question || item.city === city_question) &&
            (!sic4_question || item.SIC4 === sic4_question) &&
            (!conml_question || item.conml === conml_question)
        );

        // Filter data based on the window parameter
        if (window_question == 45) {
            filteredData_question = filteredData_question.filter(item => item.dist >= -15 && item.dist <= 30);
        } else if (window_question == 30) {
            filteredData_question = filteredData_question.filter(item => item.dist >= -10 && item.dist <= 20);
        } else if (window_question == 60) {
            filteredData_question = filteredData_question.filter(item => item.dist >= -20 && item.dist <= 40);
        } else if (window_question == 90) {
            filteredData_question = filteredData_question.filter(item => item.dist >= -30 && item.dist <= 60);
        } else if (window_question == 150) {
            filteredData_question = filteredData_question.filter(item => item.dist >= -60 && item.dist <= 90);
        } //else: all 3-D data

        const chartElement_question = document.getElementById('chart2_question');
        if (filteredData_question.length === 0) {
            chartElement_question.innerHTML = 'No data';
        } else {
            if (chartElement_question.innerHTML === 'No data') {
                chartElement_question.innerHTML = '';
            }
            const stats_question = calculateStatistics(filteredData_question, window_question,'abnormal'); 
            // I use the same function but not plot the same data
            plotData2(filteredData_question, window_question, stats_question, 'chart2_question', 
                appState_question.eventTitles[eventid_question],appState_question.eventDates[eventid_question],
                appState_question.eventTics[eventid_question],appState_question.eventDistToLabels[eventid_question]);
            plotData3(filteredData_question, window_question, stats_question, 'chart3_question', 
                appState_question.eventDates[eventid_question], appState2.eventTics[eventid_question], 
                appState_question.eventDistToLabels[eventid_question]);
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

    function updateCityDropdown_question(data_question, primarySector_question, state_question) {
        const cities_question = new Set();

        data_question.forEach(item => {
            if ((!primarySector_question || item.PrimarySector === primarySector_question) &&
                (!state_question || item.state === state_question)) {
                cities_question.add(item.city);
            }
        });

        const selectedCity_question = document.getElementById('city_question').value;
        populateDropdown('city_question', Array.from(cities_question), selectedCity_question);
        updateSIC4Dropdown_question(data_question, primarySector_question, state_question, selectedCity_question);
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

    function updateSIC4Dropdown_question(data_question, primarySector_question, state_question, city_question) {
        const sic4s_question = new Set();

        data_question.forEach(item => {
            if ((!primarySector_question || item.PrimarySector === primarySector_question) &&
                (!state_question || item.state === state_question) &&
                (!city_question || item.city === city_question)) {
                sic4s_question.add(item.SIC4);
            }
        });

        const selectedSIC4_question = document.getElementById('SIC4_question').value;
        populateDropdown('SIC4_question', Array.from(sic4s_question), selectedSIC4_question);
        updateCompanyDropdown_question(data_question,primarySector_question,state_question,city_question,selectedSIC4_question);
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

    function updateCompanyDropdown_question(data_question, primarySector_question, state_question, city_question, sic4_question) {
        const conmls_question = new Set();

        data_question.forEach(item => {
            if ((!primarySector_question || item.PrimarySector === primarySector_question) &&
                (!state_question || item.state === state_question) &&
                (!city_question || item.city === city_question) &&
                (!sic4_question || item.SIC4 === sic4_question)) {
                conmls_question.add(item.conml);
            }
        });

        const selectedConml_question = document.getElementById('conml_question').value;
        populateDropdown('conml_question', Array.from(conmls_question), selectedConml_question);
    }

    function calculateStatistics(data, window,rettype) {
        const cretKey = `cret${window}_${rettype}`;
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

    function plotData(stats, statsabs, chartId, chartIDabs, title, date, tic, eventDistToLabel) {

        //console.log("Title:", title);
        //console.log("Date:", date);
        //console.log("Time:", tic);

        // Calculate and display the event time (hour and minute from tic)
        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
        const eventTime = `${date} ${hour}:${minute < 10 ? '0' + minute : minute}`;
        document.getElementById('eventTime').innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}, ${title}`;

        let { dist, median, perc_10, perc_90 } = stats;
        
        // I'VE MADE SURE DIST FULLY SPANNED FOR EACH FIRM SO NO NEED TO INSERT ANYTHING NOW

        const xLabels = dist.map(d => eventDistToLabel[d] || d);
        //console.log("xLabels:", xLabels); 

        const traceMedian = {
            x: xLabels,
            y: median,
            mode: 'lines',
            name: 'Median',
            line: { color: 'blue' }
        };

        const traceHigh = {
            x: xLabels,
            y: perc_90, 
            mode: 'lines',
            name: 'P90',
            line: { color: 'lightgrey' }
        };

        
        const traceLow = {
            x: xLabels,
            y: perc_10, 
            mode: 'lines',
            name: 'P10',
            line: { color: 'lightgrey' }
        };

        // Determine the appropriate dist value for the red dashed line
        let distValue;
        if (dist.includes(0)) {
            distValue = 0;
        } else if (dist.every(d => d < 0)) {
            distValue = -1;
        } else if (dist.every(d => d > 0)) {
            distValue = 1;
        } else {
            // Default to 0 if none of the above conditions are met
            distValue = 0;
        }

        // Create shapes for vertical lines when date changes
        const shapes = [
            { // plot the red dash line at dist=0
                type: 'line',
                x0: xLabels[dist.indexOf(distValue)],
                y0: Math.min(...perc_10),
                x1: xLabels[dist.indexOf(distValue)],
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
            title: `Cumulative Abnormal Returns (Minutely, %)`,
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

        Plotly.newPlot(chartId, [traceHigh, traceMedian, traceLow], layout);

        // Destructure statsabs with different variable names
        let { dist: distabs, median: medianabs, perc_10: perc_10abs, perc_90: perc_90abs } = statsabs;
        //console.log("statsabs", statsabs);
        // Determine the appropriate dist value for the red dashed line
        let distValueabs;
        if (distabs.includes(0)) {
            distValueabs = 0;
        } else if (distabs.every(d => d < 0)) {
            distValueabs = -1;
        } else if (distabs.every(d => d > 0)) {
            distValueabs = 1;
        } else {
            // Default to 0 if none of the above conditions are met
            distValueabs = 0;
        }

        // I'VE MADE SURE DIST FULLY SPANNED FOR EACH FIRM SO NO NEED TO INSERT ANYTHING NOW

        const xLabelsabs = distabs.map(d => eventDistToLabel[d] || d);

        const traceMedianabs = {
            x: xLabelsabs,
            y: medianabs,
            mode: 'lines',
            name: 'Median',
            line: { color: 'blue' }
        };

        const traceHighabs = {
            x: xLabelsabs,
            y: perc_90abs, 
            mode: 'lines',
            name: 'P90',
            line: { color: 'lightgrey' }
        };

        
        const traceLowabs = {
            x: xLabelsabs,
            y: perc_10abs, 
            mode: 'lines',
            name: 'P10',
            line: { color: 'lightgrey' }
        };

        // Create shapes for vertical lines when date changes
        const shapesabs = [
            { // plot the red dash line at dist=0
                type: 'line',
                x0: xLabelsabs[distabs.indexOf(distValueabs)],
                y0: Math.min(...perc_10abs),
                x1: xLabelsabs[distabs.indexOf(distValueabs)],
                y1: Math.max(...perc_90abs),
                line: {
                    color: 'red',
                    width: 2,
                    dash: 'dashdot'
                }
            }
        ];

        // Add gray vertical lines when date changes
        for (let i = 1; i < xLabelsabs.length; i++) {
            const prevDate = xLabelsabs[i - 1].split(' ')[0];
            const currDate = xLabelsabs[i].split(' ')[0];
            if (prevDate !== currDate) {
                shapesabs.push({
                    type: 'line',
                    x0: xLabelsabs[i-1],
                    y0: Math.min(...perc_10abs),
                    x1: xLabelsabs[i-1],
                    y1: Math.max(...perc_90abs),
                    line: {
                        color: 'gray',
                        width: 1,
                        dash: 'dot'
                    }
                });
            }
        }

        const layoutabs = {
            title: `Cumulative Absolute Returns (Minutely, %)`,
            xaxis: {
                title: '',
                //tickformat: '%Y-%m-%d %H:%M', >>> can't do this otw it's identified as time
                tickangle: 45,
                type: 'category',
                tickvals: xLabelsabs.filter((_, i) => i % 3 === 0), // Show every 5th label
                tickfont: {
                    size: 10 // Reduce font size
                }
            },
            yaxis: { title: '' },
            shapes: shapesabs 
        };

        Plotly.newPlot(chartIDabs, [traceHighabs, traceMedianabs,traceLowabs], layoutabs);
    }

    function plotData2(filteredData, window2, stats, chartId, title, date, tic, eventDistToLabel) {

        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
        const eventTime = `${date} ${hour}:${minute < 10 ? '0' + minute : minute}`;
        document.getElementById('eventTime2').innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}, ${title}`;
    
    
        let { dist, median, perc_10, perc_90 } = stats;
        // Determine the appropriate dist value for the red dashed line
        let distValue;
        if (dist.includes(0)) {
            distValue = 0;
        } else if (dist.every(d => d < 0)) {
            distValue = -1;
        } else if (dist.every(d => d > 0)) {
            distValue = 1;
        } else {
            // Default to 0 if none of the above conditions are met
            distValue = 0;
        }

        const xLabels = dist.map(d => eventDistToLabel[d] || d);
        //console.log("xLabels:", xLabels);
        
        // Group data by firm name (conml)
        const groupedData = filteredData.reduce((acc, row) => {
            if (!acc[row.conml]) {
                 acc[row.conml] = [];
            }
            acc[row.conml].push(row);
            return acc;
        }, {});
        
         // Flatten the cret{window2}_abnormal values across all firms
        const allCretValues = [];
        Object.keys(groupedData).forEach(firmName => {
            const firmData = groupedData[firmName];
            firmData.forEach(row => {
                allCretValues.push(row[`cret${window2}_abnormal`]);
            });
        });

        // Calculate the minimum and maximum values
        const minCretValue = Math.min(...allCretValues);
        const maxCretValue = Math.max(...allCretValues);
        
        // Create traces for each firm
        const traces = Object.keys(groupedData).map(firmName => {
            const firmData = groupedData[firmName];
            // Sort firmData by dist
            firmData.sort((a, b) => a.dist - b.dist);

            return {
                x: xLabels, //firmData.map(row => row.dist), -- so have to make sure it's fully spanned
                y: firmData.map(row => row[`cret${window2}_abnormal`]),
                mode: 'lines+markers',
                name: firmName,
                text: firmData.map(row => `Firm: ${firmName}<br>x: ${row.dist}<br>y: ${row[`cret${window2}_abnormal`]}`),
                hoverinfo: 'text',
                opacity: 0.6 // Set initial opacity
            };
        });
    
        // Create shapes for vertical lines when date changes
        const shapes = [
            { // plot the red dash line at dist=1
                type: 'line',
                x0: xLabels[dist.indexOf(distValue)],
                y0: minCretValue,
                x1: xLabels[dist.indexOf(distValue)],
                y1: maxCretValue,
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
                    y0: minCretValue,
                    x1: xLabels[i-1],
                    y1: maxCretValue,
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
                //ticktext: xLabels.filter((_, i) => i % 3 === 0), //Ensure labels are shown
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
            Plotly.restyle(chartId, update, layout);
        });

        plotElement.on('plotly_unhover', function(data) {
            const update = {
                opacity: traces.map(() => 0.6)
            };
            Plotly.restyle(chartId, update, layout);
        });
    }

    function plotData3(filteredData, window2, stats, chartId, date, tic, eventDistToLabel) {

        // Calculate and display the event time (hour and minute from tic)
        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
        const eventTime = `${date} ${hour}:${minute < 10 ? '0' + minute : minute}`;
        //document.getElementById('eventTime2').innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}`;
    
        let { dist, median, perc_10, perc_90 } = stats;
        
        // Determine the appropriate dist value for the red dashed line
        let distValue;
        if (dist.includes(0)) {
            distValue = 0;
        } else if (dist.every(d => d < 0)) {
            distValue = -1;
        } else if (dist.every(d => d > 0)) {
            distValue = 1;
        } else {
            // Default to 0 if none of the above conditions are met
            distValue = 0;
        }
        // I've made sure `dist` is fully spanned so that no need to insert 0 any more

        const xLabels = dist.map(d => eventDistToLabel[d] || d);
        
        // Group data by firm name (conml)
        const groupedData = filteredData.reduce((acc, row) => {
            if (!acc[row.conml]) {
                 acc[row.conml] = [];
            }
            acc[row.conml].push(row);
            return acc;
        }, {});
        
        // Flatten the cret{window2}_abnormal values across all firms
        const allCretValues = [];
        Object.keys(groupedData).forEach(firmName => {
            const firmData = groupedData[firmName];
            firmData.forEach(row => {
                allCretValues.push(row[`cret${window2}_abnormal`]);
            });
        });

        // Calculate the minimum and maximum values
        const minCretValue = Math.min(...allCretValues);
        const maxCretValue = Math.max(...allCretValues);
        
        // Create traces for each firm
        const traces = Object.keys(groupedData).map(firmName => {
            const firmData = groupedData[firmName];
            // Sort firmData by dist
            firmData.sort((a, b) => a.dist - b.dist);
            return {
                x: xLabels, //firmData.map(row => row.dist),
                y: firmData.map(row => row[`cret${window2}_absolute`]),
                mode: 'lines+markers',
                name: firmName,
                text: firmData.map(row => `Firm: ${firmName}<br>x: ${row.dist}<br>y: ${row[`cret${window2}_absolute`]}`),
                hoverinfo: 'text',
                opacity: 0.6 // Set initial opacity
            };
        }); 
    
        // Create shapes for vertical lines when date changes
        const shapes = [
            { // plot the red dash line at dist=0
                type: 'line',
                x0: xLabels[dist.indexOf(distValue)],
                y0: minCretValue,
                x1: xLabels[dist.indexOf(distValue)],
                y1: maxCretValue,
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
                    y0: minCretValue,
                    x1: xLabels[i-1],
                    y1: maxCretValue,
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
                //ticktext: xLabels.filter((_, i) => i % 3 === 0), // Ensure labels are shown
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
            Plotly.restyle(chartId, update, layout);
        });

        plotElement.on('plotly_unhover', function(data) {
            const update = {
                opacity: traces.map(() => 0.6)
            };
            Plotly.restyle(chartId, update, layout);
        });
    }
    
    document.getElementById('eventid').addEventListener('change', () => {
        fetchOptions();
        fetchData();
    });

    document.getElementById('eventid2').addEventListener('change', () => {
        fetchOptions2();
        fetchData2();
    });
    
    document.getElementById('eventid_question').addEventListener('change', () => {
        fetchOptions_question();
        fetchData_question();
    });


    appState.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData);
    });

    appState2.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData2);
    });

    appState_question.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData_question);
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

    document.getElementById('PrimarySector_question').addEventListener('change', () => {
        const primarySector_question = document.getElementById('PrimarySector_question').value;
        const state_question = document.getElementById('state_question').value;
        updateCityDropdown_question(appState_question.initialDropdownData, primarySector_question, state_question);
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

    document.getElementById('state_question').addEventListener('change', () => {
        const primarySector_question = document.getElementById('PrimarySector_question').value;
        const state_question = document.getElementById('state_question').value;
        updateCityDropdown_question(appState_question.initialDropdownData, primarySector_question, state_question);
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

    document.getElementById('city_question').addEventListener('change', () => {
        const primarySector_question = document.getElementById('PrimarySector_question').value;
        const state_question = document.getElementById('state_question').value;
        const city_question = document.getElementById('city_question').value;
        updateSIC4Dropdown_question(appState_question.initialDropdownData, primarySector_question, state_question, city_question);
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

    document.getElementById('SIC4_question').addEventListener('change', () => {
        const primarySector_question = document.getElementById('PrimarySector_question').value;
        const state_question = document.getElementById('state_question').value;
        const city_question = document.getElementById('city_question').value;
        const sic4_question = document.getElementById('SIC4_question').value;
        updateCompanyDropdown_question(appState_question.initialDropdownData, primarySector_question, state_question, 
            city_question, sic4_question);
    });

    initialize();
});