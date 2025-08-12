//this is the generator file. It intakes specified files, zips them, converts them to base64 and embeds them in the template
//files is a string array of paths to be included (relative to the root of the project)
//  all are assumed to be absolute paths stemming from the root of the project
//  path can end with * to specify all files in the directory (does not include subdirectories).
//  path can end with **/* to specify all files and subdirectories
//config specifies:
//  compress: boolean
//  typescript: boolean
import * as fs from "fs";
import * as path from "path";
import romBackend from "./backends/rom.js";
import seaBackend from "./backends/sea.js";
import { compareVersions } from 'compare-versions';

const SEA_REQUIRED_VERSION = '21.7.3';

export default function(f, output, config) {
    //decide which backend to use
    let version = process.versions.node;
    if(process.argv.includes("--use-sea")) {
        //validate node versios
        if(compareVersions(version, SEA_REQUIRED_VERSION) >= 0) {
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