const {parseDegreeEvaluation } = require("./student_eval_parser");
const {getCoursesAsync} = require("./db.js");

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


    task.status = "parsing";
    const requirements = await parseDegreeEvaluation(record.path);

    const requirementOptions = await Promise.all(requirements.map(async requirement=>{
        const schedules = await Promise.all(requirement.course_requirements.map(async c=>{
            const [subject, number]= c.split(" ");
            const sections = await getCoursesAsync(subject, number);
            return {
                subject: subject,
                number: number,
                sections: sections.map(x=>x.id)
            };
        }));
        return {
            requirement: requirement.requirement,
            courses: schedules.filter(x=>x.sections.length > 0)
        }
    }));

    for (req of requirementOptions.filter(x=>x.courses.length > 0)){
        console.log(req);
    }



    task.status = "analyzing";
    await sleep(5000);
    task.status = "scheduling";
    await sleep(5000);
    task.status = "success";
}

module.exports = {
    generateSchedule
}