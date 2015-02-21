var url =  require("url");
var Rx =   require("rx");
var http = require("http");
var path = require("path");
var fs =   require("fs");

var port = process.argv[2] || 7001;

var filename_useast1 = path.join(process.cwd(), "us-east-1.json");
var filename_uswest2 = path.join(process.cwd(), "us-west-1.json");
var filename_euwest1 = path.join(process.cwd(), "eu-west-2.json");
var filename_artwork = path.join(process.cwd(), "artwork.json");

var isRecordMode = function() {
  var result = false;
  process.argv.forEach(function(arg) {
    if(arg === 'record') {
      console.log("Record mode");
      result = true;
    }
  });

  if(result) {
    startFiles();
  }

  return result;
}();


process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down from (Ctrl-C)" );

  if(isRecordMode) {
    finalizeFiles();
  }
  process.exit( );
});


var play_useast1;
var play_uswest2;
var play_euwest1;
var play_artwork;

var isPlayMode = function() {
  var result = false;
  process.argv.forEach(function(arg) {
    if(arg === 'play') {
      console.log("Play mode");
      result = true;
    }
  });

  if(result) {
    play_useast1 = JSON.parse(fs.readFileSync(filename_useast1));
    play_uswest2 = JSON.parse(fs.readFileSync(filename_uswest2));
    play_euwest1 = JSON.parse(fs.readFileSync(filename_euwest1));
    play_artwork = fs.readFileSync(filename_artwork);
  }

  return result;
}();



var NOTFOUND = -1;

var secs = function(n) {
  return 1000 * n;
};

var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css"
};


function getHeaders() {
  var headers = {};
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
  headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Access-Control-Allow-Origin";
  //headers["Access-Control-Allow-Credentials"] = false;
  //headers["Access-Control-Max-Age"] = '86400'; // 24 hours
  return headers;
}


// get artwork data
function getHttp(url, type, fn, errFn) {
  var data = '';

  console.log("Sending " + url);
  http.get(url, function(resp) {
    resp.on('data', function(chunk) {
      data += chunk;
    });

    resp.on('end', function() {
      console.log(trunc(data));

      fn(data);
    });

    resp.on('error', function(err) {
      console.log('getHttp error: ' + err);
      if(errFn) { errFn(err); }
    });
  });
}

function trunc(text) {
  var limit = 100;

  if(text.length > limit) {
    return text.substring(0, limit) + "...";
  } else {
    return text;
  }

}


function getHttpRx(url, type) {
  console.log("Sending: " + url);

  var observable = Rx.Observable.create(function(obs) {

    if(isPlayMode) {
      console.log("Event data from file");
      obs.onNext(getNextRecordedData(url));
      obs.onCompleted();

    } else {
      getHttp(url, type,
        function(data) {
          console.log(trunc(data));
          writeToFile(url, data);
          obs.onNext(data);
          obs.onCompleted();
        },
        function() {
          // on errors complete so that associated requests can continue
          obs.onCompleted();
        });
    }

    return function() {};
  });
  return observable;
}

var index_useast1 = 0;
var index_uswest2 = 0;
var index_euwest1 = 0;


function getNextRecordedData(url) {
  var data;

  if(url.indexOf("citools.us-east-1") !== NOTFOUND) {
    index_useast1 += 1;
    if(index_useast1 > play_useast1.length) {
      index_useast1 = 0;
    }
    data = play_useast1[index_useast1];
  } else if(url.indexOf("citools.us-west-2") !== NOTFOUND) {
    index_uswest2 += 1;
    if(index_uswest2 > play_uswest2.length) {
      index_uswest2 = 0;
    }
    data = play_euwest1[index_euwest1];
  } else if (url.indexOf("citools.eu-west-1") !== NOTFOUND) {
    index_euwest1 += 1;
    if(index_euwest1 > play_euwest1.length) {
      index_euwest1 = 0;
    }
    data = play_euwest1[index_euwest1];
  }

  return JSON.stringify(data);
}

function startFiles() {
  console.log("Start recorded files");
  fs.appendFileSync(filename_useast1, "[\n");
  fs.appendFileSync(filename_uswest2, "[\n");
  fs.appendFileSync(filename_euwest1, "[\n");
  fs.appendFileSync(filename_artwork, "[\n");
}

var hasData_useast1 = false;
var hasData_uswest2 = false;
var hasData_euwest1 = false;
var hasData_artwork = false;


function writeToFile(url, data) {
  if(!isRecordMode) {
    return;
  }
  console.log("Writing to file");

  var datafile, prependComma;
  if(url.indexOf("citools.us-east-1") !== NOTFOUND) {
    datafile = filename_useast1;
    prependComma = hasData_useast1;
    hasData_useast1 = true;

  } else if(url.indexOf("citools.us-west-2") !== NOTFOUND) {
    datafile = filename_uswest2;
    prependComma = hasData_uswest2;
    hasData_uswest2 = true;

  } else if (url.indexOf("citools.eu-west-1") !== NOTFOUND) {
    datafile = filename_euwest1;
    prependComma = hasData_euwest1;
    hasData_euwest1 = true;

  } else if (url.indexOf("jbutsch/getArtWork") !== NOTFOUND) {
    datafile = filename_artwork;
    prependComma = hasData_artwork;
    hasData_artwork = true;
  }

  console.log("File: " + datafile);

  if(prependComma) {
    fs.appendFileSync(datafile, ",\n" + data);
  } else {
    fs.appendFileSync(datafile, data);
  }
}


function finalizeFiles() {
  console.log("Finalize recorded files");
  fs.appendFileSync(filename_useast1, "\n]");
  fs.appendFileSync(filename_uswest2, "\n]");
  fs.appendFileSync(filename_euwest1, "\n]");
  fs.appendFileSync(filename_artwork, "\n]");
}



var eastTmp = 'http://citools.us-east-1.prod.netflix.com/clientinfo/api/esi/logblobs?user=jbutsch%40netflix.com&logblobTypes=startplay&lastN=50&startSearchTimestampMsec={time}&isGeoMap=true';
var westTmp = 'http://citools.us-west-2.prod.netflix.com/clientinfo/api/esi/logblobs?user=jbutsch%40netflix.com&logblobTypes=startplay&lastN=50&startSearchTimestampMsec={time}&isGeoMap=true';
var euTmp = 'http://citools.eu-west-1.prod.netflix.com/clientinfo/api/esi/logblobs?user=jbutsch%40netflix.com&logblobTypes=startplay&lastN=50&startSearchTimestampMsec={time}&isGeoMap=true';
var videoTmp = 'http://api-int-be-1283610733.us-east-1.elb.amazonaws.com:7001/jbutsch/getArtWork?videoIds={mids}&widths=200&types=sdp,personalize=true';


http.createServer(function(req, resp) {
  try {

    // CORS option requests
    if (req.method === 'OPTIONS') {
      console.log("Options request");
      var headers = getHeaders();
      resp.writeHead(200, headers);
      resp.end();

    // other requests
    } else {
      console.log("Non-options request");

      var parsedUrl = url.parse(req.url, true);

      // API requests
      if(parsedUrl.pathname.indexOf("api") !== NOTFOUND) {

        if (parsedUrl.pathname.indexOf("events") !== NOTFOUND) {
          console.log("events request");
          eventsRequestHandler(resp);

        } else if (parsedUrl.pathname.indexOf("videos") !== NOTFOUND) {
          console.log("videos request");
          movieRequestHandler(parsedUrl.query, resp);
        }

      // static files
      } else {
        console.log("static file request");
        console.log("pathname: " + parsedUrl.pathname);

        var pathname = parsedUrl.pathname;
        if(pathname.length === 0 || pathname === "/" ) {
          console.log("default index.html");
          pathname = 'index.html';
        }

        var filename = path.join(process.cwd(), pathname);

        console.log("file: " + filename);

        fs.exists(filename, function(exists) {
          if(!exists) {
            console.log("File not found: " + filename);
            resp.writeHead(404, {'Content-Type': 'text/plain'});
            resp.write('404 Not Found\n');
            resp.end();

          } else {
            var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
            resp.writeHead(200, mimeType);

            var fileStream = fs.createReadStream(filename);
            fileStream.pipe(resp);
          }
        });

      }
    }

  } catch (ex) {
    console.log("Request exception: " + ex);
  }

}).on('error', function(e) {
  console.log("http.get() error: ", e);

}).listen(parseInt(port, 10));


// Gets movie logs from 3 regions
function eventsRequestHandler(resp) {
  console.log("Events request");

  var time = Date.now() - secs(10);
  var eastQuery = eastTmp.replace("{time}", time);
  var westQuery = westTmp.replace("{time}", time);
  var euQuery = euTmp.replace("{time}", time);

  var finalData = { "data": [] };

  try {
    var eastSeq = getHttpRx(eastQuery, 'events east');
    var westSeq = getHttpRx(westQuery, 'events west');
    var euSeq = getHttpRx(euQuery, 'events eu');

    Rx.Observable.merge(eastSeq, westSeq, euSeq).subscribe(
    function(d) {
      console.log("Rx on next");
      finalData.data.push(d);
    },
    function(error) {
      console.log(" Error:" + error);
    },
    function() {
      console.log("Rx on complete");

      var headers = getHeaders();

      resp.writeHead(200, headers);
      resp.write(JSON.stringify(finalData), "utf8");
      resp.end();
    });

  } catch (ex) {
    console.log("eventsRequestHandler exception: " + ex);
  }
}



function movieRequestHandler(query, resp) {
  console.log("Movie query: " + query);

  var mids = query.mids;
  var videoUrl = videoTmp.replace("{mids}", mids);

  if(isPlayMode) {
    console.log("Movie data from file");
    var headers = getHeaders();
    resp.writeHead(200, headers);
    resp.write(play_artwork, "utf8");
    resp.end();

  } else {
    getHttp(videoUrl, 'art',
      function(vidresp) {
        var repair = vidresp.replace(/}{/g, '},{');
        var data = '{"data":[' + repair + ']}';

        var headers = getHeaders();

        resp.writeHead(200, headers);
        resp.write("[" + data + "]", "utf8");
        resp.end();

        if(isRecordMode) {
          writeToFile(videoUrl, data);
        }
      },
      function() {
        resp.end();
      }
    );
  }


}





