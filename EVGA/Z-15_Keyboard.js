export function Name() { return "EVGA Z15 Keyboard"; }
export function VendorId() { return 0x3842; }
export function ProductId() { return 0x2608; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [21, 6]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

let vKeys =
[
	1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,			14, 15, 16,	   18, 19, 20, 118,
	22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,		36, 37, 38,    39, 40, 41, 42,
	44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,		58, 59, 60,    61, 62, 63, 64,
	66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,						   79, 80, 81,
	83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 		        96,		   98, 99, 100, 101,

	103, 104, 105,           106,         107, 108, 109, 110,	    111, 112, 113,   114, 115,
];
let vKeyNames =
[
	"Esc",     "F1", "F2", "F3", "F4",   "F5", "F6", "F7", "F8",    "F9", "F10", "F11", "F12",  "Print Screen", "Scroll Lock", "Pause Break",   "Rewind", "Pause", "Skip", "Mute",
	"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",        "Insert",        "Home",     "Page Up",   "NumLock", "Num /", "Num *", "Num -",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                       "Del",         "End",   "Page Down",   "Num 7", "Num 8", "Num 9", "Num +",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                    		  "Num 4", "Num 5", "Num 6",
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",                    "Num 1", "Num 2", "Num 3", "Num Enter",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow",  "Down Arrow", "Right Arrow",   "Num 0", "Num .",


];

let vKeyPositions =
[
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0],  		[14, 0], [15, 0], [16, 0],  [17, 0], [18, 0], [19, 0], [20, 0],
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],  [14, 1], [15, 1], [16, 1],  [17, 1], [18, 1], [19, 1], [20, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],  [14, 2], [15, 2], [16, 2],  [17, 2], [18, 2], [19, 2], [20, 2],
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], 			                        [17, 3], [18, 3], [19, 3],
	[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], 		                    [15, 4],         [17, 4], [18, 4], [19, 4], [20, 4],
	[0, 5], [1, 5], [2, 5],					[6, 5],				    [10, 5], [11, 5], [12, 5], [13, 5],  [14, 5], [15, 5], [16, 5],  [17, 5], [18, 5]
];


export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Initialize() {
	sendZone();
}

export function Render() {
	sendZone();
	//Apply(1);
	//Apply(2);
}

export function Shutdown() {

}

function sendZone(shutdown = false) {

	let packet = [];
	//packet.fill(0xff);
	//packet[0x00] = 0x00;
	packet[0x00] = 0x06;
	packet[0x01] = 0xEA;
	packet[0x02] = 0x02;
	packet[0x03] = 0x01;
	packet[0x04] = 0x00;
	packet[0x05] = 0x00;
	packet[0x06] = 0x00;
	packet[0x07] = 0x02;

	for(let iIdx = 0; iIdx < 108; iIdx++) {
		let iPxX = vKeyPositions[iIdx][0];
		let iPxY = vKeyPositions[iIdx][1];
		var color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}

		packet[vKeys[iIdx]*4 + 8] = 0xff;
		packet[vKeys[iIdx]*4 + 9] = color[0];
		packet[vKeys[iIdx]*4 + 10] = color[1];
		packet[vKeys[iIdx]*4 + 11] = color[2];
	}

	//packet[0x08] = CalculateCrc(packet);
	//CalculateCrc(packet);
	//device.log(packet[0x08], {toFile: true})
	device.send_report(packet, 792);
	device.pause(1);
}

function CalculateCrc(packet) {
	let iCrc = 0;

	for (let iIdx = 0; iIdx < 1; iIdx++) {
		iCrc = packet[iIdx];

	}

	device.log(iCrc);

	return iCrc;
}

export function Validate(endpoint) {
	return endpoint.interface === 1 && endpoint.usage == 0x004b && endpoint.usage_page == 0x0008;
}

function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	let colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}
