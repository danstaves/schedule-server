const sqlite = require('sqlite3').verbose();


const db = new sqlite.Database('fall2025.db', (err) => {
    if (err) console.log("Error with database", err);
    else console.log("Connected to Database");
});

function getCoursesAsync(subject, number){
    return new Promise((resolve, reject) => {
        db.all(`SELECT * from dt_AllCourses where subject='${subject}' and course_number='${number}'`, (err,rows)=>{
            if (err){
                console.log(err);
                reject(err);
            }else{
                resolve(rows);
            }
        });
    });
}


function getCourses(subject, number){
    db.serialize(()=>{
        db.each(`SELECT * from dt_AllCourses where subject='${subject}' and course_number='${number}'`, (err,row)=>{
            if (err){
                console.log(err);
                return err;
            }else{
                return row;
            }
        })
    });
}


module.exports ={
    getCourses, getCoursesAsync
}