var historyQueue = [];
var lastHistoryRequestIndex = -1;
var nextIndex = 0;
var gettingAll = false;

/* Stolen from somewhere on the internet */
Date.prototype.setISO8601 = function (string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
}

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

    var nothingFound = true;
    for(var i = 0; i < docs.length; i++) {
        var branch = docs[i].branch;
        var platform = docs[i].platform;
        if (environments[branch] && $.inArray(platform, environments[branch]) !== -1) {
            //if (console) { console.log('Found failing test ' + docs[i].timestamp + ' in branch ' + branch + ', platform ' + platform + ' with status ' + docs[i].status + ': ' + docs[i].test); }
            nothingFound = false;
            var testName = docs[i].test;
            if ( !findTest(testName) ) {
                historyQueue.push({test:testName, index:i});
                addRowToTable(i, docs[i].test);
                nextIndex = i+1;
            }
        }
    }
    if (nothingFound) {
        $('#result').html('<tbody><tr><th>No failures found in last ' + (typeof(TRIGGER_DAYS) === 'undefined' ? 'day' : TRIGGER_DAYS + ' days') + '</th></tr></tbody>');
    }
    testManager.response = data;
}

function addRowToTable(index, testName) {
    $('#result').append("<tr ><td id='history" + index + "' style='border:1px solid #AAA'><input type='button' value='Load' onClick='fillOneHistory(" + index + ");'></td><td class='rowlabel'>" + testName.replace(/:/, '<br />--') + "</td><td class='ticketscontainer'><div class='pager'><span id='tickets"+index+"pagerheader'></span><span id='tickets"+index+"pager'></span></div><div id='tickets"+index+"' class='tickets'></div><div id='ticketscontrol"+index+"' class='ticketscontrol'></div></td></tr>");
    // ' just for emacs coloring
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
        historyManager.store.remove('fl');
        historyManager.store.addByValue('fl', defaultFieldList.join(' OR '))
        historyManager.doRequest();
    } else {
        gettingAll = false;
    }
}

function handleHistoryResponse(data) {
    var element = $('#history' + lastHistoryRequestIndex);
    var popup = $('<div class="popup"></div>');
    var requestedTest = historyQueue[0];
    var now = new Date(new Date().getYear() + 1900, new Date().getMonth(), new Date().getDate());
    var rows = {};
    var docs = data.response.docs;
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
        var branch = doc.branch;
        var platform = doc.platform;
        if (environments[branch] && $.inArray(platform, environments[branch]) !== -1 && requestedTest.test == doc.test) {
            var compound = branch + ':' + platform;
            if (!rows[compound]) {
                rows[compound] = [];
            }
            var row = rows[compound];

            var testdate = new Date();
            testdate.setISO8601(doc.datestamp);
            testdate = new Date(testdate.getYear() + 1900, testdate.getMonth(), testdate.getDate());

            var daydiff = Math.ceil((now.getTime()-testdate.getTime())/(1000*60*60*24));
            row[DAYS-daydiff-1] = doc;
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
            
            var statusFound = false;
            var graphrow = '<tr class="history">';
            for (var i = 0; i < DAYS; i++) {
                graphrow += '<td class="history">';
                var doc = row[i];
                if (!doc) {
                    doc = { status: "N/A", datestamp: "N/A" };
                }
                var status = doc.status;
                var tooltip = envs[ei] + ' : ' + doc.datestamp.split('T')[0];
                if ( status == 'N/A' ) {
                    graphrow += '<div class="missing" popup="' + tooltip + '"/>';
                } else {
                    statusFound = true;
                    if (status == 'OK') {
                        graphrow += '<div class="ok" popup="' + tooltip + '"/>';
                    } else if (status == 'KNOWN BUG') {
                        graphrow += '<div class="knownbug" popup="' + tooltip + '"/>';
                    } else {
                        graphrow += '<div class="failed" popup="' + tooltip + '"/>';
                    }
                }
                graphrow += '</td>';
            }
            graphrow += '</tr>';
            if (statusFound) {
                graph += graphrow;
            }
        }
        graph += '</table>';
    }
    element.empty();
    element.append(graph);
    $("td.rowlabel", element.parent()).prepend(popup);
    $('.missing, .ok, .knownbug, .failed', element).mouseenter(function(e) {
        popup.css('left', e.pageX + 10);
        popup.css('top', e.pageY + 10);
        popup.html($(this).attr('popup'));
        popup.show();
    });
    $('.missing, .ok, .knownbug, .failed', element).mouseleave(function(e) {
        popup.hide();
    });

    var full_test_name = requestedTest.test
    var tick = tickets.create({ target: '#tickets'+lastHistoryRequestIndex,
				test: function() { return full_test_name }
			      })
    tick.load()
    var ctrl = $('#ticketscontrol' + lastHistoryRequestIndex)
    control = '<input class=control type=button value=comment data-test="'+full_test_name+'"></input>'
    ctrl.empty()
    ctrl.append(control)
    ctrl.get(0).tickets = tick

    historyQueue.shift();
    
    if (gettingAll) {
        requestNextHistory();
    }
}

function addCustomTests(id) {
    var test = $('#' + id)[0].value;
    testManager.store.remove('q');
    testManager.store.remove('fq');
    var daysback = 4;
    if (typeof(TRIGGER_DAYS) != "undefined") {
        daysback = TRIGGER_DAYS;
    }
    
    testManager.store.addByValue('q', "datestamp:[NOW-" + daysback + "DAYS TO NOW] AND test:" + test);
    testManager.store.addByValue('fq', "branch:(" + branches.join(' OR ') + ")");
    testManager.store.addByValue('fl', defaultFieldList.join(' OR '));
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
        var platform = docs[i].platform;
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

var defaultFieldList = [
    'branch',
    'datestamp',
    'id',
    'platform',
    'suite',
    'test',
    'ticket',
    'status'
    ];
 var testManager;
var historyManager;
(function ($) {
    $(function () {
        testManager = new AjaxSolr.Manager({
            solrUrl: 'http://prodtest06:8983/solr/'
//            solrUrl: 'http://localhost:8080/solr/'
        });
        historyManager = new AjaxSolr.Manager({
            solrUrl: 'http://prodtest06:8983/solr/'
            //solrUrl: 'http://localhost:8080/solr/'
        });
        testManager.init();
        historyManager.init();
	tickets.init('http://localhost:8080/solr/')
        testManager.handleResponse = handleTestResponse;
        historyManager.handleResponse = handleHistoryResponse;
	var daysback = (new Date().getDay() == 1 ? 3 : 1);
        if (typeof(TRIGGER_DAYS) != "undefined") {
            daysback = TRIGGER_DAYS;
        }
        testManager.store.addByValue('q', "datestamp:[NOW-" + daysback + "DAYS TO NOW] AND -status:OK AND -status:\"KNOWN BUG\"");
	var filterQueries = [];
	for (var bi = 0; bi < branches.length; bi++) {
	    var branch = branches[bi];
	    filterQueries.push("(branch:" + branch + " AND platform:(\"" + environments[branch].join("\" OR \"") + "\"))");
	}
        testManager.store.addByValue('fq', filterQueries.join(' OR '));
    
        testManager.store.addByValue('fl', defaultFieldList.join(' OR '));
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

	$('.ticketscontainer .remove').live('click', function() {
            tickets.remove({ 
		id: $(this).data('docid'),
		context: this,
		success: function(data, textStatus, jqXHR) {
		    $(this).parent().remove()
		}
	    })
	    return false
	})
	
	$('.ticketscontainer .control').live('click', function() {
	    tickets.save({
		test: $(this).data('test'),
		context: $(this).parent().get(0),
		success: function(result) {
		    this.tickets.add(result.doc)
		}
	    })
	    return false
	})
    });
})(jQuery);

