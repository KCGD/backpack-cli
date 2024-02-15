#!/usr/bin/env node
//this is the cli file. It provides a cli interface for index.js
//by default reads rom.config.json
//expects properties: files as an array of paths, output as a path

const fs = require('fs');
const path = require('path');
const generator = require('./index.js')

const configpath = path.join(__dirname, "./rom.config.json");

Main();
function Main() {
    if(fs.existsSync(configpath)) {
        try {
            let config = JSON.parse(fs.readFileSync(configpath));
            if(config.files && config.output) {
                if(config.files.length > 0) {
                    generator(config.files, config.output);
                } else {
                    throw "Empty file list";
                }
            } else {
                throw "Mssing properties";
            }
        } catch (e) {
            console.log(`Malformed config file: ` + e);
            process.exit(1);
        }
    } else {
        console.log(`Could not locate rom.config.json (${configpath})`);
        process.exit(1);
    }
}