export function Name() { return "Anne Pro 2"; }
export function VendorId() { return 0x3311; }
export function ProductId() { return 0xA297; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [14, 5]; }
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

export function DeviceMessages() {
	return [
		{property: "Limited Frame Rate", message:"Limited Frame Rate", tooltip: "This device's firmware is limited to a slower refresh rate than other device's"},
	];
}

const vKeys =
[
	0,  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,        13,
	14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
	28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,    40,
	42, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,       54,
	56, 58, 59,         62,          65, 66, 67, 68,
];

const vKeyNames =
[
	"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",
];
const vKeyPositions =
[
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2],         [13, 2],
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3],                 [13, 3],
	[0, 4], [1, 4], [2, 4],                      [6, 4],                 [9, 4],   [10, 4],   [12, 4],   [13, 4],
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

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		sendColors(shutdownColor);
	}

}

function sendColors(overrideColor) {
	const RGBData = new Array(228).fill(0);


	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		var col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		RGBData[vKeys[iIdx]*3 ] = col[0];    //iIdx*3
		RGBData[vKeys[iIdx]*3  + 1] = col[1];//iIdx*3
		RGBData[vKeys[iIdx]*3  + 2] = col[2];//iIdx*3
	}

	sendColorPacket(0, RGBData.splice(0, 51));
	sendColorPacket(1, RGBData.splice(0, 51));
	sendColorPacket(2, RGBData.splice(0, 51));
	sendColorPacket(3, RGBData.splice(0, 51));
	sendApplyPacket(RGBData.splice(0, 3));

}

function sendColorPacket(index, data) {
	let packet = [0x00, 0x7B, 0x10, 0x41, 0x50 + index, 0x37, 0x00, 0x00, 0x7D, 0x20, 0x03, 0xFF, 0x02];
	packet = packet.concat(data);
	device.write(packet, 65);
	device.pause(51);
}

function sendApplyPacket(data) {
	let packet = [0x00, 0x7B, 0x10, 0x41, 0x54, 0x0A, 0x00, 0x00, 0x7D, 0x20, 0x03, 0xFF, 0x02];
	packet = packet.concat(data);
	device.write(packet, 65);
	device.pause(51);
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

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/obins/keyboards/anne-pro-2.png";
}