// +++ TEST
Parse.Cloud.define("hello_world", function(request, response) {
                   response.success("Hello world s011208!");
                   });

Parse.Cloud.job("TestAloha", function(request, status) {
                Parse.Cloud.useMasterKey();
                aloha();
                });

function aloha() {
    console.log("Hello world s011208!");
}

Parse.Cloud.job("test_job", function(request, status) {
	// test ActListItem_Job
	var query = new Parse.Query(Parse.Object.extend("ActListItem_Job"));
	query.get(ActListItem_Job_ID, {
		success: function(job) {
			// The object was retrieved successfully.
			alert("query success, bound: " + job.getJobBound());
		},
		error: function(object, error) {
			alert("query failed, msg: " + error.message);
		}
	});
	query.count({
			success: function(number) {
				alert("query success, number: " + number);
			},
			error: function(error) {
				alert("query count failed, msg: " + error.message);
			}
		})
	.then(function() {
		var job = JobRange.newInstance(30, 0);
		job.save(null, {
			success: function(job) {
				alert("insert success");
			},
			error: function(job, error) {
				alert("insert failed");
			}
		}).then(function() {
			  status.success("ParseAllActList success");
			  }, function(error){
			  status.error("ParseAllActList error: " + error);
			  }
		  )
		  ;
	})
	;
})

// --- TEST

// +++ utilities

//判斷字串開頭是否為指定的字
//回傳: bool
function startsWith(originStr, prefix) {
    return (originStr.substr(0, prefix.length) === prefix);
}

//判斷字串結尾是否為指定的字
//回傳: bool
function endsWith(originStr, suffix) {
    return (originStr.substr(originStr.length - suffix.length) === suffix);
}

//判斷字串是否包含指定的字
//回傳: bool
function contains(originStr, txt) {
    return (originStr.indexOf(txt) >= 0);
}


// --- utilities

// +++ class
var Monster = Parse.Object.extend("Monster", {
                                  // Instance methods
                                  hasSuperHumanStrength: function () {
                                  return this.get("strength") > 18;
                                  },
                                  // Instance properties go in an initialize method
                                  initialize: function (attrs, options) {
                                  this.sound = "Rawr"
                                  }
                                  }, {
                                  // Class methods
                                  spawn: function(strength) {
                                  var monster = new Monster();
                                  monster.set("strength", strength);
                                  return monster;
                                  }
                                  })
;

var JobRange = Parse.Object.extend("ActListItem_Job", {
		/*instance method*/
		getJobBound: function() {
			return this.get("job_bound");
		},
		getStartIndex: function() {
			return this.get("start_index");
		}
	}, {
	/*class method*/
		newInstance: function(jobBound, startIndex) {
			var item = new JobRange();
			item.set("job_bound", jobBound);
			item.set("start_index", startIndex);
			return item;
		}
	})
;

var ActListItem = Parse.Object.extend("ActListItem_test", {
                                      /*instance method*/
										  getAmendedDate: function() {
											return this.get("amended_date");
										  },
										  
										  getCategoty: function () {
											return this.get("category_");
										  },
										  
										  getTitle: function () {
											return this.get("title_");
										  },
										  
										  getUrl: function (){
											return this.get("url");
										  }
                                      
                                      }, {
                                      /*class method*/
										  newInstance: function(category, lawUrl, title, amendedDate) {
											  var item = new ActListItem();
											  item.set("amended_date", amendedDate);
											  item.set("category_", category);
											  item.set("title_", title);
											  item.set("url", lawUrl);
											  return item;
										  }
                                      }
                                      )
;

// --- class

var utility = require('cloud/utility/utility.js');
var cheerio = require('cloud/libs/cheerio.js');
var DEBUG = true;

var ActListItem_Job_ID = "aMmTTjEOVh";

function startToParseActItemList(job, status) {
    log("job bound: " + job.getJobBound());
    var promise = Parse.Promise.as();
    promise = promise
    /*
     debug request
     .then(function() {return getHttpRequest("http://law.moj.gov.tw/LawClass/LawClassListN.aspx?TY=03001005", "test1");})
     .then(function() {return getHttpRequest("http://law.moj.gov.tw/LawClass/LawClassListN.aspx?TY=03001005", "test2");})
     .then(function() {return getHttpRequest("http://law.moj.gov.tw/LawClass/LawClassListN.aspx?TY=03001005", "test3");})
     .then(function() {return getHttpRequest("http://law.moj.gov.tw/LawClass/LawClassListN.aspx?TY=03001005", "test4");})
     .then(function() {return getHttpRequest("http://law.moj.gov.tw/LawClass/LawClassListN.aspx?TY=03001005", "test5");})
     */
    /*get AllLawClass N web page*/
    .then(function() {return getHttpRequest("http://law.moj.gov.tw/LawClass/LawClassListN.aspx", "getAllLawClassNPage");})
    /*get AllLawClass N list*/
    .then(function(pageData) {return getAllLawClassNList(pageData);})
    /*get AllLawList*/
    .then(function(linksList) {return getAllLawList(promise, linksList, status, job);})
    ;

}

Parse.Cloud.job("ParseAllActList", function(request, status) {
                Parse.Cloud.useMasterKey();
                var query = new Parse.Query(Parse.Object.extend("ActListItem_Job"));
                query.get(ActListItem_Job_ID, {
                          success: function(job) {
                          startToParseActItemList(job, status);
                          },
                          error: function(object, error) {
                          alert("query failed, msg: " + error.message);
                          }
                });

})

function setResult(promise, status) {
    promise
    .then(function() {
          status.success("ParseAllActList success");
          }, function(error){
          status.error("ParseAllActList error: " + error);
          }
          );
}

var toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function getAllLawList(promise, linksList, status, job) {
    var actItemsList = [];
    var finishCounter = 0;
    var totalActItemCounter = 0;
    var startBound = job.getStartIndex();
    var jobBound = job.getJobBound();
    var endBound = startBound + job.getJobBound();
    var updateStartBound = endBound;
    if (endBound >= linksList.length) {
        endBound = linksList.length;
        updateStartBound = 0;
    }
	var finalJobBound = endBound - startBound;
    
    
    // update job bound
    job.save(null, {
             success: function(job) {
                    job.set("start_index", updateStartBound);
                    job.save();
                }
             });
			 
    
    log("getAllLawList, linksList size: " + linksList.length + ", startBound: " + startBound + ", endBound: " + endBound + ", finalJobBound: " + finalJobBound);
    for(i = startBound; i < endBound; i++) {
        var link = linksList[i];
        Parse.Promise.as(i)
        .then(function(i){
              return Parse.Promise.as(i)
              .then(function(i){
                    var httpPromise = Parse.Promise.as();
                    httpPromise
                    .then(function() {return getHttpRequest(link, "getLawWebPage");})
                    .then(function(pageData) {
                          $ = cheerio.load(pageData.text);
                          var eleTitleRaw = $("div.classtitle ul li");
                          if (eleTitleRaw != null && eleTitleRaw.length > 0) {
							  // get all items' value
							  var eleTitle = $(eleTitleRaw[0]).text();
							  var eleLaws = $("a[href][title]");
							  var actItemList = [];
							  for (j = 0; j < eleLaws.length; j++) {
								  var lawUrl = $(eleLaws[j]).attr("href");
								  if (contains(lawUrl, "PCode")) {
									  ++totalActItemCounter;
									  lawUrl = "http://law.moj.gov.tw/LawClass/LawContent.aspx?" + lawUrl.substr(lawUrl.indexOf("PCode"));
									  var title = $(eleLaws[j]).attr("title");
									  var nodeParent = $(eleLaws[j]).parent();
									  $(eleLaws[j]).remove();
									  var amendedDate = nodeParent.text().trim();
									  
									  // update or insert
									  var actItem = ActListItem.newInstance(eleTitle, lawUrl, title, amendedDate);
									  // log("actItem: " + actItem.getAmendedDate() + ", " + actItem.getCategoty() + ", " + actItem.getTitle() + ", " + actItem.getUrl());
									  actItemList.push(actItem);
								  }
							  }
							  Parse.Object.saveAll(actItemList).then(
								  function(actItems) {
									  return actItems;
								  },
								  function(error) {
								      return [];
							  })
							  .then(function(savedActItemResults) {
											if (savedActItemResults.length == 0) {
												--finalJobBound;
												if (finalJobBound == 0) {
													log("finishCounter: " + finishCounter + ", totalActItemCounter: " + totalActItemCounter);
													setResult(promise, status);
												}
											} else {
												var query = new Parse.Query(Parse.Object.extend("ActListItem_test"));
												query.equalTo("category_", savedActItemResults[0].getCategoty());
												query.find()
												.then(
													// find duplicated items
													function(parseActItemResults) {
														var rtn = [];
														for(j = 0; j < savedActItemResults.length; j++) {
															var savedActItem = savedActItemResults[j];
															for(i = 0; i <parseActItemResults.length; i++) {
																var parseActItem = parseActItemResults[i];
																if(parseActItem.getTitle() != savedActItem.getTitle()) continue;
																if(parseActItem.id == savedActItem.id) continue;
																rtn.push(parseActItem);
															}
														}
														// return item to delete
														log("delete item length: " + rtn.length);
														return rtn;
													},
													function(error) {
														return [];
													}
												)
												.then(function(rtnParseActItemResults) {
													log("rtnParseActItemResults item length: " + rtnParseActItemResults.length);
													for (y = 0; y < rtnParseActItemResults.length; y++) {
														log("delete object id: " + rtnParseActItemResults[y].id);
														rtnParseActItemResults[y].destroy();
													}
													return [];
												})
												.then(function(emptyResults) {
													--finalJobBound;
													if (finalJobBound == 0) {
														log("finishCounter: " + finishCounter + ", totalActItemCounter: " + totalActItemCounter);
														setResult(promise, status);
													}
												});
											}
											
										});
                          }
                          })
                    ;
              });
        });
    }
}

function getAllLawClassNList(pageData) {
//    log("start getAllLawClassNList with data:");
//    log(pageData);
//    log("pageData length: " + pageData.text.length);
    $ = cheerio.load(pageData.text);
    links = $('a'); //jquery get all hyperlinks
    log("link length: " + links.length);
    var classNLinks = [];
    $(links).each(function(i, link) {
                  var actText = $(link).text();
                  var linkUrl = $(link).attr('href');
                  var isNull = linkUrl == null;
                  if (!isNull && startsWith(linkUrl, "LawClassListN.aspx?")) {
                    classNLinks[classNLinks.length] = "http://law.moj.gov.tw/LawClass/" + linkUrl;
                  //  log("links: " + classNLinks[classNLinks.length - 1]);
                  }
                });
    return classNLinks;
}

function getHttpRequest(link, logTag) {
//    log("start " + logTag + " with link: " + link);
    return Parse.Cloud.httpRequest({
                                   url: link,
                                   success: function(httpResponse) {
//                                   log("[" + logTag + "] request success, httpResponse: " + httpResponse.text.substr(0, 30));
                                   },
                                   error: function(httpResponse) {
                                   var status = httpResponse.status;
                                   var text = httpResponse.text;
                                   log("[" + logTag + "] request error, status:" + status);
                                   }
                                   });
}


function log(logString) {
    if(!DEBUG) return;
    console.log(logString);
}