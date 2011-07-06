var tests = [];
var cols = [];
var startTime = null;

var zoomFactor = 2;

function drawTimeline(url, element, nameElement, zoom) {
    zoomFactor = zoom;
    tests = [];
    cols = [];
    startTime = null;
    var div = $('#' + element);
    div.html('');
    var nameDiv = $('#' + nameElement);
    $.get(url, {}, function(data, textStatus, jqXHR) {
        for (var i = 0; i < 20; i++) {
            cols[i] = $('<div class="column" style="left: ' + (i * 40) + 'px;"></div>');
            div.append(cols[i]);
        }
        var lines = data.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (/testStarted/.test(line)) {
                var timeStamp = getTimestamp(line);
                if (startTime === null) {
                    startTime = timeStamp;
                }
                var nextLine = lines[++i];
                var match = /INFO: Start '([^']+)'/.exec(nextLine);
                var testName = match[1];
                startTest(testName, timeStamp);
            } else if (/testFinished/.test(line)) {
                var nextLine = lines[++i];
                var match = /INFO: ([^,]+), duration ([0-9.]+) ([a-z]+)/.exec(nextLine);
                var testName = match[1];
                var duration = Number(match[2]);
                if (match[3] === 'minutes') {
                    duration = duration * 60;
                }
                endTest(testName, duration, nameDiv, /OK/.test(nextLine) ? 'ok' : 'fail');
            }
        }
    });
}

function getTimestamp(line) {
    var ts = /^([0-9]+)-([0-9]+)-([0-9]+) ([0-9]+):([0-9]+):([0-9]+),([0-9]+)/.exec(line);
    if (ts !== null) {
        return (new Date(Number(ts[1]), Number(ts[2])-1, Number(ts[3]), Number(ts[4]), Number(ts[5]), Number(ts[6]), Number(ts[7]))).getTime();
    }

    if (/AM|PM/.test(line)) {
        var stamp = /^(.+)(AM|PM)/.exec(line);
        if (stamp !== null) {
            var time = Date.parse(stamp[0]);
            if (time !== NaN) {
                return time;
            } else {
                alert('Looked like a date but could not parse: ' + line);
                return NaN;
            }
        } 
    } else {
        alert('Unknown timestamp format: ' + line);
    }
}

function startTest(testName, timeStamp) {
    for (var i = 0; i < tests.length; i++) {
        if (tests[i] === null) {
            tests[i] = { name: testName, timeStamp: timeStamp };
            return;
        }
    }

    tests.push({ name: testName, timeStamp: timeStamp });
}

function endTest(testName, duration, nameDiv, resultClass) {
    for (var i = 0; i < tests.length; i++) {
        if (tests[i] !== null && tests[i].name === testName) {
            var top = Math.round((tests[i].timeStamp - startTime) / 1000 * zoomFactor);
            var height = Math.round(duration * zoomFactor - 2);
            if (height < 0) {
                height = 0;
            }
            var div = $('<div class="test ' + resultClass + '" style="height: ' + height + 'px; top: ' + top + 'px;" >' + testName + '</div>');
            div.mouseenter(function() {
                nameDiv.html(testName + ': ' + duration + ' s');
            });
            div.mouseleave(function() { nameDiv.html(''); });
            cols[i].append(div);
            tests[i] = null;
            return;
        }
    }

    alert('Test ' + testName + ' terminated without ever starting!');    
}
