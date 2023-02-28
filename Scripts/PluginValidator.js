import fs from 'fs';
import path from 'path';
import * as url from 'url';
import DirectoryWalker from './DirectoryWalker.js';

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

function CheckForImageExport(Plugin, ReportErrorCallback){

	if(typeof Plugin.Image === "undefined"){
		ReportErrorCallback("Plugin Lacks an Image Export!");
	}

	const Base64ImageString = Plugin.Image();

	if(Base64ImageString == ""){
		ReportErrorCallback("Plugin Exports an empty Image!");
	}
}

function CheckForGPUListDuplicates(Plugin, ReportErrorCallback){
	if(typeof Plugin.BrandGPUList !== "undefined"){
		if(Plugin.BrandGPUList().CheckForDuplicates()){
			ReportErrorCallback("Plugin contains duplicate GPU list entries.");
		}
	}
}

class DuplicateUSBPluginValidator{
	constructor(){
		this.pluginMap = new Map();
	}

	CheckIDPair(Vendor, Product, ReportErrorCallback, PluginPath){
		const pair = `${Vendor}:${Product}`;

		if(!this.pluginMap.has(pair)){
			this.pluginMap.set(pair, [PluginPath]);

			return;
		}


		const PluginPaths = this.pluginMap.get(pair);
		let message = `Plugin contains duplicate Vendor:Product id pair!`;

		for(const path of PluginPaths){
			message += "\n\t\tPrevious File: " + path;
		}

		ReportErrorCallback(message);

		PluginPaths.push(PluginPath);
		this.pluginMap.set(pair, PluginPaths);
	}

	CheckForUSBProductIdDuplicates(Plugin, ReportErrorCallback, PluginPath){
		if(typeof Plugin.VendorId === "undefined" || typeof Plugin.ProductId === "undefined"){
			return;
		}

		const VendorId = Plugin.VendorId();
		const ProductIds = Plugin.ProductId();

		if(typeof ProductIds === "number"){
			this.CheckIDPair(VendorId, ProductIds, ReportErrorCallback, PluginPath);

			return;
		}

		for(const ProductId of ProductIds){
			this.CheckIDPair(VendorId, ProductId, ReportErrorCallback, PluginPath);
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
				this.AttemptValidator(validator, pluginModule, PluginPath);
			}

		} catch (e) {
			this.#ReportError(PluginPath, "Initial Module Load", e);
		}
	}

	async AttemptValidator(validatorCallback, pluginModule, PluginPath) {
		try {
			validatorCallback(pluginModule, this.#GetReportErrorCallback(PluginPath, validatorCallback.name), PluginPath);
		} catch (e) {
			this.#ReportError(PluginPath, validatorCallback.name, e);
		}
	}
}

export default new PluginValidator();