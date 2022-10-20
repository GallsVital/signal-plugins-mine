import { Project, NewLineKind } from "ts-morph";
import { argv } from 'node:process';
import { Console } from "node:console";
import * as url from 'url';
import fs from 'fs';
import path from 'path';

let dryrun = false;
let AddComments = false;
let AddTypes = false;
let sortFunctions = false;

argv.forEach((val, index) => {
	console.log(`${index}: ${val}`);

	switch(val){
	case("--dryrun"):{
		dryrun = true;
	}

	case("--comments"):{
		AddComments = true;
	}

	case("--types"):{
		AddTypes = true;
	}

	case("--order"):{
		sortFunctions = true;
	}
	}
});

// @ts-ignore
const CurrentDirectoryURL = new URL('.', import.meta.url);
const DirectoryName = path.join(url.fileURLToPath(CurrentDirectoryURL), "..", "Plugins");
const project = new Project();

const FunctionTypes = {
	"Name" : "NameExport",
	"DefaultScale": "DefaultScaleExport",
	"LedNames": "LedNamesExport",
	"LedPositions": "LedPositionsExport",
	"VendorId": "VendorIdExport",
	"ProductId": "ProductIdExport",
	"Publisher": "PublisherExport",
	"Documentation": "DocumentationExport",
	"Size": "SizeExport",
	"DefaultPosition": "DefaultPositionExport",
	"ConflictingProcesses": "ConflictingProcessesExport",
	"ControllableParameters": "ControllableParametersExport",
	"Validate": "ValidateExport",
	"Scan" : "ScanExport"
};

const FunctionOrder = {
	"Name": 1,
	"VendorId": 2,
	"ProductId": 3,
	"Publisher": 4,
	"Documentation": 5,
	"Size": 6,
	"DefaultPosition": 7,
	"DefaultScale": 8,
	"ControllableParameters": 9,
	"LedNames": 10,
	"LedPositions": 11,
	"Validate": 12,
	"Initialize": 13,
	"Render": 14,
	"Shutdown" : 15,
};

const PluginPath = "Plugins\\Corsair_K95_Plat_XT_Keyboard_ModernCorsairProtocol.js";
//const PluginPath = "Plugins\\Corsair_Dominator_Ram.js";

//ProcessPlugin(PluginPath);
ScanPlugins();

function getAllFiles(dirPath, arrayOfFiles) {
	const files = fs.readdirSync(dirPath);

	arrayOfFiles = arrayOfFiles || [];

	files.forEach(function(file) {
		if (fs.statSync(dirPath + "/" + file).isDirectory()) {
			arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
		} else {
			arrayOfFiles.push(path.join(dirPath, "/", file));
		}
	});

	return arrayOfFiles;
}

export async function ScanPlugins(){
	const PluginFiles = getAllFiles(DirectoryName);
	let ChangedFiles = 0;
	const ChangedFileNames = [];

	for(let iIdx = 0; iIdx < PluginFiles.length; iIdx++){
		const plugin = PluginFiles.at(iIdx);

		try{
			const ReturnValue = await ProcessPlugin(plugin);

			if(ReturnValue){
				ChangedFileNames.push(plugin);
				ChangedFiles++;
			}
		}catch(e){
			console.log(e);
		}
	}

	console.log("File Paths Edited:");
	console.log(ChangedFileNames);
	console.log(`Changed [${ChangedFiles}] files${dryrun ? " if this wasn't a dry run." : "."}`);

}

async function ProcessPlugin(PluginPath){
	console.log(` Plugin at Path: [${PluginPath}]`);

	const pluginFile = InitPlugin(PluginPath);

	if(!pluginFile){
		console.log(`Plugin Does not exist at path: [${PluginPath}]`);

		return;
	}

	let iRet = 0;

	if(AddComments){
		iRet |= await InsertParametersComment(pluginFile, PluginPath);
	}

	// if(sortFunctions){
	// 	for(const functionName in FunctionOrder){
	// 		const Function = pluginFile.getFunction(functionName);
			
	// 		if(Function){
	// 			if(Function.getChildIndex() != FunctionOrder[functionName]){
	// 				console.log(`Function [${functionName}] is likely out of order! Should be at position [${FunctionOrder[functionName]} instead of [${Function.getChildIndex()}]]`)
	// 			}
	// 		}
	// 	}
	// }

	// if(AddTypes){
	// 	iRet |= InsertTypeComments(pluginFile);
	// }

	if(!dryrun){
		pluginFile.save();
	}

	return iRet;
}

function InitPlugin(PluginPath){
	project.addSourceFileAtPath(PluginPath);

	const pluginFile = project.getSourceFile(PluginPath);

	return pluginFile;
}


function AddFunctionTypeComment(pluginFile, FunctionName, FunctionType){
	const Function = pluginFile.getFunction(FunctionName);

	if(Function){
		if(Function.getJsDocs().length === 0){
			Function.addJsDoc({
				tags: [{
					tagName: "type",
					text: `{${FunctionType}}`,
				}]
			});
		}
	}

	return 1;
}

function InsertTypeComments(pluginFile){
	let iRet = 0;

	for(const functionName in FunctionTypes){
		iRet |= AddFunctionTypeComment(pluginFile, functionName, FunctionTypes[functionName]);
	}

	return iRet;
}


async function InsertParametersComment(pluginFile, PluginPath){
	const currentComment = GetCurrentParameterComment(pluginFile);

	const parameters = await FetchControllableParameters(PluginPath);

	//console.log(parameters);
	const neededComment = CreateGlobalsComment(parameters);

	if(currentComment != neededComment){
		console.log("ESLint Comment Invalid! \nFound:");
		console.log(currentComment);
		console.log("\nWanted:");
		console.log(neededComment);

		console.log("Replacing Current Comments");
		SetControllableParametersComment(pluginFile, neededComment);

		console.log("\nNew Comments:");
		console.log(GetCurrentParameterComment(pluginFile));

		return 1;
	}

	return 0;
}

// Get ESLint global comments if they exist.
function GetCurrentParameterComment(pluginFile){
	const test = pluginFile.getFunction("ControllableParameters");

	if(test){
		const comments = test.getLeadingCommentRanges()[0];

		if(comments){
			return comments.getText();
		}
	}

	return "";
}

function SetControllableParametersComment(pluginFile, Comment){
	const test = pluginFile.getFunction("ControllableParameters");

	if(test){
		const comments = test.getLeadingCommentRanges()[0];

		if(comments){
			pluginFile.replaceText([comments.getPos(), comments.getEnd()], Comment);
		}
	}
}

function CreateGlobalsComment(parameters){
	let globalsString = "/* global\n";

	for(let i = 0; i < parameters.length; i ++){
		if(parameters[i].property){
			globalsString += parameters[i].property + ":readonly\n";
		}
	}

	globalsString += "*/";

	return globalsString;
}

async function FetchControllableParameters(pluginFile){
	const filePathUrl = url.pathToFileURL(pluginFile);
	// @ts-ignore
	const pluginModule = await import(filePathUrl);
	console.log(`\nChecking Plugin at path: [${pluginFile}]`);

	if(!pluginModule.ControllableParameters){
		console.log("ControllableParameters() does not exist. Cannot Add Global Variables.");

		return 0;
	}
	let parameters;

	try{
		parameters = pluginModule.ControllableParameters();
	}catch(e){
		console.log(e);

		return [];
	}

	return parameters;
}