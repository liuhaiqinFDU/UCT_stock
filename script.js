document.addEventListener('DOMContentLoaded', () => {

    // initialize global variables that can't be reassigned
    const appState1 = {  // US firms
        dropdowns: ['eventid1', 'window1', 'PrimarySector1', 'state1', 
            'SIC1', 'city1', 'conm1'],
        eventTitles: {},
        eventDates: {},
        eventTics: {},
        eventDistToLabels: {},
        cachedEventData: {},
        initialDropdownData: {}
    };

    const appState2 = {  // Chinese firms
        dropdowns: ['eventid2', 'window2', 'PrimarySector2', 'state2', 
            'SIC2', 'city2', 'conm2'],
        eventTitles: {},
        eventDates: {},
        eventTics: {},
        eventDistToLabels: {},
        cachedEventData: {},
        initialDropdownData: {}
    };

    /*
    const appState3 = {  // By-standers
        dropdowns: ['eventid3', 'window3', 'PrimarySector3', 'state3', 
            'SIC3', 'city3', 'conm3'],
        eventTitles: {},
        eventDates: {},
        eventTics: {},
        eventDistToLabels: {},
        cachedEventData: {},
        initialDropdownData: {}
    };
    */
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
            const eventData = await fetchJSON('US/event_ids.json');
            const uniqueEventIds1 = [];
            eventData.forEach(item => {
                if (!appState1.eventTitles[item.eventid]) {
                    uniqueEventIds1.push(item.eventid);
                    appState1.eventTitles[item.eventid] = item.title;
                    appState1.eventDates[item.eventid] = item.date;
                    appState1.eventTics[item.eventid] = item.tic;
                    appState1.eventDistToLabels[item.eventid] = item.dist_to_labels;
                }
            });
            populateDropdown('eventid1', uniqueEventIds1);
            if (uniqueEventIds1.length > 0) {
                document.getElementById('eventid1').value = uniqueEventIds1[0];
                document.getElementById('window1').value = 90;
            }
            await fetchOptions1();
        } catch (error) {
            console.error('Error fetching event IDs:', error);
        }

        try {
            const eventData2 = await fetchJSON('China/event_ids.json');
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
                document.getElementById('eventid2').value = 11; //uniqueEventIds2[0]
                document.getElementById('window2').value = 90;
            }
            await fetchOptions2();
        } catch (error) {
            console.error('Error fetching winner-loser event IDs:', error);
        }

        try {
            const eventData3 = await fetchJSON('Global/event_ids.json');
            const uniqueEventIds3 = [];
            eventData3.forEach(item => {
                if (!appState3.eventTitles[item.eventid]) {
                    uniqueEventIds3.push(item.eventid);
                    appState3.eventTitles[item.eventid] = item.title;
                    appState3.eventDates[item.eventid] = item.date;
                    appState3.eventTics[item.eventid] = item.tic;
                    appState3.eventDistToLabels[item.eventid] = item.dist_to_labels;
                }
            });
            populateDropdown('eventid3', uniqueEventIds3);
            if (uniqueEventIds3.length > 0) {
                document.getElementById('eventid3').value = uniqueEventIds3[0];
                document.getElementById('window3').value = 90;
            }
            await fetchOptions3();
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

    async function fetchOptions1() {
        const eventid1 = document.getElementById('eventid1').value;
        try {
            const data1 = await fetchJSON(`US/event${eventid1}.json`);
            appState1.cachedEventData[eventid1] = data1;
            updateDropdowns1(data1);
            await fetchData1();
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    }

    async function fetchOptions2() {
        const eventid2 = document.getElementById('eventid2').value;
        try {
            const data2 = await fetchJSON(`China/event${eventid2}.json`);
            appState2.cachedEventData[eventid2] = data2;
            updateDropdowns2(data2);
            await fetchData2();
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    }
    /*
    async function fetchOptions3() {
        const eventid3 = document.getElementById('eventid3').value;
        try {
            const data3 = await fetchJSON(`Global/event${eventid3}.json`);
            appState3.cachedEventData[eventid3] = data3;
            updateDropdowns3(data3);
            await fetchData3();
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    }
    */
    // first level of selections (row 1 bars)
    function updateDropdowns1(data1) {
        const primarySectors1 = new Set();
        const states1 = new Set();

        data1.forEach(item => {
            primarySectors1.add(item.PrimarySector);
            states1.add(item.state);
        });

        const selectedPrimarySector1 = document.getElementById('PrimarySector1').value;
        const selectedState1 = document.getElementById('state1').value;

        populateDropdown('PrimarySector1', Array.from(primarySectors1), selectedPrimarySector1);
        populateDropdown('state1', Array.from(states1), selectedState1);

        // Store initial dropdown data for city, SIC4, and conml
        appState1.initialDropdownData = data1;
        updateCityDropdown1(data1, selectedPrimarySector1, selectedState1);
    }

    function updateDropdowns2(data2) {
        const primarySectors2 = new Set();
        const states2 = new Set();

        data2.forEach(item => {
            primarySectors2.add(item.PrimarySector);  // This is actually exchange; while I rename them in stata
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
    /*
    function updateDropdowns3(data3) {
        const primarySectors3 = new Set();
        const states3 = new Set();

        data3.forEach(item => {
            primarySectors3.add(item.PrimarySector);
            states3.add(item.state);
        });

        const selectedPrimarySector3 = document.getElementById('PrimarySector3').value;
        const selectedState3 = document.getElementById('state3').value;

        populateDropdown('PrimarySector3', Array.from(primarySectors3), selectedPrimarySector3);
        populateDropdown('state3', Array.from(states3), selectedState3);

        // Store initial dropdown data for city, SIC4, and conml
        appState3.initialDropdownData = data3;
        updateCityDropdown3(data3, selectedPrimarySector3, selectedState3);
    }    
    */
    async function fetchData1() {
        const eventid1 = document.getElementById('eventid1').value;
        const window1 = document.getElementById('window1').value;
        const primarySector1 = document.getElementById('PrimarySector1').value;
        const state1 = document.getElementById('state1').value;
        const city1 = document.getElementById('city1').value;
        const sic1 = document.getElementById('SIC1').value;
        const conm1 = document.getElementById('conm1').value;

        if (appState1.cachedEventData[eventid1]) {
            processData1(appState1.cachedEventData[eventid1], 
                primarySector1, state1, city1, sic1, conm1, window1, eventid1);
        } else {
            try {
                const data1 = await fetchJSON(`US/event${eventid1}.json`);
                appState1.cachedEventData[eventid1] = data1;
                processData1(data1, primarySector1, state1, city1, sic1, conm1, window1, eventid1);
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
        const sic2 = document.getElementById('SIC2').value;
        const conm2 = document.getElementById('conm2').value;

        if (appState2.cachedEventData[eventid2]) {
            processData2(appState2.cachedEventData[eventid2], 
                primarySector2, state2, city2, sic2, conm2, window2, eventid2);
        } else {
            try {
                const data2 = await fetchJSON(`China/event${eventid2}.json`);
                appState2.cachedEventData[eventid2] = data2;
                processData2(data2,primarySector2,state2,city2,sic2,conm2,window2,eventid2);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    }    
    /*
    async function fetchData3() {
        const eventid3 = document.getElementById('eventid3').value;
        const window3 = document.getElementById('window3').value;
        const primarySector3 = document.getElementById('PrimarySector3').value;
        const state3 = document.getElementById('state3').value;
        const city3 = document.getElementById('city3').value;
        const sic3 = document.getElementById('SIC3').value;
        const conm3 = document.getElementById('conm3').value;

        if (appState3.cachedEventData[eventid3]) {
            processData3(appState3.cachedEventData[eventid3], 
                primarySector3, state3, city3, sic3, conm3, window3, eventid3);
        } else {
            try {
                const data3 = await fetchJSON(`Global/event${eventid3}.json`);
                appState3.cachedEventData[eventid3] = data3;
                processData3(data3, primarySector3, state3, city3, sic3, conm3, window3, eventid3);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    }  
    */
    function processData1(data1, primarySector1, state1, city1, sic1, conm1, window1, eventid1) {
        let filteredData1 = data1.filter(item =>
            (!primarySector1 || item.PrimarySector === primarySector1) &&
            (!state1 || item.state === state1) &&
            (!city1 || item.city === city1) &&
            (!sic1 || item.SIC4 === sic1) &&
            (!conm1 || item.conml === conm1)
        );

        // Filter data based on the window parameter
        if (window1 == 60) {
            filteredData1 = filteredData1.filter(item => item.dist >= -20 && item.dist <= 40);
        } else if (window1 == 90) {
            filteredData1 = filteredData1.filter(item => item.dist >= -30 && item.dist <= 60);
        } else if (window1 == 150) {
            filteredData1 = filteredData1.filter(item => item.dist >= -60 && item.dist <= 90);
        }
        
        const chartElement = document.getElementById('chart1');
        if (filteredData1.length === 0) {
            chartElement.innerHTML = 'No data';
        } else {
            if (chartElement.innerHTML === 'No data') {
                chartElement.innerHTML = '';
            }
            const stats1 = calculateStatistics(filteredData1, window1);
            plotData(filteredData1, window1,stats1,'eventTime1','chart1', appState1.eventTitles[eventid1],
            appState1.eventDates[eventid1],appState1.eventTics[eventid1], appState1.eventDistToLabels[eventid1]);
        }
    }

    function processData2(data2, primarySector2, state2, city2, sic2, conm2, window2, eventid2) {
        let filteredData2 = data2.filter(item =>
            (!primarySector2 || item.PrimarySector === primarySector2) &&
            (!state2 || item.state === state2) &&
            (!city2 || item.city === city2) &&
            (!sic2 || item.SIC4 === sic2) &&
            (!conm2 || item.conml === conm2)
        );

        // Filter data based on the window parameter
                if (window2 == 60) {
            filteredData2 = filteredData2.filter(item => item.dist >= -20 && item.dist <= 40);
        } else if (window2 == 90) {
            filteredData2 = filteredData2.filter(item => item.dist >= -30 && item.dist <= 60);
        } else if (window2 == 150) {
            filteredData2 = filteredData2.filter(item => item.dist >= -60 && item.dist <= 90);
        }

        const chartElement2 = document.getElementById('chart2');
        if (filteredData2.length === 0) {
            chartElement2.innerHTML = 'No data';
        } else {
            if (chartElement2.innerHTML === 'No data') {
                chartElement2.innerHTML = '';
            }
            const stats2 = calculateStatistics(filteredData2, window2); 
            plotData(filteredData2, window2,stats2,'eventTime2','chart2', appState2.eventTitles[eventid2],
                appState2.eventDates[eventid2],appState2.eventTics[eventid2], appState2.eventDistToLabels[eventid2]);
        }
    }
    /*
    function processData3(data3, primarySector3, state3, city3, sic3, conm3, window3, eventid3) {
        let filteredData3 = data3.filter(item =>
            (!primarySector3 || item.PrimarySector === primarySector3) &&
            (!state3 || item.state === state3) &&
            (!city3 || item.city === city3) &&
            (!sic3 || item.SIC4 === sic3) &&
            (!conm3 || item.conml === conm3)
        );

        // Filter data based on the window parameter
        if (window3 == 60) {
            filteredData3 = filteredData3.filter(item => item.dist >= -20 && item.dist <= 40);
        } else if (window3 == 90) {
            filteredData3 = filteredData3.filter(item => item.dist >= -30 && item.dist <= 60);
        } else if (window3 == 150) {
            filteredData3 = filteredData3.filter(item => item.dist >= -60 && item.dist <= 90);
        }
        
        const chartElement = document.getElementById('chart3');
        if (filteredData3.length === 0) {
            chartElement.innerHTML = 'No data';
        } else {
            if (chartElement.innerHTML === 'No data') {
                chartElement.innerHTML = '';
            }
            const stats3 = calculateStatistics(filteredData3, window3);
            plotData(filteredData3, window3,stats3,'eventTime3','chart3', appState3.eventTitles[eventid3],
            appState3.eventDates[eventid3],appState3.eventTics[eventid3], appState3.eventDistToLabels[eventid3]);
        }
    }
    */
    function updateCityDropdown1(data1, primarySector1, state1) {
        const cities1 = new Set();

        data1.forEach(item => {
            if ((!primarySector1 || item.PrimarySector === primarySector1) &&
                (!state1 || item.state === state1)) {
                cities1.add(item.city);
            }
        });

        const selectedCity1 = document.getElementById('city1').value;
        populateDropdown('city1', Array.from(cities1), selectedCity1);
        updateSIC4Dropdown1(data1, primarySector1, state1, selectedCity1);
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
    /*
    function updateCityDropdown3(data3, primarySector3, state3) {
        const cities3 = new Set();

        data3.forEach(item => {
            if ((!primarySector3 || item.PrimarySector === primarySector3) &&
                (!state3 || item.state === state3)) {
                cities3.add(item.city);
            }
        });

        const selectedCity3 = document.getElementById('city3').value;
        populateDropdown('city3', Array.from(cities3), selectedCity3);
        updateSIC4Dropdown3(data3, primarySector3, state3, selectedCity3);
    }
    */
    function updateSIC4Dropdown1(data1, primarySector1, state1, city1) {
        const sic4s1 = new Set();

        data1.forEach(item => {
            if ((!primarySector1 || item.PrimarySector === primarySector1) &&
                (!state1 || item.state === state1) &&
                (!city1 || item.city === city1)) {
                sic4s1.add(item.SIC4);
            }
        });

        const selectedSIC1 = document.getElementById('SIC1').value;
        populateDropdown('SIC1', Array.from(sic4s1), selectedSIC1);
        updateCompanyDropdown1(data1, primarySector1, state1, city1, selectedSIC1);
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

        const selectedSIC2 = document.getElementById('SIC2').value;
        populateDropdown('SIC2', Array.from(sic4s2), selectedSIC2);
        updateCompanyDropdown2(data2, primarySector2, state2, city2, selectedSIC2);
    }
    /*
    function updateSIC4Dropdown3(data3, primarySector3, state3, city3) {
        const sic4s3 = new Set();

        data3.forEach(item => {
            if ((!primarySector3 || item.PrimarySector === primarySector3) &&
                (!state3 || item.state === state3) &&
                (!city3 || item.city === city3)) {
                sic4s3.add(item.SIC4);
            }
        });

        const selectedSIC3 = document.getElementById('SIC3').value;
        populateDropdown('SIC3', Array.from(sic4s3), selectedSIC3);
        updateCompanyDropdown3(data3, primarySector3, state3, city3, selectedSIC3);
    }
    */
    function updateCompanyDropdown1(data1, primarySector1, state1, city1, sic1) {
        const conmls1 = new Set();

        data1.forEach(item => {
            if ((!primarySector1 || item.PrimarySector === primarySector1) &&
                (!state1 || item.state === state1) &&
                (!city1 || item.city === city1) &&
                (!sic1 || item.SIC4 === sic1)) {
                conmls1.add(item.conml);
            }
        });

        const selectedConm1 = document.getElementById('conm1').value;
        populateDropdown('conm1', Array.from(conmls1), selectedConm1);
    }
    
    function updateCompanyDropdown2(data2, primarySector2, state2, city2, sic2) {
        const conmls2 = new Set();

        data2.forEach(item => {
            if ((!primarySector2 || item.PrimarySector === primarySector2) &&
                (!state2 || item.state === state2) &&
                (!city2 || item.city === city2) &&
                (!sic2 || item.SIC4 === sic2)) {
                conmls2.add(item.conml);
            }
        });

        const selectedConm2 = document.getElementById('conm2').value;
        populateDropdown('conm2', Array.from(conmls2), selectedConm2);
    }
    /*
    function updateCompanyDropdown3(data3, primarySector3, state3, city3, sic3) {
        const conmls3 = new Set();

        data3.forEach(item => {
            if ((!primarySector3 || item.PrimarySector === primarySector3) &&
                (!state3 || item.state === state3) &&
                (!city3 || item.city === city3) &&
                (!sic3 || item.SIC4 === sic3)) {
                conmls3.add(item.conml);
            }
        });

        const selectedConm3 = document.getElementById('conm3').value;
        populateDropdown('conm3', Array.from(conmls3), selectedConm3);
    }
    */
    function calculateStatistics(data, window) { //,rettype -- no abnormal data anymore
        const cretKey = `cret${window}`; //_${rettype}
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

    function plotData(filteredData, window, stats, titleId, chartId, title, date, tic, eventDistToLabel) {

        // Calculate and display the event time (hour and minute from tic)
        const hour = Math.floor(tic / 60);
        const minute = tic - hour * 60;
        const eventTime = `${date} ${hour}:${minute < 10 ? '0' + minute : minute}`;
        document.getElementById(titleId).innerHTML = `Date: ${date}, Time: ${hour}:${minute < 10 ? '0' + minute : minute}, ${title}`;
    
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
                y: firmData.map(row => row[`cret${window}`]),
                mode: 'lines+markers',
                name: firmName,
                text: firmData.map(row => `Firm: ${firmName}<br>x: ${row.dist}<br>y: ${row[`cret${window}`]}`),
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
    

    document.getElementById('eventid1').addEventListener('change', () => {
        fetchOptions1();
        fetchData1();
    });

    document.getElementById('eventid2').addEventListener('change', () => {
        fetchOptions2();
        fetchData2();
    });
    /*
    document.getElementById('eventid3').addEventListener('change', () => {
        fetchOptions3();
        fetchData3();
    });
    */
    appState1.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData1);
    });

    appState2.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData2);
    });
    /*
    appState3.dropdowns.forEach(dropdown => {
        document.getElementById(dropdown).addEventListener('change', fetchData3);
    });
    */
    document.getElementById('PrimarySector1').addEventListener('change', () => {
        const primarySector1 = document.getElementById('PrimarySector1').value;
        const state1 = document.getElementById('state1').value;
        updateCityDropdown1(appState1.initialDropdownData, primarySector1, state1);
    });

    document.getElementById('PrimarySector2').addEventListener('change', () => {
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        updateCityDropdown2(appState2.initialDropdownData, primarySector2, state2);
    });
    /*
    document.getElementById('PrimarySector3').addEventListener('change', () => {
        const primarySector3 = document.getElementById('PrimarySector3').value;
        const state3 = document.getElementById('state3').value;
        updateCityDropdown3(appState3.initialDropdownData, primarySector3, state3);
    });
    */
    document.getElementById('state1').addEventListener('change', () => {
        const primarySector1 = document.getElementById('PrimarySector1').value;
        const state1 = document.getElementById('state1').value;
        updateCityDropdown1(appState1.initialDropdownData, primarySector1, state1);
    });

    document.getElementById('state2').addEventListener('change', () => {
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        updateCityDropdown2(appState2.initialDropdownData, primarySector2, state2);
    });
    /*
    document.getElementById('state3').addEventListener('change', () => {
        const primarySector3 = document.getElementById('PrimarySector3').value;
        const state3 = document.getElementById('state3').value;
        updateCityDropdown3(appState3.initialDropdownData, primarySector3, state3);
    });
    */
    document.getElementById('city1').addEventListener('change', () => {
        const primarySector1 = document.getElementById('PrimarySector1').value;
        const state1 = document.getElementById('state1').value;
        const city1 = document.getElementById('city1').value;
        updateSIC4Dropdown1(appState1.initialDropdownData, primarySector1, state1, city1);
    });

    document.getElementById('city2').addEventListener('change', () => {
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        const city2 = document.getElementById('city2').value;
        updateSIC4Dropdown2(appState2.initialDropdownData, primarySector2, state2, city2);
    });
    /*
    document.getElementById('city3').addEventListener('change', () => {
        const primarySector3 = document.getElementById('PrimarySector3').value;
        const state3 = document.getElementById('state3').value;
        const city3 = document.getElementById('city3').value;
        updateSIC4Dropdown3(appState3.initialDropdownData, primarySector3, state3, city3);
    });
    */
    document.getElementById('SIC1').addEventListener('change', () => {
        const primarySector1 = document.getElementById('PrimarySector1').value;
        const state1 = document.getElementById('state1').value;
        const city1 = document.getElementById('city1').value;
        const sic1 = document.getElementById('SIC1').value;
        updateCompanyDropdown1(appState1.initialDropdownData, primarySector1, state1, city1, sic1);
    });

    document.getElementById('SIC2').addEventListener('change', () => {
        const primarySector2 = document.getElementById('PrimarySector2').value;
        const state2 = document.getElementById('state2').value;
        const city2 = document.getElementById('city2').value;
        const sic2 = document.getElementById('SIC2').value;
        updateCompanyDropdown2(appState2.initialDropdownData, primarySector2, state2, city2, sic2);
    });
    /*
    document.getElementById('SIC3').addEventListener('change', () => {
        const primarySector3 = document.getElementById('PrimarySector3').value;
        const state3 = document.getElementById('state3').value;
        const city3 = document.getElementById('city3').value;
        const sic3 = document.getElementById('SIC3').value;
        updateCompanyDropdown3(appState3.initialDropdownData, primarySector3, state3, city3, sic3);
    });
    */
    initialize();
});