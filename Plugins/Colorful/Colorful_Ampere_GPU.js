export function Name() { return "Colorful Ampere GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting"; }
export function Type() { return "SMBUS"; }
export function Size() { return [3, 1]; }
export function DefaultPosition(){return [192, 127];}
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

	for(const ColorfulGPUID of ColorfulGPUIDs) {
		if(ColorfulGPUID.Vendor === bus.Vendor() &&
		ColorfulGPUID.SubVendor === bus.SubVendor() &&
		ColorfulGPUID.Device === bus.Product() &&
		ColorfulGPUID.SubDevice === bus.SubDevice()
		) {
			FoundAddresses.push(ColorfulGPUID.Address);
		}
	}

	return FoundAddresses;
}

function SetGPUNameFromBusIds() {
	for(const ColorfulGPUID of ColorfulGPUIDs) {
		if(ColorfulGPUID.Vendor === bus.Vendor() &&
		ColorfulGPUID.SubVendor === bus.SubVendor() &&
		ColorfulGPUID.Device === bus.Product() &&
		ColorfulGPUID.SubDevice === bus.SubDevice()
		) {
			device.setName(ColorfulGPUID.Name);
		}
	}
}

export function Initialize() {

	SetGPUNameFromBusIds();
}

export function Render() {
	sendColors();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		sendColors(shutdownColor);
	}

}

function sendColors(overrideColor) {
	let color;

	if(overrideColor) {
		color = hexToRgb(overrideColor);
	} else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	} else {
		color = device.color(vLedPositions[0][0],  vLedPositions[0][1]);
	}

	const packet = [0xAA, 0xEF, 0x12, 0x03, 0x01, 0xff].concat(color);
	const CRCResult = BinaryUtils.WriteInt16LittleEndian(generateCRC(packet));

	if(CRCResult[0] !== undefined && CRCResult[1] !== undefined) {
		packet[9] = CRCResult[0];
		packet[10] = CRCResult[1];

		bus.WriteBlockWithoutRegister(0x0B, packet);
	}
}

function generateCRC(packet) { //I hate CRC's but at least this one isn't stupid complicated.
	let CRCResult = 0;

	for(let bytes = 0; bytes < 9; bytes++) {
		CRCResult += packet[bytes];
	}

	return CRCResult;
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

class ColorfulGPUIdentifier extends GPUIdentifier {
	constructor(Brand, Device, SubDevice, Name, Model = "") {
		super(0x10DE, Brand, Device, SubDevice, 0x61, Name, Model);
	}
}

export function BrandGPUList(){ return ColorfulGPUIDs; }

const ColorfulGPUIDs =
[
	//new ColorfulGPUIdentifier(0x7377, 0x2504, 0x150A, "Colorful 3060 iGame Advanced OC-V"),
	new ColorfulGPUIdentifier(0x7377, 0x2544, 0x1500, "Colorful 3060 iGame Ultra"),
	new ColorfulGPUIdentifier(0x7377, 0x2204, 0x140A, "Colorful 3090 iGame Advanced OC-V"),

	new ColorfulGPUIdentifier(0x7377, 0x2782, 0x2001, "Colorful 4070Ti Battle Axe"),
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

export default class BinaryUtils{
	static WriteInt16LittleEndian(value){
		return [value & 0xFF, (value >> 8) & 0xFF];
	}
	static WriteInt16BigEndian(value){
		return this.WriteInt16LittleEndian(value).reverse();
	}
	static ReadInt16LittleEndian(array){
		return (array[0] & 0xFF) | (array[1] & 0xFF) << 8;
	}
	static ReadInt16BigEndian(array){
		return this.ReadInt16LittleEndian(array.slice(0, 2).reverse());
	}
	static ReadInt32LittleEndian(array){
		return (array[0] & 0xFF) | ((array[1] << 8) & 0xFF00) | ((array[2] << 16) & 0xFF0000) | ((array[3] << 24) & 0xFF000000);
	}
	static ReadInt32BigEndian(array){
		if(array.length < 4){
			array.push(...new Array(4 - array.length).fill(0));
		}

		return this.ReadInt32LittleEndian(array.slice(0, 4).reverse());
	}
	static WriteInt32LittleEndian(value){
		return [value & 0xFF, ((value >> 8) & 0xFF), ((value >> 16) & 0xFF), ((value >> 24) & 0xFF)];
	}
	static WriteInt32BigEndian(value){
		return this.WriteInt32LittleEndian(value).reverse();
	}
}