const sqlite = require('sqlite3').verbose();


const db = new sqlite.Database('fall2025.db', (err) => {
    if (err) console.log("Error with database", err);
    else console.log("Connected to Database");
});

db.each("SELECT * from dt_AllCourses WHERE start_time NOT null", (err, row) => {
    if (err) console.log(err);
    else {
        console.log(row);
    }
});

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
    getCourses
}