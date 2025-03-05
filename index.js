import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css"; // ✅ Import Bootstrap here
import { WorkspaceProvider } from "./context/WorkspaceContext";

// For React 18 (recommended)
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </BrowserRouter>
);

// If you’re using React 17 instead, uncomment this and comment out the above:
// import ReactDOM from "react-dom";
// ReactDOM.render(
//   <BrowserRouter>
//     <WorkspaceProvider>
//       <App />
//     </WorkspaceProvider>
//   </BrowserRouter>,
//   document.getElementById("root")
// );