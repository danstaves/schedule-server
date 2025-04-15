const fs = require("fs");

function AISchedule(requirements, numClasses){
	const requirementCourses = requirements.flatMap((req, index)=>{
		return req.courses.flatMap(course=>{
			const courseNum = parseInt(course.sections[0].course_number);
			const numPostReqs = course.sections[0].next_pre_requisite??0;

			return {...course, reqId:index, rank: courseNum - numPostReqs};
		})
	});

	const sortedCourses = requirementCourses.sort((a, b) => a.rank - b.rank);

	const chosenSections = [];

	for (section of sortedCourses.flatMap(x=>x.sections)){
		if (chosenSections.length >= numClasses){
			break;
		}

		let conflicts = false;
		for (chosen of chosenSections){
			if (!chosenSections.some(c=>c.course_number === section.course_number && c.subject === section.subject)){
				if (hasTimeDayConflict(section, chosen)){
					conflicts = true;
					break;
				}
			} else{
				conflicts = true;
				break;
			}
		}
		if (!conflicts){
			chosenSections.push(section);
		}
	}

	return {AvailableCourses:sortedCourses, Schedule:chosenSections};
}

module.exports = AISchedule;


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