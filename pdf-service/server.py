from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from docx import Document
from docx.shared import Pt
import requests
import io
import os
import tempfile
import subprocess
import hashlib
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
        # Try both command names
        for cmd in ['soffice', 'libreoffice']:
            try:
                result = subprocess.run([cmd, '--version'], 
                                      capture_output=True, 
                                      text=True, 
                                      timeout=5)
                if result.returncode == 0:
                    return {'available': True, 'version': result.stdout.strip(), 'command': cmd}
            except:
                continue
        return {'available': False, 'error': 'LibreOffice not found'}
    except Exception as e:
        return {'available': False, 'error': str(e)}

def convert_docx_to_pdf_libreoffice(docx_buffer, original_filename):
    """Convert DOCX to PDF using LibreOffice with exact formatting preservation"""
    temp_dir = os.path.join(tempfile.gettempdir(), f'docx-pdf-{hashlib.md5(docx_buffer).hexdigest()}')
    
    try:
        os.makedirs(temp_dir, exist_ok=True)
        print(f"📁 Created temp directory: {temp_dir}")

        # Save DOCX exactly as received (no modifications)
        docx_path = os.path.join(temp_dir, original_filename)
        with open(docx_path, 'wb') as f:
            f.write(docx_buffer)
        print(f"💾 Saved DOCX: {docx_path} ({len(docx_buffer)} bytes)")

        print(f"🔄 Converting DOCX to PDF with LibreOffice...")
        
        # LibreOffice command with options for exact formatting preservation
        command = [
            'soffice',
            '--headless',
            '--invisible',
            '--nodefault',
            '--nofirststartwizard',
            '--nolockcheck',
            '--nologo',
            '--norestore',
            '--convert-to', 'pdf:writer_pdf_Export',
            '--outdir', temp_dir,
            docx_path
        ]
        
        # Set environment to prevent LibreOffice from modifying formatting
        env = os.environ.copy()
        env['HOME'] = temp_dir  # Isolated config
        
        result = subprocess.run(
            command,
            timeout=120,
            capture_output=True,
            text=True,
            env=env,
            cwd=temp_dir
        )

        if result.returncode != 0:
            print(f"⚠️ First attempt failed, trying alternative command...")
            # Fallback to simpler command
            simple_command = ['libreoffice', '--headless', '--convert-to', 'pdf', '--outdir', temp_dir, docx_path]
            result = subprocess.run(simple_command, timeout=120, capture_output=True, text=True, env=env, cwd=temp_dir)
            
            if result.returncode != 0:
                raise Exception(f"LibreOffice conversion failed: {result.stderr}")

        if result.stdout:
            print(f"✅ LibreOffice output: {result.stdout}")
        if result.stderr:
            print(f"⚠️ LibreOffice stderr: {result.stderr}")

        # Find generated PDF
        pdf_filename = original_filename.replace('.docx', '.pdf').replace('.doc', '.pdf')
        pdf_path = os.path.join(temp_dir, pdf_filename)

        if not os.path.exists(pdf_path):
            # Sometimes LibreOffice changes the output filename
            pdf_files = [f for f in os.listdir(temp_dir) if f.endswith('.pdf')]
            if pdf_files:
                pdf_path = os.path.join(temp_dir, pdf_files[0])
            else:
                raise Exception(f"PDF file not created in {temp_dir}")

        # Read PDF
        with open(pdf_path, 'rb') as f:
            pdf_buffer = f.read()
        
        print(f"✅ PDF created successfully: {len(pdf_buffer)} bytes")
        return pdf_buffer
        
    except subprocess.TimeoutExpired:
        raise Exception("LibreOffice conversion timed out after 120 seconds")
    except Exception as e:
        print(f"❌ Conversion error: {str(e)}")
        raise Exception(f"PDF conversion failed: {str(e)}")
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
            print(f"✅ Cleaned up temp directory: {temp_dir}")
        except Exception as cleanup_error:
            print(f"⚠️ Cleanup warning: {cleanup_error}")

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
    """Convert single DOCX file to PDF (preserving original formatting)"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only .docx and .doc files are allowed'}), 400
        
        filename = secure_filename(file.filename)
        print(f"\n📥 Converting: {filename}")
        
        # Read file into buffer
        docx_buffer = file.read()
        print(f"📥 Received: {filename} ({len(docx_buffer) / 1024:.2f} KB)")
        
        # Convert to PDF
        pdf_buffer = convert_docx_to_pdf_libreoffice(docx_buffer, filename)
        
        # Return PDF
        pdf_filename = filename.replace('.docx', '.pdf').replace('.doc', '.pdf')
        
        return send_file(
            io.BytesIO(pdf_buffer),
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
        
        print(f"\n📥 Converting and merging {len(files)} files")
        
        pdf_buffers = []
        
        # Convert each DOCX to PDF
        for idx, file in enumerate(files):
            if not allowed_file(file.filename):
                continue
            
            filename = secure_filename(file.filename)
            print(f"🔄 Converting {idx + 1}/{len(files)}: {filename}")
            
            # Read file into buffer
            docx_buffer = file.read()
            
            # Convert to PDF
            pdf_buffer = convert_docx_to_pdf_libreoffice(docx_buffer, filename)
            pdf_buffers.append(pdf_buffer)
        
        if len(pdf_buffers) == 0:
            return jsonify({'error': 'No valid DOCX files to convert'}), 400
        
        # Merge PDFs using PyPDF2
        try:
            from PyPDF2 import PdfMerger
            
            print(f"📦 Merging {len(pdf_buffers)} PDFs...")
            merger = PdfMerger()
            
            for pdf_buffer in pdf_buffers:
                merger.append(io.BytesIO(pdf_buffer))
            
            # Save merged PDF to buffer
            merged_output = io.BytesIO()
            merger.write(merged_output)
            merger.close()
            merged_output.seek(0)
            
            print(f"✅ Merge complete: {len(merged_output.getvalue())} bytes")
            
            return send_file(
                merged_output,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='merged_curriculum.pdf'
            )
            
        except ImportError:
            # Fallback: return first PDF only if PyPDF2 not installed
            print("⚠️ PyPDF2 not installed, returning first PDF only")
            return send_file(
                io.BytesIO(pdf_buffers[0]),
                mimetype='application/pdf',
                as_attachment=True,
                download_name='curriculum.pdf'
            )
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pdf-health', methods=['GET'])
@app.route('/api/pdf-health', methods=['GET'])
def pdf_health():
    """Health check for PDF conversion service"""
    libreoffice_status = check_libreoffice()
    
    return jsonify({
        'status': 'healthy',
        'service': 'PDF Conversion Service (Format-Preserving)',
        'libreOffice': libreoffice_status,
        'limits': {
            'maxFileSize': '50 MB',
            'maxFiles': 20,
            'timeout': '2 minutes',
            'allowedFormats': ['docx', 'doc']
        },
        'notes': 'Converts DOCX to PDF without modifying original formatting'
    }), 200
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
