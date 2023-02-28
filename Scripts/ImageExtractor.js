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

	return Base64ImageString;
}


for(const Path of DirectoryWalker.walkPaths(["../Plugins"])){
	try{
		const Base64 = "data:image/png;base64," + await GetImageFromPlugin(Path);

		if(Base64 == ""){
			throw `${Path}\n\tPlugin Exports an empty Image!`;
		}

		let RelativePath = pathLib.relative(process.cwd(), url.fileURLToPath(Path));
		RelativePath = RelativePath.replace("Plugins\\", "ImageOut\\");

		const FileNames = RelativePath.split("\\");
		RelativePath = process.cwd() + "\\" + RelativePath;
		RelativePath = RelativePath.substring(0, RelativePath.lastIndexOf("\\")) + "\\";

		//console.log(RelativePath);

		if(!fs.existsSync(RelativePath)){
			fs.mkdirSync(RelativePath);
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
