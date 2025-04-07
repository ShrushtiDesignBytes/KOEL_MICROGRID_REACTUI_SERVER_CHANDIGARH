import React, { useState, useRef, useEffect } from 'react';
import { RiArrowDropDownLine } from "react-icons/ri";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MdOutlineCalendarToday } from "react-icons/md";
import ExcelJS from "exceljs";


const Excel = ({ BaseUrl }) => {
    const [loading, setLoading] = useState(true);
    const [alldata, setAllData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 5, 0, 0); // Set time to 00:05
        return now;
      });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        now.setHours(23, 55, 0, 0); // Set time to 23:55
        return now;
    });
    const datepickerRef = useRef(null);
    const datepickerendRef = useRef(null);


       const fetchConfig = () => {
            fetch(`${BaseUrl}/overview`)
                .then((response) => response.json())
                .then((data) => {
                   // console.log(data)
                    setAllData(data)
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching data:", error);
                });
        };
    
        useEffect(() => {
            fetchConfig();
    
            const interval = setInterval(() => {
                fetchConfig();
            }, 5000);
    
            return () => clearInterval(interval);
        }, []);

    const formatDateWithOffset = (dateString) => {
        const date = new Date(dateString);
    
        // Subtract 5 hours 30 minutes (5 * 60 + 30 = 330 minutes)
        date.setMinutes(date.getMinutes() - 330);
    
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
    
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
    
    const formatDateLocal = (dateString) => {
        const date = new Date(dateString);
      
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0');
      
        return `${year}-${month}-${day}`;
      };

    const handleStartIconClick = () => {
        if (datepickerRef.current) {
            datepickerRef.current.setOpen(true);
        }
    };

    const handleEndIconClick = () => {
        if (datepickerendRef.current) {
            datepickerendRef.current.setOpen(true);
        }
    };


    const fetchPowerData = async () => {
        //console.log(startDate, endDate)
        const startd = formatDateLocal(startDate);
        const endd = formatDateLocal(endDate)

        const enddT = formatDateWithOffset(endDate);

       // console.log(startd, endd)
        const today = formatDateLocal(new Date());

        try {
            const requestBody = { fromDate: startd };
        if (endd !== today) {
            requestBody.toDate = enddT; // Only include toDate if it's not today
        }

            const [solarRes, mainsRes, gensetRes] = await Promise.all([
                fetch(`${BaseUrl}/solar/report`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }).then((res) => res.json()),

                fetch(`${BaseUrl}/mains/report`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }).then((res) => res.json()),

                fetch(`${BaseUrl}/genset/report`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }).then((res) => res.json())
            ]);

           // console.log("Solar Data:", solarRes);
           // console.log("Mains Data:", mainsRes);
           // console.log("Genset Data:", gensetRes);

            return { solar: solarRes, mains: mainsRes, genset: gensetRes };
        } catch (error) {
            console.error("Error fetching power data:", error);
            return { solar: [], mains: [], genset: [] };
        }
    };




    const downloadExcel = async () => {
        setIsLoading(true);
        setIsPressed(true);

        const { solar, mains, genset } = await fetchPowerData();

        const combinedData = {};


        solar.forEach(({ date, minute, kwh_reading, unit_generation }) => {
            const key = `${date} ${minute}`; // Unique key using date + minute
            if (!combinedData[key]) combinedData[key] = { Date: date, Hour: minute, solar_kwh: 0, solar_unit: 0, mains_kwh: 0, mains_unit: 0, genset_kwh: 0, genset_unit: 0, Total: 0, Savings: 0 };
            combinedData[key].solar_kwh = kwh_reading;
            combinedData[key].solar_unit = unit_generation;
        });

        mains.forEach(({ date, minute, kwh_reading, unit_generation }) => {
            const key = `${date} ${minute}`;
            if (!combinedData[key]) combinedData[key] = { Date: date, Hour: minute, solar_kwh: 0, solar_unit: 0, mains_kwh: 0, mains_unit: 0, genset_kwh: 0, genset_unit: 0, Total: 0, Savings: 0 };
            combinedData[key].mains_kwh = kwh_reading;
            combinedData[key].mains_unit = unit_generation;
        });

        genset.forEach(({ date, minute, kwh_reading, unit_generation }) => {
            const key = `${date} ${minute}`;
            if (!combinedData[key]) combinedData[key] = { Date: date, Hour: minute, solar_kwh: 0, solar_unit: 0, mains_kwh: 0, mains_unit: 0, genset_kwh: 0, genset_unit: 0, Total: 0, Savings: 0 };
            combinedData[key].genset_kwh = kwh_reading;
            combinedData[key].genset_unit = unit_generation;
        });


        // Calculate total power for each hour
        Object.values(combinedData).forEach((item) => {
            item.Total = item.solar_kwh + item.mains_kwh + item.genset_kwh;
        });

        // Calculate total power for each hour
        Object.values(combinedData).forEach((item) => {
            if (item.solar_kwh > 0 && item.mains_kwh > 0) {
                item.Savings = item.solar_kwh * 6.6;
            } else if (item.solar_kwh > 0 && item.genset_kwh > 0) {
                item.Savings = item.solar_kwh * 18.4;
            } else if (item.solar_kwh <= 0) {
                item.Savings = 0;
            }
        });


        // Convert to array
        const finalData = Object.values(combinedData);

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Hourly Power Data");

        // Merge cells for multi-row and multi-column headers
        worksheet.mergeCells("A1:A3"); // Date (rowspan 3)
        worksheet.getCell("A1").value = "Date";
        worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

        worksheet.mergeCells("B1:B3"); // Hour (rowspan 3)
        worksheet.getCell("B1").value = "Hour";
        worksheet.getCell("B1").alignment = { horizontal: "center", vertical: "middle" };

        worksheet.mergeCells("C1:H1"); // Energy Generation (colspan 6, rowspan 1)
        worksheet.getCell("C1").value = "Energy Generation";
        worksheet.getCell("C1").alignment = { horizontal: "center", vertical: "middle" };

        worksheet.mergeCells("I1:I3"); // Total Load (rowspan 3)
        worksheet.getCell("I1").value = "Total";
        worksheet.getCell("I1").alignment = { horizontal: "center", vertical: "middle" };

        worksheet.mergeCells("J1:J3"); // Savings (rowspan 3)
        worksheet.getCell("J1").value = "Savings";
        worksheet.getCell("J1").alignment = { horizontal: "center", vertical: "middle" };

        // Second row: Solar, Mains, Genset each spanning two columns
        worksheet.mergeCells("C2:D2"); // Solar (colspan 2, rowspan 1)
        worksheet.getCell("C2").value = "Solar";
        worksheet.getCell("C2").alignment = { horizontal: "center", vertical: "middle" };

        worksheet.mergeCells("E2:F2"); // Mains (colspan 2, rowspan 1)
        worksheet.getCell("E2").value = "Mains";
        worksheet.getCell("E2").alignment = { horizontal: "center", vertical: "middle" };

        worksheet.mergeCells("G2:H2"); // Genset (colspan 2, rowspan 1)
        worksheet.getCell("G2").value = "Genset";
        worksheet.getCell("G2").alignment = { horizontal: "center", vertical: "middle" };

        // Third row: kWh Reading & Unit Generated under each section
        worksheet.getCell("C3").value = "kWh Reading";
        worksheet.getCell("D3").value = "Unit Generated";
        worksheet.getCell("E3").value = "kWh Reading";
        worksheet.getCell("F3").value = "Unit Generated";
        worksheet.getCell("G3").value = "kWh Reading";
        worksheet.getCell("H3").value = "Unit Generated";

        // Bold and center align headers
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: "center", vertical: "middle", width: 15 };
            });
        });

        // Define column widths
        worksheet.columns = [
            { key: "Date", width: 15 },
            { key: "Hour", width: 15 },
            { key: "solar_kwh", width: 15 },
            { key: "solar_unit", width: 15 },
            { key: "mains_kwh", width: 15 },
            { key: "mains_unit", width: 15 },
            { key: "genset_kwh", width: 15 },
            { key: "genset_unit", width: 15 },
            { key: "Total", width: 12 },
            { key: "Savings", width: 12 },

        ];


        worksheet.getRow(1).font = { bold: true, size: 12 };

       // console.log(finalData)
        // Add rows to the worksheet
        worksheet.addRows(finalData);

        // Apply alignment to all cells (centered horizontally and vertically)
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });
        });

        // const totalRow = {
        //     Hour: "Total",
        //     solar_kwh: finalData.reduce((sum, row) => sum + row.solar_kwh, 0),
        //     solar_unit: finalData.reduce((sum, row) => sum + row.solar_unit, 0),
        //     mains_kwh: finalData.reduce((sum, row) => sum + row.mains_kwh, 0),
        //     mains_unit: finalData.reduce((sum, row) => sum + row.mains_unit, 0),
        //     genset_kwh: finalData.reduce((sum, row) => sum + row.genset_kwh, 0),
        //     genset_unit: finalData.reduce((sum, row) => sum + row.genset_unit, 0),
        //     Total: finalData.reduce((sum, row) => sum + row.Total, 0),
        //     Savings: finalData.reduce((sum, row) => sum + row.Savings, 0),
        // };

        // // Add total row
        // worksheet.addRow(totalRow);

        // // Make total row bold
        // const lastRowNumber = worksheet.rowCount;
        // worksheet.getRow(lastRowNumber).font = { bold: true };
        // worksheet.eachRow((row) => {
        //     row.eachCell((cell) => {
        //         cell.alignment = { horizontal: 'center', vertical: 'middle' };
        //     });
        // });


        // Download the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const today = new Date().toISOString().split('T')[0];
        link.download = `${today}_CMKL_Microgrid_Report.xlsx`;
        link.click();

        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsLoading(false);
        setTimeout(() => setIsPressed(false), 200);
    };

    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    return (
        // <div className="flex items-center justify-center h-screen">
        //     <button onClick={downloadExcel} className="px-4 py-2 bg-[#0A3D38] text-white rounded-md shadow-md hover:bg-[#0A3D38] transition">
        //         <div className="flex items-center justify-center"><FaCloudDownloadAlt /></div>
        //         <p>Download</p>
        //     </button>
        // </div>

        <div className="h-screen">
            <div className='text-[#F3E5DE] text-sm pl-4'>Reports</div>
            <div className="flex gap-10 p-4 text-[#CACCCC] font-poppins">
                {/* Energy Source Dropdown */}
                <div className="flex flex-col">
                    <label className="text-sm mb-3 text-[#959999]">Energy Source</label>
                    <select className="bg-[#0A3D38] text-white p-2 rounded-md w-60" onChange={(e) => console.log(e.target.value)}>
                        <option >All plants</option>
                        {/* <option value='solar'>Solar plants</option>
                        <option value='main'>Mains plants</option>
                        <option value='genset'>Genset plants</option> */}
                    </select>
                </div>

                {/* Date Range Picker */}
                <div className="flex flex-col">
                    <label className="text-sm mb-3 text-[#959999]">Date Range</label>
                    <div className='flex'>
                        <div className="relative flex justify-between items-center bg-[#0A3D38] text-white p-2 rounded-md w-52">
                            <input
                                type="text"
                                value={startDate ? `${startDate.getFullYear()}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getDate().toString().padStart(2, '0')}` : ""}
                                readOnly
                                className="bg-transparent focus:outline-none w-[120px] cursor-default"
                            />
                            <MdOutlineCalendarToday
                                className="absolute right-2"
                                size={18}
                                onClick={handleStartIconClick}
                            />
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => {
                                    const updatedDate = new Date(date);
                                    updatedDate.setHours(0, 5, 0, 0); // Ensure the selected date keeps the time at 00:05
                                    setStartDate(updatedDate);
                                  }}
                                  ref={datepickerRef}
                                  dateFormat="dd.MM.yyyy"
                                  className="hidden"
                                  popperClassName="!z-50"
                                  maxDate={endDate}
                            />
                        </div>
                        <span className="mx-2 text-[#68BFB6] mt-2">-</span>
                        <div className="relative flex justify-between items-center bg-[#0A3D38] text-white p-2 rounded-md w-52">
                            <input
                                type="text"
                                value={endDate ? `${endDate.getFullYear()}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate.getDate().toString().padStart(2, '0')}` : ""}
                                readOnly
                                className="bg-transparent focus:outline-none w-[120px] cursor-default"
                            />
                            <MdOutlineCalendarToday
                                className="absolute right-2"
                                size={18}
                                onClick={handleEndIconClick}
                            />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                ref={datepickerendRef}
                                dateFormat="dd.MM.yyyy"
                                className="hidden"
                                popperClassName="!z-50"
                                minDate={startDate}
                            />
                        </div>
                    </div>
                </div>

                {/* Category Dropdown */}
                <div className="flex flex-col">
                    <label className="text-sm mb-3 text-[#959999]">Category</label>
                    <select className="bg-[#0A3D38] text-white p-2 rounded-md w-60" onChange={(e) => console.log(e.target.value)}>
                        <option value='energy generated'>Energy Generated</option>
                        {/* <option value='savings'>Savings</option> */}
                    </select>
                </div>
            </div>
            <div className='p-4 flex justify-between'>
                <div className='py-4 text-[#7A7F7F] text-sm'>
                    3 results
                </div>
                <div className="">
                    <button
                        onClick={downloadExcel}
                        className={`p-2 flex items-center justify-center rounded-md shadow-md transition 
                    ${isLoading ? "bg-gray-500 cursor-not-allowed" : " hover:border-[#68BFB6] hover:border-4 bg-[#41ACA1]"} 
                    ${isPressed ? "scale-95" : "scale-100"}`}
                        disabled={isLoading}
                    >

                        <p className='text-[#031210] text-sm'>{isLoading ? "Downloading..." : "Export "}</p>
                        <div
                            className={`transition-transform ${isLoading ? "rotate-180" : ""
                                } text-white`}
                        >
                            <RiArrowDropDownLine color='#031210' className='w-6 h-6' />
                        </div>

                    </button>

                </div>
            </div>
            <div className="max-h-auto xl:max-h-auto overflow-y-auto rounded-lg scrollbar-custom p-4">
                <table className="w-full border-collapse text-[#CACCCC] text-xs xl:text-sm text-start">
                    <thead className="bg-[#051E1C] text-left sticky top-0 z-20 text-[#68BFB6] text-base font-medium  ">
                        <tr>
                            <th className="px-4 xl:px-5 py-3 xl:py-4 whitespace-nowrap rounded-tl-md">S.No</th>
                            <th className="px-4 py-3 whitespace-nowrap">Energy Source</th>
                            <th className="px-4 py-3 whitespace-nowrap">Energy Generated</th>
                            <th className="px-4 py-3 whitespace-nowrap">Total Utilised</th>
                            <th className="px-4 py-3 whitespace-nowrap rounded-tr-md">Date</th>
                        </tr>
                    </thead>
                   <tbody className="bg-[#030F0E] capitalize font-light" id="alert-container">
                        
                              { !loading && <tr>
                                    <td className='px-4 xl:px-5 py-3 xl:py-4'>1</td>
                                    <td className='px-4 py-3'>Solar Plant</td>
                                    <td className='px-4 py-3'>{ !loading && alldata.solar.kwh} kWh</td>
                                    <td className='px-4 py-3'>{ !loading && alldata.solar.kwh} kWh</td>
                                    <td className='px-4 py-3'>{formattedToday}</td>
                                </tr> }
                             { !loading && <tr>
                                    <td className='px-4 xl:px-5 py-3 xl:py-4'>2</td>
                                    <td className='px-4 py-3'>Mains Plant</td>
                                    <td className='px-4 py-3'>{ !loading && alldata.mains.kwh} kWh</td>
                                    <td className='px-4 py-3'>{ !loading && alldata.mains.kwh} kWh</td>
                                    <td className='px-4 py-3'>{formattedToday}</td>
                                </tr> }
                            { !loading && <tr>
                                    <td className='px-4 xl:px-5 py-3 xl:py-4'>3</td>
                                    <td className='px-4 py-3'>Genset Plant</td>
                                    <td className='px-4 py-3'>{ !loading && alldata.genset.kwh} kWh</td>
                                    <td className='px-4 py-3'>{ !loading && alldata.genset.kwh} kWh</td>
                                    <td className='px-4 py-3'>{formattedToday}</td>
                                </tr> }
                        
                         
                    </tbody> 
                </table>

            </div>

        </div>
    );

}

export default Excel;