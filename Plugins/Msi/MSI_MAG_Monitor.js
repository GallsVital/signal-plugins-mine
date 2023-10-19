export function Name() { return "MSI Monitor Controller"; }
export function VendorId() { return 0x1038; }
export function ProductId() { return 0x1128; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [40, 2]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){ return [0, 0]; }
export function DefaultScale(){ return 1.0; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters() {
	return [
		{ "property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde" },
		{ "property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas" },
		{ "property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde" }
	];
}

const vLedNames = [
	"Front LED 1", "Front LED 2", "Front LED 3", "Front LED 4", "Front LED 5", "Front LED 6", "Front LED 7", "Front LED 8", "Front LED 9", "Front LED 10", "Front LED 11", "Front LED 12", "Front LED 13", "Front LED 14", "Front LED 15", "Front LED 16", "Front LED 17", "Front LED 18", "Front LED 19", "Front LED 20", "Front LED 21", "Front LED 22", "Front LED 23", "Front LED 24", "Front LED 25", "Front LED 26", "Front LED 27", "Front LED 28", "Front LED 29", "Front LED 30", "Front LED 31", "Front LED 32", "Front LED 33", "Front LED 34", "Front LED 35", "Front LED 36", "Front LED 37", "Front LED 38", "Front LED 39", "Front LED 40",
	"Back LED 1", "Back LED 2", "Back LED 3", "Back LED 4", "Back LED 5", "Back LED 6", "Back LED 7", "Back LED 8", "Back LED 9", "Back LED 10", "Back LED 11", "Back LED 12"
];

const vLedPositions = [
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0], [30, 0], [31, 0], [32, 0], [33, 0], [34, 0], [35, 0], [36, 0], [37, 0], [38, 0], [39, 0],
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1]
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {

}

export function Render() {
	sendColors();
}

export function Shutdown(SystemSuspending) {
	const color = SystemSuspending ? "#000000" : shutdownColor;
	sendColors(color);
}

function sendColors(overrideColor) {
	const RGBData = [];

	//rgb data
	for (let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
		const iX = vLedPositions[iIdx][0];
		const iY = vLedPositions[iIdx][1];
		let color;

		if (overrideColor) {
			color = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iX, iY);
		}

		RGBData[iIdx*4]		= iIdx;
		RGBData[iIdx*4+1]	= color[0];
		RGBData[iIdx*4+2]	= color[1];
		RGBData[iIdx*4+3]	= color[2];
	}

	device.send_report([0x00, 0x0C, 0x00, 0x28, 0x00].concat(RGBData.splice(0, 40*4)), 525);
	device.send_report([0x00, 0x0C, 0x00, 0x0C, 0x00].concat(RGBData), 525);
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
	return endpoint.interface === 0 && endpoint.usage === 0x0001 && endpoint.usage_page=== 0xFFC0;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/msi/monitors/generic-monitor.png";
}