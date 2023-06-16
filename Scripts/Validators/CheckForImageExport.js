export function CheckForImageExport(Plugin, ReportErrorCallback) {

	const hasImageExport = typeof Plugin.Image === "function";
	const hasImageResourceExport = typeof Plugin.ImageResource === "function";

	if (!hasImageExport && !hasImageResourceExport) {
		ReportErrorCallback("Plugin Lacks an Image Export!");
	}

	if(hasImageExport && hasImageResourceExport){
		ReportErrorCallback("Plugin has 2 image exports!");
	}

	//const Base64ImageString = Plugin.Image();

	// if (Base64ImageString == "") {
	// 	ReportErrorCallback("Plugin Exports an empty Image!");
	// }
}
