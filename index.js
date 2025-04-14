const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {Mutex} = require('async-mutex');
const ai = require('./ai.js');
const db = require('./db.js');

const m = new Mutex();
let taskNum = 1000;


app.use(express.static(path.join(__dirname, './front_end')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../ai-scheduler/build', 'index.html'));
});

const taskDictionary = {};

class Task{
    constructor(taskId, asyncFunc, file, numClasses){
        this.file = file;
        this.numClasses = numClasses;
        this.taskId = taskId;
        this.func = asyncFunc;
        this.status = "";
        this.message = "";
        this.schedule=[];
    }

    async begin(){
        this.promise = this.func(this);
    }
}

const testRecordPath = path.join(__dirname, "Degree evaluation record 5.mhtml");
const testRecord = {
    path: testRecordPath,
    originalname: "Degree evaluation record 5.mhtml"
};
const testTask = new Task(1, ai.generateSchedule, testRecord, 4);
testTask.begin();


app.post('/api/getSchedule', upload.single("file"), async (req, res) => {
    const file = req.file;
    const numClasses = req.body.numClasses;

    console.log(`Received Data: ${file.originalname}, Num Classes: ${numClasses}`);

    const release = await m.acquire();
    let task = new Task(++taskNum, ai.generateSchedule, file, numClasses);
    release();

    task.begin();

    taskDictionary[taskNum] = task;

    res.redirect("/api/getSchedule/" + taskNum);
});
app.get('/api/getSchedule/:taskid', (req, res) => {
    console.log(`Received request for task: ${req.params.taskid}`);
    let task = taskDictionary[req.params.taskid];
    res.send({status:task.status, message:task.message, schedule:task.schedule});
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});