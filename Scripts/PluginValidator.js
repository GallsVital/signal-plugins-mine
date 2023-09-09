import fs from 'fs';
import path from 'path';
import * as url from 'url';
import DirectoryWalker from './DirectoryWalker.js';
import { CheckThatLEDNameAndPositionLengthsMatch } from './Validators/Plugin/CheckThatLEDNameAndPositionLengthsMatch.js';
import { CheckAllLedPositionsAreWithinBounds } from './Validators/Plugin/CheckAllLedPositionsAreWithinBounds.js';
import { CheckForImageExport } from './Validators/Plugin/CheckForImageExport.js';
import { DuplicateUSBPluginValidator } from './Validators/Plugin/DuplicateUSBPluginValidator.js';

function CheckForGPUListDuplicates(Plugin, ReportErrorCallback){
	if(typeof Plugin.BrandGPUList !== "undefined"){
		if(Plugin.BrandGPUList().CheckForDuplicates()){
			ReportErrorCallback("Plugin contains duplicate GPU list entries.");
		}
	}
}

const DuplicateUSBValidator = new DuplicateUSBPluginValidator();

class PluginValidator {
	constructor() {
		this.totalErrors = 0;
		this.FilePathsWithErrors = new Map();
		this.paths = [];
		this.walker = new DirectoryWalker();
		this.validators = [
			CheckThatLEDNameAndPositionLengthsMatch,
			CheckAllLedPositionsAreWithinBounds,
			//CheckForGPUListDuplicates,
			DuplicateUSBValidator.CheckForUSBProductIdDuplicates.bind(DuplicateUSBValidator),
			CheckForImageExport
		];
		this.excludedFiles = [".test.js"];
	}

	async CheckAllPaths(paths = []) {
		// Add any paths the user passed in during this call.
		if (paths.length !== 0) {
			for (const path of paths) {
				this.walker.AddPath(path);
			}
		}

		// Check each path in order.
		for (const path of this.walker.walkPaths(this.paths)) {
			await this.ValidatePlugin(path);
		}

		// if we have any errors reported let's notify and exit with an error.
		if (this.totalErrors > 0) {
			console.log("\n", `[${this.totalErrors}] Errors across [${this.FilePathsWithErrors.size}] files.`);
			process.exit(1);
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

	async ValidatePlugin(PluginPath) {
		// This will throw if it isn't a valid JS file.
		// We can't run any more tests if this happens.
		try {
			const pluginModule = await import(PluginPath);

			for (const validator of this.validators) {
				await this.AttemptValidator(validator, pluginModule, PluginPath);
			}

		} catch (e) {
			this.#ReportError(PluginPath, "Initial Module Load", e);
		}
	}

	async AttemptValidator(validatorCallback, pluginModule, PluginPath) {
		try {
			await validatorCallback(pluginModule, this.#GetReportErrorCallback(PluginPath, validatorCallback.name), PluginPath);
		} catch (e) {
			this.#ReportError(PluginPath, validatorCallback.name, e);
		}
	}
}

export default new PluginValidator();