const { parseDegreeEvaluation } = require("./student_eval_parser");
const { getCoursesAsync } = require("./db.js");
const { mergeRecordsWithRequirements } = require("./student_eval_parser");

async function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async function generateSchedule(task) {
  const record = task.file;
  const numClasses = task.numClasses;

  // Parse the uploaded degree record for required courses
  task.status = "parsing";
  const records = await parseDegreeEvaluation(record.path);
  const requirements = records.filter((record) => record.met === false);

  // Compare the requirements with the Fall 2025 Course Schedule (DB Lookup)
  const requirementOptions = await Promise.all(
    requirements.map(async (requirement) => {
      const schedules = await Promise.all(
        requirement.course_requirements.map(async (c) => {
          const [subject, number] = c.split(" ");

          // Get the available sections for the course
          const sections = await getCoursesAsync(subject, number);

          // Return the subject, course number, and available sections
          return {
            subject: subject,
            number: number,
            sections: sections,
          };
        })
      );
      return {
        requirement: requirement.requirement,
        courses: schedules.filter((x) => x.sections.length > 0), // Filter out courses with no available sections
      };
    })
  );

  // Print out the available courses for each requirement
  const availableCourses = [];
  for (req of requirementOptions.filter((x) => x.courses.length > 0)) {
    //Filter out requirements with no available courses
    console.log(req);
    availableCourses.push(req);
  }
  // Send the requirements to the parser to be merged with the records
  const testing = await mergeRecordsWithRequirements(availableCourses, records);

  //AI---------------------------------------------------------------------------------------
  //----------------------------------------------------------------------------------------
  const fs = require("fs");
  const yaml = require("yaml");

  const fileContents = fs.readFileSync("output.yaml", "utf8");
  const courses = yaml.parse(fileContents);

  const allSections = courses.flatMap((req) =>
    req.courses.flatMap((course) =>
      course.sections.map((section) => ({
        ...section,
        heuristic:
          parseInt(section.course_number) + (section.next_pre_requisite || 0),
      }))
    )
  );

  const sortedSections = [...allSections].sort(
    (a, b) => a.heuristic - b.heuristic
  );

  function hasTimeDayConflict(sectionA, sectionB) {
    if (
      !sectionA.start_time ||
      !sectionA.end_time ||
      !sectionB.start_time ||
      !sectionB.end_time
    ) {
      return false;
    }

    const toMinutes = (time) =>
      parseInt(time.substring(0, 2)) * 60 + parseInt(time.substring(2));

    const startA = toMinutes(sectionA.start_time);
    const endA = toMinutes(sectionA.end_time);
    const startB = toMinutes(sectionB.start_time);
    const endB = toMinutes(sectionB.end_time);

    const timeConflict = startA < endB && endA > startB;

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayConflict = days.some((day) => sectionA[day] && sectionB[day]);

    return timeConflict && dayConflict;
  }

  // Select non-conflicting sections (keep lowest heuristic)
  const selectedSections = [];
  for (const section of sortedSections) {
    const conflicts = selectedSections.some((selected) =>
      hasTimeDayConflict(section, selected)
    );
    if (!conflicts) {
      selectedSections.push(section);
      if (selectedSections.length >= 10) break;
    }
  }

  const output = {
    AvailableCourses: selectedSections.slice(0, 10),
    Schedule: sortedSections.slice(0, 10),
  };

  const jsonOutput = JSON.stringify(output, null, 2);

  fs.writeFileSync("output.json", jsonOutput);

  console.log("Top 10 courses exported to output.json");
  console.log(jsonOutput);

  console.log("=== All Courses (Sorted by Heuristic) ===");
  sortedSections
    .slice(0, 10)
    .forEach((s) =>
      console.log(`${s.course_title} | Heuristic: ${s.heuristic}`)
    );

  console.log("\n=== Non-Conflicting Schedule ===");
  selectedSections
    .slice(0, 10)
    .forEach((s) =>
      console.log(
        `${s.course_title} ${s.course_number} | Heuristic: ${s.heuristic}`
      )
    );

  task.status = "analyzing";
  await sleep(5000);
  task.status = "scheduling";
  await sleep(5000);
  task.status = "success";
}

module.exports = {
  generateSchedule,
};
