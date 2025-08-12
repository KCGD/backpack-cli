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
const romBackend = require("./backends/rom");
const seaBackend = require("./backends/sea");

const SEA_REQUIRED_VERSION = '21.7.3';

module.exports = function(f, output, config) {
    //decide which backend to use
    let version = process.versions.node;
    if(process.argv.includes("--use-sea")) {
        //validate node version
        let version_ok = true;

        // version - major
        if(parseInt(version.split(".")[0]) < parseInt(SEA_REQUIRED_VERSION.split(".")[0])) {
            version_ok = false;
        }

        // version - minor
        else if(parseInt(version.split(".")[1]) < parseInt(SEA_REQUIRED_VERSION.split(".")[1])) {
            version_ok = false;
        }

        // version - patch
        else if(parseInt(version.split(".")[2]) < parseInt(SEA_REQUIRED_VERSION.split(".")[2])) {
            version_ok = false;
        }

        if(version_ok) {
            seaBackend(f, output, config, process.argv.includes("--passthrough"));
        } else {
            //node version too low
            console.log(`Sea backend requires node version ${SEA_REQUIRED_VERSION} or greater. You are running ${version}`);
            process.exit(1);
        }
    } else {
        console.log("Using ROM backend");
        romBackend(f, output, config);
    }
}