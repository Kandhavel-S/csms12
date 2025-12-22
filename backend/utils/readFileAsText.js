const fs = require('fs/promises');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const path = require('path');
const unzipper = require('unzipper');

async function readFileAsText(filePath, originalName) {
  const ext = path.extname(originalName || '').toLowerCase();

  if (!ext) {
    throw new Error('File extension not found');
  }

  if (ext === '.docx') {
    // Primary extraction using mammoth
    let mammothText = '';
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      mammothText = result?.value || '';

      if (mammothText && mammothText.trim().length > 20) {
        console.log(`readFileAsText: extracted ${mammothText.length} chars with mammoth for ${originalName}`);
        console.log('readFileAsText preview:', mammothText.substring(0, 500));
        return mammothText;
      }
    } catch (mErr) {
      console.warn('mammoth.extractRawText error:', mErr && mErr.message ? mErr.message : mErr);

      // If mammoth specifically threw a 'not implemented' error, try docx-parser fallback
      if (mErr && /not implemented/i.test(String(mErr.message || ''))) {
        console.log('mammoth reported "not implemented" — attempting docx-parser fallback');
        try {
          let docxParser;
          try {
            docxParser = require('docx-parser');
          } catch (e) {
            throw new Error('docx-parser module not installed');
          }

          // docx-parser may export a function or an object with parseDocx
          if (typeof docxParser === 'function') {
            mammothText = await new Promise((resolve, reject) => {
              try {
                docxParser(filePath, (data) => resolve(String(data || '')));
              } catch (err) {
                reject(err);
              }
            });
          } else if (typeof docxParser.parseDocx === 'function') {
            mammothText = await new Promise((resolve, reject) => {
              try {
                docxParser.parseDocx(filePath, (data) => resolve(String(data || '')));
              } catch (err) {
                reject(err);
              }
            });
          } else {
            throw new Error('docx-parser API not recognized');
          }

          if (mammothText && mammothText.trim().length > 0) {
            console.log(`readFileAsText: extracted ${mammothText.length} chars with docx-parser for ${originalName}`);
            console.log('readFileAsText preview (docx-parser):', mammothText.substring(0, 500));
            return mammothText;
          }
        } catch (dpErr) {
          console.warn('docx-parser fallback failed:', dpErr && dpErr.message ? dpErr.message : dpErr);
          // fallthrough to other fallback mechanisms below
        }
      }
      // if mammoth error wasn't 'not implemented', continue to other fallback below
    }

    // Fallback: unzip the DOCX and extract <w:t> text from word/document.xml
    try {
      const buffer = await fs.readFile(filePath);
      const zip = await unzipper.Open.buffer(buffer);
      const docFile = zip.files.find(f => f.path === 'word/document.xml');
      if (docFile) {
        const docXml = await docFile.buffer();
        const xmlText = docXml.toString('utf8');

        console.log(`readFileAsText: mammoth returned ${mammothText.length} chars; attempting fallback XML extraction for ${originalName}`);
        console.log('readFileAsText: document.xml preview:', xmlText.substring(0, 1000));

        // Collect all text within <w:t>...</w:t>
        const tMatches = [...xmlText.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)];
        const parts = tMatches.map(m => m[1]);

        // Join preserving line breaks for paragraph-like tags
        const extracted = parts.join(' ')
          .replace(/\s+\n/g, '\n')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (extracted && extracted.length > 0) {
          console.log(`readFileAsText: extracted ${extracted.length} chars from document.xml for ${originalName}`);
          console.log('readFileAsText preview (fallback):', extracted.substring(0, 500));
          return extracted;
        }
      }
    } catch (e) {
      // fallback failure -- continue to final error
      console.warn('Fallback DOCX extraction failed:', e.message || e);
    }

    // If everything failed, return mammoth output (even if short) so caller can log it
    return mammothText;
  }

  if (ext === '.pdf') {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.txt') {
    return await fs.readFile(filePath, 'utf8');
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

module.exports = { readFileAsText };
