//this is the generator file. It intakes specified files, zips them, converts them to base64 and embeds them in the template
//files is a string array of paths to be included (relative to the root of the project)
//  all are assumed to be absolute paths stemming from the root of the project
//  path can end with * to specify all files in the directory (does not include subdirectories).
//  path can end with **/* to specify all files and subdirectories
//config specifies:
//  compress: boolean
//  typescript: boolean
const fs = require('fs');
const path = require('path');
const yazl = require('yazl');
const readline = require('readline');
const { Buffer } = require('buffer');

const {
    glob,
    globSync,
    globStream,
    globStreamSync,
    Glob,
} = require('glob')

//configuration
const PATCH_PRIMER = "// START DATA";

module.exports = function(f, output, config) {
    let zip = new yazl.ZipFile();
    let buffers = [];
    let encoding = "";

    //direct output to buffers
    zip.outputStream.on('data', function(data) {
        buffers.push(data);
    })
    zip.outputStream.on('close', function() {
        console.log("Encoding data ...");
        encoding = Buffer.concat(buffers).toString("base64");
        
        //patch the template
        console.log(`Patching template ...`);
        patch(path.join(__dirname, "./templates/template.js"), encoding, output);
    })

    //start loop and handle next
    _recurseFiles(f, function(err) {
        if(!err) {
            console.log("Waiting for output stream to drain ...");
        } else {
            console.log(err);
        }
    });

    function _recurseFiles(files, callback) {
        if(files.length > 0) {
            addToZip(zip, files[0], process.cwd(), function(err) {
                if(!err) {
                    _recurseFiles(files.slice(1), callback);
                } else {
                    callback(err);
                }
            })
        } else {
            zip.end();
            callback();
        }
    }
}


function addToZip(zip, pattern, root=".", callback) {
    if(pattern.includes("*")) {
        //wildcard
        try {
            let files = globSync(pattern, {cwd: root, nodir:true, absolute:true});
            for(let i = 0; i < files.length; i++) {
                let file = files[i];
                zip.addFile(file, path.relative(root, file));
                console.log(`Add: ${file}`);
            }
            callback();
        } catch (e) {
            console.log(`File match error: ${err}`);
            callback("ERR_MATCH_FAILED");
        }
    } else {
        //file path
        if(fs.existsSync(pattern)) {
            if(!fs.statSync(pattern).isDirectory()) {
                console.log(`Add: ${pattern}`);
                zip.addFile(pattern, path.relative(root, pattern));
                callback();
            } else {
                //do not handle directories directly
                console.log(`Cannot directly add directory (use **/*): ${pattern}`);
                callback("ERR_NO_DIRECTORY");
            }
        } else {
            //file doesnt exist (existSync failed)
            console.log(`Cannot access: ${pattern}`);
            callback("ERR_FILE_NOT_FOUND");
        }
    }
}


//patcher function, given template path, encoding and output, generates a rom module
function patch(template, data, output) {
    let primed = false;
    let out = fs.createWriteStream(output);

    //create interface
    const rl = readline.createInterface({
        input: fs.createReadStream(template),
        crlfDelay: Infinity
    })

    //handle lines
    rl.on('line', function(line) {
        if(primed) {
            out.write(`const DATA = "${data}";\n`);
            primed = false;
        } else {
            out.write(line + "\n");
        }

        if(line.includes(PATCH_PRIMER)) {
            primed = true;
        }
    })

    rl.on('close', function() {
        out.close();
        console.log(`Generated: ${output}`);
    })
}