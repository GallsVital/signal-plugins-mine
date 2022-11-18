import fs from 'fs';
import path from 'path';
import * as url from 'url';

// @ts-ignore
const CurrentDirectoryURL = new URL('.', import.meta.url);
const DirectoryName = path.join(url.fileURLToPath(CurrentDirectoryURL), "..", "Plugins");

ScanPlugins();

async function ScanPlugins(){
	const PluginFiles = getAllFilePaths(DirectoryName);
	let ErroredFiles = 0;

	for(let iIdx = 0; iIdx < PluginFiles.length; iIdx++){
		const PluginPath = PluginFiles.at(iIdx);

		try{
			const filePathUrl = url.pathToFileURL(PluginPath).toString();
			// Checking if the file loads without an error.
			// If we error here we skip any other tests
			const pluginModule = await import(filePathUrl);
			await CheckPluginFile(pluginModule);
		}catch(e){
			console.log(PluginPath);
			console.log(e);
			console.log("\n");
			ErroredFiles++;
		}
	}

	console.log(`[${ErroredFiles}] file(s) had errors that prevented module loading.`);

	if(ErroredFiles > 0){
		process.exit(1);
	}
}

async function CheckPluginFile(Plugin){

	// Add Checks here
	CheckThatLEDNameAndPositionLengthsMatch(Plugin);
	CheckAllLedPositionsAreWithinBounds(Plugin);
	CheckForGPUListDuplicates(Plugin);
}

function CheckThatLEDNameAndPositionLengthsMatch(Plugin){
	if(typeof Plugin.LedPositions === "undefined"){
		return;
	}
	const LedNames = Plugin.LedNames();
	const LedPositions = Plugin.LedPositions();

	if(LedNames.length !== LedPositions.length){
		throw `Led Name and Position differ in length! Led Painting and key press effects will not function. Led Names [${LedNames.length}], Led Positions: [${LedPositions.length}]`
	}
}


function CheckAllLedPositionsAreWithinBounds(Plugin){
	if(typeof Plugin.LedPositions === "undefined"){
		return;
	}

	const [width, height] = Plugin.Size();
	const LedPositions = Plugin.LedPositions();
	let ValidPositions = true;

	LedPositions.forEach(Position => {
		if(Position[0] < 0 || Position[0] >= width){
			console.log(`Led X coordinate is out of bounds. [${Position[0]}] is not inside the plugins width (0-${width})`);
			ValidPositions = false;
		}

		if(Position[1] < 0 || Position[1] >= height){
			console.log(`Led Y coordinate is out of bounds. [${Position[1]}] is not inside the plugins height (0-${height})`);
			ValidPositions = false;
		}
	});

	if(!ValidPositions){
		throw "Plugin has out of bounds Led Positions";
	}
}

function CheckForGPUListDuplicates(Plugin){
	if(typeof Plugin.BrandGPUList !== "undefined"){
		if(Plugin.BrandGPUList().CheckForDuplicates()){
			console.log("FOUND PLUGIN FILE WITH DUPLICATES");
		}
	}
}

function getAllFilePaths(dirPath, arrayOfFiles = []) {
	const files = fs.readdirSync(dirPath);

	files.forEach(function(file) {
		if (fs.statSync(dirPath + "/" + file).isDirectory()) {
			arrayOfFiles = getAllFilePaths(dirPath + "/" + file, arrayOfFiles);
		} else {
			// Ignore test files
			if(!file.endsWith("test.js")){
				arrayOfFiles.push(path.join(dirPath, "/", file));
			}
		}
	});

	return arrayOfFiles;
}