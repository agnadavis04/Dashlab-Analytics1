import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { WorkspaceContext } from "./context/WorkspaceContext"; // Add this
import SessionHandler from "./components/SessionHandler";
import "bootstrap/dist/css/bootstrap.min.css";

// Import Pages
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUp";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./components/Dashboard";
import UserAccountPage from "./components/UserAccountPage";
import ImportPage from "./components/ImportPage";

function App() {
  const [workspaces, setWorkspaces] = useState(() => {
    return JSON.parse(localStorage.getItem("workspaces")) || [];
  });

  const updateWorkspace = (workspace) => {
    setWorkspaces(prev => {
      const updated = prev.map(w => (w.id === workspace.id ? workspace : w));
      localStorage.setItem("workspaces", JSON.stringify(updated));
      return updated;
    });
  };

  const getWorkspaceById = (id) => workspaces.find(w => w.id === id);

  return (
    <UserProvider>
      <WorkspaceContext.Provider value={{ workspaces, setWorkspaces, updateWorkspace, getWorkspaceById }}>
        <SessionHandler />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/useraccount" element={<UserAccountPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </WorkspaceContext.Provider>
    </UserProvider>
  );
}

export default App;