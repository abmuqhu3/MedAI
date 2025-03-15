print("🚀 Starting Flask server...")

from flask import Flask, request, jsonify
import os
import cv2
import numpy as np
import re
import io
import requests
from google.cloud import vision
from google.oauth2 import service_account
from flask_cors import CORS
from dotenv import load_dotenv

# 🔹 Load environment variables from .env file
# Explicitly specify the .env file location (optional, if it's not in the same directory)
dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path)

# 🔹 Load Google Credentials from environment variable (Render)
GOOGLE_CREDENTIALS_JSON = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")

if GOOGLE_CREDENTIALS_JSON:
    credentials_path = "/tmp/google-credentials.json"
    with open(credentials_path, "w") as f:
        f.write(GOOGLE_CREDENTIALS_JSON)  # Save the JSON string as a temp file
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
else:
    raise FileNotFoundError("❌ ERROR: Google Credentials JSON not found in environment variables.")

credentials = service_account.Credentials.from_service_account_file(credentials_path)
vision_client = vision.ImageAnnotatorClient(credentials=credentials)


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Enable CORS for React frontend

@app.route('/')
def home():
    return "✅ Flask Server is Running!"

def preprocess_image(image):
    """Preprocess image before OCR (grayscale, denoising, thresholding)."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    sharpen_kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])  # Sharpening
    sharpened = cv2.filter2D(gray, -1, sharpen_kernel)
    thresh = cv2.adaptiveThreshold(sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    kernel = np.ones((1, 1), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)
    return cleaned

def extract_text_google_vision(image_bytes):
    """Extracts text from an image using Google Vision OCR."""
    try:
        image = vision.Image(content=image_bytes)
        response = vision_client.text_detection(image=image)
        texts = response.text_annotations
        if not texts:
            print("⚠️ Google Vision OCR returned no text.")
            return None
        extracted_text = texts[0].description  # Full text extraction
        print("\n📜 DEBUG: Extracted Text:\n", extracted_text)  # Debugging output
        return extracted_text
    except Exception as e:
        print(f"❌ ERROR: Google Vision API Failed: {e}")
        return None

def extract_medicine_data_fixed(text):
    """Extract structured medicine details from OCR output."""
    medicines = []
    lines = text.split("\n")
    
    print("\n🔍 DEBUG: Extracted Lines Before Processing:")
    for line in lines:
        print(f"> {line.strip()}")  # Strip spaces and print each line
    
    merged_lines = []
    current_entry = ""

    for line in lines:
        line = line.strip()
        if line == "":
            continue
        if re.match(r"^\d+\)", line):  # If line starts with a number like "1)"
            if current_entry:
                merged_lines.append(current_entry.strip())  # Save previous entry
            current_entry = line  # Start a new entry
        else:
            current_entry += " " + line  # Append to the current entry

    if current_entry:
        merged_lines.append(current_entry.strip())  # Save the last entry

    print("\n🔍 DEBUG: Merged Medicine Lines:")
    for line in merged_lines:
        print(f"> {line}")

    for line in merged_lines:
        match = re.match(r"(\d+)\)\s*([\w\s\-]+)\s+([\d\.]+[mgMlG]*)\s*(.*)", line, re.IGNORECASE)
        if match:
            _, name, dosage, frequency = match.groups()
            name = name.strip() if name else "Unknown"
            dosage = dosage.strip() if dosage else "Unknown"
            frequency_match = re.findall(r"(once|twice|thrice|daily|\d+)", frequency.lower())
            frequency = " ".join(frequency_match) if frequency_match else "Unknown"
            medicines.append({
                "medicine": name,
                "dosage": dosage,
                "frequency": frequency,
            })
        else:
            print(f"❌ No match for line: {line}")

    structured_medicines = []
    for med in medicines:
        freq_text = med["frequency"].lower()
        numeric_freq = re.findall(r"\d+", freq_text)
        numeric_freq = int(numeric_freq[0]) if numeric_freq else None

        if "once" in freq_text:
            tablets_per_day = 1
        elif "twice" in freq_text:
            tablets_per_day = 2
        elif "thrice" in freq_text:
            tablets_per_day = 3
        elif numeric_freq:
            tablets_per_day = numeric_freq
        else:
            tablets_per_day = 1  # Default assumption

        days_to_take = numeric_freq // tablets_per_day if numeric_freq else 1

        structured_medicines.append({
            "medicine": med["medicine"],
            "dosage": med["dosage"],
            "frequency": med["frequency"],
            "days_to_take": days_to_take,
            "schedule": f"{days_to_take} days"
        })

    return structured_medicines

@app.route('/extract_text', methods=['POST'])
def extract_text():
    """API endpoint to process image and return extracted medicine data."""
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    image_bytes = file.read()

    image_array = np.asarray(bytearray(image_bytes), dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        return jsonify({"error": "Invalid image file"}), 400

    processed_image = preprocess_image(image)
    _, encoded_image = cv2.imencode(".jpg", processed_image)
    image_bytes = encoded_image.tobytes()

    extracted_text = extract_text_google_vision(image_bytes)
    print("\n📜 DEBUG: Extracted Text from OCR:\n", extracted_text)

    structured_data = extract_medicine_data_fixed(extracted_text)
    if not structured_data:
        print("❌ No structured medicine data found!")

    return jsonify({"medicine_data": structured_data})

@app.route('/get_medicine_image', methods=['GET'])
def get_medicine_image():
    """Fetch medicine image from Google Custom Search API."""
    medicine_name = request.args.get("name")
    if not medicine_name:
        return jsonify({"error": "Medicine name is required"}), 400

    search_url = f"https://www.googleapis.com/customsearch/v1?q={medicine_name}+medicine&searchType=image&num=1&key={GOOGLE_CUSTOM_SEARCH_API_KEY}&cx={SEARCH_ENGINE_ID}"

    try:
        response = requests.get(search_url).json()
        if "items" in response:
            image_url = response["items"][0]["link"]
            return jsonify({"image_url": image_url})
        return jsonify({"error": "No image found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Render provides $PORT
    app.run(host="0.0.0.0", port=port, debug=True)

