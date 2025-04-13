const fs = require('fs').promises;
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const regex = /[A-Z]{3,4}\s\d{4}(?:,\s\d{4})*(?:\/\d{4})?/g;

// CourseRecord class with met as a boolean
class CourseRecord {
    constructor(met, requirement, course_requirements, term, satisfiedBy, title, attribute, credits, grade, source) {
        // Convert "No" to false, anything else (like "Yes") to true
        this.met = met.trim().toLowerCase().includes("no") ? false : true;
        // this.met = met.trim().toLowerCase() === "yes" ? true : false;
        this.requirement = requirement.trim();
        this.course_requirements = course_requirements;
        this.term = term.trim();
        this.satisfiedBy = satisfiedBy.trim();
        this.title = title.trim();
        this.attribute = attribute.trim();
        this.credits = credits.trim();
        this.grade = grade.trim();
        this.source = source.trim();
    }
}

async function parseDegreeEvaluation(filePath) {

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const dom = new JSDOM(fileContent);
        const doc = dom.window.document;

        const records = [];
        const rows = doc.querySelectorAll('table tr');
        const tables = doc.querySelectorAll('table');

        for (let i = 0; i < rows.length; i++) {

            
            const columns = rows[i].querySelectorAll('td');
            if (columns.length >= 9) {
                const met = columns[0].textContent; // Keep as string initially
                let requirement = columns[1].textContent.replace(/requirement/gi, '').replaceAll(/=\n/g, '');
                const requirements = requirement.match(regex) || [];
                let course_requirements = [];
                requirements.forEach(course => {
                    // Find the prefix
                    const prefixMatch = course.match(/[A-Z]{3,4}/);
                    if (!prefixMatch) return; // Skip sections without a prefix (e.g., "Select one...")
                    const prefix = prefixMatch[0]; // e.g., "CSSE" or "ELEE"

                    // Extract all 4-digit numbers
                    const numbers = course.match(/\d{4}/g);
                    if (!numbers) return; // Skip if no numbers found

                    // Attach prefix to each number
                    numbers.forEach(num => {
                        course_requirements.push(`${prefix} ${num}`);
                    });
                });
                const term = columns[2].textContent.replace(/term/gi, '');;
                const satisfiedBy = columns[3].textContent.replace(/Satisfie=\nd By/gi, '').replaceAll(/=\n/g, '');
                const title = columns[4].textContent.replace(/title/gi, '');
                const attribute = columns[5].textContent.replace(/attribute/gi, '');
                const credits = columns[6].textContent.replace(/credits/gi, '');
                const grade = columns[7].textContent.replace(/grade/gi, '');
                const source = columns[8].textContent.replace(/source/gi, '');

                // Pass the string value to CourseRecord, which will convert it to boolean
                records.push(new CourseRecord(
                    met, requirement, course_requirements, term, satisfiedBy,
                    title, attribute, credits, grade, source
                ));
            }
        }

        // Print table header
        console.log(
            `${"Met".padEnd(8)} ${"Requirement".padEnd(20)} ${"Term".padEnd(10)} ` +
            `${"Satisfied By".padEnd(15)} ${"Title".padEnd(30)} ${"Attribute".padEnd(15)} ` +
            `${"Credits".padEnd(8)} ${"Grade".padEnd(8)} ${"Source".padEnd(10)}`
        );
        console.log('-'.repeat(120));
        const next_courses = records.filter(record => record.met === false);
        // Print table rows (met will display as true/false)
        next_courses.forEach(record => {
            console.log(
                `${String(record.met).padEnd(8)} ${record.requirement.padEnd(20)} ${record.term.padEnd(10)} ` +
                `${record.satisfiedBy.padEnd(15)} ${record.title.padEnd(30)} ${record.attribute.padEnd(15)} ` +
                `${record.credits.padEnd(8)} ${record.grade.padEnd(8)} ${record.source.padEnd(10)}`
            );
        });

        return next_courses

    } catch (error) {
        console.log("Error reading the file: " + error.message);
        console.error(error);
    }
}

module.exports = {
    parseDegreeEvaluation
};