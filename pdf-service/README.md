# PDF Conversion Service

A dedicated microservice for converting DOCX files to PDF using LibreOffice headless mode.

## Features

- 🔄 Convert single DOCX files to PDF
- 📦 Convert and merge multiple DOCX files into one PDF
- 🎨 Preserves formatting, tables, Tamil fonts, and merged cells
- ⚡ LibreOffice headless for high-quality conversion
- 🔒 File validation and size limits (50MB per file)

## API Endpoints

### 1. Health Check
```http
GET /api/pdf-health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "PDF Conversion Service",
  "libreOffice": {
    "available": true,
    "version": "LibreOffice 7.x"
  },
  "limits": {
    "maxFileSize": "50 MB",
    "maxFiles": 20,
    "timeout": "2 minutes",
    "allowedFormats": ["docx", "doc"]
  }
}
```

### 2. Convert Single DOCX to PDF
```http
POST /api/convert-docx-to-pdf
Content-Type: multipart/form-data
```

**Request:**
- `file`: DOCX file (multipart/form-data)

**Response:**
- PDF file download

### 3. Convert & Merge Multiple DOCX to PDF
```http
POST /api/convert-merge-pdfs
Content-Type: multipart/form-data
```

**Request:**
- `files`: Array of DOCX files (multipart/form-data)

**Response:**
- Merged PDF file download (`merged_curriculum.pdf`)

## Deployment on Render

### Prerequisites
- GitHub repository
- Render account

### Steps

1. **Push to GitHub:**
   ```bash
   git add pdf-service/
   git commit -m "Add PDF conversion microservice"
   git push origin main
   ```

2. **Create New Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Configure:
     - **Name:** `csms-pdf-service` (or your choice)
     - **Environment:** Docker
     - **Branch:** main
     - **Root Directory:** `pdf-service` ← **IMPORTANT**
     - **Region:** Choose nearest to you
     - **Instance Type:** Free

3. **No Environment Variables Needed:**
   - Render automatically provides `PORT` variable
   - Dockerfile is already configured to use `$PORT`

4. **Deploy:**
   - Click **Create Web Service**
   - Wait 5-10 minutes for LibreOffice installation
   - Service will be available at: `https://your-service-name.onrender.com`

5. **Test the Service:**
   ```bash
   # Health check
   curl https://your-service-name.onrender.com/api/pdf-health
   
   # Convert DOCX to PDF
   curl -X POST https://your-service-name.onrender.com/api/convert-docx-to-pdf \
     -F "file=@curriculum.docx" \
     -o output.pdf
   ```

## Local Development

### Using Docker
```bash
cd pdf-service
docker build -t pdf-service .
docker run -p 10000:10000 -e PORT=10000 pdf-service
```

### Using Python
```bash
cd pdf-service
pip install -r requirements.txt
python server.py
```

Service runs on `http://localhost:5001`

## Technical Stack

- **Python:** 3.11-slim
- **Flask:** 3.0.0
- **LibreOffice:** Headless mode for conversion
- **PyPDF2:** 3.0.1 for merging PDFs
- **Gunicorn:** 21.2.0 WSGI server
- **Docker:** Multi-stage build (~300MB image)

## Fonts Included

- Liberation (Microsoft Office compatible)
- Noto (Unicode support)
- Noto CJK (Chinese, Japanese, Korean)
- Noto Color Emoji
- DejaVu
- Tamil fonts for regional support

## Troubleshooting

### Port Binding Issues
- Render assigns `PORT` dynamically (usually 10000)
- Dockerfile uses `$PORT` environment variable
- No manual configuration needed

### Build Failures
- Check Dockerfile syntax
- Verify `requirements.txt` has all dependencies
- Ensure root directory is set to `pdf-service` in Render

### Conversion Timeouts
- Default timeout: 120 seconds per file
- Adjust `--timeout` in Dockerfile CMD if needed
- Free tier may have slower builds

### LibreOffice Not Found
- Docker image includes LibreOffice installation
- Check build logs for apt-get errors
- Verify base image is `python:3.11-slim`

## Frontend Integration

Update your Next.js frontend to use the deployed service:

```typescript
const API_URL = 'https://your-service-name.onrender.com';

// Convert single file
const response = await fetch(`${API_URL}/api/convert-docx-to-pdf`, {
  method: 'POST',
  body: formData,
});

// Convert and merge multiple files
const response = await fetch(`${API_URL}/api/convert-merge-pdfs`, {
  method: 'POST',
  body: formData,
});
```

## Limits

- **Max file size:** 50 MB per file
- **Max files:** 20 files per merge request
- **Timeout:** 2 minutes per conversion
- **Formats:** .docx, .doc only

## License

This service is part of the CSMS (Curriculum and Syllabus Management System) project.
