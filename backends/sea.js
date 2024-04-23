const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

module.exports = function(f, output, config) {
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
    fs.copyFileSync(path.join(__dirname, "../templates/sea.template.js"), output);
}