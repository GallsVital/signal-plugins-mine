export function CheckForImageExport(Plugin, ReportErrorCallback) {

	const hasImageExport = typeof Plugin.Image === "function";
	const hasImageUrlExport = typeof Plugin.ImageUrl === "function";

	if (!hasImageExport && !hasImageUrlExport) {
		ReportErrorCallback("Plugin Lacks an Image Export!");
	}

	if(hasImageExport && hasImageUrlExport){
		ReportErrorCallback("Plugin has 2 image exports!");
	}

	const hasImageResourceExport = typeof Plugin.ImageResource === "function";

	if(hasImageResourceExport){
		ReportErrorCallback("Plugin uses Image Resource exports!");

	}
	//const Base64ImageString = Plugin.Image();

	// if (Base64ImageString == "") {
	// 	ReportErrorCallback("Plugin Exports an empty Image!");
	// }
}
