export function Name() { return "ASUS ROG Claymore II"; }
export function VendorId() { return 0x0B05; }
export function Documentation(){ return "troubleshooting/asus"; }
export function ProductId() { return [0x1934, 0x196B]; } // 0x1934 is wired
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [21, 7]; }
export function DefaultPosition(){return [10, 100];}
const DESIRED_HEIGHT = 85;
export function DefaultScale(){return Math.floor(DESIRED_HEIGHT/Size()[1]);}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
layout:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"layout", "group":"", "label":"Keyboard Layout", "type":"combobox", "values":["Right", "Left"], "default":"Right"},
	];
}

const vKeysLeft = //Left Side Edited by Kris. Right Side Needs ISO Conversion.
[
	6,   14,
	32,      56, 64, 72, 80,   96, 104, 112, 120, 128, 136, 144, 152,   160, 168, 176,
	33,  49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137,    153,   161, 169, 177,   1, 9, 17, 25,
	34,  50, 58, 66, 74, 82, 90, 98, 106, 114, 122, 130, 138,    154,   162, 170, 178,   2, 10, 18, 26,
	35,  51, 59, 67, 75, 83, 91, 99, 107, 115, 123, 131,         155,                  3, 11, 19,
	36,  52, 60, 68, 76, 84, 92, 100, 108, 116, 124,              156,       172,       4, 12, 20, 28,
	37,  45,  53,      85,           109, 125, 133,         157,   165, 173, 181,   5,   21,
];

const vKeysRight =
[
	6,  14,
	0,      24, 32, 40, 48,   64, 72, 80, 88, 96, 104, 112, 120,   128, 136, 144,
	1,  17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,    121,   129, 137, 145,   153, 161, 169, 177,
	2,  18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,    122,   130, 138, 146,   154, 162, 170, 178,
	3,  19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 107,    123,                  155, 163, 171,
	4,  12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92,             124,       140,       156, 164, 172, 180,
	5,  13, 21,             53,             77, 93, 101,    125,   133, 141, 149,   157, 173,
];

const vKeyNames =
[
	"Logo Left", "Logo Right",
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",
	"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ISO_#", "Enter",                                                              "Num 4", "Num 5", "Num 6",
	"Left Shift", "ISO_<", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num ."
];

const vKeyPositionsRight =
[
	[0, 0], [1, 0],
	[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1],        [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],   [14, 1], [15, 1], [16, 1],
	[0, 2],  [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 1], [15, 1], [16, 1],   [17, 2], [18, 2], [19, 2], [20, 2],
	[0, 3],  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],   [14, 2], [15, 2], [16, 2],   [17, 3], [18, 3], [19, 3], [20, 3],
	[0, 4],  [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4],                             [17, 4], [18, 4], [19, 4],
	[0, 5],  [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5],                  [13, 5],            [15, 4],           [17, 5], [18, 5], [19, 5], [20, 5],
	[0, 6],  [1, 6], [2, 6],                     [6, 6],                      [10, 6], [11, 6], [12, 6], [13, 6],    [14, 6], [15, 6], [16, 6],   [17, 6],                       [19, 6],
];

const vKeyPositionsLeft =
[
	[4, 0], [5, 0],
	[4, 1],  [5, 1], [6, 1], [7, 1], [8, 1],        [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1],   [18, 1], [19, 1], [20, 1],
	[4, 2],  [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2],   [18, 2], [19, 2], [20, 2],   [0, 2], [1, 2], [2, 2], [3, 2],
	[4, 3],  [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [16, 3], [17, 3],   [18, 3], [19, 3], [20, 3],   [0, 3], [1, 3], [2, 3], [3, 3],
	[4, 4],  [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4],         [17, 4],                             [0, 4], [1, 4], [2, 4],
	[4, 5],  [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],                 [17, 5],           [19, 5],           [0, 5], [1, 5], [2, 5], [3, 5],
	[4, 6],  [5, 6], [6, 6],                      [10, 6],                         [14, 6], [15, 6], [16, 6], [17, 6],   [18, 6], [19, 6], [20, 6],   [0, 6],        [2, 6],
];

function LedKeys() {
	if (layout == "Left") {
		return vKeysLeft;
	} else if (layout == "Right") {
		return vKeysRight;
	}

	return [];

}

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	if (layout == "Left") {
		return vKeyPositionsLeft;
	} else if (layout == "Right") {
		return vKeyPositionsRight;
	}

	return [];

}

export function Initialize() {

}

export function Render() {
	sendColors();
}

export function Shutdown() {
// revert to rainbow mode
	sendPacketString("00 51 2C 04 00 48 64 00 00 02 07 0E F5 00 FF 1D 00 06 FF 2B 00 FA FF 39 01 FF 00 48 FF F6 00 56 FF 78 07 64 FF 00 0D", 65);
	sendPacketString("00 50 55", 65);
}

function sendColors(shutdown = false) {
	const RGBData = new Array(600).fill(255);
	let TotalLedCount = 120;

	for(let iIdx = 0; iIdx < LedKeys().length; iIdx++) {
		const iPxX = LedPositions()[iIdx][0];
		const iPxY = LedPositions()[iIdx][1];
		var col;

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		RGBData[iIdx * 4 + 0] = LedKeys()[iIdx];
		RGBData[iIdx * 4 + 1] = col[0];
		RGBData[iIdx * 4 + 2] = col[1];
		RGBData[iIdx * 4 + 3] = col[2];
	}

	let packetCount = 0;

	while(TotalLedCount > 0){
		const ledsToSend = TotalLedCount >= 15 ? 15 : TotalLedCount;

		let packet = [];
		packet[0] = 0x00;
		packet[1] = 0xC0;
		packet[2] = 0x81;
		packet[3] = 0x90 - (0x0F * packetCount++);
		packet[4] = 0x00;
		packet = packet.concat(RGBData.splice(0, ledsToSend*4));
		device.write(packet, 65);

		TotalLedCount -= ledsToSend;
	}

}

export function Validate(endpoint) {
	return endpoint.interface === 1;
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

function sendPacketString(string, size) {
	const packet= [];
	const data = string.split(' ');

	for(let i = 0; i < data.length; i++) {
		packet[i] =parseInt(data[i], 16);//.toString(16)
	}

	device.write(packet, size);
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/asus/keyboards/claymore-ii.png";
}