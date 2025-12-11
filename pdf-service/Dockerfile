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
    "uuid": "^9.0.0"
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

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 10000;

app.get('/ping', (req, res) => res.json({ status: 'ok' }));

// POST { "docxUrls": ["https://.../a.docx","https://.../b.docx"] }
app.post('/convert', async (req, res) => {
  const docxUrls = req.body.docxUrls;
  if (!Array.isArray(docxUrls) || docxUrls.length === 0) {
    return res.status(400).json({ error: 'Provide docxUrls array' });
  }

  const jobId = uuidv4();
  const workDir = path.join('/tmp', `pdfsvc-${jobId}`);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    const pdfFiles = [];

    // Download each DOCX and convert
    for (let i = 0; i < docxUrls.length; i++) {
      const url = docxUrls[i];
      const docxPath = path.join(workDir, `file-${i}.docx`);

      const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 });
      fs.writeFileSync(docxPath, Buffer.from(resp.data));

      // Convert to PDF using soffice (LibreOffice headless)
      // Output pdf will be named file-<i>.pdf in workDir
      execFileSync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', workDir, docxPath], { timeout: 120000 });

      const pdfPath = path.join(workDir, `file-${i}.pdf`);
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`Conversion failed for ${url}`);
      }
      pdfFiles.push(pdfPath);
    }

    // Merge PDFs
    const merger = new PDFMerger();
    for (const p of pdfFiles) merger.add(p);

    const outPath = path.join(workDir, 'merged.pdf');
    await merger.save(outPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.sendFile(outPath, (err) => {
      // cleanup
      try {
        fs.readdirSync(workDir).forEach(f => fs.unlinkSync(path.join(workDir, f)));
        fs.rmdirSync(workDir);
      } catch (e) {
        console.error('cleanup error', e);
      }
    });
  } catch (err) {
    console.error(err);
    // try cleanup
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
