import DirectoryWalker from "./DirectoryWalker.js";


class GPUIdCollector{
	constructor(){
		this.FoundGPUs = [];
		this.FoundIDs = new Set();
	}

	async FindGpus(){

		for(const Path of DirectoryWalker.walkPaths(["../Non-Release-Plugins/SMBus/GPUs", "../Plugins"])){
			//console.log(Path);

			try {
				const pluginModule = await import(Path);

				if(typeof pluginModule.BrandGPUList !== "undefined"){
					const GPUList = pluginModule.BrandGPUList();

					for(const device of GPUList){
						this.FoundGPUs.push(device);

						const UID = `${device.Vendor}:${device.SubVendor}:${device.Device}:${device.SubDevice}`;

						if(this.FoundIDs.has(UID)){
							console.log(`Duplicate ID Found! UID: [${UID}], Name: [${device.Name}]`);
						}else{
							this.FoundIDs.add(UID);
						}

					}
				}

			}catch(e){
				// Do Nothing
			}
		}

	}
}

const collector = new GPUIdCollector();
collector.FindGpus().then(() => {
	console.log(`Found [${collector.FoundGPUs.length}] GPU's`);

	if(collector.FoundGPUs.length !== collector.FoundIDs.size){
		console.log(`Duplicate GPU id's found!`);
		process.exit(1);
	}
});


