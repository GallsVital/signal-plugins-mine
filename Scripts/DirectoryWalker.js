import fs from 'fs';
import path from 'path';
import * as url from 'url';

export default class DirectoryWalker{
	constructor(){
		this.paths = [];
		this.excludedfileTypes = [".test.js"];
	};

	AddPath(pathToAdd) {
		const CurrentDirectoryURL = new URL('.', import.meta.url);
		const absolutePath = path.join(url.fileURLToPath(CurrentDirectoryURL), pathToAdd);

		if (!this.paths.includes(absolutePath)) {
			this.paths.push(absolutePath);
		}
	}

	RemovePath(pathToRemove) {
		this.paths = this.paths.filter(function (path) { path !== pathToRemove; });
	}
	static walkPaths(paths = []){
		const walker = new DirectoryWalker();

		return walker.walkPaths(paths);
	}

	*walkPaths(paths = []) {
		// Add any paths the user passed in during this call.
		if (paths.length !== 0) {
			for (const path of paths) {
				this.AddPath(path);
			}
		}

		// Check each path in order.
		for (const directory of this.paths) {
			yield* this.#walkDirectory(directory);
		}
	}

	#ShouldSkipPath(path){
		for(const exclusion of this.excludedfileTypes){
			if(path.includes(exclusion)){
				return true;
			}
		}

		return false;
	}
	*#walkDirectory(src) {
		const files = fs.readdirSync(src, { withFileTypes: true });

		for (const file of files) {
			const AbsoluteFilePath = path.join(src, file.name);

			if(this.#ShouldSkipPath(AbsoluteFilePath)){
				continue;
			}

			if (file.isDirectory()) {
				yield* this.#walkDirectory(AbsoluteFilePath);
			} else {
				yield url.pathToFileURL(AbsoluteFilePath).toString();
			}
		}
	}

}