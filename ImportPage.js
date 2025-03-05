import React, { useState, useRef, useContext } from "react";
import { FaUpload, FaLink, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { WorkspaceContext } from "../context/WorkspaceContext";
import * as XLSX from "xlsx";


const ImportPage = () => {
  const [datasetUrl, setDatasetUrl] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [datasetPreview, setDatasetPreview] = useState([]);
  const [datasetSummary, setDatasetSummary] = useState({
    rows: 0,
    columns: 0,
    cleanedRows: 0,
    nullValuesRemoved: 0,
  });
  const [visualizations, setVisualizations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);


  const { workspaces, setWorkspaces, updateWorkspace } = useContext(WorkspaceContext);


  const analyzeDatasetAndGenerateInsights = (data, headers) => {
    if (!data || data.length === 0) return { visualizations: [], insights: [] };


    const columns = data[0].length;
    const dataRows = headers === data[0] ? data.slice(1) : data;
    const vizSuggestions = [];
    const insightsList = [];


    for (let col = 0; col < columns; col++) {
      const columnData = dataRows.map((row) => row[col]);
      const isNumeric = columnData.every((val) => !isNaN(val) && val !== "");
      const isDate = columnData.every((val) => !isNaN(Date.parse(val)) && val);
      const uniqueValues = [...new Set(columnData.filter((v) => v !== null && v !== ""))];
      const columnName = headers[col] || `Column ${col + 1}`;


      if (isNumeric) {
        const numericValues = columnData.map(Number).filter((v) => !isNaN(v));
        if (numericValues.length === 0) continue;


        const stats = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          median: numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)],
          stdDev: Math.sqrt(
            numericValues.reduce((sum, val) => sum + Math.pow(val - stats.mean, 2), 0) / numericValues.length
          ),
        };


        const q1 = numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 4)];
        const q3 = numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length * 3 / 4)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = numericValues.filter((v) => v < lowerBound || v > upperBound);


        if (outliers.length > 0) {
          insightsList.push(`Outliers detected in ${columnName}: ${outliers.join(", ")}`);
        }


        vizSuggestions.push({
          type: "line",
          title: `${columnName} Trend Over Rows`,
          xAxis: "Row Index",
          yAxis: columnName,
          data: numericValues.map((val, idx) => ({ x: idx + 1, y: val })),
          stats,
        });


        vizSuggestions.push({
          type: "bar",
          title: `${columnName} Distribution`,
          xAxis: "Value",
          yAxis: "Count",
          data: numericValues.reduce((acc, val) => {
            acc[val.toFixed(2)] = (acc[val.toFixed(2)] || 0) + 1;
            return acc;
          }, {}),
        });


        vizSuggestions.push({
          type: "area",
          title: `${columnName} Area Trend`,
          xAxis: "Row Index",
          yAxis: columnName,
          data: numericValues.map((val, idx) => ({ x: idx + 1, y: val })),
          stats,
        });


        insightsList.push(`Average ${columnName}: ${stats.mean.toFixed(2)}, Std Dev: ${stats.stdDev.toFixed(2)}`);
      } else if (isDate) {
        const dates = columnData.map((val) => new Date(val).getTime()).filter((t) => !isNaN(t));
        if (dates.length > 0) {
          const sortedDates = dates.sort((a, b) => a - b);
          vizSuggestions.push({
            type: "line",
            title: `${columnName} Timeline`,
            xAxis: "Date",
            yAxis: "Count",
            data: sortedDates.map((timestamp, idx) => ({
              x: new Date(timestamp).toLocaleDateString(),
              y: idx + 1,
            })),
          });
          insightsList.push(`Data spans from ${new Date(Math.min(...dates)).toLocaleDateString()} to ${new Date(Math.max(...dates)).toLocaleDateString()}`);
        }
      } else if (uniqueValues.length <= 15) {
        const valueCounts = columnData.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});


        vizSuggestions.push({
          type: "pie",
          title: `${columnName} Breakdown`,
          data: Object.entries(valueCounts).map(([label, value]) => ({ label, value })),
        });


        vizSuggestions.push({
          type: "bar",
          title: `${columnName} Category Distribution`,
          xAxis: "Category",
          yAxis: "Count",
          data: valueCounts,
        });


        const topValue = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0];
        if (topValue) {
          insightsList.push(`${topValue[0]} is the most frequent value in ${columnName} with ${topValue[1]} occurrences`);
        }
      }
    }


    const numericCols = [];
    for (let col = 0; col < columns; col++) {
      if (dataRows.every((row) => !isNaN(row[col]) && row[col] !== "")) {
        numericCols.push(col);
      }
    }


    if (numericCols.length >= 2) {
      for (let i = 0; i < numericCols.length; i++) {
        for (let j = i + 1; j < numericCols.length; j++) {
          const xValues = dataRows.map((row) => Number(row[numericCols[i]]));
          const yValues = dataRows.map((row) => Number(row[numericCols[j]]));
          const correlation = calculateCorrelation(xValues, yValues);


          if (Math.abs(correlation) > 0.5) {
            insightsList.push(`Moderate to strong correlation (${correlation.toFixed(2)}) between ${headers[numericCols[i]]} and ${headers[numericCols[j]]}`);
            vizSuggestions.push({
              type: "scatter",
              title: `${headers[numericCols[i]]} vs ${headers[numericCols[j]]}`,
              xAxis: headers[numericCols[i]],
              yAxis: headers[numericCols[j]],
              data: dataRows.map((row, idx) => ({
                x: Number(row[numericCols[i]]),
                y: Number(row[numericCols[j]]),
              })),
            });


            if (numericCols.length >= 3) {
              const zValues = dataRows.map((row) => Number(row[numericCols[2]]));
              vizSuggestions.push({
                type: "bubble",
                title: `${headers[numericCols[i]]} vs ${headers[numericCols[j]]} with ${headers[numericCols[2]]}`,
                data: dataRows.map((row, idx) => ({
                  x: Number(row[numericCols[i]]),
                  y: Number(row[numericCols[j]]), // Fixed: Added comma and proper parenthesis
                  r: Math.sqrt(Number(row[numericCols[2]]) || 1) * 5,
                })),
                xAxis: headers[numericCols[i]],
                yAxis: headers[numericCols[j]],
                zAxis: headers[numericCols[2]],
              });
            }
          }
        }
      }
    }


    if (numericCols.length >= 2) {
      const heatmapData = [];
      for (let i = 0; i < numericCols.length; i++) {
        for (let j = 0; j < numericCols.length; j++) {
          const xValues = dataRows.map((row) => Number(row[numericCols[i]]));
          const yValues = dataRows.map((row) => Number(row[numericCols[j]]));
          const correlation = calculateCorrelation(xValues, yValues);
          heatmapData.push({ x: i, y: j, value: correlation });
        }
      }
      vizSuggestions.push({
        type: "heatmap",
        title: "Correlation Heatmap Across Numeric Columns",
        data: heatmapData,
        xAxis: "Column Index",
        yAxis: "Column Index",
      });
    }


    return { visualizations: vizSuggestions, insights: insightsList };
  };


  const calculateCorrelation = (x, y) => {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    const stdX = Math.sqrt(x.reduce((a, b) => a + Math.pow(b - meanX, 2), 0) / n);
    const stdY = Math.sqrt(y.reduce((a, b) => a + Math.pow(b - meanY, 2), 0) / n);


    if (stdX === 0 || stdY === 0) return 0;


    const covariance = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / n;
    return covariance / (stdX * stdY);
  };


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }


    const allowedExtensions = ["csv", "xlsx", "xls"];
    const fileName = file.name;
    const fileExtension = fileName.split(".").pop().toLowerCase();


    if (!allowedExtensions.includes(fileExtension)) {
      setErrorMessage("Invalid file format. Please upload CSV, XLS, or XLSX files.");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }


    setSelectedFile(file);
    setErrorMessage("");


    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target.result;


      let headers, cleanedRows, numericData;
      if (fileExtension === "csv") {
        const text = data;
        const rows = text.split("\n").filter((row) => row.trim() !== "");


        if (rows.length > 1000000) {
          setErrorMessage("The number of rows should be less than 1 million.");
          return;
        }


        const parsedData = rows.map((row) => row.replace(/"/g, "").split(","));
        headers = parsedData[0].some((cell) => isNaN(cell)) ? parsedData[0] : Array.from({ length: parsedData[0].length }, (_, i) => `Column ${i + 1}`);
        cleanedRows = parsedData.filter((row) => !row.some((cell) => cell.trim() === ""));
        numericData = cleanedRows.map((row) => row.map((cell) => parseFloat(cell) || cell));
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });


        if (jsonData.length > 1000000) {
          setErrorMessage("The number of rows should be less than 1 million.");
          return;
        }


        headers = jsonData[0];
        cleanedRows = jsonData.filter((row) => !row.some((cell) => cell === null || cell === ""));
        numericData = cleanedRows.map((row) => row.map((cell) => parseFloat(cell) || cell));
      }


      const nullValuesRemoved = cleanedRows.length - numericData.length;
      setDatasetPreview(numericData.slice(0, 5));
      setDatasetSummary({
        rows: numericData.length,
        columns: numericData[0]?.length || 0,
        cleanedRows: cleanedRows.length,
        nullValuesRemoved,
      });


      const { visualizations: viz, insights } = analyzeDatasetAndGenerateInsights(numericData, headers);
      setVisualizations(viz);
      setInsights(insights);
    };


    if (fileExtension === "csv") {
      reader.readAsText(file);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      reader.readAsBinaryString(file);
    }
  };


  const handleNextStep = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select a file first.");
      return;
    }


    if (selectedFile.size > 100 * 1024 * 1024) {
      setErrorMessage("File size should be less than 100 MB.");
      return;
    }


    const existingWorkspace = workspaces.find(
      (workspace) => workspace.name.toLowerCase() === workspaceName.toLowerCase()
    );
    if (existingWorkspace) {
      const confirmSave = window.confirm(
        `A workspace with the same name "${workspaceName}" already exists. Do you want to save your workspace there?`
      );
      if (!confirmSave) {
        return;
      }
    }


    setUploadStep(2);
  };


  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!datasetUrl) {
      setErrorMessage("Please enter a valid URL.");
      return;
    }


    const existingWorkspace = workspaces.find(
      (workspace) => workspace.name.toLowerCase() === workspaceName.toLowerCase()
    );
    if (existingWorkspace) {
      const confirmSave = window.confirm(
        `A workspace with the same name "${workspaceName}" already exists. Do you want to save your workspace there?`
      );
      if (!confirmSave) {
        return;
      }
    }


    setIsLoading(true);
    setErrorMessage("");


    try {
      const response = await fetch("http://localhost:5000/api/fetch-dataset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ datasetUrl }),
      });


      if (!response.ok) {
        throw new Error(`Failed to fetch dataset. Status: ${response.status}`);
      }


      const data = await response.json();
      const text = data.dataset;


      const rows = text.split("\n").filter((row) => row.trim() !== "");


      if (rows.length > 1000000) {
        throw new Error("The number of rows should be less than 1 million.");
      }


      const parsedData = rows.map((row) => row.replace(/"/g, "").split(","));
      const headers = parsedData[0].some((cell) => isNaN(cell)) ? parsedData[0] : Array.from({ length: parsedData[0].length }, (_, i) => `Column ${i + 1}`);
      const cleanedRows = parsedData.filter((row) => !row.some((cell) => cell.trim() === ""));
      const numericData = cleanedRows.map((row) => row.map((cell) => parseFloat(cell) || cell));


      const nullValuesRemoved = cleanedRows.length - numericData.length;
      setDatasetPreview(numericData.slice(0, 5));
      setDatasetSummary({
        rows: numericData.length,
        columns: numericData[0]?.length || 0,
        cleanedRows: cleanedRows.length,
        nullValuesRemoved,
      });


      const { visualizations: viz, insights } = analyzeDatasetAndGenerateInsights(numericData, headers);
      setVisualizations(viz);
      setInsights(insights);
      setUploadStep(2);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching dataset:", error);
      setErrorMessage(
        error.message || "Failed to fetch the dataset. Please check the URL and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleProceedToDashboard = async () => {
    setIsLoading(true);
    const existingWorkspace = workspaces.find(
      (workspace) => workspace.name.toLowerCase() === workspaceName.toLowerCase()
    );


    let fullCleanedDataset = datasetPreview;


    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();


      fullCleanedDataset = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = event.target.result;
            let parsedData = [];


            if (fileExtension === "csv") {
              const text = data;
              const rows = text.split("\n").filter((row) => row.trim() !== "");
              parsedData = rows
                .map((row) => row.replace(/"/g, "").split(","))
                .filter((row) => !row.some((cell) => cell.trim() === ""));
            } else if (fileExtension === "xlsx" || fileExtension === "xls") {
              const workbook = XLSX.read(data, { type: "binary" });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              parsedData = parsedData.filter((row) =>
                row.every((cell) => cell !== null && cell !== "")
              );
            }
            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        };


        reader.onerror = () => reject(new Error("Error reading file"));


        if (fileExtension === "csv") {
          reader.readAsText(selectedFile);
        } else {
          reader.readAsBinaryString(selectedFile);
        }
      });
    }


    const workspaceMeta = {
      id: existingWorkspace ? existingWorkspace.id : Date.now(),
      name: workspaceName,
      description: workspaceDescription,
      datasetSummary,
    };


    const workspaceData = {
      ...workspaceMeta,
      file: selectedFile,
      datasetPreview,
      fullDataset: fullCleanedDataset,
      visualizations,
      insights,
    };


    if (existingWorkspace) {
      updateWorkspace(workspaceMeta);
    } else {
      const updatedWorkspaces = [...workspaces, workspaceMeta];
      setWorkspaces(updatedWorkspaces);
      try {
        localStorage.setItem("workspaces", JSON.stringify(updatedWorkspaces));
      } catch (e) {
        if (e.name === "QuotaExceededError") {
          console.error("Storage quota exceeded. Clearing old workspaces...");
          localStorage.clear();
          localStorage.setItem("workspaces", JSON.stringify([workspaceMeta]));
        } else {
          console.error("Error saving to localStorage:", e);
        }
      }
    }


    setIsLoading(false);


    console.log("Navigating with state:", workspaceData);


    navigate("/dashboard", {
      state: {
        workspaceId: workspaceData.id,
        dataset: fullCleanedDataset,
        datasetSummary,
        visualizations,
        insights,
      },
    });
  };


  return (
    <div className="min-vh-100 bg-light p-5">
      <div className="container">
        <header className="text-center mb-5">
          <h1 className="display-4 fw-bold text-dark mb-3">Import Your Data</h1>
          <p className="lead text-muted">
            Select a data source and start your analytics journey
          </p>
        </header>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card h-100 text-center shadow-lg border-0">
              <div className="card-body d-flex flex-column p-5">
                <div
                  className="bg-primary text-white rounded-circle p-4 mx-auto mb-4"
                  style={{ width: "80px", height: "80px" }}
                >
                  <FaUpload className="fs-3" />
                </div>
                <h3 className="card-title fs-3 fw-bold mb-3">Upload from Device</h3>
                <p className="card-text text-muted mb-4">
                  Import data from CSV or Excel files. Supported formats include .csv, .xlsx, and .xls.
                </p>
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="btn btn-primary btn-lg w-100"
                >
                  Upload File
                </button>
              </div>
            </div>
          </div>


          <div className="col-md-6">
            <div className="card h-100 text-center shadow-lg border-0">
              <div className="card-body d-flex flex-column p-5">
                <div
                  className="bg-primary text-white rounded-circle p-4 mx-auto mb-4"
                  style={{ width: "80px", height: "80px" }}
                >
                  <FaLink className="fs-3" />
                </div>
                <h3 className="card-title fs-3 fw-bold mb-3">Dataset URL</h3>
                <p className="card-text text-muted mb-4">
                  Fetch and import datasets from online sources. Supported formats include .csv, .xlsx, and .xls.
                </p>
                <button
                  onClick={() => setShowUrlForm(true)}
                  className="btn btn-primary btn-lg w-100"
                >
                  Submit URL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {showUploadForm && (
        <div className="modal show d-block bg-dark bg-opacity-50">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h2 className="modal-title fs-4 fw-bold">Upload File</h2>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowUploadForm(false)}
                ></button>
              </div>
              <div className="modal-body p-5">
                {uploadStep === 1 ? (
                  <>
                    <p className="text-muted mb-4">
                      Please ensure your file is properly formatted and does not exceed the maximum file size limit (100 MB) and row count (1 million rows). Supported formats include .csv, .xlsx, and .xls.
                    </p>
                    {errorMessage && (
                      <div className="alert alert-danger mb-4">{errorMessage}</div>
                    )}
                    {workspaces.find(
                      (workspace) => workspace.name.toLowerCase() === workspaceName.toLowerCase()
                    ) && (
                      <div className="alert alert-warning mb-4">
                        A workspace with the name "{workspaceName}" already exists. You can save your data there or choose a different name.
                      </div>
                    )}
                    <form onSubmit={handleNextStep}>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Workspace Name</label>
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          className="form-control form-control-lg"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Workspace Description</label>
                        <textarea
                          value={workspaceDescription}
                          onChange={(e) => setWorkspaceDescription(e.target.value)}
                          className="form-control form-control-lg"
                          rows="3"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Select Dataset File</label>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="form-control form-control-lg"
                          required
                        />
                      </div>
                      <div className="d-flex justify-content-between mt-5">
                        <button
                          type="button"
                          onClick={() => setShowUploadForm(false)}
                          className="btn btn-outline-secondary btn-lg"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg">
                          Next
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    {isLoading ? (
                      <div className="text-center">
                        <FaSpinner className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
                        <h3 className="mt-3">Processing dataset...</h3>
                      </div>
                    ) : (
                      <>
                        <h2 className="fs-4 fw-bold mb-4 text-dark">Dataset Summary & Preview</h2>
                        <div className="mb-5">
                          <h3 className="fs-5 fw-bold mb-4 text-dark">Dataset Summary</h3>
                          <div className="row g-4">
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <p className="card-text text-muted">Total Rows</p>
                                  <p className="fs-2 fw-bold text-primary">{datasetSummary.rows}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <p className="card-text text-muted">Total Columns</p>
                                  <p className="fs-2 fw-bold text-primary">{datasetSummary.columns}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <p className="card-text text-muted">Cleaned Rows</p>
                                  <p className="fs-2 fw-bold text-primary">{datasetSummary.cleanedRows}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <p className="card-text text-muted">Null Values Removed</p>
                                  <p className="fs-2 fw-bold text-primary">{datasetSummary.nullValuesRemoved}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-5">
                          <h3 className="fs-5 fw-bold mb-4 text-dark">Dataset Preview</h3>
                          <div className="table-responsive">
                            <table className="table table-bordered table-hover">
                              <thead className="table-light">
                                <tr>
                                  {datasetPreview.length > 0 &&
                                    datasetPreview[0].map((_, index) => (
                                      <th key={index} className="text-center">
                                        Column {index + 1}
                                      </th>
                                    ))}
                                </tr>
                              </thead>
                              <tbody>
                                {datasetPreview.length > 0 &&
                                  datasetPreview.map((row, index) => (
                                    <tr key={index}>
                                      {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="text-center">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="d-flex justify-content-end gap-3">
                          <button
                            onClick={() => {
                              setUploadStep(1);
                              setShowUploadForm(false);
                              setDatasetPreview([]);
                              setDatasetSummary({
                                rows: 0,
                                columns: 0,
                                cleanedRows: 0,
                                nullValuesRemoved: 0,
                              });
                              setVisualizations([]);
                              setInsights([]);
                              setErrorMessage("");
                            }}
                            className="btn btn-outline-secondary btn-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleProceedToDashboard}
                            className="btn btn-primary btn-lg"
                          >
                            Proceed to Dashboard
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {showUrlForm && (
        <div className="modal show d-block bg-dark bg-opacity-50">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h2 className="modal-title fs-4 fw-bold">Submit Dataset URL</h2>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowUrlForm(false)}
                ></button>
              </div>
              <div className="modal-body p-5">
                {uploadStep === 1 ? (
                  <>
                    <p className="text-muted mb-4">
                      Please provide a valid URL to fetch the dataset.
                    </p>
                    {errorMessage && (
                      <div className="alert alert-danger mb-4">{errorMessage}</div>
                    )}
                    {workspaces.find(
                      (workspace) => workspace.name.toLowerCase() === workspaceName.toLowerCase()
                    ) && (
                      <div className="alert alert-warning mb-4">
                        A workspace with the name "{workspaceName}" already exists. You can save your data there or choose a different name.
                      </div>
                    )}
                    <form onSubmit={handleUrlSubmit}>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Workspace Name</label>
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          className="form-control form-control-lg"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Workspace Description</label>
                        <textarea
                          value={workspaceDescription}
                          onChange={(e) => setWorkspaceDescription(e.target.value)}
                          className="form-control form-control-lg"
                          rows="3"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Dataset URL</label>
                        <input
                          type="url"
                          value={datasetUrl}
                          onChange={(e) => setDatasetUrl(e.target.value)}
                          placeholder="https://example.com/dataset.csv"
                          className="form-control form-control-lg"
                          required
                        />
                      </div>
                      <div className="d-flex justify-content-between mt-5">
                        <button
                          type="button"
                          onClick={() => setShowUrlForm(false)}
                          className="btn btn-outline-secondary btn-lg"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg">
                          Next
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    {isLoading ? (
                      <div className="text-center">
                        <FaSpinner className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
                        <h3 className="mt-3">Processing dataset...</h3>
                      </div>
                    ) : (
                      <>
                        <h2 className="fs-4 fw-bold mb-4 text-dark">Dataset Summary & Preview</h2>
                        <div className="mb-5">
                          <h3 className="fs-5 fw-bold mb-4 text-dark">Dataset Summary</h3>
                          <div className="row g-4">
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <p className="card-text text-muted">Total Rows</p>
                                  <p className="fs-2 fw-bold text-primary">{datasetSummary.rows}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <p className="card-text text-muted">Total Columns</p>
                                  <p className="fs-2 fw-bold text-primary">{datasetSummary.columns}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <p className="card-text text-muted">Cleaned Rows</p>
                                  <p className="fs-2 fw-bold text-primary">{datasetSummary.cleanedRows}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <p className="card-text text-muted">Null Values Removed</p>
                                  <p className="fs-2 fw-bold text-primary">{datasetSummary.nullValuesRemoved}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-5">
                          <h3 className="fs-5 fw-bold mb-4 text-dark">Dataset Preview</h3>
                          <div className="table-responsive">
                            <table className="table table-bordered table-hover">
                              <thead className="table-light">
                                <tr>
                                  {datasetPreview.length > 0 &&
                                    datasetPreview[0].map((_, index) => (
                                      <th key={index} className="text-center">
                                        Column {index + 1}
                                      </th>
                                    ))}
                                </tr>
                              </thead>
                              <tbody>
                                {datasetPreview.length > 0 &&
                                  datasetPreview.map((row, index) => (
                                    <tr key={index}>
                                      {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="text-center">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="d-flex justify-content-end gap-3">
                          <button
                            onClick={() => {
                              setUploadStep(1);
                              setShowUrlForm(false);
                              setDatasetPreview([]);
                              setDatasetSummary({
                                rows: 0,
                                columns: 0,
                                cleanedRows: 0,
                                nullValuesRemoved: 0,
                              });
                              setVisualizations([]);
                              setInsights([]);
                              setErrorMessage("");
                            }}
                            className="btn btn-outline-secondary btn-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleProceedToDashboard}
                            className="btn btn-primary btn-lg"
                          >
                            Proceed to Dashboard
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default ImportPage;