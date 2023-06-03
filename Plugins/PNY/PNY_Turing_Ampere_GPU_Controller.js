// Modifying SMBUS Plugins is -DANGEROUS- and can -DESTROY- devices.
export function Name() { return "PNY GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Type() { return "SMBUS"; }
export function Size() { return [3, 1]; }
export function DefaultPosition(){return [5, 2];}
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
const vLedPositions = [ [1, 0] ];

/** @param {FreeAddressBus} bus */
export function Scan(bus) {
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus()) {
		return [];
	}

	for(const PNYGPUID of PNYGPUIDs) {
		if(PNYGPUID.Vendor === bus.Vendor() &&
		PNYGPUID.SubVendor === bus.SubVendor() &&
		PNYGPUID.Device === bus.Product() &&
		PNYGPUID.SubDevice === bus.SubDevice()
		) {
			FoundAddresses.push(PNYGPUID.Address);
		}
	}

	return FoundAddresses;
}

export function Initialize() {
	bus.WriteByte(PNYGPU.registers.Control, 0x00);
	bus.WriteByte(PNYGPU.registers.Mode, 0x01);
	bus.WriteByte(PNYGPU.registers.Brightness, 0x64);
	SetGPUNameFromBusIds();
}

export function Render() {
	sendColors();
}

export function Shutdown() {
}

function SetGPUNameFromBusIds() {
	for(const PNYGPUID of PNYGPUIDs) {
		if(PNYGPUID.Vendor === bus.Vendor() &&
		PNYGPUID.SubVendor === bus.SubVendor() &&
		PNYGPUID.Device === bus.Product() &&
		PNYGPUID.SubDevice === bus.SubDevice()
		) {
			device.setName(PNYGPUID.Name);
		}
	}
}

function sendColors(shutdown = false) {
	const iPxX = vLedPositions[0][0];
	const iPxY = vLedPositions[0][1];
	let color;

	if(shutdown) {
		color = hexToRgb(shutdownColor);
	} else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	} else {
		color = device.color(iPxX, iPxY);
	}

	bus.WriteByte(PNYGPU.registers.R, color[0]);
	bus.WriteByte(PNYGPU.registers.G, color[1]);
	bus.WriteByte(PNYGPU.registers.B, color[2]);
}

class PNYGPUController {
	constructor() {
		this.registers =
        {
        	Control    : 0xE0,
        	Mode       : 0x60,
        	R          : 0x6C,
        	G          : 0x6D,
        	B          : 0x6E,
        	Brightness : 0x6F
        };
	}

	setDeviceMode(mode) {
		bus.WriteByte(this.registers.Mode, mode);
	}
}

const PNYGPU = new PNYGPUController();

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

class PNYGPUIdentifier extends GPUIdentifier {
	constructor(Device, Brand, SubDevice, Name, Model = "") {
		super(0x10DE, Brand, Device, SubDevice, 0x49, Name, Model);
	}
}
export function BrandGPUList(){ return PNYGPUIDs; }

const PNYGPUIDs =
[
	new PNYGPUIdentifier(0x2482, 0x10B0, 0x2482, "Gainward Phoenix RTX 3070TI"),

	new PNYGPUIdentifier(0x2486, 0x1569, 0x2486, "PALIT RTX 3060TI Dual OC"),
	new PNYGPUIdentifier(0x2482, 0x1569, 0xf278, "PALIT RTX 3070TI GameRock"),
	new PNYGPUIdentifier(0x2482, 0x1569, 0x2482, "PALIT RTX 3070TI Gaming Pro"),
	new PNYGPUIdentifier(0x2204, 0x1569, 0xf278, "PALIT RTX 3090 GameRock"),
	new PNYGPUIdentifier(0x2204, 0x1569, 0x2204, "PALIT RTX 3090 Gaming Pro"),
	new PNYGPUIdentifier(0x2208, 0x1569, 0x2208, "PALIT RTX 3080TI Gaming Pro"),
	new PNYGPUIdentifier(0x2216, 0x1569, 0x2216, "PALIT RTX 3080 Gaming Pro"),
	new PNYGPUIdentifier(0x2206, 0x1569, 0x2206, "PALIT RTX 3080 Gaming Pro"),
	new PNYGPUIdentifier(0x2484, 0x1569, 0x2484, "PALIT RTX 3070 Gaming Pro"),
	new PNYGPUIdentifier(0x2488, 0x1569, 0x2488, "PALIT RTX 3070 Gaming Pro"),
	new PNYGPUIdentifier(0x2484, 0x1569, 0xf280, "PALIT RTX 3070 JetStream"),


	new PNYGPUIdentifier(0x2484, 0x196E, 0x136E, "PNY RTX 3070 XLR8"),
	new PNYGPUIdentifier(0x2216, 0x196E, 0x138B, "PNY RTX 3080 XLR8"),
	new PNYGPUIdentifier(0x2208, 0x196E, 0x1385, "PNY RTX 3080TI Revel"),
	new PNYGPUIdentifier(0x2206, 0x196E, 0x136B, "PNY RTX 3080 XLR8 Gaming REVEL EPIC-X RGB Triple Fan Edition"),
	new PNYGPUIdentifier(0x2204, 0x196E, 0x136A, "PNY RTX3090 XLR8"),

	new PNYGPUIdentifier(0x2782, 0x1569, 0xF298, "Palit RTX 4070TI Gaming Pro"),
	new PNYGPUIdentifier(0x2704, 0x1569, 0xF296, "Palit RTX 4080 GameRock"),
	new PNYGPUIdentifier(0x2684, 0x1569, 0xF296, "Palit RTX 4090 GameRock OC")
];

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageResource() {
	return "default/gpu";
}