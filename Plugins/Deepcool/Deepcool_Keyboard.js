export function Name() { return "Deepcool Keyboard"; }
export function VendorId() { return 0x0416; }
export function ProductId() { return 0xb23C; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [17, 6]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
keyboardType:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"keyboardType", "group":"lighting", "label":"Keyboard Size", "type":"combobox", "values":["TKL", "68%"], "default":"TKL"},
	];
}

const vKeyNamesTKL = [
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",					   "PrtSc", "ScrLk", "Pause",
	"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",
];

const vKeysTKL = [
	0,      6,  9,  12, 15,  21,  24,  27,  30,  33,  36,  39, 42,  45, 48, 51,
	70,  73,  76,  79,  82,  85,  88,  91,  94,  97,  100, 103, 106, 116, 119, 122, 125,
	140, 143, 146, 149, 152, 155, 158, 161, 164, 167, 174, 177, 180, 186, 189, 192, 195,
	210, 216, 219, 222, 225, 232, 235, 238, 241, 244, 247, 250, 256,
	280, 290, 293, 296, 299, 302, 305, 308, 311, 314, 317, 326, 332,
	354, 357, 360,           372,           384, 387, 390, 393, 399, 406, 409,
];


const vKeyPositionsTKL = [
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0],         [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],   [14, 0], [15, 0], [16, 0],
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],   [14, 1], [15, 1], [16, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],          [13, 3],
	[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],                   [13, 4],            [15, 4],
	[0, 5], [1, 5], [2, 5],                         [6, 5],                         [10, 5], [11, 5], [12, 5], [13, 5],   [14, 5], [15, 5], [16, 5],
];

const vKeyNames68 = [
	"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace", "'", //15
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Del", //15
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",       "Enter", "PgUp", //15
	"Left Shift",      "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/",     "Right Shift", "Up Arrow", "PgDn", //13
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow" //8
];

const vKeys68 = [
	70,  73,  76,  79,  82,  85,  88,  91,  94,  97,  100, 103, 106, 116, 119,
	140, 143, 146, 149, 152, 155, 158, 161, 164, 167, 174, 177, 180, 186, 189,
	210, 216, 219, 222, 225, 232, 235, 238, 241, 244, 247, 250,      256, 259,
	280, 290, 293, 296, 299, 302, 305, 308, 311, 314, 317, 		323, 326, 329,
	354, 357, 360,           372,                384, 387, 390, 393, 396, 399
];


const vKeyPositions68 = [
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0],
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2],          [13, 2], [14, 2],
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], 	      [12, 3], [13, 3], [14, 3],
	[0, 4], [1, 4], [2, 4],                 [5, 4],                 [8, 4], [9, 4], [10, 4], 		  [12, 4], [13, 4], [14, 4]
];

export function LedNames() {
	return vKeyNamesTKL;
}

export function LedPositions() {
	return vKeyPositionsTKL;
}

export function Initialize() {
	setKeymap();
}

export function Render() {
	sendPackets();
}

export function Shutdown() {
	sendPackets(true);
}

export function onkeyboardTypeChanged()
{
	setKeymap();
}

function setKeymap()
{
	if(keyboardType === "TKL") {
		device.setSize([17, 6]);
		device.setControllableLeds(vKeyNamesTKL, vKeyPositionsTKL);
	} else {
		device.setSize([15, 5]);
		device.setControllableLeds(vKeyNames68, vKeyPositions68);
	}
}

function sendPackets(shutdown = false) {
	const RGBData = grabColors(shutdown);

	for(let packets = 0; packets < 8; packets++) {
		let packet = [ 0x01, 0x0f, 0x00, 0x00, packets, (packets === 7) ? 0x12 : 0x36 ];
		packet = packet.concat(RGBData.splice(0, 58));
		device.write(packet, 64);
	}
}

function grabColors(shutdown) {
	const RGBData = new Array(464).fill(0);

	if(keyboardType === "TKL") {
		for(let iIdx = 0; iIdx < vKeysTKL.length; iIdx++) {
			const iPxX = vKeyPositionsTKL[iIdx][0];
			const iPxY = vKeyPositionsTKL[iIdx][1];
			let col;

			if(shutdown) {
				col = hexToRgb(shutdownColor);
			} else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			} else {
				col = device.color(iPxX, iPxY);
			}

			RGBData[vKeysTKL[iIdx] ] = col[0];
			RGBData[vKeysTKL[iIdx] +  1] = col[1];
			RGBData[vKeysTKL[iIdx] +  2] = col[2];
		}
	} else {
		for(let iIdx = 0; iIdx < vKeys68.length; iIdx++) {
			const iPxX = vKeyPositions68[iIdx][0];
			const iPxY = vKeyPositions68[iIdx][1];
			let col;

			if(shutdown) {
				col = hexToRgb(shutdownColor);
			} else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			} else {
				col = device.color(iPxX, iPxY);
			}

			RGBData[vKeys68[iIdx] ] = col[0];
			RGBData[vKeys68[iIdx] +  1] = col[1];
			RGBData[vKeys68[iIdx] +  2] = col[2];
		}
	}

	return RGBData;
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
	return endpoint.interface === 2;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/deepcool/keyboards/kg722.png";
}