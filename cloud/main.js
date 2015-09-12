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
var utility = require('cloud/utility/utility.js');
var cheerio = require('cloud/libs/cheerio.js');
var DEBUG = true;

Parse.Cloud.job("ParseAllActList", function(request, status) {
                var promise = Parse.Promise.as();
                Parse.Cloud.useMasterKey();
                promise = promise
                /*get AllLawClass N web page*/
                .then(function() {return getAllLawClassNPage();})
                /*get AllLawClass N list*/
                .then(function(pageData) {return getAllLawClassNList(pageData);})
                /*set final result*/
                .then(function(){
                      status.success("ParseAllActList success");
                      }, function(error){
                      status.error("ParseAllActList error: " + error);
                      });
                });

function getAllLawClassNList(pageData) {
    log("start getAllLawClassNList with data:");
    log(pageData);
    $ = cheerio.load(pageData);
    var promise = Parse.Promise.as();
    promise = promise
    .then(function(){
          links = $('a'); //jquery get all hyperlinks
          log("link length: " + links.length);
          $(links).each(function(i, link){
                        log($(link).text() + ':\n  ' + $(link).attr('href'));
                        });
          return promise;
          })
    .then(function(){
          $('a').map(function(i, link) {
                     var href = $(link).attr('href');
                     log("href length: " + href.length);
                     });
          return promise;
          });
    
    return promise;
}

function getAllLawClassNPage() {
    log("start getAllLawClassNPage");
    var urlLink = "http://law.moj.gov.tw/LawClass/LawClassListN.aspx";
    return Parse.Cloud.httpRequest({
                                   url: urlLink,
                                   success: function(httpResponse) {
                                   log("[getAllLawClassNRequest] request success"); 
                                   },
                                   error: function(httpResponse) {
                                   var status = httpResponse.status;
                                   var text = httpResponse.text;
                                   log("[getAllLawClassNRequest] request error, status:" + status);
                                   }
                                   });
}

function log(logString) {
    if(!DEBUG) return;
    console.log(logString);
}