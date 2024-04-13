const yauzl = require('yauzl');
const { Buffer } = require('buffer');
const { createWriteStream } = require('fs');

// START DATA

// END DATA

const buffer = Buffer.from(DATA, "base64");

//define exports
module.exports = {
    //fs-like readFile, returns buffer via callback
    "readFile": function(pattern, callback) {
        read(buffer, pattern, function(err, res) {
            if(!err) {
                let stream = res;
                let buf = [];

                stream.on('data', function(data) {
                    buf.push(data);
                })
                stream.on('end', function() {
                    callback(undefined, Buffer.concat(buf));
                })
            } else {
                callback(err);
            }
        })
    },

    //copyFile - similar to readFile but outputs to a path instead of returning a buffer
    "copyFile": function(pattern, output, callback=()=>{}) {
        read(buffer, pattern, (err, res) => {
            if(!err) {
                let out = createWriteStream(output);
                res.pipe(out);
                res.on('end', function() {
                    callback();
                })
            } else {
                callback(err);
            }
        })
    },

    //fs-like reasStream - returns a readstream via callback
    "readStream": function(pattern, callback) {
        read(buffer, pattern, function(err, res) {
            callback(err, res);
        })
    }
}


//read function - returns (error/undef, stream/undef)
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
                            callback(undefined, stream);

                            //handle stream end
                            stream.on('end', function() {
                                zip.close();
                            })
                        } else {
                            callback(err, undefined);
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
                    callback("FILE_NOT_FOUND", undefined);
                }
            })
        } else {
            callback(err, undefined);
        }
    })
}