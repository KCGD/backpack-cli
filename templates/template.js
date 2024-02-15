const yauzl = require('yauzl');
const { Buffer } = require('buffer');

// START DATA

// END DATA

const buffer = Buffer.from(DATA, "base64");

//define exports
module.exports = {
    //fs-like readFile, returns buffer via callback
    "readFile": function(pattern, callback) {
        read(buffer, pattern, function(res) {
            if(!res[0] && res[1]) {
                let stream = res[1];
                let buf = [];

                stream.on('data', function(data) {
                    buf.push(data);
                })
                stream.on('end', function() {
                    callback([undefined, Buffer.concat(buf)]);
                })
            } else {
                callback(res);
            }
        })
    },

    //fs-like reasStream - returns a readstream via callback
    "readStream": function(pattern, callback) {
        read(buffer, pattern, function(res) {
            callback(res);
        })
    }
}


//read function - returns array [error/undef, stream/undef]
function read(buffer, file, callback) {
    let found = false;

    yauzl.fromBuffer(buffer, {lazyEntries: true}, (err, zip) => {
        if(!err) {
            zip.readEntry();
            zip.on("entry", function(entry) {
                if(entry.fileName === file) {
                    //file found, open stream
                    found = true;
                    zip.openReadStream(entry, (err, stream) => {
                        if(!err) {
                            callback([undefined, stream]);

                            //handle stream end
                            stream.on('end', function() {
                                zip.close();
                            })
                        } else {
                            callback([err, undefined]);
                        }
                    })
                } else {
                    //entree is not target, continue
                    zip.readEntry();
                }
            })

            //handle zip closure
            zip.on('end', function() {
                if(!found) {
                    callback(["FILE_NOT_FOUND", undefined]);
                }
            })
        } else {
            callback([err, undefined]);
        }
    })
}