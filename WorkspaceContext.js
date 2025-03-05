import React, { createContext, useState } from "react";

export const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState(
    JSON.parse(localStorage.getItem("workspaces")) || []
  );

  const updateWorkspace = (updatedWorkspace) => {
    const updatedWorkspaces = workspaces.map((workspace) =>
      workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace
    );
    setWorkspaces(updatedWorkspaces);
    localStorage.setItem("workspaces", JSON.stringify(updatedWorkspaces));
  };

  const getWorkspaceById = (id) => {
    return workspaces.find((workspace) => workspace.id === id);
  };

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, setWorkspaces, updateWorkspace, getWorkspaceById }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};