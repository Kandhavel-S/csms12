const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { readFileAsText } = require('../utils/readFileAsText');
const dotenv = require("dotenv")

dotenv.config()

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.resolve(req.file.path);
    const rawText = await readFileAsText(filePath, req.file.originalname);

    console.log('Raw text extracted:', rawText.substring(0, 500)); // Log first 500 chars

    fs.unlinkSync(filePath); // optional: remove temp file

    const prompt = `
Extract the following syllabus data. Respond with ONLY a valid JSON object (no markdown, no explanation). Ensure all strings are properly JSON-escaped, with quotes inside strings escaped as \\".

{
  "title": "",
  "subject": "",
  "objectives": "",
  "courseDescription": "",
  "prerequisites": "",
  "unit1Name": "", "unit1Hours": "", "unit1Content": [],
  "unit2Name": "", "unit2Hours": "", "unit2Content": [],
  "unit3Name": "", "unit3Hours": "", "unit3Content": [],
  "unit4Name": "", "unit4Hours": "", "unit4Content": [],
  "unit5Name": "", "unit5Hours": "", "unit5Content": [],
  "theoryPeriods": "", "practicalExercises": "", "practicalPeriods": "", "totalPeriods": "",
  "courseFormat": "", "assessments": "",
  "courseOutcomes" : "",
  "textBooks": "", "references": "",
  "ytResources": "", "webResources": "", "listOfSoftwares": "", "eBook": "",
  "L": "", "T": "", "P": "", "C": ""
}
RULES (STRICT):

1) Practical Exercises:
Map ONLY the content explicitly under a "Practical Exercises" section.
Include all content until the next section header appears.
Do NOT include coding exercises under this field.

2) Coding Exercises:
Coding exercises are NOT practical exercises.
DO NOT map coding exercises under "practicalExercises".
Each coding exercise MUST be mapped under the unit section where it appears (usually unitXContent).

3) Subject Field:
In the "subject" field, pass ONLY the course code.

4) Structuring Content (Non-Unit Sections):
If content is unstructured, structure it logically.
For objectives, course outcomes, textbooks, references, web resources, YouTube resources, software lists, and e-books:
Each point must be on a new line.
Remove all numbering and prefixes such as CO1, 1., 1), -, *.
Preserve the original wording of each point.

5) Missing Content:
If any section is not present, return an empty string "".
For unit content arrays, return an empty array [] if no content exists.
Do NOT return null or undefined.

6) Unit Content Formatting:
unitXContent MUST be an array of strings.
Each array element must represent one complete logical unit, which can be a topic, a subheading, or a paragraph.
Preserve all original subheadings exactly as they appear, including capitalization and punctuation.
Subheadings MUST appear as their own separate array elements.
Content belonging to a subheading must appear in subsequent array elements until the next subheading or unit header.
Preserve original bulleting or numbering inside unit content if present.
Do NOT split comma-separated topics or '-' into separate array elements.
Do NOT remove, reword, summarize, or lose any words.
every bulleted or numbered point must be preserved exactly as it appears like '1.','a.','i.' and should be on the new line and even the spaces should be preserved exactly.

7) Line Break Handling (Unit Content):
Split unit content into multiple array elements ONLY when there is a clear line break and the content represents a new logical point or subheading.
Do NOT split complete sentences arbitrarily.

8) Course Outcomes:
Map each CO[x] until the next CO[x] or a new section header appears.
Remove all CO labels and numbering in the final output.
Preserve the full textual meaning of each outcome.

9) Objectives and Similar Sections:
Treat each bullet or numbered point as a separate logical line.dont need to preserve the bulletins like 1. or the other type of bulletins.
Apply the same rule consistently to references, web resources, YouTube resources, software lists, and e-books.

10) Period Calculations:
Map theoryPeriods and practicalPeriods ONLY IF they are explicitly written as "Theory Periods" or "Practical Periods" in the syllabus text.
DO NOT infer theoryPeriods or practicalPeriods from L, T, P, or C.
If totalPeriods is not explicitly present, calculate it as theoryPeriods + practicalPeriods.

11) L, T, P, C Isolation Rule:
Extract L, T, P, and C values ONLY into their respective fields.
These values MUST NOT be reused, inferred, or mapped to any other field.
LTPC these values are one after another 

12) Practical Exercises Formatting:
If practical exercises content is unstructured, structure it clearly.
everything under the practical exercises header should be extracted 
every point must be on a new line.
if there are subheadings, preserve them exactly as they appear.
if there are bullet points or numbering, preserve them exactly as they appear.

13) No Extra Sections:
Do NOT invent, infer, or create new sections.
Map all content strictly to the fields defined in the schema only.

14) Integrity Rule:
Recover all syllabus content exactly as provided.
No omissions.
No rewording.
No summarization.

15) course title:
it will be in between the course code and the lecture tutorial practical credit pattern

16) theoryPeriods and practicalPeriods and totalPeriods:
 if theoryperiods and total periods are equal to each other then dont need to fill theoryPeriods field.
 if any of these fields are 0 then leave the field empty.

 17)unit name :
 dont map unit name as "Unit - I" or "Unit I" just map the actual name of the unit
 dont map unit name inside the unit content array
 unit name will be between the unit-[x] and unit-[x]hours
TEXT:
${rawText}
`;

    let response;
    try {
      response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'user', content: prompt }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
    } catch (apiErr) {
      // axios-level error (network, 4xx/5xx)
      console.error('OpenRouter API request failed:', apiErr.message);
      if (apiErr.response) {
        console.error('OpenRouter response status:', apiErr.response.status, apiErr.response.statusText);
        try {
          const preview = JSON.stringify(apiErr.response.data).slice(0, 2000);
          console.error('OpenRouter response data preview:', preview);
        } catch (e) {
          console.error('OpenRouter response data (non-serializable)');
        }
      }
      throw new Error('OpenRouter API request failed: ' + (apiErr.message || 'unknown'));
    }

    // Log basic response metadata to help diagnose 'not implemented' responses
    try {
      console.log('OpenRouter response status:', response.status, response.statusText);
      console.log('OpenRouter response headers preview:', JSON.stringify(response.headers || {}).slice(0, 1000));
      const dataPreview = typeof response.data === 'string' ? response.data.slice(0, 2000) : JSON.stringify(response.data).slice(0, 2000);
      console.log('OpenRouter response data preview:', dataPreview);
    } catch (e) {
      console.warn('Failed to log OpenRouter response metadata:', e.message || e);
    }

    // If the API returned a plain text/HTML saying 'Not Implemented' or similar, surface it
    if (response && response.data && typeof response.data === 'string') {
      const lower = response.data.toLowerCase();
      if (lower.includes('not implemented') || lower.includes('not implemented.')) {
        throw new Error('Extraction API returned: ' + response.data.slice(0, 2000));
      }
    }

    // Basic sanity checks for API response
    if (!response || !response.data) {
      throw new Error('Empty response from extraction API');
    }

    if (!response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
      // include API returned payload to help debugging
      const payloadPreview = JSON.stringify(response.data).slice(0, 1000);
      throw new Error('No choices returned from extraction API: ' + payloadPreview);
    }

    const fullResponse = response.data.choices[0].message?.content || '';
    console.log('API response:', fullResponse);

    // Extract only JSON part using RegExp - take the last valid JSON if multiple
    const matches = fullResponse.match(/\{[\s\S]*?\}/g);
    if (!matches || matches.length === 0) {
      // If the model returned an error-like string such as "not implemented", include it
      const preview = fullResponse.slice(0, 1000);
      throw new Error('Failed to extract valid JSON from output. Raw model output: ' + preview);
    }

    const jsonString = matches[matches.length - 1]; // Take the last match
    console.log('Using JSON:', jsonString.substring(0, 200) + '...');

    const parsed = JSON.parse(jsonString);
    res.status(200).json(parsed);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message || 'Extraction failed.' });
  }

});

module.exports = router;