/// <reference path="./Fantech_Board_Keyboard.d.ts" />
export function Name() { return "Fantech board"; }
export function VendorId() { return 0x0416; }
export function ProductId() { return 0xc345; }
export function Publisher() { return "WhirlwindFX"; }
export function DefaultPosition(){return [10, 100]; }
export function DefaultScale(){return 8.0;}
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"boardModel", "group":"", "label":"Layout", "type":"combobox", "values":["MAXFIT61", "MK870TKL", "K24"], "default":"MAXFIT61"},
	];
}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
boardModel:readonly
*/
//Credits:
// arunasmazeika  MK870 TKL
// 5vhled MAXFIT61 FROST

const boards = {

	MAXFIT61: {
		name: "MAXFIT61",
		vKeyNames: [
			"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",
			"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
			"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",       "Enter",
			"Left Shift",      "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/",     "Right Shift",
			"Left Ctrl", "Left Win", "Left Alt",        "Space",      "Right Alt", "Menu", "Right Ctrl", "Fn"
		],
		vKeys:  [
			22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,  36,
			44,  45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 58,
			66,   68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,    80,
			88,    90, 91, 92, 93, 94, 95, 96, 97, 98, 99,      102,
			110, 111, 112,         116,          120, 121, 122, 123
		],
		vKeyPositions: [
			[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0],   [13, 0],
			[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1],  [13, 1],
			[0, 2],   [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2],          [13, 2],
			[0, 3],        [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],             [13, 3],
			[0, 4], [1, 4], [2, 4],                         [6, 4],                            [10, 4], [11, 4], [12, 4], [13, 4]
		],
		size: [14, 5]
	},
	MK870TKL:{
		name: "MK870TKL",
		vKeyNames: [
			"Esc",     "F1", "F2", "F3", "F4",   "F5", "F6", "F7", "F8",    "F9", "F10", "F11", "F12",  		  "Print Screen", "Scroll Lock", "Pause Break",
			"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace", 					  "Insert", "Home", "PgUp",
			"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", 							  "Delete", " End", "PgDown",
			"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",       "Enter",
			"Left Shift",      "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/",     "Right Shift",    			  "Up Arrow",
			"Left Ctrl", "Left Win", "Left Alt",        "Space",      "Right Alt", "Fn", "Menu", "Right Ctrl",    "Left Arrow",  "Down Arrow", "Right Arrow"
		],
		vKeys: [
			0, 		2, 3, 4, 5, 	7, 8, 9, 10, 	 11, 12, 13, 14,	15, 16, 17,
			22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,  36,    37, 38, 39,
			44,  45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 58,    59, 60, 61,
			66,   68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,    80,
			88,    90, 91, 92, 93, 94, 95, 96, 97, 98, 99,      102, 	104,
			110, 111, 112,         116,          120, 121, 122, 123,    125, 126, 127
		],
		vKeyPositions: [
			[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0],   			[14, 0], [15, 0], [16, 0],
			[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1],   [13, 1],	[14, 1], [15, 1], [16, 1],
			[0, 2],  [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2],  [13, 2],	[14, 2], [15, 2], [16, 2],
			[0, 3],   [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],          [13, 3],
			[0, 4],        [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],             [13, 4],	[15, 4],
			[0, 5], [1, 5], [2, 5],                         [6, 5],                            [10, 5], [11, 5], [12, 5], [13, 5],	[14, 5], [15, 5], [16, 5]
		],
		size: [17, 6]
	},
	K24:{
		name: "Motospeed K24",
		vKeyNames: [
			"Esc", "Tab", "Backspace", "FN",
			"Numlock", "/", "*", "-",
			"Num 7", "Num 8", "Num 9", "Num +",
			"Num 4", "Num 5", "Num 6",
			"Num 1", "Num 2", "Num 3", "Num Enter",
			"Num 0", "."
		],
		vKeys: [
			18, 19, 20, 21,
			40, 41, 42, 43,
			62, 63, 64, 65,
			84, 85, 86,
			106, 107, 108, 109,
			128, 130
		],
		vKeyPositions: [
			[0, 0], [1, 0], [2, 0], [3, 0],
			[0, 1], [1, 1], [2, 1], [3, 1],
			[0, 2], [1, 2], [2, 2], [3, 2],
			[0, 3], [1, 3], [2, 3],
			[0, 4], [1, 4], [2, 4], [3, 4],
			[0, 5],			[2, 5],
		],
		size: [4, 6]
	}
};

let vKeyNames = [];
let vKeys = [];
let vKeyPositions = [];

export function Size() {
	return boards[boardModel].size;
}

export function LedNames() {
	vKeyNames = boards[boardModel].vKeyNames;

	return vKeyNames;
}

export function LedPositions() {
	vKeyPositions = boards[boardModel].vKeyPositions;

	return vKeyPositions;
}

export function onboardModelChanged () {

	vKeyNames = boards[boardModel].vKeyNames;
	vKeyPositions = boards[boardModel].vKeyPositions;
	vKeys = boards[boardModel].vKeys;

	device.setName(boards[boardModel].name);
	device.log(`Model set to: ` + boards[boardModel].name);
	device.setControllableLeds(vKeyNames, vKeyPositions);
}

export function Initialize() {

	vKeyNames = boards[boardModel].vKeyNames;
	vKeyPositions = boards[boardModel].vKeyPositions;
	vKeys = boards[boardModel].vKeys;

	device.setControllableLeds(vKeyNames, vKeyPositions);
	device.setName(boards[boardModel].name);
	device.log(`Model set to: ` + boards[boardModel].name);

	device.write([0x01, 0x0D], 64);
	device.write([0x01, 0x15], 64);
	device.write([0x01, 0x0A], 64);
	device.write([0x01, 0x02], 64);
	device.write([0x01, 0x07, 0x00, 0x00, 0x00, 0x0E, 0x00, 0x04, 0x03, 0xFF], 64);
	device.write([0x01, 0x17, 0x00, 0x00, 0x00, 0x01, 0x01], 64);
	device.write([0x01, 0x08, 0x00, 0x00, 0x00, 0x0D, 0x02, 0x03, 0x03, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], 64);
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
  	let mxPxColor;
	const RGBData = new Array(432);

	for(let iIdx = 0; iIdx < vKeyPositions.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];

		if(overrideColor) {
			mxPxColor = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			mxPxColor = hexToRgb(forcedColor);
		}else {
			mxPxColor = device.color(iPxX, iPxY);
		}

		RGBData[(vKeys[iIdx]*3)] = mxPxColor[0];
		RGBData[(vKeys[iIdx]*3)+1] = mxPxColor[1];
		RGBData[(vKeys[iIdx]*3)+2] = mxPxColor[2];
	}

	for(let row = 0; row <= 7; row++) {
		let packet = [];
		packet[0] = 0x01;
		packet[1] = 0x0F;
		packet[2] = 0x00;
		packet[3] = 0x00;
		packet[4] = row;
		packet[5] = row === 7 ? 0x12 : 0x36;
		packet = packet.concat(RGBData.splice(0, 54));
		device.write(packet, 64);
	}

	device.write([0x01, 0x0F, 0x01, 0x00, 0x00, 0x36], 64);
	device.write([0x01, 0x0F, 0x01, 0x00, 0x01, 0x2D], 64);
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
	return endpoint.interface === 2 && endpoint.usage === 0x0091 && endpoint.usage_page === 0xff1b && endpoint.collection === 0x0000;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/fantech/keyboards/mk876-tkl.png";
}