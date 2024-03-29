export function Name() { return "ASUS ROG Strix Flare"; }
export function VendorId() { return 0x0B05; }
export function Documentation(){ return "troubleshooting/asus"; }
export function ProductId() { return [0x1875, 0x18af, 0x18CF]; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [22, 6]; }
export function DefaultPosition(){return [10, 100];}
const DESIRED_HEIGHT = 85;
export function DefaultScale(){return Math.floor(DESIRED_HEIGHT/Size()[1]);}
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

export function Initialize() {

}


export function Shutdown() {
// revert to rainbow mode
	device.write([0x00, 0x51, 0x2C, 0x04, 0x00, 0x48, 0x64, 0x00, 0x00, 0x02, 0x07, 0x0E, 0xF5, 0x00, 0xFF, 0x1D, 0x00, 0x06, 0xFF, 0x2B, 0x00, 0xFA, 0xFF, 0x39, 0x01, 0xFF, 0x00, 0x48, 0xFF, 0xF6, 0x00, 0x56, 0xFF, 0x78, 0x07, 0x64, 0xFF, 0x00, 0x0D], 65);
	device.write([0x00, 0x50, 0x55], 65);
}


// This is an array of key indexes for setting colors in our render array, indexed left to right, row top to bottom.
const vKeys = [
	0,      24, 32, 40, 48,   64, 72, 80, 88,  96, 104, 112, 120,   128, 136, 144,
	1,  17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,    121,   129, 137, 145,   153, 161, 169, 177,
	2,  18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,    122,   130, 138, 146,   154, 162, 170, 178,
	3,    19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99,      123,                  155, 163, 171,
	4,    20, 28, 36, 44, 52, 60, 68, 76, 84, 92,          124,       140,       156, 164, 172, 180,
	5,    13, 21,      53,            77, 93, 101,  125,   133, 141, 149,   157,    173,

	184, 185, 186,
];

const vKeyNames = [
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",
	"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",  //21
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",    //21
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                              "Num 4", "Num 5", "Num 6",             //16
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter", //17
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",                       //13
	"Logo", "Left underglow", "Right underglow"
];

// This array must be the same length as vKeys[], and represents the pixel color position in our pixel matrix that we reference.  For example,
// item at index 3 [9,0] represents the corsair logo, and the render routine will grab its color from [9,0].
const vKeyPositions = [
	[0, 0],    [1, 0], [2, 0], [3, 0], [4, 0],    [6, 0], [7, 0], [8, 0], [9, 0],  [10, 0], [11, 0], [12, 0], [13, 0],      [14, 0], [15, 0], [16, 0],            //20
	[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],     [14, 1], [15, 1], [16, 1],   [17, 1], [18, 1], [19, 1], [20, 1], //21
	[0, 2],    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],   [17, 2], [18, 2], [19, 2], [20, 3], //20
	[0, 3],    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],         [13, 3],                             [17, 3], [18, 3], [19, 3], // 17
	[0, 4],  [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],               [13, 4],           [15, 4],           [17, 4], [18, 4], [19, 4], [20, 4], // 17
	[0, 5], [1, 5], [2, 5],                      [6, 5],                        [10, 5], [11, 5],  [12, 5], [13, 5],    [14, 5], [15, 5], [16, 5],   [17, 5],         [19, 5],               // 13
	//Logo,  left underglow, right underglow
	[18, 0], [0, 2], [21, 2],
];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Render() {
	sendColors();
}

function sendColors(shutdown = false){

	const RGBData = new Array(600).fill(255);
	let TotalLedCount = 144;

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		let col;

		if(shutdown){
			col = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		}else{
			col = device.color(iPxX, iPxY);
		}

		RGBData[iIdx * 4 + 0] = vKeys[iIdx];
		RGBData[iIdx * 4 + 1] = col[0];
		RGBData[iIdx * 4 + 2] = col[1];
		RGBData[iIdx * 4 + 3] = col[2];
	}

	let packetCount = 0;

	while(TotalLedCount > 0){
		const ledsToSend = TotalLedCount >= 15 ? 15 : TotalLedCount;
		device.write([0x00, 0xC0, 0x81, 0x90 - (0x0F * packetCount++), 0x00].concat(RGBData.splice(0, ledsToSend*4)), 65);
		TotalLedCount -= ledsToSend;
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
	return endpoint.interface === 1;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/asus/keyboards/strix-flare-standard.png";
}