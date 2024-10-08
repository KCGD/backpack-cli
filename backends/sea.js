const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { globSync } = require('glob');

const PATCH_PRIMER = "// START DATA";

module.exports = function(f, output, config, passthrough) {
    //make sure sea config exists (expected in config.seaConfigPath)
    let seaConfigPath
    if(path.isAbsolute(config.seaConfigPath)) {
        seaConfigPath = config.seaConfigPath;
    } else {
        seaConfigPath = path.join(process.cwd(), config.seaConfigPath);
    }
    if(!fs.existsSync(seaConfigPath)) {
        console.log(`ERROR: sea config not found in specified path: ${seaConfigPath}`);
    }

    //sea config to be written back to file once patched. target "assets" property (key <file path>: real asset path)
    let seaConfig = JSON.parse(fs.readFileSync(seaConfigPath).toString());

    //warn if using passthrough
    if(passthrough) {
        console.log(`WARN: Using file passthrough! (Rom will read from actual file system)`)
    }

    //run globsync and patch the assets. preserve pre-existing assets
    //f is a str list of files to be included
    const ROOT = ".";
    for(let i = 0; i < f.length; i++) {
        let files = globSync(f[i], {cwd: ROOT, nodir:true, absolute:true});
        for(let ii = 0; ii < files.length; ii++) {
            //make sure file exists, otherwise throw error
            let fileAbsolutePath = files[ii];
            let key = path.relative(ROOT, fileAbsolutePath);
            console.log(`Add: ${fileAbsolutePath}`);

            //throw error if trying to add file that doesn't exist anymore
            if(!fs.existsSync(fileAbsolutePath)) {
                console.log(`ERROR: File "${fileAbsolutePath}" was not found.`);
                process.exit(1);
            }
            seaConfig.assets[key] = fileAbsolutePath; //add file to sea config assets
        }
    }

    //write changes to config file
    console.log(`Write changes to: ${seaConfigPath}`);
    fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));

    //write template
    patch(path.join(__dirname, "../templates/sea.template.js"), JSON.stringify(seaConfig.assets), output, passthrough);
}

//patcher function, given template path, encoding and output, generates a rom module
function patch(template, data, output, passthrough) {
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
            out.write(`const MAP = \`${data}\`;\n`);
            out.write(`const PASSTHROUGH = ${passthrough? "true" : "false"};\n`);
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
    })
}