// Modifying SMBUS Plugins is -DANGEROUS- and can -DESTROY- devices.
export function Name() { return "PNY GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Type() { return "SMBUS"; }
export function Size() { return [3, 3]; }
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

const vLedNames = [ "LED 1", "LED 2", "LED 3" ];
const vLedPositions = [ [0, 0], [0, 1], [0, 2] ];

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
	SetGPUNameFromBusIds();
	sendColors();
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

	for(let zone = 0; zone < 3; zone++) {
		const iPxX = vLedPositions[zone][0];
		const iPxY = vLedPositions[zone][1];
		let color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}

		PNYGPU.setRGB(zone, color);
	}

}

class PNYGPUController {
	constructor() {
		this.registers =
        {
        	Fetch    : 0x82,
        	Lighting : 0x02
        };
	}

	setRGB(zone, RGBData) {
		const packet = [0x06, 0xff, zone, 0x00];
		packet.push(...RGBData);
		bus.WriteBlock(this.registers.Lighting, 0x07, packet);
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
	constructor(Device, SubDevice, Name, Model = "") {
		super(0x10DE, 0x196E, Device, SubDevice, 0x60, Name, Model);
	}
}

export function BrandGPUList(){ return PNYGPUIDs; }

const PNYGPUIDs =
[
	new PNYGPUIdentifier(0x2782, 0x13b1, "PNY RTX 4070TI XLR8"),
	new PNYGPUIdentifier(0x2782, 0x13b2, "PNY RTX 4070 Ti 12GB XLR8 Gaming VERTO™ EPIC-X RGB Triple Fan"),
	new PNYGPUIdentifier(0x2704, 0x13b0, "PNY RTX 4080 XLR8 Gaming VERTO™ OC"),
	new PNYGPUIdentifier(0x2684, 0x13ad, "PNY RTX 4090 XLR8"),
	new PNYGPUIdentifier(0x2684, 0x13ae, "PNY RTX 4090 XLR8"),
	new PNYGPUIdentifier(0x2704, 0x13BC, "PNY RTX 4080 16GB XLR8 Gaming OC"),
];

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/default/gpu.png";
}