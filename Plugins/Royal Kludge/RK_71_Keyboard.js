export function Name() { return "Royal Kludge RK71"; }
export function Publisher() { return "WhirlwindFX"; }
export function VendorId() { return  0x258a; }
export function ProductId() { return 0x0069; }
export function Size() { return [16, 5]; }
export function DefaultPosition(){return [0, 5];}
export function DefaultScale(){return 1.5;}
/* global
LightingMode:readonly
forcedColor:readonly
rgSwap:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"rgSwap", "group":"", "label":"Swap Red and Green Color Order", "type":"boolean", "default":"true"},
	];
}

const vKeyNames = [
	"Esc",   "1",  "2",  "3",  "4",  "5",  "6",  "7",  "8",  "9",  "0",   "-_",  "+=",         "Backspace",    "Insert",       "Home",
	"Tab",    "Q",  "W",  "E",  "R",  "T",  "Y",  "U",  "I",  "O",   "P",   "[",    "]",       "\\",           "Del",          "End",
	"CapsLock", "A",  "S",  "D",  "F",  "G",  "H",  "J",  "K",  "L",   ";",   "'",            "Enter",         "Page Up",      "Page Down",
	"Left Shift", "Z",  "X",  "C",  "V",  "B",  "N",  "M",  ",",  ".",  "/",   "Right Shift",  "Up Arrow",     "Pause Break",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Right Ctrl", "Left Arrow", "Down Arrow", "Right Arrow",

];

const vKeys =
[
	4,  22, 40, 58, 76, 94,  112, 130, 148, 166, 184, 202, 220, 238, 256, 274,
	7,  25, 43, 61, 79, 97,  115, 133, 151, 169, 187, 205, 223, 241, 259, 277,
	10, 28, 46, 64, 82, 100, 118, 136, 154, 172, 190, 208,      244, 262, 280,
	13, 31, 49, 67, 85, 103, 121, 139, 157, 175, 193, 		    247, 265, 283,
	16, 34, 52,         106,           160, 178, 196,  		    250, 268, 286,
];

const vKeyPositions = [
	[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0],
	[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1],
	[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2],          [14, 2], [15, 2], [16, 2],
	[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 	                [14, 3], [15, 3], [16, 3],
	[1, 4], [2, 4], [3, 4],                 [6, 4],                 [9, 4], [10, 4], [11, 4], 				    [14, 4], [15, 4], [16, 4],
];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Initialize() {

}

export function Render() {
	sendColors();
	sendPaddingZone(6);
	sendPaddingZone(7);
}

export function Shutdown() {
	//Do nothing. Keeb reverts to hardware mode when streaming is stopped.
}

function sendPaddingZone(zone) { //These are empty zones that we still need to send because the protocol is used for boards with more keys.
	device.send_report([0x0A, 0x07, zone], 65);
}

function sendInitalPacket(data) {
	device.send_report([0x0A, 0x07, 0x01, 0x06].concat(data), 65);
}

function StreamPacket(zone, data) {
	device.send_report([0x0A, 0x07, zone].concat(data), 65);
	device.pause(1);
}

function sendColors(overrideColor) {
	const RGBData = new Array(425).fill(0);

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		RGBData[vKeys[iIdx] ] = rgSwap ? col[1] : col[0];
		RGBData[vKeys[iIdx] +  1] = rgSwap ? col[0] : col[1];
		RGBData[vKeys[iIdx] +  2] = col[2];
	}

	sendInitalPacket(RGBData.splice(0, 61));
	StreamPacket(2, RGBData.splice(0, 62));
	StreamPacket(3, RGBData.splice(0, 62));
	StreamPacket(4, RGBData.splice(0, 62));
	StreamPacket(5, RGBData.splice(0, 62));
	device.pause(1);
}

export function Validate(endpoint) {
	return endpoint.interface === 1 && endpoint.usage === 0x0001 && endpoint.usage_page === 0xff00 && endpoint.collection === 0x0005;
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/royal-kludge/keyboards/rk84.png";
}