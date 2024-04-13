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

//configuration
const PATCH_PRIMER = "// START DATA";

//globals
let totalsize = 0;
let totalfiles = 0;

module.exports = function(f, output, config) {
    romBackend(f, output, config);
}