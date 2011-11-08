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
            try {
                if (!/^[\t ]*at/.test(line)) {
                    if (/testStarted/.test(line) || /startTest/.test(line)) {
                        var timeStamp = getTimestamp(line);
                        if (startTime === null) {
                            startTime = timeStamp;
                        }
                        var nextLine = lines[++i];
                        var match = /INFO: Start '([^']+)'/.exec(nextLine);
                        var testName = match[1];
                        startTest(testName, timeStamp);
                    } else if (/testFinished/.test(line) || /endTest/.test(line)) {
                        var nextLine = lines[++i];
                        var match = /INFO: ([^,]+), duration ([0-9.]+) ([a-z]+)/.exec(nextLine);
                        var testName = match[1];
                        if (testName.indexOf("'") != -1) {
                            testName = /'([^']+)'/.exec(testName)[1];
                        }
                        var duration = Number(match[2]);
                        if (match[3] === 'minutes') {
                            duration = duration * 60;
                        }
                        if (match[3] === 'ms') {
                            duration = duration / 1000;
                        }
                        endTest(testName, duration, nameDiv, /OK/.test(nextLine) ? 'ok' : 'fail');
                    }
                }
            } catch(err) {
                alert('Failed on line ' + i + ': "' + line + '"\n' + err); 
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

function endTest(testName, duration, nameDiv, resultType) {
    for (var i = 0; i < tests.length; i++) {
        if (tests[i] !== null && tests[i].name === testName) {
            var top = Math.round((tests[i].timeStamp - startTime) / 1000 * zoomFactor);
            var height = Math.round(duration * zoomFactor - 2);
            if (height < 0) {
                height = 0;
            }
            var color = Math.min(Math.max(Math.log(duration)/5, 0.3),1);
            var cssColor = "rgb(";
            if (resultType === 'ok') {
                cssColor += "" + Math.round(128*color) + "," + Math.round(12*16*color) + "," + Math.round(128*color);
            } else {
                cssColor += "255,128,128";
            }
            cssColor += ")";
            var div = $('<div class="test ' + resultType + '" style="height: ' + height + 'px; top: ' + top + 'px; color:' + cssColor + '; background-color:' + cssColor + ';" >' + testName + '</div>');
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
