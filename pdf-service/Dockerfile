FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install LibreOffice (for headless conversion) and other utilities
RUN apt-get update \
   && apt-get install -y --no-install-recommends \
     libreoffice \
     wget \
     ca-certificates \
     ghostscript \
   && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create package.json at build-time
RUN cat > package.json <<'EOF'
{
  "name": "pdf-service",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "axios": "^1.5.0",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "pdf-merger-js": "^4.2.0",
    "uuid": "^9.0.0",
    "cors": "^2.8.5"
  }
}
EOF

# Create a small server that: fetches docx files (URLs), converts each to PDF using soffice, merges PDFs and returns merged result
RUN cat > server.js <<'EOF'
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const PDFMerger = require('pdf-merger-js');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '200mb' }));

const PORT = process.env.PORT || 10000;

app.get('/ping', (req, res) => res.json({ status: 'ok' }));

// Root route for platform health checks
app.get('/', (req, res) => res.send('ok'));

// Helper: download a URL to disk
async function downloadTo(fileUrl, destPath) {
  const resp = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 120000 });
  fs.writeFileSync(destPath, Buffer.from(resp.data));
}

// Convert any .docx files in `inputs` (paths) to PDFs in workDir and return array of pdf paths
function convertDocxToPdf(inputs, workDir) {
  const pdfs = [];
  for (const inputPath of inputs) {
    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.docx' && ext !== '.doc') continue;
    try {
      execFileSync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', workDir, inputPath], { timeout: 120000 });
      const base = path.basename(inputPath, path.extname(inputPath));
      const pdfPath = path.join(workDir, `${base}.pdf`);
      if (fs.existsSync(pdfPath)) pdfs.push(pdfPath);
    } catch (err) {
      console.error('soffice conversion error:', err && err.message ? err.message : err);
    }
  }
  return pdfs;
}

// Support both JSON body with docxUrls and multipart/form-data file uploads
const upload = multer({ dest: '/tmp/uploads' });

app.post('/convert', upload.array('files'), async (req, res) => {
  const jobId = uuidv4();
  const workDir = path.join('/tmp', `pdfsvc-${jobId}`);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    const inputDocxPaths = [];

    // If files were uploaded via multipart/form-data
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const f of req.files) {
        // move the uploaded file into workDir with its original name
        const origName = f.originalname || path.basename(f.path);
        const dest = path.join(workDir, origName);
        fs.copyFileSync(f.path, dest);
        inputDocxPaths.push(dest);
      }
    }

    // If JSON body contains docxUrls array, download them
    if (req.body && req.body.docxUrls) {
      let urls = req.body.docxUrls;
      if (typeof urls === 'string') {
        try { urls = JSON.parse(urls); } catch {}
      }
      if (Array.isArray(urls)) {
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          const dest = path.join(workDir, `downloaded-${i}.docx`);
          await downloadTo(url, dest);
          inputDocxPaths.push(dest);
        }
      }
    }

    if (inputDocxPaths.length === 0) {
      return res.status(400).json({ error: 'No input DOCX files provided (upload files or provide docxUrls).' });
    }

    // Convert each docx to pdf
    const pdfPaths = convertDocxToPdf(inputDocxPaths, workDir);

    if (pdfPaths.length === 0) {
      throw new Error('No PDFs generated from inputs');
    }

    // Merge PDFs in the order they were provided
    const merger = new PDFMerger();
    for (const p of pdfPaths) merger.add(p);

    const outPath = path.join(workDir, 'merged.pdf');
    await merger.save(outPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.sendFile(outPath, (err) => {
      // best-effort cleanup
      try {
        // remove uploaded tmp files
        if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
        fs.readdirSync(workDir).forEach(f => fs.unlinkSync(path.join(workDir, f)));
        fs.rmdirSync(workDir);
      } catch (e) {
        console.error('cleanup error', e);
      }
    });
  } catch (err) {
    console.error('conversion error:', err && err.message ? err.message : err);
    try { fs.rmdirSync(workDir, { recursive: true }); } catch (e) {}
    res.status(500).json({ error: err.message || 'Conversion failed' });
  }
});

app.listen(PORT, () => {
  console.log(`PDF conversion service listening on port ${PORT}`);
});
EOF

# Install dependencies
RUN npm install --production --no-audit --prefer-offline

EXPOSE 10000

CMD ["node", "server.js"]
