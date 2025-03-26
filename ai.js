
async function sleep(ms){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

async function generateSchedule(task){
    task.status = "parsing";
    await sleep(5000);
    task.status = "analyzing";
    await sleep(5000);
    task.status = "scheduling";
    await sleep(5000);
    task.status = "success";
}

module.exports = {
    generateSchedule
}