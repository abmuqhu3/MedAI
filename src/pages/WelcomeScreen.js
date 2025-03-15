import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const backgroundImage = "/sample_image.webp";

function WelcomeScreen() {
  const navigate = useNavigate();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleDragEnd = (event, info) => {
    // If dragged past 120px (threshold), confirm and navigate
    if (info.point.x >= 120) {
      setIsConfirmed(true);
      setTimeout(() => navigate("/register"), 500); // Delay for effect
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 w-full bg-gray-800 text-white text-center py-0.2 text-sm font-serif font-semibold shadow-md">
        MedAI
      </div>

      {/* Main Card */}
      <motion.div
        className="bg-white p-1 shadow-lg rounded-lg text-center max-w-sm"
        initial={{ scale: 0.1 }}
        animate={{ scale: 0.9 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl font-bold">Welcome to MedAI</h1>
        <p className="text-gray-600 mt-1">Your AI-powered medicine assistant</p>

        {/* Slide-to-Continue Button */}
        <div className="flex justify-center items-center w-full mt-0.1">
        <div className="relative w-40 h-10 bg-gray-300 rounded-full mt-4 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-blue-500"
            animate={{ width: isConfirmed ? "100%" : "0%" }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute top-1 left-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer"
            drag="x"
            dragConstraints={{ left: 0, right: 120 }}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 1.1 }}
          >
            ➜
          </motion.div>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default WelcomeScreen;
