import fs from 'fs';
import path from 'path';
import * as url from 'url';

const DirectoryName = "Plugins";


ScanPlugins();

async function ScanPlugins(){
	const PluginFiles = getAllFilePaths(DirectoryName);
	let ErroredFiles = 0;

	for(let iIdx = 0; iIdx < PluginFiles.length; iIdx++){
		const plugin = PluginFiles.at(iIdx);

		try{
			await CheckPluginFile(plugin);
		}catch(e){
			console.log(plugin);
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

async function CheckPluginFile(PluginPath){

	const filePathUrl = url.pathToFileURL(PluginPath);

	// Checking if the file loads without an error.
	const pluginModule = await import(filePathUrl);

}

function getAllFilePaths(dirPath, arrayOfFiles = []) {
	const files = fs.readdirSync(dirPath);

	files.forEach(function(file) {
		if (fs.statSync(dirPath + "/" + file).isDirectory()) {
			arrayOfFiles = getAllFilePaths(dirPath + "/" + file, arrayOfFiles);
		} else {
			// Ignore test files
			if(!file.endsWith("test.js")){
				arrayOfFiles.push(path.join(url.fileURLToPath(new URL('.', import.meta.url)), dirPath, "/", file));
			}
		}
	});

	return arrayOfFiles;
}