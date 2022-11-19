import { argv } from 'node:process';
import Validator from './PluginValidator.js';

let directories = ["../Plugins"];
console.log(argv);

//Only handle file paths as arguments
if(argv.length > 2){
	directories = argv.slice(2);
}

console.log(`Checking Paths: [${directories}]`);
Validator.CheckAllPaths(directories);