export function Name() { return "HyperX Alloy Origins 60"; }
export function VendorId() { return 0x0951; }
export function ProductId() { return 0x1734; }
export function Publisher() { return "Derek Huber"; }
export function Size() { return [14, 5]; }
export function DefaultPosition() {return [75, 70]; }
export function DefaultScale() {return 8.0;}
export function ConflictingProcesses() {
	return ["NGenuity2.exe"];
}
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

const vLedNames =
[
	"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",       "Enter",
	"Left Shift",      "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/",     "Right Shift",
	"Left Ctrl", "Left Win", "Left Alt", "LSpace",       "MSpace",      "RSpace", "Right Alt", "Menu", "Right Ctrl", "Fn",
];

const vLedPositions =
[
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2],          [13, 2],
	[0, 3],         [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],          [13, 3],
	[0, 4], [1, 4], [2, 4], [3, 4],                 [6, 4],                 [9, 4], [10, 4], [11, 4], [12, 4], [13, 4],
];

const vKeymap =
[
	1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 15,
	16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
	30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,     43,
	44,     46, 47, 48, 49, 50, 51, 52, 53, 54, 55,     57,
	58, 59, 60, 61,         62,         63, 64, 65, 66, 70
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
	sendColor();
}

export function Shutdown() {
	sendColor(true);
}

function StartPacket() {
	device.send_report([0x00, 0x04, 0xF2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05], 65);
}

function sendColor(shutdown = false){
	StartPacket();

	const red = new Array(80).fill(0);
	const green = new Array(80).fill(0);
	const blue = new Array(80).fill(0);

	for(let iIdx = 0; iIdx < vKeymap.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}

		red[vKeymap[iIdx]] = color[0];
		green[vKeymap[iIdx]] = color[1];
		blue[vKeymap[iIdx]] = color[2];
	}

	let TotalkeyCount = 80;
	let sentKeys = 0;

	while(TotalkeyCount > 0) {
		const packet = [];
		packet[0x00] = 0x00;

		const keys = TotalkeyCount >= 16 ? 16 : TotalkeyCount;

		for(let idx = 0; idx < keys; idx++) {
			packet[(idx * 4) + 1] = 0x81;
			packet[(idx * 4) + 2] = red[sentKeys];
			packet[(idx * 4) + 3] = green[sentKeys];
			packet[(idx * 4) + 4] = blue[sentKeys];
			TotalkeyCount--;
			sentKeys++;
		}

		device.send_report(packet, 65);
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

export function Validate(endpoint) {
	return endpoint.interface === 3;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/hyperx/keyboards/alloy-origins-60.png";
}