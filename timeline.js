var tests = [];
var cols = [];
var buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var startTime = null;

var zoomFactor = 2;

function drawTimeline(url, element, nameElement, zoom) {
    zoomFactor = zoom;
    tests = [];
    cols = [];
    buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
        drawHistogram();
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

            var bucket_idx = Math.round(Math.log(duration)/Math.log(2));
            buckets[bucket_idx] = buckets[bucket_idx] + duration;
            return;
        }
    }

    alert('Test ' + testName + ' terminated without ever starting!');    
}

function drawHistogram() {
    var canvas = document.getElementById('histogram');
    var height = canvas.getAttribute('height');
    var width = canvas.getAttribute('width');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width, canvas.height);

    var lineargradient = ctx.createLinearGradient(0,0,0,height);
    lineargradient.addColorStop(0,'rgb(180, 190, 230)');
    lineargradient.addColorStop(1,'rgb(230, 220, 213)');

    ctx.save();
    ctx.strokeStyle = "rgb(90, 110, 150)";
    ctx.fillStyle = lineargradient;
    
    var maxheight = 0;
    for (var i = 0; i < buckets.length; i++) {
        if (buckets[i] > maxheight) {
            maxheight = buckets[i];
        }
    }

    for (var i = 0; i < buckets.length; i++) {
        var accum = buckets[i];
        
        ctx.beginPath();
        ctx.moveTo(i * 5, 0);
        var barsize = accum/(maxheight/height);
        ctx.fillRect (i*(width/buckets.length), height-barsize, width/buckets.length, barsize);
    }

    ctx.restore();

    // Fix fillText compatibility
    if (!ctx.fillText && ctx.mozDrawText) { ctx.fillText = function(textToDraw, x, y, maxWidth) { ctx.translate(x, y); ctx.mozTextStyle = ctx.font; ctx.mozDrawText(textToDraw); ctx.translate(-x, -y); } } 
    

    ctx.save();
    ctx.font = "15px Times New Roman";
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText("Accumulated test time, log2 x-axis", 5, 18);
    ctx.restore();
}
