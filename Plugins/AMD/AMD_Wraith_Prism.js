export function Name() { return "AMD Wraith Prism"; }
export function VendorId() { return 0x2516; }
export function Documentation(){ return "troubleshooting/coolermaster"; }
export function ProductId() { return 0x0051; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [5, 5]; }
export function DefaultPosition(){return [165, 60];}
export function DefaultScale(){return 6.0;}
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

const vZones = [ 5, 0, 6 ];

const vKeyNames = [ "Logo", "Ring", "Fan" ];
const vKeyPositions = [ [0, 0], [1, 1], [2, 2] ];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Initialize() {
	device.write([0x00, 0x41, 0x80], 65);
	SendChannelSetup();
}

export function Render() {
	sendColors();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		sendColors("#000000"); // Go Dark on System Sleep/Shutdown
		device.write([0x00, 0x41, 0x00], 65);
	}else{
		sendColors(shutdownColor);
		device.write([0x00, 0x41, 0x00], 65);
	}

}

function sendColors(overrideColor) {

	for(let iIdx = 0; iIdx < vZones.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		var col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		sendColorPacket(vZones[iIdx], col);
	}

	device.write([0x00, 0x51, 0x28, 0x00, 0x00, 0xE0], 65);
}

const ColorPacket =
[
	0x00, 0x51, 0x2C, 0x01, 0x00, 0x05, 0xFF, 0x00, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
];

function sendColorPacket(zone, data) {
	ColorPacket[5] = zone;
	ColorPacket[11] = data[0];
	ColorPacket[12] = data[1];
	ColorPacket[13] = data[2];

	device.write(ColorPacket, 65);
}

const ChannelPacket = [ 0x00, 0x51, 0xA0, 0x01, 0x00, 0x00, 0x03, 0x00, 0x00, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ];

function SendChannelSetup() {
	device.write(ChannelPacket, 65);
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint) {
	return endpoint.interface === 1;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/amd/wraith-prism.png";
}