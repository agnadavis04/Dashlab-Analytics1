import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Email Validation
  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  // ✅ Password Validation (at least 6 chars, uppercase, lowercase, number, special char)
  const isValidPassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(password);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    // Validate email
    if (!isValidEmail(email)) {
      setMessage("❌ Invalid email format.");
      setIsLoading(false);
      return;
    }

    // Check if user exists in the database
    try {
      console.log("Checking if user exists with email:", email);
      const verifyResponse = await axios.get("http://localhost:5000/api/check-user", {
        params: { email },
      });

      console.log("User check response:", verifyResponse.data, verifyResponse.status);
      if (verifyResponse.status === 200) {
        // User exists, proceed with password reset
        if (!newPassword || !confirmPassword) {
          setMessage("❌ Please enter a new password and confirm it.");
          setIsLoading(false);
          return;
        }

        // Validate new password
        if (!isValidPassword(newPassword)) {
          setMessage("❌ Password must be at least 6 characters long and include uppercase, lowercase, a number, and a special character.");
          setIsLoading(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setMessage("❌ Passwords do not match.");
          setIsLoading(false);
          return;
        }

        // Update password in the database
        console.log("Attempting to reset password for email:", email);
        const updateResponse = await axios.post("http://localhost:5000/api/reset-password", {
          email,
          newPassword,
        });

        console.log("Password reset response:", updateResponse.data, updateResponse.status);
        if (updateResponse.status === 200) {
          setMessage("✅ Password reset successfully! You can now log in with your new password.");
          setTimeout(() => navigate("/login"), 2000); // Redirect to login after success
        }
      }
    } catch (error) {
      console.error("Password reset error:", error.response?.data?.message || error);
      if (error.response?.status === 404) {
        setMessage("❌ Successful.");
      } else {
        setMessage("❌ An error occurred while resetting your password. Please try again.");
      }
    } finally {
      setIsLoading(false);
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

      <div className="login-container d-flex align-items-center justify-content-center flex-grow-1">
        <div className="row w-100 g-0" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="col-md-6 p-0" style={{ background: `url('https://th.bing.com/th/id/R.b6252eb025c2d1ce4803524d7c0cf215?rik=QPev791tlw0APw&riu=http%3a%2f%2fkabstech.com%2fwp-content%2fuploads%2f2021%2f04%2f3778874-1-1024x1000.png&ehk=wVM1eN8e7qLhu9qsXHTmToeRUBnIQAD%2fghDKcJ0xoic%3d&risl=&pid=ImgRaw&r=0') no-repeat center center/cover`, height: '100vh', backgroundSize: 'cover' }}>
            {/* Left side: Professional image for Forgot Password */}
          </div>
          <div className="col-md-6 d-flex align-items-center justify-content-center p-4" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <form className="login-form p-4 bg-dark bg-opacity-10 rounded-3 shadow-lg" style={{ maxWidth: '400px', width: '100%', color: '#fff' }} onSubmit={handlePasswordReset} autoComplete="off">
              <div className="form-icons mb-3 d-flex align-items-center justify-content-center" style={{ color: '#f4a261' }}>
                <FaUser size={40} />
              </div>
              <h2 className="form-header text-center mb-3" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Reset Password</h2>

              {message && (
                <div className={`message p-2 mb-3 rounded ${message.includes("✅") ? 'bg-success bg-opacity-30 text-white' : 'bg-danger bg-opacity-30 text-danger'}`} style={{ border: '2px solid', borderColor: message.includes("✅") ? '#c3e6cb' : '#f5c6cb', fontSize: '1.1rem', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>
                  {message}
                </div>
              )}

              <div className="mb-3">
                <input
                  type="email"
                  name="email_field"
                  className="form-control bg-dark bg-opacity-10 text-white border-0"
                  style={{ padding: '1rem', fontSize: '1rem', borderRadius: '8px' }}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  name="new_password_field"
                  className="form-control bg-dark bg-opacity-10 text-white border-0"
                  style={{ padding: '1rem', fontSize: '1rem', borderRadius: '8px' }}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  name="confirm_password_field"
                  className="form-control bg-dark bg-opacity-10 text-white border-0"
                  style={{ padding: '1rem', fontSize: '1rem', borderRadius: '8px' }}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 mb-3" style={{ backgroundColor: '#f4a261', border: 'none', fontSize: '1.2rem', padding: '0.8rem', borderRadius: '8px', transition: 'background 0.3s ease' }} disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-center" style={{ fontSize: '0.9rem' }}>
                <a href="#" onClick={() => navigate("/login")} className="text-warning text-decoration-none">Back to Login</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;