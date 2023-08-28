export function Name() { return "ASUS ROG Strix Scope TKL"; }
export function VendorId() { return 0x0B05; }
export function Documentation(){ return "troubleshooting/asus"; }
export function ProductId() { return 0x190C; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [17, 7]; }
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

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Initialize() {
	//Direct mode init?
//  51 2C 02 00 19 64 00 FF FF 00 00 00 00 00 00 00 00 00 70 05 FE FF FF FF F4 D9 8D 01 52 04 D4 75 7C 2A 50 77 90 E1 D4 75 98 06 00 00 00 00
// 00 00 1C DA 8D 01 96 CC 8B 70 98 06 00 00 A6 CC 8B 70
}


export function Shutdown() {
// revert to rainbow mode
	sendPacketString("00 51 2C 04 00 48 64 00 00 02 07 0E F5 00 FF 1D 00 06 FF 2B 00 FA FF 39 01 FF 00 48 FF F6 00 56 FF 78 07 64 FF 00 0D", 65);
	sendPacketString("00 50 55", 65);
}


// This is an array of key indexes for setting colors in our render array, indexed left to right, row top to bottom.
const vKeys = [
	0,      24, 32, 40, 48,   64, 72, 80, 88,  96, 104, 112, 120,  128,  144,
	1,  17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,    121,   129, 137, 145,
	2,  18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,    122,   130, 138, 146,
	3,    19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99,      123,
	4,    20, 28, 36, 44, 52, 60, 68, 76, 84, 92,          124,       140,
	5,    21, 29,      53,            77, 93, 101,  125,   133, 141, 149,

	6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94, 102, 110, 118, 126, 134, 142,  150, 158, 166, 174, 182, 190, 198, 206
];

const vKeyNames = [
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Logo 1", "Logo 2",
	"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",
	"LightBar Led 1", "LightBar Led 2", "LightBar Led 3", "LightBar Led 4", "LightBar Led 5", "LightBar Led 6", "LightBar Led 7", "LightBar Led 8", "LightBar Led 9",
	"LightBar Led 10", "LightBar Led 11", "LightBar Led 12", "LightBar Led 13", "LightBar Led 14", "LightBar Led 15", "LightBar Led 16", "LightBar Led 17", "LightBar Led 18",
	"LightBar Led 19", "LightBar Led 20", "LightBar Led 21", "LightBar Led 22", "LightBar Led 23", "LightBar Led 24", "LightBar Led 25", "LightBar Led 26"
];

// This array must be the same length as vKeys[], and represents the pixel color position in our pixel matrix that we reference.  For example,
// item at index 3 [9,0] represents the corsair logo, and the render routine will grab its color from [9,0].
const vKeyPositions = [
	[0, 0],    [1, 0], [2, 0], [3, 0], [4, 0],    [6, 0], [7, 0], [8, 0], [9, 0],  [10, 0], [11, 0], [12, 0], [13, 0],       [14, 0],        [16, 0],
	[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1],  [12, 1], [13, 1],  [14, 1], [15, 1], [16, 1],
	[0, 2],    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],
	[0, 3],    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],         [13, 3],
	[0, 4],      [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],               [13, 4],           [15, 4],
	[0, 5], [1, 5], [2, 5],                      [6, 5],                        [10, 5], [11, 5],  [12, 5], [13, 5],    [14, 5], [15, 5], [16, 5],

	[0, 6], [0, 6], [1, 6], [1, 6], [2, 6], [3, 6], [4, 6], [4, 6], [5, 6],  [5, 6], [6, 6], [7, 6], [7, 6], [8, 6], [9, 6], [9, 6], [10, 6], [11, 6], [11, 6], [12, 6], [13, 6], [13, 6], [14, 6], [15, 6], [16, 6], [16, 6]
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
		var col;

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
		//TotalLedCount++;
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
		//device.read(packet,65)
		TotalLedCount -= ledsToSend;
	}

}


export function Validate(endpoint) {
	return endpoint.interface === 1;
}

function sendPacketString(string, size){

	const packet= [];
	const data = string.split(' ');

	for(let i = 0; i < data.length; i++){
		packet[i] =parseInt(data[i], 16);//.toString(16)
	}

	device.write(packet, size);
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/asus/keyboards/strix-scope-tkl.png";
}