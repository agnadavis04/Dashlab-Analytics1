import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Ensure AOS is installed via npm install aos

function HomePage() {
  React.useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div>
      <style>{`
        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #2f2f2f 0%, #4a4a4a 100%);
          color: #fff;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        .header {
          background: rgba(184, 177, 177, 0.31);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 1rem 2rem;
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .navbar-brand img {
          width: 100px;
          margin-right: 0.5rem;
        }
        .navbar-brand span {
          font-weight: 600;
          color: #fff;
          font-size: 1.5rem;
        }
        .navmenu {
          display: flex;
          align-items: center;
        }
        .navmenu ul {
          list-style: none;
          display: flex;
          margin: 0;
          padding: 0;
          gap: 1.5rem;
        }
        .nav-link {
          color: #fff !important;
          font-weight: 900;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .nav-link:hover {
          color: #f4a261 !important;
        }
        .cta-btn {
          background-color: #f4a261;
          color: #fff;
          padding: 0.75rem 2rem;
          border-radius: 25px;
          text-decoration: none;
          transition: background-color 0.3s ease;
          font-weight: 500;
          margin-left: 1rem;
        }
        .cta-btn:hover {
          background-color: #e07a3e;
        }
        .hero {
          height: 100vh;
          background: url('https://c0.wallpaperflare.com/preview/241/384/859/analysis-analytics-analyzing-annual.jpg') no-repeat center center/cover;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding-top: 80px; /* Offset for fixed header */
        }
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(127, 127, 127, 0.28);
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
          padding: 2rem;
          max-width: 800px;
        }
        .hero-content h2 {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-shadow: 2px 4px 4px rgb(158, 27, 27);
        }
        .hero-content p {
          font-size: 1.25rem;
          color:rgb(242, 242, 242);
          margin-bottom: 2rem;
        }
        .section {
          padding: 5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 3rem;
          text-align: center;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 2rem;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          margin: 0 auto;
          max-width: 500px;
        }
        .glass-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 8px 20px rgba(244, 162, 97, 0.3);
        }
        .feature-icon {
          font-size: 2.5rem;
          color: #f4a261;
          margin-bottom: 1rem;
        }
        .contact-form .form-control {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fff;
          border-radius: 10px;
          margin-bottom: 1rem;
        }
        .contact-form .form-control::placeholder {
          color: #ccc;
        }
        .contact-form .btn {
          background-color: #f4a261;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 25px;
        }
        .contact-form .btn:hover {
          background-color: #e07a3e;
        }
        #preloader {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #2f2f2f;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #preloader::after {
          content: '';
          width: 40px;
          height: 40px;
          border: 4px solid #f4a261;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <header className="header">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src="https://images.vexels.com/media/users/3/136060/isolated/preview/431ec8b80e334de114dadfe2a3090c36-graph-bar-chart-icon-by-vexels.png"
              alt="Dashlab Analytics Logo"
              style={{ width: '40px', marginRight: '0.5rem' }}
            />
            <span>Dashlab Analytics</span>
          </Link>
          <div className="d-flex align-items-center">
            <nav className="navmenu">
              <ul className="d-flex">
                <li><a className="nav-link" href="#hero">Home</a></li>
                <li><a className="nav-link" href="#about">About</a></li>
                <li><a className="nav-link" href="#features">Features</a></li>
                <li><a className="nav-link" href="#contact">Contact</a></li>
              </ul>
            </nav>
            <Link to="/login" className="cta-btn">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Hero Section */}
        <section id="hero" className="hero dark-background">
         <div className="hero-overlay"></div>
         <div className="container d-flex flex-column align-items-center" data-aos="fade-up">
          <h2 style={{ 
           fontSize: '3.5rem', 
           fontWeight: 700, 
           marginBottom: '1rem', 
           color: 'black', 
          textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)' // Stronger shadow for better visibility
        }}>
          DashLab Analytics
         </h2>

        <p style={{ 
          fontSize: '1.25rem', 
          color: 'black', 
          marginBottom: '2rem', 
          textShadow: '1px 1px 4px rgba(0, 0, 0, 0.9)' // Stronger shadow for better visibility
        }}>
         <strong>Transforming data into actionable insights.</strong>  
          </p>
           <div className="d-flex mt-4">
    </div>
  </div>
</section>

        {/* About Section */}
        <section id="about" className="about section">
          <div className="container">
            <div className="row gy-4 align-items-center">
              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
                <h3>About DashLab Analytics</h3>
                <p>
                  Dashlab Analytics is dedicated to transforming raw data into actionable insights. With cutting-edge tools and a passionate team, we empower businesses to make informed decisions that drive growth and innovation.
                </p>
                <p>
                  Our expertise spans data visualization, predictive analytics, and customized solutions tailored to meet unique organizational needs.
                </p>
              </div>
              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="250">
                <div className="glass-card">
                  <p className="fst-italic text-center">
                    Transforming data into success stories.
                  </p>
                  <ul className="list-unstyled text-center">
                    <li><i className="bi bi-check-circle-fill"></i> <span>  Real-time data insights</span></li>
                    <li><i className="bi bi-check-circle-fill"></i> <span>  AI-driven analytics    </span></li>
                    <li><i className="bi bi-check-circle-fill"></i> <span>  Customized reporting   </span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features section">
          <div className="container section-title" data-aos="fade-up">
            <h2>Features</h2>
            <p>Explore Our Capabilities</p>
          </div>
          <div className="container">
            <div className="row gy-4">
              <div className="col-md-6" data-aos="zoom-in" data-aos-delay="200">
                <div className="glass-card">
                  <i className="bi bi-bar-chart feature-icon"></i>
                  <h3>Interactive Dashboards</h3>
                  <p>Create visually engaging dashboards that provide real-time insights.</p>
                </div>
              </div>
              <div className="col-md-6" data-aos="zoom-in" data-aos-delay="300">
                <div className="glass-card">
                  <i className="bi bi-gear feature-icon"></i>
                  <h3>Advanced Analytics</h3>
                  <p>Leverage AI-driven analytics to uncover trends and predict outcomes.</p>
                </div>
              </div>
              <div className="col-md-6" data-aos="zoom-in" data-aos-delay="400">
                <div className="glass-card">
                  <i className="bi bi-file-earmark-text feature-icon"></i>
                  <h3>Customizable Reports</h3>
                  <p>Generate detailed reports tailored to your business objectives.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact section">
          <div className="container section-title" data-aos="fade-up">
            <h2>Contact Us</h2>
            <p>Get in Touch</p>
          </div>
          <div className="container" data-aos="fade-up" data-aos-delay="100">
            <div className="row gy-4">
              <div className="col-lg-6">
                <div className="info-item d-flex flex-column align-items-center" data-aos="fade-up" data-aos-delay="200">
                  <i className="bi bi-geo-alt"></i>
                  <h3>Address</h3>
                  <p>123 Analytics Lane, Tech City, TC 12345</p>
                </div>
                <div className="info-item d-flex flex-column align-items-center" data-aos="fade-up" data-aos-delay="300">
                  <i className="bi bi-envelope"></i>
                  <h3>Email Us</h3>
                  <p><a href="mailto:info@dashlabanalytics.com">info@dashlabanalytics.com</a></p>
                </div>
              </div>
              <div className="col-lg-6">
                <form className="contact-form" data-aos="fade-up" data-aos-delay="400">
                  <div className="row gy-4">
                    <div className="col-md-6">
                      <input type="text" className="form-control" placeholder="Your Name" required />
                    </div>
                    <div className="col-md-6">
                      <input type="email" className="form-control" placeholder="Your Email" required />
                    </div>
                    <div className="col-md-12">
                      <textarea className="form-control" rows="4" placeholder="Message" required></textarea>
                    </div>
                    <div className="col-md-12 text-center">
                      <button type="submit" className="btn">Send Message</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;