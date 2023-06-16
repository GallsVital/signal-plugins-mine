import DirectoryWalker from "./DirectoryWalker.js";


class GPUIdCollector{
	constructor(){
		this.FoundGPUs = [];
		this.UIDToPathMap = new Map();
		this.FoundIDs = new Set();
		this.brandIds = {
			"evga" : 0x3842,
		};
	}
	GetGPUsByBrand(brand){
		const brandId = this.brandIds[brand];

		return this.FoundGPUs.filter((device) => { return device.SubVendor === brandId;});
	}
	CheckIfPluginHasGPUs(pluginModule){
		return typeof pluginModule.BrandGPUList !== "undefined";
	}
	GetUIDFromGPU(GPU){
		return `${GPU.Vendor}:${GPU.SubVendor}:${GPU.Device}:${GPU.SubDevice}:${GPU.Address}`;
	}
	// AddGPUToMap(GPU){
	// 	const UID = this.GetUIDFromGPU(GPU);

	// 	if(Object.keys(this.FoundGPUs).includes(UID)){
	// 		console.log(`Duplicate GPU ID Found! UID: [${UID}], Name: [${device.Name}]`);

	// 	}
	// }

	async FindGpus(){

		for(const Path of DirectoryWalker.walkPaths(["../Non-Release-Plugins/SMBus/GPUs", "../Plugins"])){
			//console.log(Path);

			try {
				const pluginModule = await import(Path);

				if(!this.CheckIfPluginHasGPUs(pluginModule)){
					continue;
				}

				const GPUList = pluginModule.BrandGPUList();
				let hasDupe = false;

				for(const device of GPUList){
					this.FoundGPUs.push(device);

					const UID = this.GetUIDFromGPU(device);

					if(this.FoundIDs.has(UID)){
						const OriginalFilePaths = Array.from(this.UIDToPathMap.get(UID));

						if(!hasDupe){
							hasDupe = true;
							console.log(Path);
						}

						console.log(`\tDuplicate ID Found! UID: [${UID}], Name: [${device.Name}]. Original File(s): [${OriginalFilePaths}]`);
						this.UIDToPathMap.set(UID, [...OriginalFilePaths, Path]);
					}else{
						this.FoundIDs.add(UID);
						this.UIDToPathMap.set(UID, [Path]);
					}

				}

			}catch(e){
				// Do Nothing
			}
		}

	}
}

run();

async function run(){
	const collector = new GPUIdCollector();
	await collector.FindGpus();
	console.log(`Found [${collector.FoundGPUs.length}] GPU's Total`);
	//console.log(`Found [${collector.GetGPUsByBrand("evga").length}] EVGA Gpus`);

	if(collector.FoundGPUs.length !== collector.FoundIDs.size){
		console.log(`${collector.FoundGPUs.length - collector.FoundIDs.size} Duplicate GPU id's found!`);
		process.exit(1);
	}

}


