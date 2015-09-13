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

var utility = require('cloud/utility/utility.js');
var cheerio = require('cloud/libs/cheerio.js');
var DEBUG = true;

Parse.Cloud.job("ParseAllActList", function(request, status) {
                var promise = Parse.Promise.as();
                Parse.Cloud.useMasterKey();
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
                .then(function(linksList) {return getAllLawList(promise, linksList, status);})
                ;
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

function getAllLawList(promise, linksList, status) {
    log("getAllLawList, linksList size: " + linksList.length);
    var actItemsList = [];
    var finishCounter = 0;
    for(i = 0; i < linksList.length; i++) {
        if (i == 10) break;
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
                          
                          var eleTitle = $(eleTitleRaw[0]).text();
                          log("eleTitle :" + eleTitle);
                          var eleLaws = $("a[href][title]");
                          log("eleLaws length: " + eleLaws.length);
                          for (j = 0; j < eleLaws.length; j++) {
                          var lawUrl = $(eleLaws[j]).attr("href");
                          if (contains(lawUrl, "PCode")){
                          lawUrl = "http://law.moj.gov.tw/LawClass/LawContent.aspx?" + lawUrl.substr(lawUrl.indexOf("PCode"));
                          log("lawUrl: " + lawUrl);
                          var title = $(eleLaws[j]).attr("title");
                          log("title: " + title);
                          
                          }
                          
                          }
                          ++finishCounter;
                          if (finishCounter == 10) {
                            setResult(promise, status);
                          }
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
    log("start " + logTag + " with link: " + link);
    return Parse.Cloud.httpRequest({
                                   url: link,
                                   success: function(httpResponse) {
                                   log("[" + logTag + "] request success, httpResponse: " + httpResponse.text.substr(0, 30));
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