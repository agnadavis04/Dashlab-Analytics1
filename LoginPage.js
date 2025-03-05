import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaGoogle, FaLinkedin } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const emailInputRef = useRef(null); // Ref for the email input field

  // ✅ Clear email input field on component mount
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.value = ""; // Explicitly clear the input field
    }
    setEmail(""); // Clear the email state
  }, []);

  // ✅ Check if token exists and is valid before redirecting
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);

    if (token) {
      axios
        .get("http://localhost:5000/api/validate-token", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          console.log("Token validation success:", response.data);
          navigate("/useraccount"); // ✅ Redirect only if token is valid
        })
        .catch((error) => {
          console.error("Token validation error:", error);
          localStorage.removeItem("token"); // ❌ Remove invalid token
        });
    }
  }, [navigate]);

  // ✅ Email Validation
  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  // ✅ Password Length Validation
  const isValidPassword = (password) => password.length >= 6;

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (!isValidEmail(email)) {
      setMessage("❌ Invalid email format.");
      setIsLoading(false);
      return;
    }

    if (!isValidPassword(password)) {
      setMessage("❌ Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting login with email:", email);
      const response = await axios.post("http://localhost:5000/api/login", { email, password });

      if (response.status === 200) {
        console.log("Login successful, token received:", response.data.token);
        localStorage.setItem("token", response.data.token); // ✅ Store token
        setMessage("✅ Login successful! Redirecting...");

        // Extract the initial from the email
        const userInitial = email.charAt(0).toUpperCase();

        // Navigate to the UserAccountPage and pass the initial, email, and login time
        setTimeout(() => {
          console.log("Redirecting to /useraccount...");
          navigate("/useraccount", {
            state: {
              userInitial,
              email, // Pass the actual email used to log in
              createdAt: new Date().toLocaleString(), // Add login time
            },
          });
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error.response?.data?.message || error);
      setMessage(error.response?.data?.message || "❌ Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Redirecting to Google OAuth...");
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleLinkedInLogin = () => {
    console.log("Redirecting to LinkedIn OAuth...");
    window.location.href = "http://localhost:5000/api/auth/linkedin";
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'linear-gradient(135deg, #2f2f2f 0%, #4a4a4a 100%)', color: '#fff' }}>
      <header className="header position-fixed w-100" style={{ background: 'rgba(255, 255, 255, 0)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 1000 }}>
        <div className="container-fluid d-flex justify-content-between align-items-center py-2">
          <a className="navbar-brand d-flex align-items-center text-decoration-none" href="/">
            <img
              src="https://images.vexels.com/media/users/3/136060/isolated/preview/431ec8b80e334de114dadfe2a3090c36-graph-bar-chart-icon-by-vexels.png"
              alt="DashLab Analytics Logo"
              style={{ width: '40px', marginRight: '0.5rem' }}
            />
            <span style={{ fontWeight: 600, color: '#fff', fontSize: '1.5rem' }}>DashLab Analytics</span>
          </a>
        </div>
      </header>

      <div className="login-container d-flex align-items-center justify-content-center flex-grow-1">
        <div className="row w-100 g-0" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="col-md-6 p-0" style={{ background: `url('https://www.leelija.com/images/main/welcome-back-login-banner.webp') no-repeat center center/cover`, height: '100vh', backgroundSize: 'cover' }}>
            {/* Left side: Professional image for Login */}
          </div>
          <div className="col-md-6 d-flex align-items-center justify-content-center p-4" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <form className="login-form p-4 bg-dark bg-opacity-10 rounded-3 shadow-lg" style={{ maxWidth: '400px', width: '100%', color: '#fff' }} onSubmit={handleLogin} autoComplete="off">
              <div className="form-icons mb-3 d-flex align-items-center justify-content-center" style={{ color: '#f4a261' }}>
                <FaUser size={40} />
              </div>
              <h2 className="form-header text-center mb-3" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Log In</h2>

              {message && (
                <div className={`message p-2 mb-3 rounded text-center ${message.includes("✅") ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'}`} style={{ 
                  border: '1px solid', 
                  borderColor: message.includes("✅") ? '#c3e6cb' : '#f5c6cb',
                  color: message.includes("✅") ? '#d4edda' : '#f8d7da',
                  fontWeight: 'bold'
                }}>
                  {message}
                </div>
              )}

              <div className="mb-3">
                <input
                  type="email"
                  name="email_field"
                  className="form-control bg-dark bg-opacity-10 text-white border-0"
                  style={{ padding: '1rem', fontSize: '1rem', borderRadius: '8px' }}
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  ref={emailInputRef} // Attach the ref to the email input field
                  autoComplete="new-email" // Disable autofill
                  required
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  name="password_field"
                  className="form-control bg-dark bg-opacity-10 text-white border-0"
                  style={{ padding: '1rem', fontSize: '1rem', borderRadius: '8px' }}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password" // Disable autofill
                  required
                />
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="rememberMe" />
                  <label className="form-check-label text-white" htmlFor="rememberMe">Remember me</label>
                </div>
                <a href="#" onClick={() => navigate("/forgot-password")} className="text-warning text-decoration-none">Forgot Password?</a>
              </div>
              <button type="submit" className="btn btn-primary w-100 mb-3" style={{ backgroundColor: '#f4a261', border: 'none', fontSize: '1.2rem', padding: '0.8rem', borderRadius: '8px', transition: 'background 0.3s ease' }} disabled={isLoading}>
                {isLoading ? "Logging in..." : "Log In"}
              </button>

              <div className="text-center mb-3">
                <p className="mb-2" style={{ fontSize: '1rem', color: '#e0e0e0' }}>Or sign in using:</p>
                <div className="d-flex justify-content-center gap-3">
                  <button onClick={handleGoogleLogin} className="btn p-2" style={{ color: '#f4a261', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.3s ease' }} type="button">
                    <FaGoogle size={24} />
                  </button>
                  <button onClick={handleLinkedInLogin} className="btn p-2" style={{ color: '#f4a261', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.3s ease' }} type="button">
                    <FaLinkedin size={24} />
                  </button>
                </div>
              </div>

              <div className="text-center" style={{ fontSize: '0.9rem' }}>
                <a href="#" onClick={() => navigate("/signup")} className="text-warning text-decoration-none">Don't have an account? Sign up</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;