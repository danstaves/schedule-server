const {parseDegreeEvaluation } = require("./student_eval_parser");

async function sleep(ms){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

async function generateSchedule(task){
    const record = task.file;
    const numClasses = task.numClasses;


    console.log(`Generating schedule for ${record.originalname} with ${numClasses} classes`);
    task.status = "parsing";
    const nextCourses = await parseDegreeEvaluation(record.path);

    console.log(nextCourses)


    task.status = "analyzing";
    await sleep(5000);
    task.status = "scheduling";
    await sleep(5000);
    task.status = "success";
}

module.exports = {
    generateSchedule
}