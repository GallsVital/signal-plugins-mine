// Modifing SMBUS Plugins is -DANGEROUS- and can -DESTROY- devices.
export function Name() { return "Gigabyte Master GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/gigabyte"; }
export function Type() { return "SMBUS"; }
export function Size() { return [6, 2]; }
export function DefaultPosition(){return [192, 127];}
export function DefaultScale(){return 12.5;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
export function ConflictingProcesses() { return ["RGBFusion.exe"]; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

let vLedNames = [ ];
/** @type {LedPosition[]} */
let vLedPositions = [ ];

/** @type {GigabyteMasterProtocol} */
let GigabyteMaster;

/** @param {FreeAddressBus} bus */
export function Scan(bus) {
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	if (!bus.IsNvidiaBus()) {
		return [];
	}

	for(const GPU of new GigabyteMasterGPuList().devices) {
		if(CheckForIdMatch(bus, GPU)) {
			bus.log(`Found Gigabyte Master GPU! [${GPU.Name}]`, {toFile : true});
			FoundAddresses.push(GPU.Address);
		}
	}

	return FoundAddresses;
}

function CheckForIdMatch(bus, Gpu) {
	return Gpu.Vendor === bus.Vendor() &&
    Gpu.SubVendor === bus.SubVendor() &&
    Gpu.Device === bus.Product() &&
    Gpu.SubDevice === bus.SubDevice();
}

function SetGPUNameFromBusIds(GPUList) {
	for(const GPU of GPUList) {
		if(CheckForIdMatch(bus, GPU)) {
			device.setName(GPU.Name);
			break;
		}
	}
}

export function Initialize() {
	GigabyteMaster = new GigabyteMasterProtocol();
	// We must do this before any other writes as a bad length will soft lock the GPU.
	GigabyteMaster.determineWriteLength();

	for(let zones = 0; zones < 8; zones++) {
		GigabyteMaster.setMode(0x01, zones);
	}

	GigabyteMaster.BuildLEDs();

	SetGPUNameFromBusIds(new GigabyteMasterGPuList().devices);
}

export function Render() {
	GigabyteMaster.UpdateLEDs();

	device.pause(10);
}

export function Shutdown() {
}

function grabRGB(zoneId, ZoneInfo, shutdown = false) {
	const zonePositions = ZoneInfo.Positions;
	const RGBData = new Array(24);

	for(let zoneLeds = 0; zoneLeds < zonePositions.length; zoneLeds++) {
		let Color;
		const iPxX = zonePositions[zoneLeds][0];
		const iPxY = zonePositions[zoneLeds][1];

		if(shutdown) {
			Color = hexToRgb(shutdownColor);
		} else if(LightingMode === "Forced") {
			Color = hexToRgb(forcedColor);
		} else {
			Color = device.color(iPxX, iPxY);
		}

		RGBData[zoneLeds * 3] = Color[0];
		RGBData[zoneLeds * 3 + 1] = Color[1];
		RGBData[zoneLeds * 3 + 2] = Color[2];
	}

	GigabyteMaster.WriteRGB(RGBData, zoneId);
}


function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

class GigabyteMasterProtocol {
	constructor(){

		this.registers =
		{
			Initialization: 0xAB,
			Mode: 0x88,
			Color: 0x40
		};

		this.modes =
		{
			static: 0x01,
			breathing: 0x02,
			flashing: 0x04,
			dualFlash: 0x08,
			specrum: 0x011
		};

		this.config =
		{
			writeLength : 0
		};

		this.library =
		{ //So it begins.
			0x40bf :
			{
				Size: [5, 3],
				Zones:
				{
					0: {Names : [ "Fan 1", "Fan 2", "Fan 3" ], Positions : [ [1, 2], [2, 2], [3, 2] ], Mapping : [ 0, 1, 2 ]},
					//1: {Names : [ ], Positions : [ ], Mapping : [ ]},
					//2: {Names : [ ], Positions : [ ], Mapping : [ ]},
					3: {Names : [ "Logo" ], Positions : [ [3, 1] ], Mapping : [ 0 ]}
				}
			},
			0x40c0 :
			{
				Size: [8, 4],
				Zones:
				{
					0: {Names : [ "Placeholder 1", "Placeholder 2", "Placeholder 3", "Placeholder 4", "Placeholder 5", "Placeholder 6", "Placeholder 7", "Placeholder 8",],         Positions : [ [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], ], Mapping : [ 0, 1, 2, 3, 4, 5, 6, 7 ]},
					1: {Names : [ "Placeholder 9", "Placeholder 10", "Placeholder 11", "Placeholder 12", "Placeholder 13", "Placeholder 14", "Placeholder 15", "Placeholder 16",],  Positions : [ [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], ], Mapping : [ 0, 1, 2, 3, 4, 5, 6, 7 ]},
					2: {Names : [ "Placeholder 17", "Placeholder 18", "Placeholder 19", "Placeholder 20", "Placeholder 21", "Placeholder 22", "Placeholder 23", "Placeholder 24",], Positions : [ [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], ], Mapping : [ 0, 1, 2, 3, 4, 5, 6, 7 ]},
					3: {Names : [ "Placeholder 25", "Placeholder 26", "Placeholder 27", "Placeholder 28", "Placeholder 29", "Placeholder 30", "Placeholder 31", "Placeholder 32",], Positions : [ [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], ], Mapping : [ 0, 1, 2, 3, 4, 5, 6, 7 ]}
				}
			}
		};
	}

	determineWriteLength() {
		this.config.writeLength = [0x62, 0x71].includes(bus.GetAddress()) ? 8 : 4;
	}

	setMode(mode, zone) {

		const data = [this.registers.Mode, mode, 0x06, 0x63, 0x08, zone];

		const iRet = this.WriteBlockSafe(data);

		if(iRet < 0) {
			bus.log("Failed To Set Mode");

			return;
		}

		bus.log(`Set Lighting Mode To [${mode}]`);
	}

	UpdateLEDs() {
		for(const [zoneId, ZoneInfo] of Object.entries(this.library[bus.SubDevice()].Zones)) {
			grabRGB(zoneId, ZoneInfo);
		}
	}

	BuildLEDs() {
		vLedNames = [];
		vLedPositions = [];

		for(const [zoneId, ZoneInfo] of Object.entries(this.library[bus.SubDevice()].Zones)) {
			vLedNames.push(...ZoneInfo.Names);
			vLedPositions.push(...ZoneInfo.Positions);
		}

		device.setSize(this.library[bus.SubDevice()].Size);
		device.setControllableLeds(vLedNames, vLedPositions);
	}

	WriteRGB(RGBData, zone) {

		for(let zonePackets = 0; zonePackets < 4; zonePackets++) {
			const zoneIdx = 0xB0 + ((zone)* 4) + zonePackets;
			const Data = [zoneIdx, 0x01];
			Data.push(...RGBData.splice(0, 6));
			this.WriteBlockSafe(Data);
		}
	}

	WriteBlockSafe(Data) {
		if(this.config.writeLength === -1) {
			bus.log("Invalid Write Length. Aborting Write Operation to Redetect...");
			this.determineWriteLength();

			return -1;
		}

		return bus.WriteBlockWithoutRegister(this.config.writeLength, Data);
	}

}

class NvidiaGPUDeviceIds {
	constructor() {
		this.GTX1050TI       = 0x1C82;
		this.GTX1060         = 0x1C03;
		this.GTX1070         = 0x1B81;
		this.GTX1070TI       = 0x1B82;
		this.GTX1080         = 0x1B80;
		this.GTX1080TI       = 0x1B06;
		this.GTX1650         = 0x1F82;
		this.GTX1650S        = 0x2187;
		this.GTX1660         = 0x2184;
		this.GTX1660TI       = 0x2182;
		this.GTX1660S        = 0x21C4;
		this.RTX2060_TU104   = 0x1E89;
		this.RTX2060_TU106   = 0x1F08;
		this.RTX2060S        = 0x1F47;
		this.RTX2060S_OC     = 0x1F06;
		this.RTX2070         = 0x1F02;
		this.RTX2070_OC      = 0x1F07;
		this.RTX2070S        = 0x1E84;
		this.RTX2080         = 0x1E82;
		this.RTX2080_A       = 0x1E87;
		this.RTX2080S        = 0x1E81;
		this.RTX2080TI_TU102 = 0x1E04;
		this.RTX2080TI       = 0x1E07;
		this.RTX2080_SUPER   = 0x1E81;
		this.RTX3050         = 0x2507;
		this.RTX3060         = 0x2503;
		this.RTX3060_LHR     = 0x2504;
		this.RTX3060_GA104   = 0x2487;
		this.RTX3060TI       = 0x2486;
		this.RTX3060TI_LHR   = 0x2489;
		this.RTX3070         = 0x2484;
		this.RTX3070_LHR     = 0x2488;
		this.RTX3070TI       = 0x2482;
		this.RTX3080         = 0x2206;
		this.RTX3080_LHR     = 0x2216;
		this.RTX3080_GA102   = 0x220A;
		this.RTX3080TI       = 0x2208;
		this.RTX3090         = 0x2204;
		this.RTX3090TI       = 0x2203;
		this.RTX4070TI 		 = 0x2782;
		this.RTX4080		 = 0x2704;
		this.RTX4090		 = 0x2684;
	}
};

const Nvidia = new NvidiaGPUDeviceIds();

class GigabyteMasterDeviceIds {
	constructor() {
		this.RTX4090_GAMING_OC_24GB			= 0x40BF;
	}
}

class GPUIdentifier {
	constructor(Vendor, SubVendor, Device, SubDevice, Address, Name, Model = "") {
		this.Vendor = Vendor;
		this.SubVendor = SubVendor;
		this.Device = Device;
		this.SubDevice = SubDevice;
		this.Address = Address;
		this.Name = Name;
		this.Model = Model;
	}
}

//0x1458
class GigabyteMasterIdentifier extends GPUIdentifier {
	constructor(device, SubDevice, Address, Name) {
		super(0x10DE, 0x1458, device, SubDevice, Address, Name, "");
	}
}

class GigabyteMasterGPuList {
	constructor() {
		const Nvidia = new NvidiaGPUDeviceIds();
		const GigabyteMasterIds  = new GigabyteMasterDeviceIds();

		this.devices = [
			new GigabyteMasterIdentifier(Nvidia.RTX4090,        GigabyteMasterIds.RTX4090_GAMING_OC_24GB,         0x71, "GIGABYTE 4090 Gaming OC"),
		];
	}
}

