import React, { useState } from "react";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const backgroundImage = "/sample_image.webp";

function UploadPage() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [medicineData, setMedicineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to clean and refine extracted text
  const cleanExtractedText = (text) => {
    if (!text) return "";

    return text
      .replace(/[^\w\s.%/,-]/g, "") // Remove unwanted characters
      .replace(/\s+/g, " ") // Remove extra spaces
      .trim();
  };

  // Function to process medicine data from response
  const processMedicineData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];

    return rawData.map((med) => ({
      medicine: med.medicine ? cleanExtractedText(med.medicine) : "",
      dosage: med.dosage ? cleanExtractedText(med.dosage) : "",
      schedule: med.schedule ? cleanExtractedText(med.schedule) : "",
    }));
  };

  const handleImageCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show image preview
    setImage(URL.createObjectURL(file));

    // Prepare the form data
    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/extract_text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("API Response:", data);

      // Apply cleaning and processing
      setExtractedText(cleanExtractedText(data.extracted_text || "No text extracted."));
      setMedicineData(processMedicineData(data.medicine_data || []));
    } catch (error) {
      console.error("Upload error:", error);
      setExtractedText("Error extracting text. Please try again.");
    }
    setLoading(false);
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

      <div className="bg-white p-4 shadow-lg rounded-lg text-center max-w-xs">
        <h2 className="text-lg font-serif font-bold">Upload Prescription</h2>
        <label className="flex flex-col items-center p-2 border-2 border-dashed cursor-pointer mt-2 rounded-lg">
          <Camera className="h-4 w-6 text-gray-500" />
          <span className="text-gray-500 text-sm mt-1">Capture or Upload Image</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
        </label>

        {image && <img src={image} alt="Prescription" className="mt-2 rounded-lg shadow-md max-w-full h-auto" />}

        {loading && <p className="mt-4 text-blue-500">Extracting text...</p>}

        {extractedText && !loading && (
          <div className="text-output mt-4">
            <h3 className="text-md font-bold">Extracted Text:</h3>
            <p className="text-sm text-gray-600">{extractedText}</p>
          </div>
        )}

        {medicineData.length > 0 && (
          <div className="medicine-list mt-4">
            <h3 className="text-md font-bold">Medicine Data:</h3>
            <ul className="text-sm text-gray-600">
              {medicineData.map((med, index) => (
                <li key={index}>
                  <strong>{med.medicine}</strong>: {med.dosage} ({med.schedule})
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* ✅ Pass extracted medicine data to reminders page */}
        <button
          onClick={() => navigate("/reminders", { state: { medicines: medicineData } })}
          className="mt-1 px-2 py-2 bg-green-500 text-white rounded-lg"
        >
          Set Medicine Reminders
        </button>
      </div>
    </motion.div>
  );
}

export default UploadPage;
