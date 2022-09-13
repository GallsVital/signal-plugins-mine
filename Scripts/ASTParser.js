import { Project } from "ts-morph";
import { argv } from 'node:process';
import { Console } from "node:console";

let dryrun = false;

argv.forEach((val, index) => {
	console.log(`${index}: ${val}`);

	switch(val){
	case("--dryrun"):{
		dryrun = true;
	}
	}
});


const project = new Project();
let ChangedComments = 0;

const PluginPath = "Plugins\\Corsair_K95_Plat_XT_Keyboard_ModernCorsairProtocol.js";
ProcessPlugin(PluginPath);

function ProcessPlugin(PluginPath){
	const pluginFile = InitPlugin(PluginPath);

	if(!pluginFile){
		console.log(`Plugin Does not exist at path: [${PluginPath}]`);

		return;
	}

	InsertTypeComments(pluginFile);
	InsertParametersComment(pluginFile);

	if(!dryrun){
		console.log(`Changed [${ChangedComments}] Comments!`);
		pluginFile.save();
	}else{
		console.log(`Changed [${ChangedComments}] Comments if this wasn't a dry run!`);
	}
}

function InitPlugin(PluginPath){
	project.addSourceFileAtPath(PluginPath);

	const pluginFile = project.getSourceFile(PluginPath);

	return pluginFile;
}

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
};


function AddFunctionTypeComment(pluginFile, FunctionName, FunctionType){
	const Function = pluginFile.getFunction(FunctionName);

	if(Function){
		if(Function.getJsDocs().length === 0){
			ChangedComments += 1;
			Function.addJsDoc({
				tags: [{
					tagName: "type",
					text: `{${FunctionType}}`,
				}]
			});
		}
	}
}

function InsertTypeComments(pluginFile){
	for(const functionName in FunctionTypes){
		AddFunctionTypeComment(pluginFile, functionName, FunctionTypes[functionName]);
	}
}


function InsertParametersComment(pluginFile){
	console.log(GetCurrentParameterComment(pluginFile));
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