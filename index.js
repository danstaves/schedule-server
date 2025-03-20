const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, './front_end')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../ai-scheduler/build', 'index.html'));
});

app.post('/api/getSchedule', upload.single("file"), (req, res) => {
    const file = req.file;

    console.log(`Received file: ${file.originalname}`);

    res.sendStatus(200);
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});