from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from docx import Document
from docx.shared import Pt
import requests
import io
import os
import tempfile
import subprocess
from pathlib import Path
from werkzeug.utils import secure_filename
import shutil

app = Flask(__name__)
CORS(app)

# PDF Conversion Configuration
ALLOWED_EXTENSIONS = {'docx', 'doc'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def check_libreoffice():
    """Check if LibreOffice is installed"""
    try:
        result = subprocess.run(['libreoffice', '--version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=5)
        return {'available': True, 'version': result.stdout.strip()}
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception) as e:
        return {'available': False, 'error': str(e)}

def convert_docx_to_pdf_libreoffice(docx_path, output_dir):
    """Convert DOCX to PDF using LibreOffice headless mode"""
    try:
        print(f"🔄 Converting: {docx_path}")
        
        # Run LibreOffice conversion
        cmd = [
            'libreoffice',
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            output_dir,
            docx_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,  # 2 minutes timeout
            check=True
        )
        
        if result.stderr:
            print(f"⚠️ LibreOffice stderr: {result.stderr}")
        if result.stdout:
            print(f"✅ LibreOffice stdout: {result.stdout}")
        
        # Find the generated PDF
        pdf_filename = Path(docx_path).stem + '.pdf'
        pdf_path = os.path.join(output_dir, pdf_filename)
        
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not created at {pdf_path}")
        
        print(f"✅ PDF created: {pdf_path}")
        return pdf_path
        
    except subprocess.CalledProcessError as e:
        print(f"❌ LibreOffice error: {e.stderr}")
        raise Exception(f"LibreOffice conversion failed: {e.stderr}")
    except Exception as e:
        print(f"❌ Conversion error: {str(e)}")
        raise

@app.route('/ping', methods=['GET', 'HEAD'])
def ping():
    return jsonify({"status": "ok"}), 200

@app.route('/merge-first-syllabus', methods=['POST'])
def merge_first_syllabus():
    data = request.json
    title = data['title']
    syllabus_url = data['syllabusUrl']
    
    # Fetch the syllabus file from the provided URL
    response = requests.get(syllabus_url)
    if not response.ok:
        return {"error": f"Failed to fetch syllabus: {response.status_code}"}, 500
    
    syllabus_bytes = response.content
    
    # Load the syllabus document
    doc = Document(io.BytesIO(syllabus_bytes))
    
    # Insert a new paragraph at the very beginning
    first_paragraph = doc.paragraphs[0]
    # Create a new paragraph before the first one
    new_paragraph = first_paragraph.insert_paragraph_before(title)
    new_paragraph.runs[0].font.name = 'Cambria'
    new_paragraph.runs[0].font.size = Pt(11)
    new_paragraph.runs[0].font.bold=True  # Slightly larger to look like a title
    
    # Save the modified document to a buffer
    merged_buffer = io.BytesIO()
    doc.save(merged_buffer)
    merged_buffer.seek(0)
    
    # Return the modified file
    return send_file(
        merged_buffer,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        as_attachment=True,
        download_name='merged.docx'
    )

@app.route('/api/convert-docx-to-pdf', methods=['POST'])
def convert_docx_to_pdf():
    """Convert single DOCX file to PDF"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only .docx and .doc files are allowed'}), 400
        
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save uploaded file
            filename = secure_filename(file.filename)
            docx_path = os.path.join(temp_dir, filename)
            file.save(docx_path)
            
            print(f"📥 Received: {filename} ({os.path.getsize(docx_path) / 1024:.2f} KB)")
            
            # Convert to PDF
            pdf_path = convert_docx_to_pdf_libreoffice(docx_path, temp_dir)
            
            # Read PDF and return
            pdf_filename = filename.rsplit('.', 1)[0] + '.pdf'
            
            return send_file(
                pdf_path,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=pdf_filename
            )
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/convert-merge-pdfs', methods=['POST'])
def convert_merge_pdfs():
    """Convert multiple DOCX files to PDF and merge them"""
    try:
        # Check if files are present
        if 'files' not in request.files:
            return jsonify({'error': 'No files uploaded'}), 400
        
        files = request.files.getlist('files')
        
        if len(files) == 0:
            return jsonify({'error': 'No files selected'}), 400
        
        print(f"📥 Received {len(files)} files for conversion and merging")
        
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_paths = []
            
            # Convert each DOCX to PDF
            for idx, file in enumerate(files):
                if not allowed_file(file.filename):
                    continue
                
                filename = secure_filename(file.filename)
                docx_path = os.path.join(temp_dir, f"{idx}_{filename}")
                file.save(docx_path)
                
                print(f"🔄 Converting {idx + 1}/{len(files)}: {filename}")
                
                # Convert to PDF
                pdf_path = convert_docx_to_pdf_libreoffice(docx_path, temp_dir)
                pdf_paths.append(pdf_path)
            
            if len(pdf_paths) == 0:
                return jsonify({'error': 'No valid DOCX files to convert'}), 400
            
            # Merge PDFs using PyPDF2
            try:
                from PyPDF2 import PdfMerger
                
                print(f"📦 Merging {len(pdf_paths)} PDFs...")
                merger = PdfMerger()
                
                for pdf_path in pdf_paths:
                    merger.append(pdf_path)
                
                # Save merged PDF
                merged_pdf_path = os.path.join(temp_dir, 'merged_curriculum.pdf')
                merger.write(merged_pdf_path)
                merger.close()
                
                print(f"✅ Merged PDF created: {merged_pdf_path}")
                
                return send_file(
                    merged_pdf_path,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name='merged_curriculum.pdf'
                )
                
            except ImportError:
                # Fallback: return first PDF only if PyPDF2 not installed
                print("⚠️ PyPDF2 not installed, returning first PDF only")
                return send_file(
                    pdf_paths[0],
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name='curriculum.pdf'
                )
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pdf-health', methods=['GET'])
def pdf_health():
    """Health check for PDF conversion service"""
    libreoffice_status = check_libreoffice()
    
    return jsonify({
        'status': 'healthy',
        'service': 'PDF Conversion Service',
        'libreOffice': libreoffice_status,
        'limits': {
            'maxFileSize': '50 MB',
            'maxFiles': 20,
            'timeout': '2 minutes',
            'allowedFormats': ['docx', 'doc']
        }
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
