import DirectoryWalker from "./DirectoryWalker.js";
import pathLib from "path";
import * as url from 'url';
import base64ToImage from 'base64-to-image';
import fs from 'fs';

async function GetImageFromPlugin(PluginPath){
	const pluginModule = await import(PluginPath);

	if(typeof pluginModule.Image === "undefined"){
		throw `${PluginPath}\n\tPlugin Lacks an Image Export!`;
	}

	const Base64ImageString = pluginModule.Image();

	if(Base64ImageString == ""){
		throw `${PluginPath}\n\tPlugin Exports an empty Image!`;
	}

	return Base64ImageString;
}

async function GetImageFromComponent(PluginPath){
	const componentJson = fs.readFileSync(url.fileURLToPath(PluginPath));

	const component = JSON.parse(componentJson);


	if(typeof component.Image === "undefined"){
		throw `${PluginPath}\n\tComponent Lacks an Image Export!`;
	}

	const Base64ImageString = component.Image;

	if(Base64ImageString == ""){
		throw `${PluginPath}\n\tComponent Exports an empty Image!`;
	}

	return Base64ImageString;
}

for(const Path of DirectoryWalker.walkPaths(["../Plugins"])){
	try{
		const Base64 = "data:image/png;base64," + await GetImageFromPlugin(Path);

		let RelativePath = pathLib.relative(process.cwd(), url.fileURLToPath(Path));
		RelativePath = RelativePath.replace("Plugins\\", "ImageOut\\Plugins\\");

		const FileNames = RelativePath.split("\\");
		RelativePath = process.cwd() + "\\" + RelativePath;
		RelativePath = RelativePath.substring(0, RelativePath.lastIndexOf("\\")) + "\\";

		//console.log(RelativePath);

		if(!fs.existsSync(RelativePath)){
			fs.mkdirSync(RelativePath, { recursive: true});
		}

		const FileName = FileNames[FileNames.length - 1].replace(".js", "").replace(".", "");
		const DestPath = RelativePath + FileName + ".png";

		if(fs.existsSync(DestPath)){
			fs.rmSync(DestPath);
		}

		const optionalObj = {'fileName': FileName, 'type':'png'};
		//console.log(FileName);

		base64ToImage(Base64, RelativePath, optionalObj);

	}catch(e){
		console.log(e);
	}

}

for(const Path of DirectoryWalker.walkPaths(["../Components"])){
	try{
		const Base64 = "data:image/png;base64," + await GetImageFromComponent(Path);

		let RelativePath = pathLib.relative(process.cwd(), url.fileURLToPath(Path));
		RelativePath = RelativePath.replace("Components\\", "ImageOut\\Components\\");

		const FileNames = RelativePath.split("\\");
		RelativePath = process.cwd() + "\\" + RelativePath;
		RelativePath = RelativePath.substring(0, RelativePath.lastIndexOf("\\")) + "\\";

		//console.log(RelativePath);

		if(!fs.existsSync(RelativePath)){
			fs.mkdirSync(RelativePath, { recursive: true});
		}

		const FileName = FileNames[FileNames.length - 1].replace(".json", "").replace(".", "");
		const DestPath = RelativePath + FileName + ".png";

		if(fs.existsSync(DestPath)){
			fs.rmSync(DestPath);
		}

		const optionalObj = {'fileName': FileName, 'type':'png'};
		//console.log(FileName);

		base64ToImage(Base64, RelativePath, optionalObj);

	}catch(e){
		console.log(e);
	}

}