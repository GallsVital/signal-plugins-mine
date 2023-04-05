export function Name() { return "ThermalTake DPSG PSU"; }
export function VendorId() { return 0x264A; }
export function ProductId() { return 0x2329; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [7, 7]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 8.0;}
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

const vLedNames = ["LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10", "LED 11", "LED 12" ];
const vLedPositions = [ [1, 2], [0, 3], [1, 4], [2, 5], [3, 6], [4, 5], [5, 4], [6, 3], [5, 2], [4, 1], [3, 0], [2, 0] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.write([0x00, 0xfe, 0x31], 64);
}

export function Render() {
	sendZone();
}

export function Shutdown() {
	sendZone(true);
}

function sendZone(shutdown = false) {
	const packet = [0x00, 0x30, 0x42, 0x18];


	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		let color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}

		const iLedIdx = 4 + iIdx *3;
		packet[iLedIdx] = color[1];
		packet[iLedIdx + 1] = color[0];
		packet[iLedIdx + 2] = color[2];
	}

	device.write(packet, 65);
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
	return endpoint.interface === -1;
}