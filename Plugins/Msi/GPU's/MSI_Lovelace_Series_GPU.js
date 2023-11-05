export function Name() { return "MSI Lovelace GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/MSI"; }
export function Type() { return "SMBUS"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 2.5;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

const vLedNames = [ "GPU" ];
const vLedPositions = [ [0, 0]];

let startupRed;
let startupBlue;
let startupGreen;
let startupBrightness;
let startupMode;

/** @param {FreeAddressBus} bus */
export function Scan(bus) {
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus()) {
		return [];
	}

	for(const MSIGPUID of new MSIGPUList().devices) {
		if(MSIGPUID.Vendor === bus.Vendor() &&
		MSIGPUID.SubVendor === bus.SubVendor() &&
		MSIGPUID.Device === bus.Product() &&
		MSIGPUID.SubDevice === bus.SubDevice()
		) {
			FoundAddresses.push(MSIGPUID.Address);
		}
	}

	return FoundAddresses;
}

export function BrandGPUList(){ return new MSIGPUList().devices; }

export function Initialize() {
	bus.WriteByte(0x2E, 0x00);
	bus.WriteByte(0x2D, 0x00); //40 Series flags
	MSIGPU.setDeviceMode(MSIGPU.modes.STATIC);
	MSIGPU.setDeviceBrightness(0x64);
	MSIGPU.setDeviceEffectSpeed(0x00); //Yay 40 series quirks
	SetGPUNameFromBusIds(new MSIGPUList().devices);
}

export function Render() {
	sendColors();
}

export function Shutdown() {
}

function SetGPUNameFromBusIds(GPUList) {
	for(const GPU of GPUList) {
		if(CheckForIdMatch(bus, GPU)) {
			device.setName(GPU.Name);
			break;
		}
	}
}

function CheckForIdMatch(bus, Gpu) {
	return Gpu.Vendor === bus.Vendor() &&
    Gpu.SubVendor === bus.SubVendor() &&
    Gpu.Device === bus.Product() &&
    Gpu.SubDevice === bus.SubDevice();
}

function sendColors(shutdown = false) {
	let color;

	if(shutdown) {
		color = hexToRgb(shutdownColor);
	} else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	} else {
		color = device.color(vLedPositions[0][0],  vLedPositions[0][1]);
	}

	MSIGPU.setDeviceMode(MSIGPU.modes.STATIC); //40 Series special.
	//We aren't using the start flag here. The 40 series card didn't need it, so let's just try without.
	bus.WriteByte(MSIGPU.registers.R1, color[0]);
	bus.WriteByte(MSIGPU.registers.G1, color[1]);
	bus.WriteByte(MSIGPU.registers.B1, color[2]);
	device.pause(120);
}

class MSIGPUController {
	constructor() {
		this.registers =
        {
        	BRIGHTNESS                 : 0x36,
        	SPEED                      : 0x38,
        	START                      : 0x26,
        	R1                         : 0x30,
        	G1                         : 0x31,
        	B1                         : 0x32,
        	R2                         : 0x27,
        	G2                         : 0x28,
        	B2                         : 0x29,
        	R3                         : 0x2a,
        	G3                         : 0x2b,
        	B3                         : 0x2c,
        	MODE                       : 0x22,
        	APPLY                      : 0x3f,
        	MSI_GPU_APPLY_VAL          : 0x01,
        };

		this.commands =
        {
        	action    : 0x80,
        	speed     : 0x20,
        	direction : 0x24,
        	apply     : 0x2F
        };

		this.modes =
        {
        	OFF                       : 0x01,
        	RAINBOW                   : 0x08,
        	STATIC                    : 0x13,
        	RAINDROP                  : 0x1a,
        	MAGIC                     : 0x07,
        	PATROLLING                : 0x05,
        	STREAMING                 : 0x06,
        	LIGHTNING                 : 0x15,
        	WAVE                      : 0x1f,
        	METEOR                    : 0x16,
        	MARQUEE                   : 0x18,
        	STACK                     : 0x0d,
        	RHYTHM                    : 0x0b,
        	FLOWING                   : 0x09,
        	WHIRLING                  : 0x0f,
        	TWISTING                  : 0x11,
        	LAMINATING                : 0x1d,
        	FADEIN                    : 0x14,
        	BREATHING                 : 0x04,
        	FLASHING                  : 0x02,
        	DOUBLEFLASHING            : 0x03,
        };
	}

	getStartupValues() //Return startup color and brightness values.
	{
		const startupRed = bus.ReadByte(this.registers.R1);
		const startupGreen = bus.ReadByte(this.registers.G1);
		const startupBlue = bus.ReadByte(this.registers.B1);
		const startupBrightness = bus.ReadByte(this.registers.BRIGHTNESS);
		const startupMode = bus.ReadByte(this.registers.MODE);

		return [startupRed, startupBlue, startupGreen, startupBrightness, startupMode];
	}

	initializeGPU(brightness, mode) {
		if(mode !== this.modes.STATIC) {
			this.setDeviceMode(this.modes.STATIC);
			device.log(this.getStartupValues[4]); //Recheck
		}

		if(brightness !== 0x64) {
			this.setDeviceBrightness(0x64);
			device.log(this.getStartupValues[3]); //Recheck brightness
		}

		device.log("Startup Color Code" + (startupRed << 8) + (startupGreen << 8) + (startupBlue << 8));
	}

	setDeviceMode(mode) {
		bus.WriteByte(this.registers.MODE, mode);
	}

	setDeviceBrightness(brightness) {
		bus.WriteByte(this.registers.BRIGHTNESS, brightness);
	}

	setDeviceEffectSpeed(speed) {
		bus.WriteByte(this.registers.SPEED, speed);
	}
}

const MSIGPU = new MSIGPUController();

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

class MSIGPUIdentifier extends GPUIdentifier {
	constructor(device, SubDevice, Address, Name) {
		super(0x10DE, 0x1462, device, SubDevice, Address, Name, "");
	}
}

class NvidiaGPUDeviceIds {
	constructor() {
		this.RTX4060TI       = 0x2803;
		this.RTX4070		 = 0x2786;
		this.RTX4070TI		 = 0x2782;
		this.RTX4080		 = 0x2704;
		this.RTX4090		 = 0x2684;
	}
};

const Nvidia = new NvidiaGPUDeviceIds();

class MSIGPUDeviceIDs {
	constructor() {
		this.RTX4060TI_GAMING_X_TRIO                 = 0x5152;

		this.RTX4070_GAMING_X_TRIO 					 = 0x5136;

		this.RTX4070TI_GAMING_X_TRIO				 = 0x5132;
		this.RTX4070TI_SUPRIM_X						 = 0x5133;
		this.RTX4070TI_GAMING_X_TRIO_W				 = 0x5139;

		this.RTX4080_SUPRIM							 = 0x5110;
		this.RTX4080_GAMING_X_TRIO					 = 0x5111;
		this.RTX4080_GAMING_X_TRIO_W				 = 0x5115;

		this.RTX4090_SUPRRIM_X						 = 0x5102;
		this.RTX4090_GAMING_TRIO			         = 0x5103;
		this.RTX4090_SUPRIM_LIQUID_X                 = 0x5104;
		this.RTX4090_SUPRIM_X_CLASSIC				 = 0x5105;
		this.RTX4090_SUPRIM_X_CLASSIC_2				 = 0x5106;
	}
}


class MSIGPUList {
	constructor() {
		const Nvidia = new NvidiaGPUDeviceIds();
		const MSIGPUIDs  = new MSIGPUDeviceIDs();
		this.devices =
        [
        	new MSIGPUIdentifier(Nvidia.RTX4060TI,	MSIGPUIDs.RTX4060TI_GAMING_X_TRIO,		0x68, "MSI 4060Ti GAMING X TRIO"),
        	new MSIGPUIdentifier(Nvidia.RTX4070,	MSIGPUIDs.RTX4070_GAMING_X_TRIO,		0x68, "MSI 4070 GAMING X TRIO",),
        	new MSIGPUIdentifier(Nvidia.RTX4070TI,	MSIGPUIDs.RTX4070TI_GAMING_X_TRIO,		0x68, "MSI 4070Ti GAMING X TRIO"),
        	new MSIGPUIdentifier(Nvidia.RTX4070TI,	MSIGPUIDs.RTX4070TI_GAMING_X_TRIO_W,	0x68, "MSI 4070Ti GAMING X TRIO White"),
        	new MSIGPUIdentifier(Nvidia.RTX4070TI,	MSIGPUIDs.RTX4070TI_SUPRIM_X,			0x68, "MSI 4070Ti SUPRIM X"),
        	new MSIGPUIdentifier(Nvidia.RTX4080,	MSIGPUIDs.RTX4080_SUPRIM,				0x68, "MSI 4080 SUPRIM"),
        	new MSIGPUIdentifier(Nvidia.RTX4080,	MSIGPUIDs.RTX4080_GAMING_X_TRIO,		0x68, "MSI 4080 GAMING X TRIO"),
        	new MSIGPUIdentifier(Nvidia.RTX4080,	MSIGPUIDs.RTX4080_GAMING_X_TRIO_W,		0x68, "MSI 4080 GAMING X TRIO White"),
        	new MSIGPUIdentifier(Nvidia.RTX4090,	MSIGPUIDs.RTX4090_GAMING_TRIO,			0x68, "MSI 4090 GAMING TRIO"),
        	new MSIGPUIdentifier(Nvidia.RTX4090,	MSIGPUIDs.RTX4090_SUPRIM_LIQUID_X,		0x68, "MSI 4090 SUPRIM LIQUID X"),
        	new MSIGPUIdentifier(Nvidia.RTX4090,	MSIGPUIDs.RTX4090_SUPRRIM_X,			0x68, "MSI 4090 SUPRIM X"),
        	new MSIGPUIdentifier(Nvidia.RTX4090,	MSIGPUIDs.RTX4090_SUPRIM_X_CLASSIC,		0x68, "MSI 4090 SUPRIM X Classic"),
        	new MSIGPUIdentifier(Nvidia.RTX4090,	MSIGPUIDs.RTX4090_SUPRIM_X_CLASSIC_2,	0x68, "MSI 4090 SUPRIM X Classic")
        ];
	}
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/msi/gpus/gpu.png";
}
