import { createWriteStream, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import * as sea from "node:sea";
import * as path from "path";
import { Readable } from 'stream';

// START DATA

// END DATA

const MAP_OBJECT = JSON.parse(MAP);

module.exports = {
    //reads file, returns as buffer in callback(error, buffer)
    "readFile": function(key, callback) {
        read(key, callback);
    },

    "readFileSync": function(key) {
        return readSync(key);
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

    "readStreamSync": function(key) {
        return Readable.from(readSync(key));
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
    },

    "copyFileSync": function(key, output) {
        writeFileSync(output, readSync(key));
    },

    "copyDirectory": function(key, outdir, callback) {
        let files = [];
        let keys = Object.keys(MAP_OBJECT);
        for(let i = 0; i < keys.length; i++) {
            if(keys[i].startsWith(key)) {
                files.push(path.relative(key, keys[i]));
            }
        }

        //at this point, files is a list of files in the source directory to be copied
        for(let i = 0; i < files.length; i++) {
            let file = files[i];
            let fullOutputPath = path.join(outdir, file);
            if(!existsSync(path.dirname(fullOutputPath))) {
                try {
                    mkdirSync(path.dirname(fullOutputPath), {'recursive':true});
                } catch (e) {
                    callback(e);
                }
            }

            //copy file
            this.copyFile(path.join(key, file), fullOutputPath, function(e) {
                if(e) {
                    console.log(e)
                    callback(e);
                }
            })
        }
    },

    "copyDirectorySync": function(key, outdir) {
        let files = [];
        let keys = Object.keys(MAP_OBJECT);
        for(let i = 0; i < keys.length; i++) {
            if(keys[i].startsWith(key)) {
                files.push(path.relative(key, keys[i]));
            }
        }

        //at this point, files is a list of files in the source directory to be copied
        for(let i = 0; i < files.length; i++) {
            let file = files[i];
            let fullOutputPath = path.join(outdir, file);
            if(!existsSync(path.dirname(fullOutputPath))) {
                try {
                    mkdirSync(path.dirname(fullOutputPath), {'recursive':true});
                } catch (e) {
                    throw e;
                }
            }

            //copy file
            this.copyFileSync(path.join(key, file), fullOutputPath);
        }
    }
}

//accepts key, callback(error string or undefined, data as buffer)
function read(key, callback) {
    if(!sea.isSea() && !PASSTHROUGH) {
        callback("NODE_NOT_SEA", undefined);
    } else {
        try {
            if(PASSTHROUGH) {
                callback(undefined, Buffer.from(readFileSync(MAP_OBJECT[key])));
            } else {
                callback(undefined, Buffer.from(sea.getRawAsset(key)));
            }
        } catch (e) {
            callback(e, undefined);
        }
    }
}

function readSync(key) {
    if(!sea.isSea() && !PASSTHROUGH) {
        throw "NODE_NOT_SEA"
    } else {
        if(PASSTHROUGH) {
            return Buffer.from(readFileSync(MAP_OBJECT[key]));
        } else {
            return Buffer.from(sea.getRawAsset(key));
        }
    }
}
