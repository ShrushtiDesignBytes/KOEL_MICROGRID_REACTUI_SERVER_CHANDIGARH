/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/heading-has-content */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState, useRef } from 'react';
import ProgressBar from '../Components/ProgressBar';
import * as d3 from 'd3';

const Genset = ({ BaseUrl }) => {
    const [data, setData] = useState({})
    const [alertsData, setAlertsData] = useState([]);
    const [alertCount, setAlertCount] = useState(0);
    const [shutdownCount, setShutdownCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [severity, setSeverity] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);
    const containerRef = useRef(null);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchPowerData = async () => {
            try {
                const response = await fetch(`${BaseUrl}/genset/excel`)
                const result = await response.json();
                // console.log(result)
                setChartData(result);
            } catch (error) {
                console.error('Error fetching power data:', error);
            }
        };

        fetchPowerData();
        const interval = setInterval(fetchPowerData, 15 * 60 * 1000); // 15 minutes

        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await fetch(`${BaseUrl}/genset`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const sortedData = data.sort((a, b) => a.id - b.id);
            // console.log(sortedData)
            setData(sortedData[sortedData.length - 1]);
            setLoading(false);
        } catch (error) {
            console.error('Fetch Error:', error);
            setLoading(false);
        }
        try {
            const response = await fetch(`${BaseUrl}/alert`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setAlertsData(data);
            displayCounts(data);
        } catch (error) {
            console.error('Fetch Error:', error);
        }
    };

    useEffect(() => {
        fetchAlerts();

        const interval = setInterval(() => {
            fetchAlerts();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (imageLoaded && !loading) {
            displayDataCurveGraph(chartData);
        }
    }, [imageLoaded, loading, chartData]);


    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleImageError = () => {
        console.error('Image failed to load');
    };

    const displayCounts = (data) => {

        const gensetData = data.filter((i) => i.category === 'genset');

        const healthIndex = gensetData[gensetData.length - 1];
        setSeverity(healthIndex.severity.toLowerCase());

        const alerts = gensetData.filter((i) => i.severity.toLowerCase() === 'alert');
        const shutdown = gensetData.filter((i) => i.severity.toLowerCase() === 'shutdown');
        setAlertCount(alerts.length);
        setShutdownCount(shutdown.length);
    };

    const displayDataCurveGraph = (data) => {
        console.log(data)
        const margin = { top: 10, right: 10, bottom: 40, left: 20 };

        d3.select(containerRef.current).selectAll('svg').remove();
        const container = containerRef.current;
        const width = container.offsetWidth - margin.left - margin.right - 60;
        const height = container.offsetHeight - margin.top - margin.bottom - 70;

        function updateDimensions() {
            if (!containerRef.current) return;

            svg.attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom);

            x.range([0, width]);
            y.range([height, 0]);

            svg.select('.x-axis')
                .attr('transform', `translate(0, ${height})`)
                .call(d3.axisBottom(x).ticks(6).tickFormat(formatAMPM))
                .selectAll('text')
                .style('fill', 'white')
                .style('font-size', width > 500 ? '14px' : '10px');

            svg.select('.y-axis')
                .call(d3.axisLeft(y).ticks(5).tickSize(4).tickFormat(() => ''))
                .selectAll('text')
                .style('fill', 'white');

            svg.select('.curve')
                .attr('d', d3.line().x((d) => x(d.hour)).y((d) => y(+d.kwh_reading)).curve(d3.curveBasis));

            svg.select('.shadow')
                .attr('d', d3.area()
                    .x((d) => x(d.hour))
                    .y0(height)
                    .y1((d) => y(+d.kwh_reading))
                    .curve(d3.curveBasis)
                );
        }

        const svg = d3.select('#my_dataviz')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const now = new Date();
        const currentHour = now.getHours();
        const pastHour = (currentHour - 6 + 24) % 24;

        // Filter data to only include the last 6 hours, handling the hour wrap around
        const filteredData = data.filter((d) => {
            const hour = parseInt(d.hour, 10);
            if (pastHour <= currentHour) {
                return hour >= pastHour && hour <= currentHour;
            } else {
                return hour >= pastHour || hour <= currentHour;
            }
        });

        const x = d3.scaleLinear()
            .domain([pastHour, currentHour < pastHour ? currentHour + 24 : currentHour])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, (d) => +d.kwh_reading)])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .ticks(6)
                .tickFormat((d) => formatAMPM(d % 24))
            );

        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));

        svg.append('path')
            .datum(filteredData)
            .attr('class', 'curve')
            .attr('fill', 'none')
            .attr('stroke', '#68BFB6')
            .attr('stroke-width', 2)
            .attr('d', d3.line()
                .x((d) => x(d.hour >= pastHour ? d.hour : d.hour + 24))
                .y((d) => y(+d.kwh_reading))
                .curve(d3.curveBasis)
            )
            .attr('clip-path', 'url(#clip)');

        const gradient = svg.append('defs').append('linearGradient')
            .attr('id', 'shadowGradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop').attr('offset', '0%').attr('stop-color', '#0A3D38').attr('stop-opacity', 0.9);
        gradient.append('stop').attr('offset', '80%').attr('stop-color', '#0A3D38').attr('stop-opacity', 0);


        svg.append('path')
            .datum(filteredData)
            .attr('class', 'shadow')
            .attr('fill', 'url(#shadowGradient)')
            .attr('d', d3.area()
                .x((d) => x(d.hour >= pastHour ? d.hour : d.hour + 24))
                .y0(height)
                .y1((d) => y(+d.kwh_reading))
                .curve(d3.curveBasis)
            )
            .attr('clip-path', 'url(#clip)');

        const tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

        svg.selectAll('.curve, .shadow')
            .on('mouseover', function (event, d) {
                const bisect = d3.bisector((d) => d.hour).right;
                const i = bisect(data, x.invert(d3.pointer(event)[0]));
                const d0 = data[i - 1];
                const d1 = data[i];
                const dHover = x.invert(d3.pointer(event)[0]) - d0.hour > d1.hour - x.invert(d3.pointer(event)[0]) ? d1 : d0;
                tooltip.transition().duration(200).style('opacity', 0.9);
                tooltip.html(`Hour: ${formatAMPM(dHover.hour)}, Power: ${dHover.kwh_reading}`).style('left', event.pageX + 'px').style('top', event.pageY - 28 + 'px');
            })
            .on('mouseout', function () {
                tooltip.transition().duration(500).style('opacity', 0);
            });

        function formatAMPM(hour) {
            hour = hour % 24;
            const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            return `${formattedHour}${ampm}`;
        }

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => {
            window.removeEventListener('resize', updateDimensions);
        };
    };

    const total_daily_kwh = !loading && chartData.reduce((sum, row) => sum + row.kwh_reading, 0)

    const utilisation_factor = !loading && (data.operating_hours / 1000) * 100;
    const operational = !loading && ((data.fuel_level / 100) * 460) / 55;

    return (
        !loading && <div className="p-4">
            {/* First Row Section */}
            <div className="grid grid-cols-2 gap-5">
                <div className="relative w-full h-full rounded-md bg-gradient-to-t from-custom-dark-image to-custom-green-image flex items-center justify-center">
                    <div className="w-fit h-fit lg:w-11/12 lg:h-3/4">
                        <img
                            id="overview-image"
                            src="assets/genset_n.png"
                            alt="overview"
                            className="block w-full h-full object-contain"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    </div>
                    <div className="absolute top-2 right-3 transform -translate-x-1/5 translate-y-1/5 p-1.5 bg-transparent text-white rounded z-10 flex items-center max-w-[calc(100%-40px)]">
                        <div>
                            {(data.voltagel.phase1 > 200 && data.voltagel.phase2 > 200 && data.voltagel.phase3 > 200) &&
                                (data.kW.phase1 >= 1 && data.kW.phase2 >= 1 && data.kW.phase3 >= 1) ? <div className='flex items-center gap-2'><div className='bg-[#30F679] rounded-full w-4 h-4'></div><div className='text-[#30F679]'>Active</div></div>
                                : <div className='flex items-center gap-2'><div className='bg-[#DBDBDB] rounded-full w-4 h-4'></div><div className='text-[#DBDBDB]'>Inactive</div></div>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-rows-[25%_72%] gap-4">
                    <div className="grid grid-cols-4 gap-2 mt-1">
                        <div className="bg-[#051E1C] rounded-lg flex flex-col items-center justify-center">
                            <p className="text-xs xl:text-sm text-[#C37C5A] font-medium text-center">Operating Hours</p>
                            <p className="text-lg xl:text-xl font-semibold text-[#F3E5DE] pt-2" id="operating-hours">{data.operating_hours} hrs</p>
                        </div>
                        <div className="bg-[#051E1C] rounded-lg flex flex-col items-center justify-center">
                            <p className="text-xs xl:text-sm text-[#C37C5A] font-medium text-center">Total Generation</p>
                            <p className="text-lg xl:text-xl font-semibold text-[#F3E5DE] pt-2" id="total-generation">{data.kwh} kWh</p>
                        </div>
                        <div className="bg-[#051E1C] rounded-lg flex flex-col items-center justify-center">
                            <p className="text-xs xl:text-sm text-[#C37C5A] font-medium text-center">Total Consumption</p>
                            <p className="text-lg xl:text-xl font-semibold text-[#F3E5DE] pt-2" id="total-consumption">{data.kwh} kWh</p>
                        </div>
                        <div className="bg-[#051E1C] rounded-lg flex flex-col items-center justify-center">
                            <p className="text-xs xl:text-sm text-[#C37C5A] font-medium text-center">Total Cost</p>
                            <p className="text-lg xl:text-xl font-semibold text-[#F3E5DE] pt-2" id="total-savings">INR {25 * data.kwh}</p>
                        </div>
                    </div>

                    <div className="rounded-lg mr-0 grid grid-cols-[63%_35%] gap-3 ">
                        {/* <div className="flex justify-between gap-3 rounded-lg border"> */}
                        <div className="rounded-lg p-4 bg-[#051e1c]" id="grid-it-rl" ref={containerRef} >
                            <div className="flex justify-between mb-4">
                                <h5 className="text-sm xl:text-base text-white">Energy Generated Today</h5>
                                <p className="text-white text-xs xl:text-sm font-normal">Total Daily Generation: {total_daily_kwh} kWh</p>
                            </div>
                            {/* <p className="text-[#AFB2B2] text-xs xl:text-sm mt-3 ">Updated 15 min ago</p> */}
                            <div className="mt-4 h-[250px] xl:h-[330px]" id="my_dataviz"></div>
                        </div>

                        {/* </div> */}
                        <div className="flex justify-between gap-3 rounded-lg bg-[#051e1c]">
                            <div className="p-5 rounded-lg flex-1">
                                <div className="flex flex-col items-start">
                                    <div className='flex justify-between items-center w-full'>
                                        <h5 className="text-[#CACCCC] text-base flex font-semibold">Fuel Level</h5>
                                        <p className="text-white text-base flex font-semibold">{Number(data.fuel_level)} %</p>
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <ProgressBar fuellevel={Number(data.fuel_level)} />
                                    </div>

                                    <div className='mt-2 p-5 bg-[#022F2A] w-full'>
                                        <div className='flex justify-between'>
                                            <div className="text-[#CACCCC] text-sm xl:text-base">Tank Capacity  -  </div>
                                            <div className='pl-2 text-[#CACCCC] text-sm xl:text-base'>460 <br />litres</div>
                                        </div>
                                        <div className='flex justify-between pt-4'>
                                            <div className="text-[#CACCCC] text-sm xl:text-base">Operational  -  </div>
                                            <div className='pl-2 text-[#CACCCC] text-sm xl:text-base'>{operational?.toFixed(2) || 0} <br />hours</div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </div>

                    </div>


                </div>
            </div>
            {/* Second Row Section */}
            <div className="grid grid-cols-2 gap-5 mt-2 ">
                {/* Left Section */}
                <div className="grid-item-left">
                    <div className="grid grid-cols-4 gap-2 mt-1">
                        <div className="grid grid-rows-2 mt-2">
                            <div className="bg-[#051e1c] rounded-md mb-2 p-2 gap-3 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <img src="assets/battery Temp.svg" alt='image' />
                                    <h6 className="text-[#F3E5DE] text-sm xl:text-base font-semibold" id="coolant-temp">{data.coolant_temp}</h6>
                                </div>
                                <p className="text-sm xl:text-base text-[#AFB2B2] text-start">Coolant Temperature(°C)</p>
                            </div>
                            <div className="bg-[#051e1c] rounded-md mb-2 p-2 flex gap-3 flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <img src="assets/batteryV.svg" alt='image' />
                                    <h6 className="text-[#F3E5DE] text-sm xl:text-base font-semibold" id="power-generated-yesterday">{data.power_generated_yesterday?.toFixed(2) || 0}</h6>
                                </div>
                                <p className="text-sm xl:text-base text-[#AFB2B2] text-start">Power Generated Yesterday(kW)</p>
                            </div>
                        </div>
                        <div className="grid grid-rows-2 mt-2">
                            <div className="bg-[#051e1c] rounded-md mb-2 p-2 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <img src="assets/hours operated.svg" alt='image' />
                                    <h6 className="text-[#F3E5DE] text-sm xl:text-base font-semibold" id="hours-operated">{data.hours_operated_yesterday}</h6>
                                </div>
                                <p className="text-sm xl:text-base text-[#AFB2B2] text-start">Hours operated Yesterday</p>
                            </div>
                            <div className="bg-[#051e1c] rounded-md mb-2 p-2 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <img src="assets/discharging1.svg" alt='image' />
                                    <h6 className="text-[#F3E5DE] text-sm xl:text-base font-semibold" id="battery-charged">{data.battery_charged}</h6>
                                </div>
                                <p className="text-sm xl:text-base text-[#AFB2B2] text-start">Battery Charged(V)</p>
                            </div>
                        </div>
                        <div className="grid grid-rows-2 mt-2">
                            <div className="bg-[#051e1c] rounded-md mb-2 p-2 flex flex-col justify-between border border-red-500">
                                <div className="flex items-center justify-between">
                                    <img src="assets/oilpressure.svg" alt='image' />
                                    <h6 className="text-[#F3E5DE] text-sm xl:text-base font-semibold" id="oil-pressure">{data.oil_pressure}</h6>
                                </div>
                                <p className="text-sm xl:text-base text-[#AFB2B2] text-start">Oil Pressure (PSI)</p>
                            </div>
                            <div className="bg-[#051e1c] rounded-md mb-2 p-2 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <img src="assets/utilisationF.svg" alt='image' />
                                    <h6 className="text-[#F3E5DE] text-sm xl:text-base font-semibold" id="utilisation-factor">{utilisation_factor.toFixed(2)}</h6>
                                </div>
                                <p className="text-sm xl:text-base text-[#AFB2B2] text-start">Utilisation Factor(%)</p>
                            </div>
                        </div>
                        <div className="grid grid-rows-2 mt-2">
                            <div className="bg-[#051e1c] rounded-md mb-2 p-2 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <img src="assets/freq.svg" alt='image' />
                                    <h6 className="text-[#F3E5DE] text-sm xl:text-base font-semibold" id="frequency">{data.frequency ? data.frequency : 0}</h6>
                                </div>
                                <p className="text-sm xl:text-base text-[#AFB2B2] text-start">Frequency (Hz)</p>
                            </div>
                            <div className="bg-[#051e1c] rounded-md mb-2 p-2 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <img src="assets/charging1.svg" alt='image' />
                                    <h6 className="text-[#F3E5DE] text-sm xl:text-base font-semibold" id="battery-charged">{data.power_factor ? data.power_factor : 0}</h6>
                                </div>
                                <p className="text-sm xl:text-base text-[#AFB2B2] text-start">Power Factor</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid mt-1 rounded-md">
                        <div className="grid-item-left-down mt-2 bg-[#030F0E] mb-7 rounded-md">
                            <table className="table-style w-full border-collapse">
                                <thead className="bg-[#051E1C] text-[#68BFB6]">
                                    <tr className="text-xs xl:text-sm font-medium">
                                        <th className="whitespace-nowrap text-center p-5 xl:p-6 rounded-tl-lg"></th>
                                        <th className="text-center font-medium">Voltage (L-L)(V)</th>
                                        <th className="text-center font-medium">Voltage (L-N)(V)</th>
                                        <th className="text-center rounded-tr-lg font-medium">Current (Amp)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#030F0E] text-[#CACCCC]">
                                    <tr>
                                        <td className="text-center p-3 rounded-l-lg text-sm xl:text-base">L1 Phase</td>
                                        <td id="voltage-l-l-phase1" className="text-center p-3 text-sm xl:text-base">{data.voltagel.phase1}</td>
                                        <td id="voltage-l-n-phase1" className="text-center p-3 text-sm xl:text-base">{data.voltagen.phase1}</td>
                                        <td id="current-phase1" className="text-center p-3 text-sm xl:text-base">{data.current.phase1}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center p-3 rounded-l-lg text-sm xl:text-base">L2 Phase</td>
                                        <td id="voltage-l-l-phase2" className="text-center p-3 text-sm xl:text-base">{data.voltagel.phase2}</td>
                                        <td id="voltage-l-n-phase2" className="text-center p-3 text-sm xl:text-base">{data.voltagen.phase2}</td>
                                        <td id="current-phase2" className="text-center p-3 text-sm xl:text-base">{data.current.phase2}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center p-3 rounded-bl-lg text-sm xl:text-base">L3 Phase</td>
                                        <td id="voltage-l-l-phase3" className="text-center p-3 text-sm xl:text-base">{data.voltagel.phase3}</td>
                                        <td id="voltage-l-n-phase3" className="text-center p-3 text-sm xl:text-base">{data.voltagen.phase3}</td>
                                        <td id="current-phase3" className="text-center p-3 rounded-br-lg text-sm xl:text-base">{data.current.phase3}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {/* Right Section */}
                <div className="grid-item-right">
                    <div className="grid-item-right-left">
                        <div className="grid-item-left-down mt-2">
                            <div className="p-2">
                                <div className="text-white text-[20px] flex justify-between items-start">
                                    <div className="mb-4 text-base xl:text-lg font-bold">
                                        Notifications
                                    </div>
                                    <div className="flex">
                                        <p className="flex items-center ml-4 text-[#AFB2B2] text-sm xl:text-base">
                                            Alert
                                            <svg className="ml-2" width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="10.5" cy="11" r="10.5" fill="#41ACA1" />
                                                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="12" fontFamily="Arial" id="alertlen">
                                                    {alertCount}
                                                </text>
                                            </svg>
                                        </p>

                                        <p className="flex items-center ml-4 text-[#AFB2B2] text-sm xl:text-base">
                                            Shutdown
                                            <svg className="ml-2" width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="10.5" cy="11" r="10.5" fill="#EB5757" />
                                                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="12" fontFamily="Arial" id="shutdownlen">
                                                    {shutdownCount}
                                                </text>
                                            </svg>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#030F0E] rounded-lg pb-2.5 overflow-y-auto h-[220px] xl:h-[260px]"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#0A3D38 #0F544C',
                                }}>
                                <table className="w-full border-collapse text-[#CACCCC] text-xs xl:text-sm">
                                    <thead className="bg-[#051E1C] text-left sticky top-0 z-20 text-[#68BFB6]">
                                        <tr className="text-xs xl:text-sm">
                                            <th className="px-3 xl:px-4 py-2 xl:py-3 rounded-tl-lg font-medium">Fault Code</th>
                                            <th className="px-3 py-2 font-medium">Description</th>
                                            <th className="px-3 py-2 font-medium">Severity</th>
                                            <th className="px-3 py-2 font-medium">Status</th>
                                            <th className="px-3 py-2 rounded-tr-lg font-medium">Date/Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[#030F0E] capitalize text-[#CACCCC]" id="alert-container">
                                        {alertsData.filter(i => i.category === 'genset').reverse().map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-3 xl:px-4 py-4">{item.fault_code}</td>
                                                <td className="px-3 py-2">{item.description}</td>
                                                <td className={`px-3 py-3 whitespace-nowrap ${item.severity.toLowerCase() === 'alert' ? 'severity-alert' : item.severity.toLowerCase() === 'shutdown' ? 'severity-shutdown' : ''}`}>
                                                    {item.severity}
                                                </td>
                                                <td className='px-3 py-3' style={{ color: item.status.toLowerCase() === 'open' ? '#EB5757' : '#57EB66' }}>
                                                    {item.status}
                                                </td>
                                                <td className="px-3 py-2">{item.date_time}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid-item-left-down mt-5 bg-[#030F0E] mb-7 rounded-lg pb-0">
                            <table className="table-style w-full border-collapse">
                                <thead className="thead-style bg-[#051E1C] text-[#68BFB6]">
                                    <tr className="text-xs xl:text-sm text-center font-medium">
                                        <th className="whitespace-nowrap p-4 rounded-tl-lg font-medium">Power</th>
                                        <th className="p-2 font-medium">Phase 1</th>
                                        <th className="p-2 font-medium">Phase 2</th>
                                        <th className="p-2 rounded-tr-lg font-medium">Phase 3</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#030F0E] text-center text-[#CACCCC]">
                                    <tr className='text-sm xl:text-base'>
                                        <td className="p-4 rounded-bl-lg">kW</td>
                                        <td id="kW-phase1" className="p-2">{data.kW.phase1}</td>
                                        <td id="kW-phase2" className="p-2">{data.kW.phase2}</td>
                                        <td id="kW-phase3" className="p-2 rounded-br-lg">{data.kW.phase3}</td>
                                    </tr>
                                    {/* <tr className='text-sm xl:text-base'>
                                        <td className="p-3 rounded-bl-lg">kVA</td>
                                        <td id="kVA-phase1" className="p-2">{data.kVA.phase1}</td>
                                        <td id="kVA-phase2" className="p-2">{data.kVA.phase2}</td>
                                        <td id="kVA-phase3" className="p-2 rounded-br-lg">{data.kVA.phase3}</td>
                                    </tr> */}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Genset;