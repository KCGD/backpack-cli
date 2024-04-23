const { createWriteStream } = require('fs');
const sea = require('node:sea');
const { Readable } = require('stream');

module.exports = {
    //reads file, returns as buffer in callback(error, buffer)
    "readFile": function(key, callback) {
        read(key, callback);
    },

    //read file as stream, returns in callback
    "readStream": function(key, callback) {
        read(key, function(e, data) {
            if(!data || e) {
                callback(e, undefined);
            } else {
                callback(undefined, Readable.from(data));
            }
        })
    },

    //copy file to output path. callback error if present, otherwise callback w/ undefined
    "copyFile": function(key, output, callback) {
        this.readStream(key, function(e, stream) {
            if(e) {
                callback(e);
            } else {
                let out;
                try {
                    out = createWriteStream(output);
                } catch (e) {
                    callback(e);
                }

                stream.pipe(out);
                
                stream.on('end', () => {
                    callback(undefined);
                })
            }
        })
    }
}

//accepts key, callback(error string or undefined, data as buffer)
function read(key, callback) {
    if(!sea.isSea()) {
        callback("NODE_NOT_SEA", undefined);
    } else {
        try {
            callback(undefined, Buffer.from(sea.getRawAsset(key)));
        } catch (e) {
            callback(e, undefined);
        }
    }
}