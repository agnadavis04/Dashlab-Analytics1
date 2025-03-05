import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserPlus, FaGoogle, FaLinkedin } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';

function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // ✅ Email Validation
  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  // ✅ Password Validation (at least 6 chars, uppercase, lowercase, number, special char)
  const isValidPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(password);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous error
    setSuccess(""); // Clear previous success

    // **Frontend Validation Before Submitting**
    if (!isValidEmail(email)) {
      setError("Invalid email format.");
      return;
    }

    if (!isValidPassword(password)) {
      setError("Password must be at least 6 characters long and include uppercase, lowercase, a number, and a special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/signup", {
        email,
        password,
      });

      if (response.status === 201) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000); // Redirect after 2 seconds
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError(
        error.response?.data?.message ||
        "An error occurred while creating your account. Please try again."
      );
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'linear-gradient(135deg, #2f2f2f 0%, #4a4a4a 100%)', color: '#fff' }}>
      <header className="header position-fixed w-100" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 1000 }}>
        <div className="container-fluid d-flex justify-content-between align-items-center py-2">
          <a className="navbar-brand d-flex align-items-center text-decoration-none" href="/">
            <img
              src="https://images.vexels.com/media/users/3/136060/isolated/preview/431ec8b80e334de114dadfe2a3090c36-graph-bar-chart-icon-by-vexels.png"
              alt="DashLab Analytics Logo"
              style={{ width: '40px', marginRight: '0.5rem' }}
            />
            <span style={{ fontWeight: 600, color: '#fff', fontSize: '1.5rem' }}>DashLab Analytics</span>
          </a>
          <a href="/login" className="btn btn-outline-light rounded-pill">Get Started</a>
        </div>
      </header>

      <div className="signup-container d-flex align-items-center justify-content-center flex-grow-1">
        <div className="row w-100 g-0" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="col-md-6 p-0" style={{ background: `url('https://kabstech.com/wp-content/uploads/2021/04/Mobile-login-1-1.png') no-repeat center center/cover`, height: '100vh', backgroundSize: 'cover' }}>
            {/* Left side: Professional image for Sign Up */}
          </div>
          <div className="col-md-6 d-flex align-items-center justify-content-center p-4" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <form className="signup-form p-4 bg-dark bg-opacity-10 rounded-3 shadow-lg" style={{ maxWidth: '400px', width: '100%', color: '#fff' }} onSubmit={handleSignUp} autoComplete="off">
              <div className="form-icons mb-3 d-flex align-items-center justify-content-center" style={{ color: '#f4a261' }}>
                <FaUserPlus size={40} />
              </div>
              <h2 className="form-header text-center mb-3" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Sign Up</h2>

              {error && <div className="message p-2 mb-3 bg-danger bg-opacity-30 text-white rounded" style={{ border: '2px solid #f5c6cb', fontSize: '1.1rem', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>{error}</div>}
              {success && <div className="message p-2 mb-3 bg-success bg-opacity-30 text-white rounded" style={{ border: '2px solid #c3e6cb', fontSize: '1.1rem', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>{success}</div>}

              <div className="mb-3">
                <input
                  type="email"
                  name="email_field"
                  className="form-control bg-dark bg-opacity-10 text-white border-0"
                  style={{ padding: '1rem', fontSize: '1rem', borderRadius: '8px' }}
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="new-email"
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
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  name="confirm_password_field"
                  className="form-control bg-dark bg-opacity-10 text-white border-0"
                  style={{ padding: '1rem', fontSize: '1rem', borderRadius: '8px' }}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 mb-3" style={{ backgroundColor: '#f4a261', border: 'none', fontSize: '1.2rem', padding: '0.8rem', borderRadius: '8px', transition: 'background 0.3s ease' }}>
                Sign Up
              </button>

              <div className="text-center mb-3">
                <p className="mb-2" style={{ fontSize: '1rem', color: '#e0e0e0' }}>Or sign up using:</p>
                <div className="d-flex justify-content-center gap-3">
                  <button className="btn p-2" style={{ color: '#f4a261', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.3s ease' }} onClick={() => window.location.href = "http://localhost:5000/api/auth/google"}>
                    <FaGoogle size={24} />
                  </button>
                  <button className="btn p-2" style={{ color: '#f4a261', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.3s ease' }} onClick={() => window.location.href = "http://localhost:5000/api/auth/linkedin"}>
                    <FaLinkedin size={24} />
                  </button>
                </div>
              </div>

              <div className="text-center" style={{ fontSize: '0.9rem' }}>
                <a href="#" onClick={() => navigate("/login")} className="text-warning text-decoration-none">Already have an account? Log in</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;