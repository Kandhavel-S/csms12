const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { readFileAsText } = require('../utils/readFileAsText');
const dotenv = require("dotenv")

dotenv.config()

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.resolve(req.file.path);
    const rawText = await readFileAsText(filePath, req.file.originalname);

    fs.unlinkSync(filePath); // optional: remove temp file

    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

    const prompt = `
Extract the following syllabus data. Respond with ONLY a valid JSON object (no markdown, no explanation):

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
rules:
1)for practical exercise map the content under them until the section next header arrives .
2)the content may not be structure, while passing as json make them structured ,like if it as mutiple point.
3)in the subject field pass the course code while passing the json.
4)while passing as JSON,separate content in course objectives, course outcomes, text books, references, web resources, list of softwares, e-book to separate lines, each new point should start with a new line. Remove any numbering like "1.", "2)", "-", "*", "CO1:", "C02:",etc.
5)if the content is not present in the syllabus, pass it as empty string in json. Don't pass null or undefined. For unit content arrays, pass empty array [] if no content.
6)practical exercise and coding exercise are not same ,so dont treat them as same dont map coding exercises to practical exercises , map it under the section it appears .
7)while passing as json structure every field properly if they are unstructure except for unit contents.
8)dont map coding exercise to practical exercises.
9)IMPORTANT: For unit contents, return an ARRAY of strings where each element is a separate content point/paragraph. Split content by logical points, topics, or subtopics. Each array element should be one complete sentence or topic. Example: ["Introduction to algorithms", "Time complexity analysis", "Sorting algorithms - bubble sort, merge sort"] instead of one long string.
10)if total periods is not present, pass it as theory periods + practical periods.
11) in practical exercises if the content is not structured, structure it as per the guidelines.add numberings to it even if it as subheadings give number as per that.
12) in course outcomes if CO[x] then map it to that field until next CO[x] comes or the next section header comes.
13) for objectives section if there are multiple objectives,map each point until the next point arrives like bulletin or numbering bulletins, similarly do the same for other fields like references,yt_resources,web_resources, list_of_softwares, e_book.
14) When extracting unit content, break it into logical paragraphs or points. Each separate topic, concept, or bullet point should be a separate array element.
15) in the unit content , if there are any bullet points or numbered lists then preserve thier bulleting or numbering in the extracted content. 
TEXT:
${rawText}
`;

    const result = await model.generateContent(prompt);
    const fullResponse = result.response.text();

    // Extract only JSON part using RegExp
    const match = fullResponse.match(/\{[\s\S]*?\}/);
    console.log(fullResponse);
    if (!match) throw new Error('Failed to extract valid JSON from  output');

    const parsed = JSON.parse(match[0]);
    res.status(200).json(parsed);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message || 'Extraction failed.' });
  }

});

module.exports = router;