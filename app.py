from flask import Flask, render_template, jsonify, send_from_directory, request
import os
import fitz
from flask_cors import CORS
import requests  # For API calls
from openai import OpenAI

UPLOAD_FOLDER = 'uploads'

app = Flask(__name__)
CORS(app)

# OpenRouter API configuration
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
# Load the OpenRouter API token from a separate file
TOKEN_FILE = 'openrouter_token.txt'
if not os.path.exists(TOKEN_FILE):
    raise FileNotFoundError(f"Token file {TOKEN_FILE} not found. Please create it and add your token.")

with open(TOKEN_FILE, 'r') as file:
    OPENROUTER_API_TOKEN = file.read().strip()

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"







@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload')
def upload():
    return render_template('upload.html')

@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    return send_from_directory('uploads', filename)

@app.route('/uploads/<filename>')
def serve_pdf(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/viewer/<filename>')
def view_pdf(filename):
    return render_template('viewer.html', filename=filename)

@app.route('/api/pdf-text/<filename>')
def get_pdf_text(filename):
    path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404
    
    text = ""
    with fitz.open(path) as doc:
        for page in doc:
            text += page.get_text()
    
    return jsonify({"filename": filename, "text": text})

@app.route('/api/upload', methods=['POST'])
def upload_pdf():
    uploaded_file = request.files.get('pdf')
    if uploaded_file and uploaded_file.filename.endswith('.pdf'):
        filepath = os.path.join('uploads', uploaded_file.filename)
        uploaded_file.save(filepath)
        return jsonify({"status": "success", "filename": uploaded_file.filename})
    
    print("Request.files:", request.files)
    print("Received file:", uploaded_file)
    return jsonify({"status": "error", "message": "Invalid file"}), 400


@app.route('/api/get-ai-comment', methods=['POST'])
def get_ai_comment():
    data = request.json
    page_text = data.get('pageText', '')
    page_number = data.get('pageNumber', 0)
    
    if not page_text:
        return jsonify({"comment": "No text available for analysis"}), 400

    text_to_analyze = page_text[:3000]  # Limit to 3000 characters
    prompt = f"Please provide a brief, helpful summary of the following text from page {page_number} of a PDF document:\n\n{text_to_analyze}"
    
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_TOKEN}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "meta-llama/llama-4-maverick:free",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 250,
            "temperature": 0.7
        }
        
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
        
        # Debug output: print status code and response text
        print("Status code:", response.status_code)
        print("Response text:", response.text)
        
        # Attempt to parse the JSON response, but catch issues if it's not valid JSON
        try:
            result = response.json()
        except Exception as json_err:
            return jsonify({"comment": f"Error parsing JSON: {str(json_err)}. Response content: {response.text}"}), 500

        if response.status_code == 200:
            if "choices" in result and len(result["choices"]) > 0:
                comment = result["choices"][0]["message"]["content"]
            else:
                comment = str(result)
        else:
            comment = f"API error (status code: {response.status_code}). Response: {result}"
        
        return jsonify({"comment": comment})
    
    except Exception as e:
        print(f"Error with OpenRouter API: {str(e)}")
        return jsonify({"comment": "Error connecting to AI service. Please try again later."}), 500


@app.route('/api/pdf-info', methods=['GET'])
def get_pdf_info():
    # Placeholder API endpoint for future functionality
    info = {
        "appName": "PDF Reader",
        "version": "1.0",
        "capabilities": ["View PDFs", "Search Text", "Bookmark Pages"]
    }
    return jsonify(info)

if __name__ == '__main__':
    app.run(debug=True)
