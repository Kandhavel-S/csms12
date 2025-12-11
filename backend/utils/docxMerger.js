// Utility wrapper to merge multiple .docx buffers into one
// Uses the `docx-merger` package which is already a dependency in backend/package.json
const DocxMerger = require('docx-merger');

async function mergeDocuments(buffers) {
  try {
    const merger = new DocxMerger();
    // docx-merger accepts an array of buffers
    await merger.merge(buffers);
    const mergedBuffer = await merger.save();
    return mergedBuffer;
  } catch (err) {
    console.error('mergeDocuments error:', err);
    throw err;
  }
}

module.exports = { mergeDocuments };
