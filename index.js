const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const ai = require('./ai.js');
const db = require('./db.js');


app.use(express.static(path.join(__dirname, './front_end')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../ai-scheduler/build', 'index.html'));
});

console.log(db.getCourses("MTH", 4270));

const taskDictionary = {};

class Task{
    constructor(taskId, asyncFunc){
        this.taskId = taskId;
        this.func = asyncFunc;
        this.status = "";
        this.message = "";
    }

    async begin(){
        this.promise = this.func(this);
    }
}

app.post('/api/getSchedule', upload.single("file"), (req, res) => {
    const file = req.file;

    console.log(`Received file: ${file.originalname}`);

    let taskId = Math.floor(Math.random()*1000);

    let task = new Task(taskId, ai.generateSchedule);
    task.begin();

    taskDictionary[taskId] = task;

    res.redirect("/api/getSchedule/" + taskId);
});
app.get('/api/getSchedule/:taskid', (req, res) => {
    console.log(`Received request for task: ${req.params.taskid}`);
    let task = taskDictionary[req.params.taskid];
    res.send({status:task.status, message:task.message});
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});