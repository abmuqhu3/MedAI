import React, { useState, useEffect } from "react";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebase";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const backgroundImage = "/sample_image.webp";

function RegisterPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "normal" });
      window.recaptchaVerifier.render();
    }
  }, []);

  const sendOtp = async () => {
    if (phone.length === 10) {
      try {
        const formattedPhone = `+91${phone}`;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
        setConfirmationResult(confirmation);
        setOtpSent(true);
        alert("OTP sent successfully!");
      } catch (error) {
        alert("Failed to send OTP!");
      }
    } else {
      alert("Please enter a valid phone number!");
    }
  };

  const verifyOtp = async () => {
    if (!confirmationResult) {
      alert("OTP verification failed. Try resending OTP.");
      return;
    }
    try {
      await confirmationResult.confirm(otp);
      alert("OTP verified successfully!");
      navigate("/upload");
    } catch (error) {
      alert("Invalid OTP! Try again.");
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
      <div className="absolute top-0 left-0 w-full bg-gray-800 text-white text-center py-0.2 text-sm font-serif font-bold shadow-md">
        MedAI
      </div>

      <div className="bg-white p-5 shadow-md rounded-md text-center max-w-xs">
        <h2 className="text-lg font-bold">User Registration</h2>

        <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          id="phone-input"
          type="tel"
          placeholder="Enter your number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className="w-full border p-2 rounded-md mt-2"
        />

        {!otpSent && <div id="recaptcha-container" className="mt-2"></div>}

        {!otpSent ? (
          <button onClick={sendOtp} className="w-full bg-blue-500 text-white py-2 mt-2 rounded-md">
            Send OTP
          </button>
        ) : (
          <>
            <label htmlFor="otp-input" className="block text-sm font-medium text-gray-700 mt-2">
              OTP
            </label>
            <input
              id="otp-input"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full border p-2 mt-2 rounded-md"
            />
            <button onClick={verifyOtp} className="w-full bg-green-500 text-white py-2 mt-4 rounded-md">
              Verify OTP
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default RegisterPage;
