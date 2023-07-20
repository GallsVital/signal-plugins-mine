export async function CheckForImageExport(Plugin, ReportErrorCallback) {

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

	if(hasImageExport){
		const imageExport = Plugin.Image();

		if(typeof imageExport === "string" && imageExport.length === 0){
			ReportErrorCallback("Plugin has an empty Image Export!");
		}
	}

	if(hasImageUrlExport){
		const imageUrlExport = Plugin.ImageUrl();

		if(typeof imageUrlExport === "string" && imageUrlExport.length === 0){
			ReportErrorCallback("Plugin has an empty ImageUrl Export!");

			return;
		}

		if(!(await checkImage(imageUrlExport))){
			ReportErrorCallback("Plugin has an invalid ImageUrl Export!");
		}
	}
}


async function checkImage(url){

	const res = await fetch(url);
	const buff = await res.blob();
	console.log(buff.type.startsWith('image/'));

	return buff.type.startsWith('image/');

}