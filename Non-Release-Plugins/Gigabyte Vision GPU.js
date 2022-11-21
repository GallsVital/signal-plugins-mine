import { ConstructorDeclaration } from "ts-morph";

export function Name() { return "Gigabyte Vision GPU"; }
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

const vLedNames = ["Main Zone"];
/** @type {LedPosition[]} */
const vLedPositions = [[3, 1]];

let GigabyteVision;

/** @param {FreeAddressBus} bus */
export function Scan(bus) {
	const FoundAddresses = [];
	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus()) {
		return [];
	}

	for(const GPU of new GigabyteVisionGPuList().devices){
		if(CheckForIdMatch(bus, GPU)){
			// No Quick Write test on Nvidia
			if(bus.ReadByteWithoutRegister(GPU.Address) < 0){
                bus.log("failed read test!");
                return [];
			}

			if(GigabyteVisionGpuCheck(bus, GPU)){
				bus.log(`Found Gigabyte Vision GPU! [${GPU.Name}]`);
				FoundAddresses.push(GPU.Address);
			}
		}
	}

	return FoundAddresses;
}

function CheckForIdMatch(bus, Gpu){
    return Gpu.Vendor === bus.Vendor() &&
    Gpu.SubVendor === bus.SubVendor() &&
    Gpu.Device === bus.Product() &&
    Gpu.SubDevice === bus.SubDevice();
}

function SetGPUNameFromBusIds(GPUList){
	for(const GPU of GPUList){
		if(CheckForIdMatch(bus, GPU)){
			device.setName(GPU.Name);
			break;
		}
	}
}

function GigabyteVisionGpuCheck(bus, GPU){

    const ValidReturnCodes = [0x10, 0x11, 0x12, 0x14];
    // 0x62 (Gaming OC) cards use a 8 byte write length.
    // GPU will softlock if this is wrong.
    const WriteLength = GPU.Address === 0x62 ? 8 : 4;

    bus.WriteBlockWithoutRegister(GPU.Address, WriteLength, [0xAB]);

    let [iRet, Data] = bus.ReadBlockBytesWithoutRegister(GPU.Address, WriteLength);
	bus.log(`Gigabyte Vision GPU Returned Init Read: [${Data}]`);

	return Data[0] === 0xAB && ValidReturnCodes.includes(Data[1]);
}

export function Initialize() {
	GigabyteVision = new GigabyteVisionProtocol();
	// We must do this before any other writes as a bad length will soft lock the GPU.
	GigabyteVision.determineWriteLength();

	SetGPUNameFromBusIds(new GigabyteVisionGPuList().devices);
}

export function Render() {
	SendRGB();

	//PollHardwareModes();

	// Mimic old Refresh Speed to not overload the bus.
	device.pause(10);

	//device.log(`Total Packets [${sentPackets + savedPackets}]. Checking RGB values saved us sending [${Math.floor(savedPackets/(savedPackets+sentPackets) * 100)}]% of them`)
	//device.log(`Saved: [${savedPackets}] Sent: [${sentPackets}]`);
}


export function Shutdown() {
	SendRGB(true);
}

function CompareArrays(array1, array2){
	return array1.length === array2.length &&
	array1.every(function(value, index) { return value === array2[index];});
}

function SendRGB(shutdown = false){

		let Color;

		if(shutdown){
			Color = hexToRgb(shutdownColor);
		}else if(LightingMode === "Forced") {
			Color = hexToRgb(forcedColor);
		} else {
			Color = device.color(...vLedPositions[0]);
		}

		GigabyteVision.WriteRGB(Color);
}


function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

class GigabyteVisionProtocol{
	constructor(){

		this.registers = {
			Initialization: 0xAB,
			Mode: 0x88,
			Color: 0x40,
		};
		this.modes = {
			static: 0x01,
			breathing: 0x02,
			flashing: 0x04,
			dualFlash: 0x08,
			specrum: 0x011,
		};
		this.config = {
			writeLength : 0
		};
	}

	determineWriteLength(bus){
		this.config.writeLength = bus.Address() === 0x62 ? 8 : 4;
	}

	setMode(mode){
		
		let data = [this.registers.Mode, mode, 5, 0x63];

		let iRet = this.WriteBlockSafe(data);

		if(iRet < 0){
			bus.log("Failed To Set Mode");
			return;
		}
		bus.log(`Set Lighting Mode To [${mode}]`);
	}

	WriteRGB(RGBData){
		if(RGBData.length > 3){
			bus.log(`Invalid RGB Data Length. Expected 3, Got [${RGBData.length}]`);
			return
		}
		let Data = [this.registers.Color];
		this.WriteBlockSafe(Data);
	}

	WriteBlockSafe(Data){
		if(this.config.writeLength === -1){
			bus.log("Invalid Write Length. Aborting Write Operation to Redetect...");
			this.determineWriteLength();

			return -1;
		}

		return bus.WriteBlockWithoutRegister(this.config.writeLength, Data);
	}

}

class NvidiaGPUDeviceIds {
    constructor(){
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
    }
};

const Nvidia = new NvidiaGPUDeviceIds();

class GigabyteVisionDeviceIds{
	constructor(){
		this.GTX1050TI_G1_GAMING            = 0x372A;
		this.GTX1060_G1_GAMING_OC           = 0x3739;
		this.GTX1060_XTREME                 = 0x3776;
		this.GTX1070_XTREME                 = 0x3778;
		this.GTX1070TI_GAMING               = 0x3794;
		this.GTX1080_G1_GAMING              = 0x3702;
		this.GTX1080TI                      = 0x3752;
		this.GTX1080TI_GAMING_OC            = 0x374C;
		this.GTX1080TI_GAMING_OC_BLACK      = 0x377A;
		this.GTX1080TI_XTREME               = 0x3751;
		this.GTX1080TI_XTREME_WATERFORCE    = 0x3762;
		this.GTX1080TI_XTREME_WATERFORCE_2  = 0x376A;
		this.GTX1650_GAMING_OC              = 0x3FE4;
		this.GTX1660_GAMING_OC_6GB          = 0x3FC7;
		this.GTX1660S_GAMING_OC             = 0x4014;
		this.RTX2060_GAMING_OC              = 0x37CE;
		this.RTX2060_GAMING_OC_PRO          = 0x3FC2;
		this.RTX2060_GAMING_OC_PRO_WHITE    = 0x3FD0;
		this.RTX2060S_GAMING_OC_3X_WHITE    = 0x401E;
		this.RTX2060S_GAMING                = 0x404A;
		this.RTX2060S_GAMING_OC             = 0x3FED;
		this.RTX2060S_GAMING_OC_WHITE       = 0x3FFE;
		this.RTX2070_GAMING_OC              = 0x37AD;
		this.RTX2070_WINDFORCE              = 0x37C2;
		this.RTX2080_A_GAMING_OC            = 0x37A7;
		this.RTX2080_GAMING_OC              = 0x37D6;
		this.RTX2080S_GAMING_OC             = 0x3FE9;
		this.RTX2070S_GAMING_OC             = 0x3FEB;
		this.RTX2070S_GAMING_OC_V2          = 0x3FF6;
		this.RTX2070S_GAMING_OC_3X          = 0x4008;
		this.RTX2070S_GAMING_OC_3X_WHITE    = 0x400D;
		this.RTX3050_EAGLE_OC               = 0x40AA;
		this.RTX3060_EAGLE_OC_REV2          = 0x4072;
		this.RTX3060_VISION_OC_12GB         = 0x4073;
		this.RTX3060_GAMING_OC_12GB         = 0x4074;
		this.RTX3060TI_GAMING_OC            = 0x405A;
		this.RTX3060TI_EAGLE_OC             = 0x405B;
		this.RTX3060TI_GAMING_OC_PRO        = 0x405E;
		this.RTX3080_VISION_OC              = 0x404B;
		this.RTX3070_GAMING_OC              = 0x404C;
		this.RTX3070_VISION_OC              = 0x404D;
		this.RTX3070TI_GAMING_OC            = 0x408F;
		this.RTX3070TI_EAGLE                = 0x408C;
		this.RTX3070TI_EAGLE_OC             = 0x408D;
		this.RTX3070TI_VISION_OC            = 0x4090;
		this.RTX3080_EAGLE_12GB_LHR         = 0x409F;
		this.RTX3080_GAMING_OC              = 0x403F;
		this.RTX3080TI_EAGLE                = 0x4085;
		this.RTX3080TI_EAGLE_OC             = 0x4086;
		this.RTX3080TI_VISION_OC            = 0x4087;
		this.RTX3080TI_GAMING_OC            = 0x4088;
		this.RTX3090_GAMING_OC_24GB         = 0x4043;
		this.RTX3080_12G_GAMING_OC          = 0x40A2;
	}
}

class GPUIdentifier{
	constructor(Vendor, SubVendor, Device, SubDevice, Address, Name, Model = ""){
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
class GigabyteVisionIdentifier extends GPUIdentifier{
    constructor(device, SubDevice, Address, Name){
		super(0x10DE, 0x1458, device, SubDevice, Address, Name, "");
    }
}

class GigabyteVisionGPuList{
	constructor(){
		const Nvidia = new NvidiaGPUDeviceIds();
		const GigabyteVisionIds  = new GigabyteVisionDeviceIds();

		this.devices = [
			new GigabyteVisionIdentifier(Nvidia.GTX1080TI,      GigabyteVisionIds.GTX1080TI_XTREME,              0x47, "GIGABYTE 1080Ti XTREME Edition"),
			new GigabyteVisionIdentifier(Nvidia.GTX1080TI,      GigabyteVisionIds.GTX1080TI_GAMING_OC_BLACK,     0x47, "GIGABYTE 1080Ti Gaming OC Black"),
			new GigabyteVisionIdentifier(Nvidia.GTX1080TI,      GigabyteVisionIds.GTX1080TI_XTREME_WATERFORCE_2, 0x47, "GIGABYTE 1080Ti Waterforce Xtreme Edition"),
			new GigabyteVisionIdentifier(Nvidia.GTX1660,        GigabyteVisionIds.GTX1660_GAMING_OC_6GB,         0x47, "GIGABYTE 1660 Gaming OC 6gb"),
			new GigabyteVisionIdentifier(Nvidia.GTX1660S,       GigabyteVisionIds.GTX1660S_GAMING_OC,            0x47, "GIGABYTE 1660 Super Gaming OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX2060S_OC,    GigabyteVisionIds.RTX2060S_GAMING_OC_3X_WHITE,   0x47, "GIGABYTE 2060 Super Gaming OC Windforce White"),
			new GigabyteVisionIdentifier(Nvidia.RTX2070_OC,     GigabyteVisionIds.RTX2070_GAMING_OC,             0x47, "GIGABYTE 2070 Gaming OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX2070S,       GigabyteVisionIds.RTX2070S_GAMING_OC,            0x47, "GIGABYTE 2070 Super Gaming OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX2070S,       GigabyteVisionIds.RTX2070S_GAMING_OC_V2,         0x47, "GIGABYTE 2070 Super Gaming OC V2"),
			new GigabyteVisionIdentifier(Nvidia.RTX2070S,       GigabyteVisionIds.RTX2070S_GAMING_OC_3X,         0x47, "GIGABYTE 2070 Super Gaming OC 3x"),
			new GigabyteVisionIdentifier(Nvidia.RTX2070S,       GigabyteVisionIds.RTX2070S_GAMING_OC_3X_WHITE,   0x47, "GIGABYTE 2070 Super Gaming OC 3x White Edition"),
			new GigabyteVisionIdentifier(Nvidia.RTX3050,        GigabyteVisionIds.RTX3050_EAGLE_OC,              0x62, "GIGABYTE 3050 Eagle OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060,        GigabyteVisionIds.RTX3060_EAGLE_OC_REV2,         0x63, "GIGABYTE 3060 Eagle OC Rev 2.0"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060_LHR,    GigabyteVisionIds.RTX3060_EAGLE_OC_REV2,         0x63, "GIGABYTE 3060 Eagle OC Rev 2.0 LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060_GA104,  GigabyteVisionIds.RTX3060_EAGLE_OC_REV2,         0x63, "GIGABYTE 3060 Eagle OC LHR (GA104)"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060,        GigabyteVisionIds.RTX3060_GAMING_OC_12GB,        0x62, "GIGABYTE 3060 Gaming OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060_LHR,    GigabyteVisionIds.RTX3060_GAMING_OC_12GB,        0x62, "GIGABYTE 3060 Gaming OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060,        GigabyteVisionIds.RTX3060_VISION_OC_12GB,        0x63, "GIGABYTE 3060 Vision OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060_LHR,    GigabyteVisionIds.RTX3060_VISION_OC_12GB,        0x63, "GIGABYTE 3060 Vision OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060_GA104,  GigabyteVisionIds.RTX3060_VISION_OC_12GB,        0x63, "GIGABYTE 3060 Vision OC LHR (GA104)"),
			new GigabyteVisionIdentifier(Nvidia.RTX3070,        GigabyteVisionIds.RTX3070_VISION_OC,             0x63, "GIGABYTE 3070 Vision OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3070_LHR,    GigabyteVisionIds.RTX3070_VISION_OC,             0x63, "GIGABYTE 3070 Vision OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3070TI,      GigabyteVisionIds.RTX3070TI_EAGLE_OC,            0x63, "GIGABYTE 3070Ti Eagle OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3070TI,      GigabyteVisionIds.RTX3070TI_VISION_OC,           0x63, "GIGABYTE 3070Ti Vision OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060TI,      GigabyteVisionIds.RTX3060TI_EAGLE_OC,            0x63, "GIGABYTE 3060Ti Eagle OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060TI_LHR,  GigabyteVisionIds.RTX3060TI_EAGLE_OC,            0x63, "GIGABYTE 3060Ti Eagle OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060TI_LHR,  GigabyteVisionIds.RTX3060TI_GAMING_OC,           0x62, "GIGABYTE 3060Ti Gaming OC Rev 2.0"),
			new GigabyteVisionIdentifier(Nvidia.RTX3060TI_LHR,  GigabyteVisionIds.RTX3060TI_GAMING_OC_PRO,       0x62, "GIGABYTE 3060Ti Gaming OC Pro Rev 3.0"),
			new GigabyteVisionIdentifier(Nvidia.RTX3070,        GigabyteVisionIds.RTX3070_GAMING_OC,             0x62, "GIGABYTE 3070 Gaming OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3070_LHR,    GigabyteVisionIds.RTX3070_GAMING_OC,             0x62, "GIGABYTE 3070 Gaming OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080_GA102,  GigabyteVisionIds.RTX3080_12G_GAMING_OC,     	 0x62, "GIGABYTE 3080 Gaming OC 12g LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3070TI,      GigabyteVisionIds.RTX3070TI_GAMING_OC,           0x62, "GIGABYTE 3070Ti Gaming OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080,        GigabyteVisionIds.RTX3080_GAMING_OC,             0x62, "GIGABYTE 3080 Gaming OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080_LHR,    GigabyteVisionIds.RTX3080_GAMING_OC,             0x62, "GIGABYTE 3080 Gaming OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080,        GigabyteVisionIds.RTX3080_VISION_OC,             0x63, "GIGABYTE 3080 Vision OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080_LHR,    GigabyteVisionIds.RTX3080_VISION_OC,             0x63, "GIGABYTE 3080 Vision OC LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080_GA102,  GigabyteVisionIds.RTX3080_EAGLE_12GB_LHR,    	 0x63, "GIGABYTE 3080 Eagle OC 12g LHR"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080TI,      GigabyteVisionIds.RTX3080TI_VISION_OC,           0x63, "GIGABYTE 3080Ti Vision OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080TI,      GigabyteVisionIds.RTX3080TI_GAMING_OC,           0x62, "GIGABYTE 3080Ti Gaming OC"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080TI,      GigabyteVisionIds.RTX3080TI_EAGLE,               0x63, "GIGABYTE 3080Ti Eagle"),
			new GigabyteVisionIdentifier(Nvidia.RTX3080TI,      GigabyteVisionIds.RTX3080TI_EAGLE_OC,            0x63, "GIGABYTE 3080Ti Eagle OC"),
		];
	}
}
