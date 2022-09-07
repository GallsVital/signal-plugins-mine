import fs from 'fs';
import path from 'path';
import * as url from 'url';

const DirectoryName = "Plugins";

ScanPlugins();

async function ScanPlugins(){
	const PluginFiles = getAllFiles(DirectoryName);
	let ErroredFiles = 0;

	for(let iIdx = 0; iIdx < PluginFiles.length; iIdx++){
		const plugin = PluginFiles.at(iIdx);

		try{
			await loadPlugin(plugin);
		}catch(e){
			console.log(plugin);
			console.log(e);
			console.log("\n");
			ErroredFiles++;
		}
	}

	console.log(`[${ErroredFiles}] file(s) had errors that prevented module loading.`);

	return ErroredFiles > 0;
}

async function loadPlugin(PluginPath){

	const filePathUrl = url.pathToFileURL(PluginPath);
	const pluginModule = await import(filePathUrl);

	// Just checking if the file loads without an error.
	return;
}


function getAllFiles(dirPath, arrayOfFiles) {
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
}