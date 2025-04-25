from flask import Flask, render_template, jsonify, send_from_directory, request
import os
import fitz
from flask_cors import CORS
import requests  
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure folders
TEMPLATE_FOLDER = os.path.join(os.path.dirname(__file__), "templates")
STATIC_FOLDER = os.path.join(os.path.dirname(__file__), "static")
UPLOAD_FOLDER = "/tmp" if os.environ.get("VERCEL") else "uploads"

app = Flask(__name__, template_folder=TEMPLATE_FOLDER, static_folder=STATIC_FOLDER)
CORS(app)

# OpenRouter API config
OPENROUTER_API_TOKEN = os.getenv("OPENROUTER_API_TOKEN")
OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL")


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload')
def upload():
    return render_template('upload.html')

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
        filepath = os.path.join(UPLOAD_FOLDER, uploaded_file.filename)
        uploaded_file.save(filepath)
        return jsonify({"status": "success", "filename": uploaded_file.filename})
    
    return jsonify({"status": "error", "message": "Invalid file"}), 400

@app.route('/api/get-ai-comment', methods=['POST'])
def get_ai_comment():
    data = request.json
    page_text = data.get('pageText', '')
    page_number = data.get('pageNumber', 0)
    
    if not page_text:
        return jsonify({"comment": "No text available for analysis"}), 400

    text_to_analyze = page_text[:3000]
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
        result = response.json()

        if response.status_code == 200 and "choices" in result:
            comment = result["choices"][0]["message"]["content"]
        else:
            comment = f"API error (status code: {response.status_code}). Response: {result}"
        
        return jsonify({"comment": comment})
    
    except Exception as e:
        return jsonify({"comment": f"Error connecting to AI service: {str(e)}"}), 500

@app.route('/api/pdf-info', methods=['GET'])
def get_pdf_info():
    info = {
        "appName": "PDF Reader",
        "version": "1.0",
        "capabilities": ["View PDFs", "Search Text", "Bookmark Pages"]
    }
    return jsonify(info)

# Vercel needs this line
handler = app

# Optional for local dev
if __name__ == '__main__':
    app.run(debug=True)
