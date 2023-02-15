// Modifying SMBUS Plugins is -DANGEROUS- and can -DESTROY- devices.
export function Name() { return "Zotac GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/gigabyte"; }
export function Type() { return "SMBUS"; }
export function Size() { return [5, 2]; }
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

let vLedNames = [];
/** @type {LedPosition[]} */
let vLedPositions = [ ];

let Zotac;

/** @param {FreeAddressBus} bus */
export function Scan(bus) {
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	if (!bus.IsNvidiaBus()) {
		return [];
	}

	for(const GPU of new ZotacGPUList().devices) {
		if(CheckForIdMatch(bus, GPU)) {

				bus.log(`Found Zotac GPU! [${GPU.Name}]`, {toFile : true});
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
	Zotac = new ZotacGPUProtocol();
	Zotac.BuildLEDs();
	Zotac.SetActive(1);
	SetGPUNameFromBusIds(new ZotacGPUList().devices);

}                                                                     //active, zone,            //rgb,                 brightness, direction,?,  sync,                 ?,   

export function Render() {
	Zotac.UpdateLEDs();
	device.pause(1000);
}


export function Shutdown() {
	Zotac.SetActive(0);
}

function grabRGB(zoneId, ZoneInfo, shutdown = false) {
	const zonePositions = ZoneInfo.Positions;
	const RGBData = new Array(zonePositions.length*3);
	for(let zoneLeds = 0; zoneLeds < zonePositions.length; zoneLeds++)
	{
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

	Zotac.WriteRGB(RGBData, zoneId, true);
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

class ZotacGPUProtocol {
	constructor(){

		this.registers =
		{
			Color: 0xA0,
            ActivityIndicator : 0xA2
		};

		this.library =
		{
			0x1653 :
			{
				Size: [5, 3],
				Zones: 
				{
					0: { Names : [ "Side Logo" ], Positions : [ [1, 1] ] },
					1: { Names : [ "Backplate" ], Positions : [ [3, 0] ] },
				}
			},
			0x1696 :
			{
				Size: [5, 3],
				Zones: 
				{
					0: { Names : [ "Side Logo" ], Positions : [ [1, 1] ] },
					1: { Names : [ "Backplate" ], Positions : [ [3, 0] ] },
				}
			}
		}
	}

	BuildLEDs() //Kinda overkill but I wanna do this right. Zotac only has 3 or 4 different layouts I believe.
	{
		vLedNames = [];
		vLedPositions = [];

		for(const [zoneId, ZoneInfo] of Object.entries(this.library[bus.SubDevice()].Zones))
		{
			vLedNames.push(...ZoneInfo.Names);
			vLedPositions.push(...ZoneInfo.Positions);
		}
		device.setSize(this.library[bus.SubDevice()].Size);
		device.setControllableLeds(vLedNames, vLedPositions);
	}

	UpdateLEDs()
	{
		for(const [zoneId, ZoneInfo] of Object.entries(this.library[bus.SubDevice()].Zones))
		{
			grabRGB(zoneId, ZoneInfo);
		}
	}

	SetActive(active)
	{
		bus.WriteByte(this.registers.ActivityIndicator, active);
	}

	WriteRGB(RGBData, zone, active = true) {
		if(RGBData.length > 3) {
			bus.log(`Invalid RGB Data Length. Expected 3, Got [${RGBData.length}]`);

			return;
		}

		bus.WriteBlock(this.registers.Color, 0x1E, [0x01, 0x00, 0x00, 0x00, active, zone, 0x00, RGBData[0], RGBData[1], RGBData[2], 0x00, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
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

class ZotacGPUDeviceIDs {
	constructor() {
		this.RTX3070TI_AMP_HOLO_GDDR6X = 0x1653;
		this.RTX3090TI_AMP_HOLO_EXTREME_24G = 0x4666;
		this.RTX4070TI_TRINITY_OC_12G  = 0x1696;
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
class ZotacIdentifier extends GPUIdentifier {
	constructor(device, SubDevice, Address, Name) {
		super(0x10DE, 0x19da, device, SubDevice, Address, Name, "");
	}
}

class ZotacGPUList {
	constructor() {
		const Nvidia = new NvidiaGPUDeviceIds();
		const ZotacDeviceIDs  = new ZotacGPUDeviceIDs();

		this.devices = [
			new ZotacIdentifier(Nvidia.RTX3070TI,      ZotacDeviceIDs.RTX3070TI_AMP_HOLO_GDDR6X,              0x49, "Zotac RTX 3070TI AMP Holo"),
			new ZotacIdentifier(Nvidia.RTX3090TI,      ZotacDeviceIDs.RTX3090TI_AMP_HOLO_EXTREME_24G,              0x49, "Zotac RTX 3090TI AMP Holo Extreme"),
			new ZotacIdentifier(Nvidia.RTX4070TI,      ZotacDeviceIDs.RTX4070TI_TRINITY_OC_12G,              0x49, "Zotac RTX 4070TI Trinity OC 12G")
		
		];
	}
}

