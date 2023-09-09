import { argv } from 'node:process';
import Validator from './ComponentValidator.js';

let directories = ["../Components"];

//Only handle file paths as arguments
if(argv.length > 2){
	directories = argv.slice(2);
}

console.log(`Checking Paths: [${directories}]`);
Validator.CheckAllPaths(directories);