import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Trash2, Calendar } from "lucide-react"; // Calendar icon
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";

const backgroundImage = "/sample_image.webp";

export default function MedicineReminder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reminders, setReminders] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // Calendar popup state

  useEffect(() => {
    if (location.state?.medicines) {
      const newReminders = location.state.medicines.map((med) => ({
        medicine: med.medicine || "",
        dosage: med.dosage || "",
        frequency: med.frequency || "",
        time: "",
        daysToTake: med.days_to_take || 1,
        purchaseReminder: false,
        imageUrl: "", // Store fetched image URL
      }));
      setReminders(newReminders);
    }
  }, [location.state]);

  useEffect(() => {
    reminders.forEach((reminder, index) => {
      if (reminder.medicine && !reminder.imageUrl) {
        fetchMedicineImage(reminder.medicine, index);
      }
    });
  }, [reminders]);

  const fetchMedicineImage = async (medicineName, index) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1?q=${medicineName}+medicine&searchType=image&key=AIzaSyCJTTu26-KmMVj8Q6AE6VuhvTMJEYSQYec&cx=709c23a6637cc4d62`
      );
      const imageUrl = response.data.items[0]?.link || "";
      setReminders((prev) => {
        const updated = [...prev];
        updated[index].imageUrl = imageUrl;
        return updated;
      });
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  const handleInputChange = (index, field, value) => {
    setReminders((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });

    if (field === "medicine" && value.trim() !== "") {
      fetchMedicineImage(value, index);
    }
  };

  const addReminder = () => {
    setReminders([
      ...reminders,
      { medicine: "", dosage: "", frequency: "", time: "", daysToTake: 1, purchaseReminder: false, imageUrl: "" },
    ]);
  };

  const deleteReminder = (index) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  // Convert reminders to calendar events
  const calendarEvents = reminders
    .filter((reminder) => reminder.medicine && reminder.time)
    .map((reminder, index) => ({
      title: `${reminder.medicine} (${reminder.dosage})`,
      start: new Date(), // Default today (you can modify to actual date selection)
      id: index.toString(),
    }));

  return (
    <motion.div
      className="flex flex-wrap items-center justify-center min-h-screen bg-cover bg-center relative p-2 gap-1"
      style={{ backgroundImage: `url(${backgroundImage})` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 w-full bg-gray-600 text-white text-center py-0.2 text-sm font-serif font-bold shadow-md">
        MedAI
      </div>

      {/* Medicine Reminders Section */}
      <motion.div
        className="bg-white p-4 shadow-lg rounded-lg text-center w-full max-w-[400px] h-auto max-h-[350px] overflow-auto"
        initial={{ scale: 0.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-lg font-bold mb-2">Medicine Reminders</h2>

        {/* Medicine List */}
        {reminders.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {reminders.map((reminder, index) => (
              <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex flex-col w-3/4">
                  <input
                    type="text"
                    value={reminder.medicine}
                    onChange={(e) => handleInputChange(index, "medicine", e.target.value)}
                    placeholder="Medicine Name"
                    className="border p-1 rounded w-full text-sm mb-1"
                  />
                  <input
                    type="text"
                    value={reminder.dosage}
                    onChange={(e) => handleInputChange(index, "dosage", e.target.value)}
                    placeholder="Dosage (e.g., 100mg)"
                    className="border p-1 rounded w-full text-sm mb-1"
                  />
                  <input
                    type="time"
                    value={reminder.time}
                    onChange={(e) => handleInputChange(index, "time", e.target.value)}
                    className="border p-1 rounded w-full text-sm mb-1"
                  />
                </div>

                {/* Medicine Image */}
                {reminder.imageUrl && (
                  <img src={reminder.imageUrl} alt="Medicine" className="w-16 h-16 object-cover rounded-md ml-2" />
                )}

                {/* Delete Button */}
                <button onClick={() => deleteReminder(index)} className="text-red-500 hover:text-red-700 ml-2">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No reminders set.</p>
        )}

        {/* Add Reminder Button */}
        <motion.button
          onClick={addReminder}
          className="mt-3 px-3 py-1 bg-green-500 text-white rounded-lg text-sm shadow-md hover:bg-green-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add Reminder
        </motion.button>
      </motion.div>

      {/* Calendar Icon (Opens Popup) */}
      <button onClick={() => setIsCalendarOpen(true)} className="fixed bottom-5 right-5 bg-blue-500 p-3 rounded-full shadow-md hover:bg-blue-600">
        <Calendar color="white" size={24} />
      </button>

      {/* Calendar Popup */}
      {isCalendarOpen && (
        <motion.div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg w-72">
          <button onClick={() => setIsCalendarOpen(false)} className="absolute top-2 right-2 text-red-500">✖</button>
          <button onClick={() => navigate("/")}>Go Home</button>
          <FullCalendar plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} initialView="dayGridMonth" events={calendarEvents} height={250} />
        </motion.div>
      )}

    </motion.div>
  );
}
