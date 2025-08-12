#!/usr/bin/env node
//this is the cli file. It provides a cli interface for index.js
//by default reads rom.config.json
//expects properties: files as an array of paths, output as a path

import fs from 'fs';
import path from 'path';
import generator from './index.js';

const configpath = path.join(process.cwd(), "./rom.config.json");

Main();
function Main() {
    if(fs.existsSync(configpath)) {
        try {
            let config = JSON.parse(fs.readFileSync(configpath));
            if(config.files && config.output) {
                if(config.files.length > 0) {
                    generator(config.files, config.output, config);
                } else {
                    throw "Empty file list";
                }
            } else {
                throw "Mssing properties";
            }
        } catch (e) {
            console.log(`Malformed config file: ` + e);
            console.log(`Looked for: "${configpath}"`);
            throw e;
        }
    } else {
        console.log(`Could not locate rom.config.json (${configpath})`);
        process.exit(1);
    }
}