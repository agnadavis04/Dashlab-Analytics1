import React, { useState, useContext, useEffect } from "react";
import {
  FaTachometerAlt,
  FaPlus,
  FaQuestionCircle,
  FaSun,
  FaMoon,
  FaFileUpload,
  FaSignOutAlt,
  FaTrash,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { WorkspaceContext } from "../context/WorkspaceContext";
import 'bootstrap/dist/css/bootstrap.min.css';

function UserAccountPage() {
  const { workspaces, setWorkspaces } = useContext(WorkspaceContext);
  const [darkMode, setDarkMode] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    description: "",
    datasets: [],
  });
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [activeTab, setActiveTab] = useState("workspaces");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();

  // Ensure workspaces is always an array
  useEffect(() => {
    if (!Array.isArray(workspaces)) {
      setWorkspaces([]);
    }
  }, [workspaces, setWorkspaces]);

  // Apply dark/light mode styles
  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
  }, [darkMode]);

  const location = useLocation();
  const userInitial = location.state?.userInitial || "U";
  const userEmail = location.state?.email || "";
  const userFirstName = location.state?.firstName || "User";
  const loginTime = new Date().toLocaleString();

  const handleImportDataset = () => {
    navigate("/import");
  };

  const handleViewWorkspace = (workspaceId) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      navigate("/dashboard", {
        state: {
          workspaceId: workspace.id,
          dataset: workspace.fullDataset || workspace.datasetPreview || [],
          datasetSummary: workspace.datasetSummary || { rows: 0, columns: 0 },
        },
      });
    }
  };

  const handleCreateWorkspace = () => {
    if (newWorkspace.name.trim() === "") {
      alert("Workspace name cannot be empty!");
      return;
    }

    const workspaceExists = workspaces.some(
      (workspace) => workspace.name.toLowerCase() === newWorkspace.name.toLowerCase()
    );

    if (workspaceExists) {
      alert("A workspace with this name already exists. Please choose a different name.");
      return;
    }

    const newWorkspaceObj = {
      id: Date.now(),
      name: newWorkspace.name,
      description: newWorkspace.description,
      datasets: newWorkspace.datasets,
      createdAt: new Date().toLocaleString(),
      owned: true,
      dashboardImage: null,
      userEmail,
    };
    const updatedWorkspaces = [...workspaces, newWorkspaceObj];
    setWorkspaces(updatedWorkspaces);
    localStorage.setItem("workspaces", JSON.stringify(updatedWorkspaces));
    setNewWorkspace({ name: "", description: "", datasets: [] });
    setShowWorkspaceForm(false);
    alert("Workspace created successfully!");
  };

  const handleDeleteWorkspace = (workspaceId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this workspace?");
    if (confirmDelete) {
      const updatedWorkspaces = workspaces.filter((w) => w.id !== workspaceId);
      setWorkspaces(updatedWorkspaces);
      localStorage.setItem("workspaces", JSON.stringify(updatedWorkspaces));
      alert("Workspace deleted successfully!");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    alert("You have been signed out.");
    navigate("/");
  };

  return (
    <div className={darkMode ? "dark-mode" : ""} style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        body, .dark-mode {
          margin: 0;
          font-family: 'Poppins', sans-serif;
          background: ${darkMode ? 'linear-gradient(135deg, #2f2f2f 0%, #4a4a4a 100%)' : '#f8f9fa'};
          color: ${darkMode ? '#fff' : '#333'};
          transition: all 0.3s ease;
        }
        .dark-mode .bg-white {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
          color: #fff;
        }
        .dark-mode .text-black, .dark-mode .text-muted, .dark-mode .text-primary {
          color: #fff !important;
        }
        .dark-mode .btn-primary {
          background-color: #f4a261 !important;
          color: #fff !important;
          border: none !important;
        }
        .dark-mode .btn-primary:hover {
          background-color: #e07a3e !important;
        }
        .dark-mode .btn-outline-light, .dark-mode .btn-link {
          background-color: transparent !important;
          color: #f4a261 !important;
          border-color: #f4a261 !important;
        }
        .dark-mode .btn-link:hover {
          color: #e07a3e !important;
          border-color: #e07a3e !important;
        }
        .dark-mode .shadow-sm, .dark-mode .shadow-lg {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
        }
        .dark-mode .badge.bg-primary {
          background-color: #f4a261 !important;
        }
        .dark-mode .form-control, .dark-mode .modal-content {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: #fff !important;
        }
        .dark-mode .form-control::placeholder {
          color: #ccc !important;
        }
        .dark-mode .hover-bg-light:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .dark-mode .hover-shadow:hover {
          box-shadow: 0 8px 20px rgba(244, 162, 97, 0.3) !important;
        }
        .min-vh-100 {
          min-height: 100vh;
        }
        .sidebar {
          background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#fff'} !important;
          backdrop-filter: ${darkMode ? 'blur(10px)' : 'none'} !important;
        }
      `}</style>

      <div className="min-vh-100 d-flex">
        {/* Sidebar */}
        <aside className="shadow-sm p-3 sidebar" style={{ width: "250px" }}>
          <div className="d-flex align-items-center mb-4">
            <img
              src="https://images.vexels.com/media/users/3/136060/isolated/preview/431ec8b80e334de114dadfe2a3090c36-graph-bar-chart-icon-by-vexels.png"
              alt="DashLab Analytics Logo"
              className="rounded-circle me-3"
              style={{ width: "50px", height: "50px" }}
            />
            <h1 className="h5 mb-0 fw-bold">DashLab Analytics</h1>
          </div>
          <nav>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="d-flex align-items-center p-2 text-decoration-none rounded hover-bg-light">
                  <FaTachometerAlt className="me-3 text-primary" />
                  <span className="fs-6 fw-medium">Dashboard</span>
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="d-flex align-items-center p-2 text-decoration-none rounded hover-bg-light">
                  <FaPlus className="me-3 text-primary" />
                  <span className="fs-6 fw-medium">Invite a Team</span>
                </a>
              </li>
              <li className="mb-2">
                <button
                  onClick={() => setHelpDropdownOpen(!helpDropdownOpen)}
                  className="d-flex align-items-center w-100 p-2 text-decoration-none rounded hover-bg-light border-0 bg-transparent"
                >
                  <FaQuestionCircle className="me-3 text-primary" />
                  <span className="fs-6 fw-medium">Help</span>
                </button>
                {helpDropdownOpen && (
                  <ul className="list-unstyled ms-4">
                    <li className="mb-2"><a href="#" className="d-block p-2 text-decoration-none rounded hover-bg-light">FAQs</a></li>
                    <li className="mb-2"><a href="#" className="d-block p-2 text-decoration-none rounded hover-bg-light">Contact Support</a></li>
                    <li className="mb-2"><a href="#" className="d-block p-2 text-decoration-none rounded hover-bg-light">User Guide</a></li>
                  </ul>
                )}
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column">
          <header className="shadow-sm p-3 d-flex justify-content-between align-items-center sticky-top">
            <h3 className="h4 mb-0 fw-bold">Welcome to DashLab Analytics</h3>
            <div className="d-flex align-items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className="btn btn-link">
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
              <button onClick={handleImportDataset} className="btn btn-link">
                <FaFileUpload />
              </button>
              <button onClick={() => setShowFeedbackModal(true)} className="btn btn-link" style={{ color: darkMode ? '#f4a261' : '#007bff' }}>
                Feedback
              </button>
              <div className="dropdown">
                <div
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`d-flex align-items-center ${darkMode ? 'text-white' : 'text-black'} cursor-pointer`}
                >
                  <div
                    className={`d-flex align-items-center justify-content-center rounded-circle ${darkMode ? 'bg-dark' : 'bg-primary'}`}
                    style={{ width: "40px", height: "40px", color: '#fff' }}
                  >
                    {userInitial}
                  </div>
                  <span className="ms-2 fs-6 fw-medium">Hi {userFirstName}!</span>
                </div>
                {showUserDropdown && (
                  <div className="dropdown-menu show end-0 mt-2 p-3">
                    <p className="fw-bold">{userEmail}</p>
                    <p className="text-muted small">Last Login: {loginTime}</p>
                    <button onClick={handleSignOut} className="btn btn-primary w-100 d-flex align-items-center justify-content-center">
                      <FaSignOutAlt className="me-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-grow-1 p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex gap-3">
                <button onClick={() => setActiveTab("workspaces")} className="btn btn-primary fw-medium">Workspaces</button>
                <button onClick={() => setActiveTab("recentItems")} className="btn btn-primary fw-medium">Recent Items</button>
              </div>
              <button onClick={handleImportDataset} className="btn btn-primary d-flex align-items-center fw-medium">
                <FaFileUpload className="me-2" />
                Import Dataset
              </button>
            </div>

            {activeTab === "workspaces" && (
              <section className="bg-white bg-opacity-10 backdrop-blur-lg p-4 rounded shadow-lg">
                <div className="mt-3">
                  {workspaces.length === 0 ? (
                    <p className="text-center text-muted fst-italic">No workspaces created yet.</p>
                  ) : (
                    <div className="row g-3">
                      {workspaces.map((workspace) => (
                        <div key={workspace.id} className="col-md-6 col-lg-4" onClick={() => handleViewWorkspace(workspace.id)}>
                          <div className="bg-white bg-opacity-10 backdrop-blur-lg p-3 rounded shadow-sm cursor-pointer hover-shadow">
                            <h4 className="h6 fw-bold">{workspace.name}</h4>
                            <p className="text-muted small">{workspace.description}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(workspace.id); }}
                              className="btn btn-link text-danger p-0"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setShowWorkspaceForm(true)} className="btn btn-primary mt-4 d-flex align-items-center fw-medium">
                  <FaPlus className="me-2" />
                  Add Workspace
                </button>
              </section>
            )}

            {activeTab === "recentItems" && (
              <section className="bg-white bg-opacity-10 backdrop-blur-lg p-4 rounded shadow-lg">
                <p className="text-center text-muted fst-italic">Recent Items functionality to be implemented.</p>
              </section>
            )}

            {showWorkspaceForm && (
              <div className="modal show d-block bg-dark bg-opacity-50">
                <div className="modal-dialog">
                  <div className="modal-content bg-white bg-opacity-10 backdrop-blur-lg rounded shadow-lg">
                    <div className="modal-header">
                      <h5 className="modal-title fw-bold">Create New Workspace</h5>
                      <button type="button" className="btn-close" onClick={() => setShowWorkspaceForm(false)}></button>
                    </div>
                    <div className="modal-body">
                      <input
                        type="text"
                        value={newWorkspace.name}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                        placeholder="Workspace Name"
                        className="form-control mb-3"
                      />
                      <textarea
                        value={newWorkspace.description}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                        placeholder="Workspace Description"
                        className="form-control mb-3"
                        rows="3"
                      />
                    </div>
                    <div className="modal-footer">
                      <button onClick={() => setShowWorkspaceForm(false)} className="btn btn-secondary fw-medium">Cancel</button>
                      <button onClick={handleCreateWorkspace} className="btn btn-primary fw-medium">Save</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {showFeedbackModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog">
              <div className="modal-content bg-white bg-opacity-10 backdrop-blur-lg rounded shadow-lg">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Submit Feedback</h5>
                  <button type="button" className="btn-close" onClick={() => setShowFeedbackModal(false)}></button>
                </div>
                <div className="modal-body">
                  <textarea className="form-control" rows="4" placeholder="Write your feedback here..."></textarea>
                </div>
                <div className="modal-footer">
                  <button onClick={() => setShowFeedbackModal(false)} className="btn btn-secondary fw-medium">Cancel</button>
                  <button onClick={() => { setShowFeedbackModal(false); alert("Feedback submitted!"); }} className="btn btn-primary fw-medium">Submit</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserAccountPage;