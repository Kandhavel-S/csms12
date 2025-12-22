const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const unzipper = require('unzipper');
const { readFileAsText } = require('../utils/readFileAsText');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Temporary debug endpoint: returns extracted text and document.xml preview
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = path.resolve(req.file.path);
    const originalName = req.file.originalname;

    const extracted = await readFileAsText(filePath, originalName);

    // Attempt to read document.xml from the docx as well
    let docXmlPreview = null;
    try {
      const buffer = await fs.readFile(filePath);
      const zip = await unzipper.Open.buffer(buffer);
      const docFile = zip.files.find(f => f.path === 'word/document.xml');
      if (docFile) {
        const docXml = await docFile.buffer();
        const xmlText = docXml.toString('utf8');
        docXmlPreview = xmlText.substring(0, 2000);
      }
    } catch (e) {
      docXmlPreview = `failed to read document.xml: ${e.message || e}`;
    }

    // Clean up temp file
    try { await fs.unlink(filePath); } catch (e) {}

    return res.json({ extractedPreview: extracted.substring(0, 2000), extractedLength: extracted.length, docXmlPreview });
  } catch (err) {
    console.error('debug-extract error:', err);
    return res.status(500).json({ error: err.message || 'debug extraction failed' });
  }
});

module.exports = router;
