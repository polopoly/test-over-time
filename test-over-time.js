var historyQueue = [];
var lastHistoryRequestIndex = -1;
var nextIndex = 0;
var gettingAll = false;

function findTest(testName) {
    for(var i = 0; i < historyQueue.length; i++) {
        if (historyQueue[i] != null && historyQueue[i].test == testName) {
            return historyQueue[i];
        }
    }
    return null;
}

function handleTestResponse(data) {
    var docs = data.response.docs;
    $('#result').innerHTML = '';
    for(var i = 0; i < docs.length; i++) {
        var branch = docs[i].branch;
        var platform = docs[i].plattform;
        if (environments[branch] && $.inArray(platform, environments[branch]) !== -1) {
            //if (console) { console.log('Found failing test ' + docs[i].timestamp + ' in branch ' + branch + ', platform ' + platform + ' with status ' + docs[i].status + ': ' + docs[i].test); }
            var testName = docs[i].test;
            if ( !findTest(testName) ) {
                historyQueue.push({test:testName, index:i});
                addRowToTable(i, docs[i].test);
                nextIndex = i+1;
            }
        }
    }
    testManager.response = data;
}

function addRowToTable(index, testName) {
    $('#result').append("<tr ><td id='history" + index + "' style='border:1px solid #AAA'><input type='button' value='Load' onClick='fillOneHistory(" + index + ");'></td><td class='rowlabel'>" + testName.replace(/:/, '<br />--') + "</td></tr>"); 
}

function fillAllHistory() {
    gettingAll = true;
    requestNextHistory();
}

function fillOneHistory(index) {
    var duplicate = null;
    for (var i = 0; i < historyQueue.length; i++) {
        if (historyQueue[i] != null && historyQueue[i].index == index) {
            duplicate = historyQueue[i];
            historyQueue[i] = null;
            break;
        }
    }
    if (duplicate) {
        gettingAll = false;
        historyQueue.unshift(duplicate);
        requestNextHistory();
    }
}

function requestNextHistory() {
    while (historyQueue.length > 0 && historyQueue[0] == null) {
        historyQueue.shift();
    }
    if (historyQueue.length > 0) {
        var toProcess = historyQueue[0];
        lastHistoryRequestIndex = toProcess.index;
        $('#history' + lastHistoryRequestIndex + ' ').empty();
        $('#history' + lastHistoryRequestIndex + ' ').append('<img src="ajax-loader.gif" class="loader">');
        historyManager.store.remove('q');
        historyManager.store.addByValue('q', 'datestamp:[NOW-' + DAYS + 'DAYS TO NOW] AND test:"' + toProcess.test + '"');
        historyManager.store.remove('rows');
        historyManager.store.addByValue('rows', DAYS * branches.length * 50);
        historyManager.doRequest();
    } else {
        gettingAll = false;
    }
}

function handleHistoryResponse(data) {
    var element = $('#history' + lastHistoryRequestIndex);
    var requestedTest = historyQueue[0];
    var now = new Date(new Date().getYear() + 1900, new Date().getMonth(), new Date().getDate());
    var rows = {};
    var docs = data.response.docs;
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
        var branch = doc.branch;
        var platform = doc.plattform;
        if (environments[branch] && $.inArray(platform, environments[branch]) !== -1 && requestedTest.test == doc.test) {
            var compound = branch + ':' + platform;
            if (!rows[compound]) {
                rows[compound] = [];
            }
            var row = rows[compound];
            var testdate = new Date(doc.year, doc.month - 1, doc.day);
            var daydiff = Math.ceil((now.getTime()-testdate.getTime())/(1000*60*60*24));
            row[DAYS-daydiff-1] = doc.status;
        }
    }
    var graph = ""; 
    for (var bi = 0; bi < branches.length; bi++) {
        var branch = branches[bi];
        var envs = environments[branch];
        graph += '<div class="branchlabel">' + branch + '</div>';
        graph += '<table class="history">';
        for (var ei = 0; ei < envs.length; ei++) {
            var compound = branch + ':' + envs[ei];
            var row = rows[compound];
            if ( ! row ) {
                row = [];
            }
            graph += '<tr class="history">';
            for (var i = 0; i < DAYS; i++) {
                graph += '<td class="history">';
                var status = row[i];
                var tooltip = compound + ' : ' + status;
                if ( ! status ) {
                    graph += '<div class="missing" title="' + tooltip + '"/>';
                } else if (status == 'OK') {
                    graph += '<div class="ok" title="' + tooltip + '"/>';
                } else if (status == 'KNOWN BUG') {
                    graph += '<div class="knownbug" title="' + tooltip + '"/>';
                } else {
                    graph += '<div class="failed" title="' + tooltip + '"/>';
                }
                graph += '</td>';
            }
            graph += '</tr>';
        }
        graph += '</table>';
    }
    element.empty();
    element.append(graph);
    
    historyQueue.shift();
    
    if (gettingAll) {
        requestNextHistory();
    }
}

function addCustomTests(id) {
    var test = $('#' + id)[0].value;
    testManager.store.remove('q');
    testManager.store.remove('fq');
    testManager.store.addByValue('q', "datestamp:[NOW-4DAYS TO NOW] AND test:" + test);
    testManager.store.addByValue('fq', "branch:(" + branches.join(' OR ') + ")");
    testManager.handleResponse = handleCustomTestResponse;

    testManager.doRequest();
    $('#customloader').show();
}

function handleCustomTestResponse(data) {
    $('#customloader').hide();
    var docs = data.response.docs;
    var testSet = [];
    for(var i = 0; i < docs.length; i++) {
        var branch = docs[i].branch;
        var platform = docs[i].plattform;
        if (environments[branch] && $.inArray(platform, environments[branch]) !== -1) {
            var testName = docs[i].test;
            if ( !findTest(testName) ) {
                var found = false;
                for(var j = 0; j < testSet.length; j++) {
                    if ( testSet[j] == testName ) {
                        found = true;
                    }
                }
                if ( !found ) {
                    testSet.push(testName);
                    var index = nextIndex++;
                    historyQueue.push({test:testName, index:index});
                    addRowToTable(index, docs[i].test);
                }
            }
        }
    }
    //alert('Added ' + testSet.length + ' new tests');
    testManager.response = data;
}

var testManager;
var historyManager;
(function ($) {
    $(function () {
        testManager = new AjaxSolr.Manager({
            solrUrl: 'http://prodtest03:8983/solr/'
        });
        historyManager = new AjaxSolr.Manager({
            solrUrl: 'http://prodtest03:8983/solr/'
        });
        testManager.init();
        historyManager.init();
        testManager.handleResponse = handleTestResponse;
        historyManager.handleResponse = handleHistoryResponse;
        testManager.store.addByValue('q', "datestamp:[NOW-1DAYS TO NOW] AND -status:OK AND -status:\"KNOWN BUG\"");
        testManager.store.addByValue('fq', "branch:(" + branches.join(' OR ') + ")");
        testManager.store.addByValue('rows', 500);

        $('#daycount').text(DAYS);

        var legend = $('#legend');
        for (var bi = 0; bi < branches.length; bi++) {
            var branch = branches[bi];
            var envs = environments[branch];
            for (var ei = 0; ei < envs.length; ei++) {
                var compound = branch + ':' + envs[ei];
                legend.append(compound + '<br />');
            }
        }

        testManager.doRequest();
    });
})(jQuery);

