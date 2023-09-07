import fs from 'fs';
import path from 'path';
import * as url from 'url';
import DirectoryWalker from './DirectoryWalker.js';
import { CheckComponentLEDNameAndPositionLengthsMatch } from './Validators/CheckComponentLEDNameAndPositionLengthsMatch.js';
import { CheckComponentLedPositionsBounds } from './Validators/CheckComponentLEDPositionsBounds.js';

class ComponentValidator {
	constructor() {
		this.totalErrors = 0;
		this.FilePathsWithErrors = new Map();
		this.paths = [];
		this.walker = new DirectoryWalker();
		this.validators = [
			CheckComponentLEDNameAndPositionLengthsMatch,
			CheckComponentLedPositionsBounds,
		];
		this.excludedFiles = []; // Reserving for future
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

	#GetReportErrorCallback(ComponentPath, testName) {
		return function (Error) { this.#ReportError(ComponentPath, testName, Error); }.bind(this);
	}

	#ReportError(ComponentPath, testName, Error) {
		// Add to error count
		this.totalErrors++;

		// Log path on first Error
		if (!this.FilePathsWithErrors.has(ComponentPath)) {
			console.log("\n", ComponentPath);
		}
		// Get current test failures
		const CurrentFailureList = Array.from(this.FilePathsWithErrors.get(ComponentPath) || []);

		// Log if this is the first failure of this test
		if (!CurrentFailureList.includes(testName)) {
			console.log(`\n\tFailure on validation test: [${testName}]!`);
		}

		CurrentFailureList.push(testName);
		// Get current array of test failures and append our new failure to it.
		this.FilePathsWithErrors.set(ComponentPath, CurrentFailureList);

		console.log("\t\t" + Error);
	}

	async ValidatePlugin(ComponentPath) {
		// This will throw if it isn't a valid JS file.
		// We can't run any more tests if this happens.
		try {
			const absolutePath = new URL(ComponentPath);
			const componentFile = fs.readFileSync(absolutePath);
			const componentJSON = JSON.parse(componentFile);

			for (const validator of this.validators) {
				await this.AttemptValidator(validator, componentJSON, ComponentPath);
			}

		} catch (e) {
			this.#ReportError(ComponentPath, "Component load", e);
		}
	}

	async AttemptValidator(validatorCallback, componentJSON, ComponentPath) {
		try {
			await validatorCallback(componentJSON, this.#GetReportErrorCallback(ComponentPath, validatorCallback.name), ComponentPath);
		} catch (e) {
			this.#ReportError(ComponentPath, validatorCallback.name, e);
		}
	}
}

export default new ComponentValidator();