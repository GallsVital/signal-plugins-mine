
import fs from 'fs';
import path from 'path';
import * as url from 'url';

const DirectoryName = ".\\Plugins";

const getAllFiles = function(dirPath, arrayOfFiles) {
	const files = fs.readdirSync(dirPath);

	arrayOfFiles = arrayOfFiles || [];

	files.forEach(function(file) {
		if (fs.statSync(dirPath + "/" + file).isDirectory()) {
			arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
		} else {
			arrayOfFiles.push(path.join(url.fileURLToPath(new URL('.', import.meta.url)), dirPath, "/", file));
		}
	});

	return arrayOfFiles;
};

export async function ScanPlugins(){
	const PluginFiles = getAllFiles(DirectoryName);
	let ChangedFiles = 0;
	for(let iIdx = 0; iIdx < PluginFiles.length; iIdx++){
		const plugin = PluginFiles.at(iIdx);
		//console.log(plugin);

		ChangedFiles += await loadPlugin(plugin);
	}
	console.log(`Changed [${ChangedFiles}] files.`)
}

async function loadPlugin(PluginPath){

	const filePathUrl = url.pathToFileURL(PluginPath);
	const pluginModule = await import(filePathUrl);
	console.log(`\nChecking Plugin at path: [${PluginPath}]`);

	if(!pluginModule.ControllableParameters){
		console.log("ControllableParameters() does not exist. Cannot Add Global Variables.");

		return 0;
	}
	let parameters;

	try{
		parameters = pluginModule.ControllableParameters();
	}catch(e){
		console.log(e);

		return 0;
	}

	const commentString = CreateGlobalsComment(parameters);

	const fileData = fs.readFileSync(filePathUrl);
	const myBuffer = Buffer.from(fileData);
	let dataString = myBuffer.toString();

	const [start, end] = FindCommentPosition(dataString);
	if(!CheckCurrentComment(dataString, commentString, start, end)){
		console.log("Current Comment doesn't match the expected. Removing it.");
		dataString = RemoveRange(dataString, start, end);
	}


	const insert = FindInsertStart(dataString);
	dataString = InsertAtLocation(dataString, commentString, insert);

	//fs.writeFileSync("output.js", dataString);
	fs.writeFileSync(PluginPath, dataString);

	return 1;
	//console.log(commentString);
}

function CheckCurrentComment(dataString, commentString, start, end){
	if(start === -1 || end === -1){
		console.log(`Globals comment does not exist. Skipping Check of current Comment.`);

		return dataString;
	}

	const CurrentComment = dataString.substr(start, end-start+3);
	//console.log(commentString);
	//console.log(CurrentComment);
	//console.log(CurrentComment.replace(/[^a-zA-Z:*/]/g, "") === commentString.replace(/[^a-zA-Z:*/]/g, ""));

	// Check after striping linebreaks
	return CurrentComment.replace(/[^a-zA-Z:*/]/g, "") == commentString.replace(/[^a-zA-Z:*/]/g, "");

}

function CreateGlobalsComment(parameters){
	let globalsString = "/* global\n";

	for(let i = 0; i < parameters.length; i ++){
		if(parameters[i].property){
			globalsString += parameters[i].property + ":readonly\n";
		}
	}

	globalsString += "*/\n";

	return globalsString;
}

function FindCommentPosition(dataString){
	const start = dataString.indexOf("/* global");
	//console.log(`Start Position: [${start}]`);

	const end = dataString.indexOf("*/", start);
	//console.log(`End Position: [${end}]`);

	return [start, end];
}

function RemoveRange(dataString, start, end){
	if(start === -1 || end === -1){
		console.log(`Globals comment does not exist. Skipping Removal.`);
		return dataString;
	}

	dataString = dataString.substr(0, start-1) + dataString.substr(end + 3);

	return dataString;
}

function InsertAtLocation(dataString, insertString, insert){
	if(insert === -1){
		console.log("ControllableParameters() does not exist. Cannot Add Global Variables.");

		return dataString;
	}

	dataString = dataString.substr(0, insert) + insertString + dataString.substr(insert);

	return dataString;
}

function FindInsertStart(dataString){
	const insertPoint = dataString.indexOf("export function ControllableParameters()");
	//console.log(`Insert Position: [${insertPoint}]`);

	return insertPoint;
}

ScanPlugins();

const testFile = ".\\Plugins\\Corsair_K95_Plat_XT_Keyboard_ModernCorsairProtocol.js";
const test = ".\\Plugins\\CoolerMaster\\Cooler_Master_Gen2_LED_Controller_A1_0x01c9.js";
//loadPlugin(testFile);

