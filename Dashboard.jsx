import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { FaChartBar, FaChartPie, FaChartLine, FaTable, FaDownload, FaArrowLeft, FaFilter, FaTachometerAlt, FaFileImage, FaFilePdf, FaChartScatter } from "react-icons/fa";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ScatterController, Title, Tooltip, Legend } from "chart.js";
import { Bar, Line, Pie, Doughnut, Scatter } from "react-chartjs-2";
import moment from "moment";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import 'bootstrap/dist/css/bootstrap.min.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ScatterController, Title, Tooltip, Legend);

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dashboardRef = useRef(null);
  const { workspaces, getWorkspaceById } = useContext(WorkspaceContext);
  const workspaceId = location.state?.workspaceId || null;
  const initialDataset = location.state?.dataset || [];

  const [workspace, setWorkspace] = useState(null);
  const [dataset, setDataset] = useState([]);
  const [datasetSummary, setDatasetSummary] = useState({ rows: 0, columns: 0, cleanedRows: 0, nullValuesRemoved: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [filteredData, setFilteredData] = useState([]);
  const [chartConfigs, setChartConfigs] = useState({});
  const [kpis, setKpis] = useState([]);
  const [columnTypes, setColumnTypes] = useState({ numeric: [], categorical: [], date: null });

  // Clean and Aggregate Data
  const cleanAndAggregateData = useCallback((rawData) => {
    if (!rawData || rawData.length < 2) return rawData || [];
    const headers = rawData[0];
    const rows = rawData.slice(1);
    const cleanedRows = rows.filter(row => !row.every(cell => cell === null || cell === "" || cell === undefined));
    const nullValuesRemoved = rows.length - cleanedRows.length;
    setDatasetSummary({ rows: rows.length, columns: headers.length, cleanedRows: cleanedRows.length, nullValuesRemoved });
    return [headers, ...cleanedRows];
  }, []);

  // Initial Data Load
  useEffect(() => {
    setIsLoading(true);
    try {
      const cleanedData = cleanAndAggregateData(initialDataset.length > 0 ? initialDataset : (workspaceId && getWorkspaceById(workspaceId)?.fullDataset) || []);
      setDataset(cleanedData);
      setWorkspace({
        id: workspaceId || "temp-" + Date.now(),
        name: workspaces.find(w => w.id === workspaceId)?.name || "Superstore Insights",
        description: "Comprehensive analysis of Superstore sales data",
      });
    } catch (e) {
      setError("Error processing dataset: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, workspaces, getWorkspaceById, initialDataset, cleanAndAggregateData]);

  // Detect Column Types
  const detectColumnTypes = useCallback(() => {
    if (dataset.length < 2) return { numeric: [], categorical: [], date: null };
    const headers = dataset[0];
    const dataRows = dataset.slice(1);
    const numeric = headers.map((header, idx) => {
      const values = dataRows.map(row => parseFloat(row[idx]));
      const uniqueValues = [...new Set(values.filter(v => !isNaN(v)))];
      return {
        index: idx,
        header,
        isNumeric: values.every(v => !isNaN(v) && isFinite(v)) && uniqueValues.length > 2,
      };
    }).filter(col => col.isNumeric);
    const dateIdx = headers.findIndex((_, idx) => {
      const validDates = dataRows.filter(row => moment(row[idx], ["YYYY-MM-DD", "MM/DD/YYYY", "YYYY"], true).isValid()).length;
      return validDates / dataRows.length >= 0.9 && [...new Set(dataRows.map(row => row[idx]))].length > 2;
    });
    const categorical = headers.map((header, idx) => ({
      index: idx,
      header,
      isCategorical: !numeric.some(col => col.index === idx) && idx !== dateIdx && [...new Set(dataRows.map(row => row[idx]))].length > 1,
    })).filter(col => col.isCategorical);
    return { numeric, categorical, date: dateIdx !== -1 ? { index: dateIdx, header: headers[dateIdx] } : null };
  }, [dataset]);

  useEffect(() => {
    if (dataset.length > 0) {
      const types = detectColumnTypes();
      setColumnTypes(types);
      setFilteredData(dataset);
    }
  }, [dataset, detectColumnTypes]);

  // Apply Filters
  const applyFilters = useCallback(() => {
    if (dataset.length < 2) return;
    const headers = dataset[0];
    const dataRows = dataset.slice(1);
    const filtered = dataRows.filter(row => {
      return Object.entries(filters).every(([colIdx, values]) => !values?.length || values.includes(String(row[colIdx]))) &&
        (!dateRange.start || !dateRange.end || !columnTypes.date ||
          moment(row[columnTypes.date.index]).isBetween(moment(dateRange.start), moment(dateRange.end), null, '[]'));
    });
    setFilteredData([headers, ...filtered]);
  }, [dataset, filters, dateRange, columnTypes]);

  useEffect(() => applyFilters(), [filters, dateRange, dataset, applyFilters]);

  // Configure Charts for Sample Superstore with More Bar Charts
  const configureChartsForSuperstore = useCallback(() => {
    if (filteredData.length < 2) return;
    const headers = filteredData[0];
    const dateCol = headers.indexOf("Order Date");
    const salesCol = headers.indexOf("Sales");
    const qtyCol = headers.indexOf("Quantity");
    const catCol = headers.indexOf("Category");
    const regionCol = headers.indexOf("Region");
    const subCatCol = headers.indexOf("Sub-Category");

    if (dateCol < 0 || salesCol < 0 || qtyCol < 0 || catCol < 0 || regionCol < 0 || subCatCol < 0) {
      setError("Required columns (Order Date, Sales, Quantity, Category, Region, Sub-Category) not found in dataset.");
      return;
    }

    setChartConfigs({
      barSalesByDate: { 
        columns: { x: dateCol, y: salesCol, aggregation: "sum" }, 
        title: "Total Sales by Order Date", 
        type: "bar", 
        xAxisTitle: "Order Date", 
        yAxisTitle: "Total Sales" 
      },
      barSalesByRegion: { 
        columns: { x: regionCol, y: salesCol, aggregation: "sum" }, 
        title: "Total Sales by Region", 
        type: "bar", 
        xAxisTitle: "Region", 
        yAxisTitle: "Total Sales" 
      },
      barSalesByCategory: { 
        columns: { x: catCol, y: salesCol, aggregation: "sum" }, 
        title: "Total Sales by Category", 
        type: "bar", 
        xAxisTitle: "Category", 
        yAxisTitle: "Total Sales" 
      },
      barSalesBySubCategory: { 
        columns: { x: subCatCol, y: salesCol, aggregation: "sum" }, 
        title: "Total Sales by Sub-Category", 
        type: "bar", 
        xAxisTitle: "Sub-Category", 
        yAxisTitle: "Total Sales" 
      },
      barQtyByRegion: { 
        columns: { x: regionCol, y: qtyCol, aggregation: "sum" }, 
        title: "Total Quantity by Region", 
        type: "bar", 
        xAxisTitle: "Region", 
        yAxisTitle: "Total Quantity" 
      },
      lineSalesTrend: { 
        columns: { x: dateCol, y: salesCol, aggregation: "mean" }, 
        title: "Average Sales Trend", 
        type: "line", 
        xAxisTitle: "Order Date", 
        yAxisTitle: "Avg Sales" 
      },
      pieSalesByCategory: { 
        columns: { x: catCol, y: salesCol, aggregation: "sum" }, 
        title: "Sales Distribution by Category", 
        type: "pie" 
      },
      doughnutQtyByRegion: { 
        columns: { x: regionCol, y: qtyCol, aggregation: "sum" }, 
        title: "Quantity Distribution by Region", 
        type: "doughnut" 
      },
    });
  }, [filteredData]);

  useEffect(() => configureChartsForSuperstore(), [filteredData, configureChartsForSuperstore]);

  // Generate KPIs for Sample Superstore
  const generateKPIsForSuperstore = useCallback(() => {
    if (filteredData.length < 2) return;
    const headers = filteredData[0];
    const dataRows = filteredData.slice(1);

    const salesCol = headers.indexOf("Sales");
    const qtyCol = headers.indexOf("Quantity");
    const catCol = headers.indexOf("Category");

    const kpis = [];
    const addKPI = (title, value) => {
      if (kpis.length < 5 && value !== null && value !== undefined && !isNaN(value)) {
        kpis.push({ 
          title, 
          value: typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 2, style: "currency", currency: "USD" }) : value 
        });
      }
    };

    const salesValues = dataRows.map(row => parseFloat(row[salesCol]) || 0);
    const totalSales = salesValues.reduce((a, b) => a + b, 0);
    addKPI("Total Sales", totalSales);

    if (salesValues.length > 1) {
      const growth = ((salesValues[salesValues.length - 1] - salesValues[0]) / salesValues[0] * 100) || 0;
      addKPI("Sales Growth", `${growth.toFixed(1)}%`);
    }

    const qtyValues = dataRows.map(row => parseFloat(row[qtyCol]) || 0);
    const totalQty = qtyValues.reduce((a, b) => a + b, 0);
    addKPI("Total Quantity", totalQty);

    const catCounts = dataRows.reduce((acc, row) => {
      acc[row[catCol]] = (acc[row[catCol]] || 0) + 1;
      return acc;
    }, {});
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];
    addKPI("Top Category", topCat[0]);

    const avgSales = salesValues.length > 0 ? totalSales / salesValues.length : 0;
    addKPI("Average Sales", avgSales);

    setKpis(kpis);
  }, [filteredData]);

  useEffect(() => generateKPIsForSuperstore(), [filteredData, generateKPIsForSuperstore]);

  // Chart Data Generation
  const getChartData = useCallback((config) => {
    if (filteredData.length < 2 || !config) return null;
    const headers = filteredData[0];
    const dataRows = filteredData.slice(1);
    const { x, y, aggregation } = config.columns;

    const aggregateData = (values, method) => {
      if (values.length === 0) return 0;
      return method === "mean" ? values.reduce((a, b) => a + b, 0) / values.length : values.reduce((a, b) => a + b, 0);
    };

    if (config.type === "pie" || config.type === "doughnut") {
      const counts = dataRows.reduce((acc, row) => {
        const key = row[x] || "Unknown";
        acc[key] = (acc[key] || 0) + (parseFloat(row[y]) || 0);
        return acc;
      }, {});
      return {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#E7E9BB", "#C9CBE0"],
        }],
      };
    } else {
      const labels = [...new Set(dataRows.map(row => row[x] || "Unknown"))].sort((a, b) => config.type === "bar" && config.columns.x === headers.indexOf("Order Date") ? new Date(a) - new Date(b) : a.localeCompare(b));
      return {
        labels,
        datasets: [{
          label: headers[y],
          data: labels.map(label => aggregateData(dataRows.filter(row => row[x] === label).map(row => parseFloat(row[y]) || 0), aggregation)),
          backgroundColor: config.type === "bar" ? "#28a745" : undefined,
          borderColor: "#28a745",
          borderWidth: 2,
          fill: false,
        }],
      };
    }
  }, [filteredData]);

  const renderChart = useCallback((config) => {
    const chartData = getChartData(config);
    if (!chartData || chartData.labels?.length < 2) return <div className="text-center py-5">Insufficient Data</div>;
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        title: { display: true, text: config.title, font: { size: 18, family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }, color: "#343a40" }, 
        legend: { position: "top", labels: { font: { size: 12 }, color: "#6c757d" } },
        tooltip: { enabled: true },
      },
      scales: config.type === "pie" || config.type === "doughnut" ? {} : {
        x: { 
          title: { display: true, text: config.xAxisTitle, font: { size: 14 }, color: "#6c757d" }, 
          ticks: { autoSkip: true, maxTicksLimit: 10, font: { size: 12 }, color: "#6c757d" },
        },
        y: { 
          title: { display: true, text: config.yAxisTitle, font: { size: 14 }, color: "#6c757d" }, 
          beginAtZero: true, 
          ticks: { font: { size: 12 }, color: "#6c757d" },
        },
      },
    };
    switch (config.type) {
      case "bar": return <Bar data={chartData} options={options} />;
      case "line": return <Line data={chartData} options={options} />;
      case "pie": return <Pie data={chartData} options={options} />;
      case "doughnut": return <Doughnut data={chartData} options={options} />;
      default: return null;
    }
  }, [getChartData]);

  // Slicers with Deselect Option
  const renderSlicers = useCallback(() => {
    if (dataset.length < 2) return null;
    const headers = dataset[0];
    const dataRows = dataset.slice(1);
    const dateCol = headers.indexOf("Order Date");

    const clearFilter = (colIdx) => {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[colIdx];
        return newFilters;
      });
    };

    return (
      <div className="card shadow-sm mb-4" style={{ borderRadius: "12px", backgroundColor: "#fff", border: "none" }}>
        <div className="card-header" style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
          <h5 className="mb-0" style={{ fontSize: "1.25rem", color: "#343a40" }}><FaFilter className="me-2" /> Filters</h5>
        </div>
        <div className="card-body" style={{ padding: "20px" }}>
          <div className="row g-3">
            {["Category", "Region", "Sub-Category"].map(colName => {
              const colIdx = headers.indexOf(colName);
              if (colIdx < 0) return null;
              const values = [...new Set(dataRows.map(row => String(row[colIdx] || "Unknown")))].sort();
              if (values.length <= 1 || values.length > 50) return null;
              return (
                <div key={colIdx} className="col-md-3">
                  <label className="form-label" style={{ fontSize: "0.9rem", color: "#6c757d" }}>{colName}</label>
                  <select
                    multiple
                    className="form-select"
                    value={filters[colIdx] || []}
                    onChange={e => setFilters(prev => ({
                      ...prev,
                      [colIdx]: e.target.selectedOptions.length === 0 ? [] : Array.from(e.target.selectedOptions, option => option.value),
                    }))}
                    style={{ height: "120px", borderRadius: "8px", fontSize: "0.85rem", borderColor: "#6c757d" }}
                  >
                    {values.map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                  <button
                    className="btn btn-outline-secondary btn-sm mt-2"
                    onClick={() => clearFilter(colIdx)}
                    style={{ borderRadius: "20px", padding: "5px 15px", color: "#6c757d", borderColor: "#6c757d" }}
                  >
                    Clear
                  </button>
                </div>
              );
            })}
            {dateCol >= 0 && (
              <div className="col-md-3">
                <label className="form-label" style={{ fontSize: "0.9rem", color: "#6c757d" }}>Order Date Range</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="form-control mb-2"
                  style={{ borderRadius: "8px", fontSize: "0.85rem", borderColor: "#6c757d" }}
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="form-control"
                  style={{ borderRadius: "8px", fontSize: "0.85rem", borderColor: "#6c757d" }}
                />
                <button
                  className="btn btn-outline-secondary btn-sm mt-2"
                  onClick={() => setDateRange({ start: "", end: "" })}
                  style={{ borderRadius: "20px", padding: "5px 15px", color: "#6c757d", borderColor: "#6c757d" }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          <button
            className="btn btn-outline-secondary btn-sm mt-3"
            onClick={() => { setFilters({}); setDateRange({ start: "", end: "" }); }}
            style={{ borderRadius: "20px", padding: "5px 15px", color: "#6c757d", borderColor: "#6c757d" }}
          >
            Reset All Filters
          </button>
        </div>
      </div>
    );
  }, [dataset, filters, dateRange]);

  // Export Functions
  const exportAsPNG = useCallback(() => {
    html2canvas(dashboardRef.current, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
      const link = document.createElement("a");
      link.download = `${workspace?.name || "dashboard"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }).catch(err => {
      console.error("Error generating PNG:", err);
      setError("Failed to export PNG: " + err.message);
    });
  }, [workspace]);

  const generateReport = useCallback(() => {
    try {
      console.log("Starting PDF generation...");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const headers = dataset[0];
      const dataRows = filteredData.slice(1);
      let y = 20;

      // Helper function to add text with page break check
      const addText = (text, x, yPos, options = {}) => {
        if (yPos > 270) {
          doc.addPage();
          y = 20;
          addHeader();
        }
        doc.text(text, x, yPos, options);
        return yPos + (options.lineHeight || 6);
      };

      // Add header to each page
      const addHeader = () => {
        doc.setFontSize(10);
        doc.setTextColor(108, 117, 125); // Grey #6c757d
        doc.text("DashLab Analytics", 10, 10);
        doc.text(moment().format("MMMM Do YYYY"), 180, 10, { align: "right" });
        doc.setLineWidth(0.5);
        doc.setDrawColor(108, 117, 125);
        doc.line(10, 15, 200, 15);
      };

      // Title Page
      addHeader();
      doc.setFontSize(20);
      doc.setTextColor(40, 167, 69); // Green #28a745
      y = addText("Superstore Data Analysis Report", 105, y, { align: "center", lineHeight: 10 });
      doc.setFontSize(12);
      doc.setTextColor(108, 117, 125);
      y = addText(`Dataset: ${workspace?.name || "Unnamed"}`, 105, y, { align: "center" });
      y = addText(`Generated: ${moment().format("MMMM Do YYYY")}`, 105, y, { align: "center" });
      doc.addPage();

      // Dataset Overview
      y = 20;
      addHeader();
      doc.setFontSize(16);
      doc.setTextColor(40, 167, 69);
      y = addText("Dataset Overview", 20, y);
      doc.setFontSize(12);
      doc.setTextColor(0);
      y = addText(`Total Rows: ${datasetSummary.rows}`, 30, y);
      y = addText(`Total Columns: ${datasetSummary.columns}`, 30, y);
      y = addText(`Cleaned Rows: ${datasetSummary.cleanedRows}`, 30, y);
      y = addText(`Missing Values Removed: ${datasetSummary.nullValuesRemoved}`, 30, y);
      y += 6;

      // Variables
      doc.setFontSize(16);
      doc.setTextColor(40, 167, 69);
      y = addText("Variables", 20, y);
      doc.setFontSize(12);
      doc.setTextColor(0);
      headers.forEach((header, i) => {
        const type = columnTypes.numeric.some(c => c.index === i) ? "Numeric" :
                     columnTypes.categorical.some(c => c.index === i) ? "Categorical" :
                     columnTypes.date?.index === i ? "Date" : "Other";
        y = addText(`${header}: ${type}`, 30, y);
      });
      y += 6;

      // KPIs
      doc.setFontSize(16);
      doc.setTextColor(40, 167, 69);
      y = addText("Key Performance Indicators", 20, y);
      doc.setFontSize(12);
      doc.setTextColor(0);
      kpis.forEach(kpi => {
        y = addText(`${kpi.title}: ${kpi.value}`, 30, y);
      });

      // Top Categories Table
      doc.addPage();
      y = 20;
      addHeader();
      doc.setFontSize(16);
      doc.setTextColor(40, 167, 69);
      y = addText("Top Categories by Sales", 20, y);
      doc.setFontSize(12);
      doc.setTextColor(0);
      const salesCol = headers.indexOf("Sales");
      const catCol = headers.indexOf("Category");
      const catSales = dataRows.reduce((acc, row) => {
        const cat = row[catCol] || "Unknown";
        acc[cat] = (acc[cat] || 0) + (parseFloat(row[salesCol]) || 0);
        return acc;
      }, {});
      const topCategories = Object.entries(catSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 8, "F");
      y = addText("Category", 25, y + 6);
      doc.text("Total Sales", 120, y - 6);
      y += 2;

      topCategories.forEach(([cat, sales]) => {
        doc.setFillColor(255, 255, 255);
        doc.rect(20, y - 4, 170, 8, "F");
        y = addText(cat, 25, y + 2);
        doc.text(sales.toLocaleString('en-US', { style: "currency", currency: "USD" }), 120, y - 2);
        y += 2;
      });
      y += 6;

      // Charts and Inferences
      doc.setFontSize(16);
      doc.setTextColor(40, 167, 69);
      y = addText("Charts and Insights", 20, y);
      doc.setFontSize(12);
      doc.setTextColor(0);
      Object.entries(chartConfigs).forEach(([key, config], idx) => {
        const chartData = getChartData(config);
        if (!chartData || chartData.labels?.length < 2) return;

        y += 10;
        y = addText(`Chart ${idx + 1}: ${config.title}`, 20, y, { lineHeight: 8 });

        let inference = "";
        if (config.type === "line") {
          const values = chartData.datasets[0].data;
          const trend = values[values.length - 1] > values[0] ? "increasing" : "decreasing";
          inference = `Trend: ${trend} over time.`;
        } else if (config.type === "bar") {
          const maxIdx = chartData.datasets[0].data.indexOf(Math.max(...chartData.datasets[0].data));
          inference = `Highest ${headers[config.columns.y]}: ${chartData.labels[maxIdx]}.`;
        } else if (config.type === "pie" || config.type === "doughnut") {
          const maxIdx = chartData.datasets[0].data.indexOf(Math.max(...chartData.datasets[0].data));
          inference = `Dominant category: ${chartData.labels[maxIdx]} (${((chartData.datasets[0].data[maxIdx] / chartData.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%).`;
        }
        y = addText(inference, 30, y);

        if (y > 240 && idx < Object.keys(chartConfigs).length - 1) {
          doc.addPage();
          y = 20;
          addHeader();
        }
      });

      console.log("PDF generation complete.");
      doc.save(`${workspace?.name || "report"}.pdf`);
    } catch (err) {
      console.error("Error generating PDF report:", err);
      setError("Failed to generate PDF report: " + err.message);
    }
  }, [workspace, dataset, datasetSummary, columnTypes, kpis, chartConfigs, getChartData, filteredData]);

  if (error) return <div className="alert alert-danger m-4">{error}</div>;
  if (isLoading) return <div className="text-center my-5"><div className="spinner-border text-primary" role="status" /></div>;

  return (
    <div ref={dashboardRef} className="container-fluid p-4" style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <style>{`
        .card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .card:hover {
          transform: translateY(-5px);
        }
        .card-header {
          background-color: #fff;
          border-bottom: 1px solid #e9ecef;
          padding: 15px 20px;
        }
        .card-body {
          padding: 20px;
        }
        h1, h5, h6 {
          color: #343a40;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .btn-primary {
          background-color: #28a745;
          border: none;
          border-radius: 20px;
          padding: 8px 20px;
          transition: background-color 0.2s;
        }
        .btn-primary:hover {
          background-color: #218838;
        }
        .btn-light {
          border-radius: 20px;
          padding: 8px 20px;
          background-color: #fff;
          border: 1px solid #6c757d;
          color: #6c757d;
        }
        .btn-light:hover {
          background-color: #f8f9fa;
          color: #5a6268;
        }
        .btn-outline-secondary {
          border-color: #6c757d;
          color: #6c757d;
        }
        .btn-outline-secondary:hover {
          background-color: #f8f9fa;
          color: #5a6268;
        }
        .table {
          border-radius: 8px;
          overflow: hidden;
        }
        .table thead th {
          background-color: #f8f9fa;
          color: #6c757d;
          font-weight: 600;
        }
        .form-select, .form-control {
          border-color: #6c757d;
          color: #495057;
        }
        .form-select:focus, .form-control:focus {
          border-color: #28a745;
          box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
        }
      `}</style>

      <header className="mb-4 p-3 bg-white rounded shadow-sm" style={{ borderLeft: "5px solid #28a745" }}>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="h3 mb-0" style={{ fontWeight: 700 }}>
            <FaTachometerAlt className="me-2" style={{ color: "#28a745" }} />
            {workspace?.name}
          </h1>
          <div className="d-flex gap-2">
            <button className="btn btn-light" onClick={() => navigate("/")}><FaArrowLeft /> Back</button>
            <button className="btn btn-light" onClick={exportAsPNG}><FaFileImage /> PNG</button>
            <button className="btn btn-primary" onClick={generateReport}><FaFilePdf /> PDF Report</button>
          </div>
        </div>
        <p className="small mt-2" style={{ fontStyle: "italic", color: "#6c757d" }}>{workspace?.description}</p>
      </header>

      {renderSlicers()}

      <div className="card shadow-sm mb-4">
        <div className="card-header"><h5 style={{ fontWeight: 600 }}>Key Performance Indicators</h5></div>
        <div className="card-body">
          <div className="row g-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="col-md-3">
                <div className="card p-3 bg-white">
                  <h6 className="text-muted" style={{ fontSize: "0.9rem", color: "#6c757d" }}>{kpi.title}</h6>
                  <p className="mb-0" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#28a745" }}>{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header"><h5 style={{ fontWeight: 600 }}>Data Visualizations</h5></div>
        <div className="card-body">
          <div className="row g-4">
            {Object.entries(chartConfigs).map(([key, config]) => (
              <div key={key} className="col-md-6">
                <div className="card" style={{ height: "400px" }}>
                  <div className="card-body p-3">{renderChart(config)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header"><h5 style={{ fontWeight: 600 }}>Dataset Summary</h5></div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3"><p><strong>Total Rows:</strong> {datasetSummary.rows}</p></div>
            <div className="col-md-3"><p><strong>Total Columns:</strong> {datasetSummary.columns}</p></div>
            <div className="col-md-3"><p><strong>Cleaned Rows:</strong> {datasetSummary.cleanedRows}</p></div>
            <div className="col-md-3"><p><strong>Missing Values Removed:</strong> {datasetSummary.nullValuesRemoved}</p></div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header"><h5 style={{ fontWeight: 600 }}>Data Preview ({filteredData.length - 1} rows)</h5></div>
        <div className="card-body table-responsive">
          <table className="table table-striped table-hover">
            <thead><tr>{filteredData[0]?.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{filteredData.slice(1, 11).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;