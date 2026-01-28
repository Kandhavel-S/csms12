const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('node:http');
const userRoutes = require('./routes/auth');
const syllabusRoute = require('./routes/extract-syllabus');
const debugExtractRoute = require('./routes/debug-extract');


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', userRoutes);
app.use('/extract-syllabus', syllabusRoute);
app.use('/debug-extract', debugExtractRoute);

app.head("/ping", (req, res) => {
  res.status(200).end();
});

app.get('/',(req,res)=>{
  res.send('Backend server is running');
});

const server = http.createServer(app);

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected Successfully');
  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
} catch (err) {
  console.error(err);
}
