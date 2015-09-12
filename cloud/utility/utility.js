exports.arrayContain = function(array, elem) {
    return (array.indexOf(elem) > -1);
}

exports.queryObjects = function(tableName, selectsArr, isDescending, scendingStr) {
    var ParseObject = Parse.Object.extend(tableName);
    var query = new Parse.Query(ParseObject);
    query.limit(1000);
    if (selectsArr) {
        query.select(selectsArr);
    }

    if (scendingStr) {
        if (isDescending) {
            // descending
            query.descending(scendingStr);
        } else {
            // ascending
            query.ascending(scendingStr);
        }
    }
    return query.find();
}

exports.destroyAllData = function(tableName) {
    var ParseObject = Parse.Object.extend(tableName);
    var query = new Parse.Query(ParseObject);
    query.limit(1000);
    return query.find().then(function(results) {
        return Parse.Object.destroyAll(results);
    }).then(function(success) {
        return success;
    }, function(error) {
        return error;
    });
}

exports.scheduleNextJob = function(isSuccess, jobId, retryTime, jobType) {
    console.log('start schedule next job ' + jobId);
    var ScheduleJobs = Parse.Object.extend('schedule_jobs');
    var query = new Parse.Query(ScheduleJobs);
    var settings = require('cloud/utility/settings.js');
    return query.get(jobId).then(function(jobInfo) {
        console.log('find job data success');
        jobInfo.set('retryTime', isSuccess ? 0 : ++retryTime);
        var startTime;
        if (isSuccess) {
            startTime = Date.now() + settings.getJobNextTime(jobType, isSuccess);
        } else {
            if (retryTime > settings.getRetryMaxTimes()) {
                console.log("is max retry time" + retryTime + " , schedule next period");
                startTime = Date.now() + settings.getJobNextTime(jobType, true);
            }else {
                console.log("not max retry time" + retryTime + ", retry again");
                startTime = Date.now() + settings.getJobNextTime(jobType, isSuccess);
            }
        }
        jobInfo.set('startTimeInMS', startTime);
        jobInfo.save();
    }, function(error) {
        console.log('find job data error ' + error.message);
    })
}

exports.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
}
