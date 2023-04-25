export function CheckForImageExport(Plugin, ReportErrorCallback) {

	if (typeof Plugin.Image === "undefined") {
		ReportErrorCallback("Plugin Lacks an Image Export!");
	}

	//const Base64ImageString = Plugin.Image();

	// if (Base64ImageString == "") {
	// 	ReportErrorCallback("Plugin Exports an empty Image!");
	// }
}
