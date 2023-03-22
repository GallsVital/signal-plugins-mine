export function Name() { return "ASUS ROG Azoth"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return [0x1a83, 0x1a85];}
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/asus"; }
export function Size() { return [15, 6]; }
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

const vKeys = [
	0,  8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, //13
	1,  9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97,	105, 121, //15
	2, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98,	106, 122, //15
	3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99,	107, 123, //15
	4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100,	116, 124, //15
	5, 13, 21,			   53,		  85, 93, 101, 109, 117, 125 //10
];

const vKeyNames = [
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", //13
	"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",	"Ins", //15
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Del", //15
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ISO #", "Enter", "PgUp", //15
	"Left Shift", "ISO <", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "PgDn", //15
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Menu", "Right Ctrl", "Left Arrow",  "Down Arrow", "Right Arrow" //10
];

const vKeyPositions = [
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], //13
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], //15
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], //15
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], //15
	[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], //15
	[0, 5], [1, 5], [2, 5],			  		[6, 5],			  				[9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], //10
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
}

export function Shutdown() {
	sendColors(true);
}

function sendColors(shutdown = false){

	const RGBData = [];
	let TotalLedCount = 0;

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
		TotalLedCount++;
	}

	let packetCount = 0;

	while(TotalLedCount > 0) {
		const ledsToSend = TotalLedCount >= 15 ? 15 : TotalLedCount;

		let packet = [];
		packet[0] = 0x00;
		packet[1] = 0xC0;
		packet[2] = 0x81;
		packet[3] = 0x53 - (0x0F * packetCount++);
		packet[4] = 0x00;
		packet = packet.concat(RGBData.splice(0, ledsToSend*4));
		device.write(packet, 65);
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

export function Image() {
	return "";
}