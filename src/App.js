import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomeScreen from "./pages/WelcomeScreen";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";
import MedicineReminder from "./pages/MedicineReminder";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/reminders" element={<MedicineReminder />} />
      </Routes>
    </Router>
  );
}

export default App;
