const {parseDegreeEvaluation } = require("./student_eval_parser");
const {getCoursesAsync} = require("./db.js");
const AISchedule = require("./ASTAR_AI_2.js");

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

    // Parse the uploaded degree record for required courses
    task.status = "parsing";
    const records = await parseDegreeEvaluation(record.path);
    const requirements = records.filter(record => record.met === false);

    // Compare the requirements with the Fall 2025 Course Schedule (DB Lookup)
    task.status = "analyzing";
    const requirementOptions = await Promise.all(requirements.map(async requirement=>{
        const schedules = await Promise.all(requirement.course_requirements.map(async c=>{
            const [subject, number]= c.split(" ");

            // Get the available sections for the course
            const sections = await getCoursesAsync(subject, number);

            // Return the subject, course number, and available sections
            return {
                subject: subject,
                number: number,
                sections: sections
            };
        }));
        return {
            requirement: requirement.requirement,
            courses: schedules.filter(x=>x.sections.length > 0) // Filter out courses with no available sections
        }
    }));

    const availableRequirements = requirementOptions.filter(x=>x.courses.length > 0);


    task.status = "scheduling";
    task.schedule = AISchedule(availableRequirements, numClasses);
    task.status = "success";
}

module.exports = {
    generateSchedule
}