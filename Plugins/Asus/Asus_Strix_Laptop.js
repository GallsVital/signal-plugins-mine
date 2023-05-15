export function Name() { return "ROG Strix Scar (2022)"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return 0x19B6; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [15, 8]; }
export function DefaultPosition(){return [10, 100];}
const DESIRED_HEIGHT = 85;
export function DefaultScale(){return Math.floor(DESIRED_HEIGHT/Size()[1]);}
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

const vKeys =
[
	3, 4, 5, 6, 7,
	27, 29, 30, 31, 32, 34, 35, 36, 37, 44, 45, 46, 47, 48,
	53, 54, 55, 56, 57, 58, 65, 66, 67, 68, 69, 70, 71, 72, 75,
	80, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 101,
	111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 130, 133,
	138, 140, 141, 142, 143, 144, 150, 151, 152, 153, 154, 156, 159,
	164, 165, 171, 172, 173, 178, 180, 182, 185,
	208, 214, 215
];

const vKeysBitOffset =
[
	2, 2, 2, 2, 2,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2,
	2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2,
	2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 0, 0, 0, 0, 0, 0, 0,
	2, 1, 1
];

const vKeyNames =
[
	"M1", "M2", "M3", "M4", "M5",
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Del",
	"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace", "Pause",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Stop",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", "Rewind",
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Skip",
	"Left Ctrl", "Fn", "Left Win", "Left Alt", "Space", "Right Alt", "Right Ctrl",  "Up Arrow", "Print Screen",
	"Left Arrow",  "Down Arrow", "Right Arrow"
];

const vKeyPositions =
[
	[2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
	[0, 1],      [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],
	[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],        [13, 4], [14, 4],
	[0, 5],      [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5],        [13, 5], [14, 5],
	[0, 6], [1, 6], [2, 6], [3, 6],            [6, 6],            [9, 6], [10, 6],        [12, 6],        [14, 6],
	[11, 7], [12, 7], [13, 7]
];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Initialize() {
	device.log("vKey: " + vKeys.length);
	device.log("vKeyNames: " + vKeyNames.length);
	device.log("vKeyPositions: " + vKeyPositions.length);
}

export function Render() {
	sendColors();
}

export function Shutdown() {
	sendColors(true);
}

function sendColors(shutdown = false) {
	const RGBData = new Array(168*3).fill(0);
	let TotalLedCount = 168;
	let ledsSent = 0;

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		let col;

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		RGBData[vKeys[iIdx] * 3 - vKeysBitOffset[iIdx] + 0] = col[0];
		RGBData[vKeys[iIdx] * 3 - vKeysBitOffset[iIdx] + 1] = col[1];
		RGBData[vKeys[iIdx] * 3 - vKeysBitOffset[iIdx] + 2] = col[2];
	}

	while(TotalLedCount > 0) {
		const ledsToSend = TotalLedCount >= 16 ? 16 : TotalLedCount;

		let packet = [0x5D, 0xbc, 0x00, 0x01, 0x01, 0x01, ledsSent, ledsToSend];
		packet = packet.concat(RGBData.splice(0, ledsToSend*4));
		device.send_report(packet, 64); //why are we using this and still limiting the packets to 65 ASUS?
		TotalLedCount -= ledsToSend;
		ledsSent += ledsToSend;
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
	return endpoint.interface === -1 && endpoint.usage === 0x0079 && endpoint.usage_page === 0xff31;
}

export function Image() {
	return "";
}