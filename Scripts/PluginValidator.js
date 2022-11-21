import fs from 'fs';
import path from 'path';
import * as url from 'url';

function CheckThatLEDNameAndPositionLengthsMatch(Plugin, ReportErrorCallback){
	if(typeof Plugin.LedPositions === "undefined"){
		return;
	}
	const LedNames = Plugin.LedNames();
	const LedPositions = Plugin.LedPositions();

	if(LedNames.length !== LedPositions.length){
		ReportErrorCallback(`Led Name and Position differ in length! Led Painting and key press effects will not function. Led Names [${LedNames.length}], Led Positions: [${LedPositions.length}]`);
	}
}

function CheckAllLedPositionsAreWithinBounds(Plugin, ReportErrorCallback){
	if(typeof Plugin.LedPositions === "undefined"){
		return;
	}

	const [width, height] = Plugin.Size();
	const LedPositions = Plugin.LedPositions();

	LedPositions.forEach((Position) => {
		if(Position[0] < 0 || Position[0] >= width){
			ReportErrorCallback(`Led X coordinate of [${Position}] is out of bounds. [${Position[0]}] is not inside the plugins width [0-${width})`);
		}

		if(Position[1] < 0 || Position[1] >= height){
			ReportErrorCallback(`Led Y coordinate of [${Position}] is out of bounds. [${Position[1]}] is not inside the plugins height [0-${height})`);
		}
	});
}

function CheckForGPUListDuplicates(Plugin, ReportErrorCallback){
	if(typeof Plugin.BrandGPUList !== "undefined"){
		if(Plugin.BrandGPUList().CheckForDuplicates()){
			ReportErrorCallback("Plugin contains duplicate GPU list entries.");
		}
	}
}

class PluginValidator {
	constructor() {
		this.totalErrors = 0;
		this.FilePathsWithErrors = new Map();
		this.paths = [];
		this.validators = [
			CheckThatLEDNameAndPositionLengthsMatch,
			CheckAllLedPositionsAreWithinBounds,
			CheckForGPUListDuplicates,
		];
		this.excludedFiles = [".test.js"];
	}
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

	async CheckAllPaths(paths = []) {
		// Add any paths the user passed in during this call.
		if (paths.length !== 0) {
			for (const path of paths) {
				this.AddPath(path);
			}
		}

		// Check each path in order.
		for (const directory of this.paths) {
			await this.CheckAllPluginsInDirectory(directory);
		}

		// if we have any errors reported let's notify and exit with an error.
		if (this.totalErrors > 0) {
			console.log("\n", `[${this.totalErrors}] Errors across [${this.FilePathsWithErrors.size}] files.`);
			process.exit(1);
		}
	}
	#ShouldSkipPath(path){
		for(const exclusion of this.excludedFiles){
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

	#GetReportErrorCallback(pluginPath, testName) {
		return function (Error) { this.#ReportError(pluginPath, testName, Error); }.bind(this);
	}

	#ReportError(pluginPath, testName, Error) {
		// Add to error count
		this.totalErrors++;

		// Log path on first Error
		if (!this.FilePathsWithErrors.has(pluginPath)) {
			console.log("\n", pluginPath);
		}
		// Get current test failures
		const CurrentFailureList = Array.from(this.FilePathsWithErrors.get(pluginPath) || []);

		// Log if this is the first failure of this test
		if (!CurrentFailureList.includes(testName)) {
			console.log(`\n\tFailure on validation test: [${testName}]!`);
		}

		CurrentFailureList.push(testName);
		// Get current array of test failures and append our new failure to it.
		this.FilePathsWithErrors.set(pluginPath, CurrentFailureList);

		console.log("\t\t" + Error);
	}

	async CheckAllPluginsInDirectory(directory) {
		for (const PluginPath of this.#walkDirectory(directory)) {
			await this.ValidatePlugin(PluginPath);
		}
	}

	async ValidatePlugin(PluginPath) {
		// This will throw if it isn't a valid JS file.
		// We can't run any more tests if this happens.
		try {
			const pluginModule = await import(PluginPath);

			for (const validator of this.validators) {
				this.AttemptValidator(validator, pluginModule, PluginPath);
			}

		} catch (e) {
			this.#ReportError(PluginPath, "Initial Module Load", e);
		}
	}

	async AttemptValidator(validatorCallback, pluginModule, PluginPath) {
		try {
			validatorCallback(pluginModule, this.#GetReportErrorCallback(PluginPath, validatorCallback.name));
		} catch (e) {
			this.#ReportError(PluginPath, validatorCallback.name, e);
		}
	}
}

export default new PluginValidator();