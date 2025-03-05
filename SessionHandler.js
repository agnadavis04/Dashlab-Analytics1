import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SessionHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("authToken"); // Remove token
        navigate("/login"); // Redirect to login
      }, 15 * 60 * 1000);// 15 minutes
    };

    // Track user activity
    window.onload = resetTimer;
    window.onmousemove = resetTimer;
    window.onkeydown = resetTimer;
    window.onclick = resetTimer;
    window.onscroll = resetTimer;

    resetTimer(); // Initialize the timer

    return () => clearTimeout(timer); // Cleanup
  }, [navigate]);

  return null; // No UI needed, just runs in background
};

export default SessionHandler;
