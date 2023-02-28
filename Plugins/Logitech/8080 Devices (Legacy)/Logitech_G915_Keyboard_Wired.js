export function Name() { return "Logitech G915 Wireless"; }
export function VendorId() { return 0x046d; }
export function Documentation(){ return "troubleshooting/logitech"; }
export function ProductId() { return 0xC33E; }//0xC33E
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [24, 9]; }
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
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},

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
const vLedNames = [
	"logo",                         "brightness",
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",     "MediaRewind", "MediaPlayPause", "MediaFastForward", "MediaStop",
	"G1", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",              "NumLock", "Num /", "Num *", "Num -",
	"G2", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",                "Num 7", "Num 8", "Num 9", "Num +",
	"G3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                                     "Num 4", "Num 5", "Num 6",
	"G4", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",                      "Num 1", "Num 2", "Num 3", "Num Enter",
	"G5", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",        "Num 0", "Num .",
];

const vKeymap = [
	38, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,                   67, 68, 69,
	50, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 42, 43, 39,              70, 71, 72,
	40, 17, 23, 5, 18, 20, 25, 21, 9, 15, 16, 44, 45, 46,               73, 74, 75,
	54, 1, 19, 4, 6, 7, 8, 10, 11, 12, 48, 49, 37,
	81, 26, 24, 3, 22, 2, 14, 13, 51, 52, 53, 85,                           79,
	80, 83, 82,          41,             86, 87, 88, 84,                77, 78, 76,

];

const vLedPositions = [

	[1, 1],   [2, 1], [3, 1], [4, 1], [5, 1],   [6, 1], [7, 1], [8, 1], [9, 1],    [11, 1], [12, 1], [13, 1], [14, 1],           [15, 1], [16, 1], [17, 1],
	[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],
	[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],   [15, 3], [16, 3], [17, 3],
	[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],         [14, 4],
	[1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5],                 [14, 5],           [16, 5],
	[1, 6], [2, 6], [3, 6],                      [7, 6],                       [11, 6], [12, 6], [13, 6], [14, 6],   [15, 6], [16, 6], [17, 6],

	[0, 0],
];
const vFAKELedPositions = [
	[0, 0],                              [6, 0],
	[1, 1],   [2, 1], [3, 1], [4, 1], [5, 1],   [6, 1], [7, 1], [8, 1], [9, 1],    [11, 1], [12, 1], [13, 1], [14, 1],    [15, 1], [16, 1], [17, 1], [19, 1], [20, 1], [21, 1], [22, 1],
	[0, 2],    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2], [19, 2], [20, 2], [21, 2], [22, 2],
	[0, 3],    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],   [15, 3], [16, 3], [17, 3], [19, 3], [20, 3], [21, 3], [22, 3],
	[0, 4],    [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],         [14, 4],                           [19, 4], [20, 4], [21, 4],
	[0, 5],    [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5],                 [14, 5],           [16, 5],         [19, 5], [20, 5], [21, 5], [22, 5],
	[0, 6],    [1, 6], [2, 6], [3, 6],                      [7, 6],                       [11, 6], [12, 6], [13, 6], [14, 6],   [15, 6], [16, 6], [17, 6], [19, 6], [20, 6],

];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vFAKELedPositions;
}


export function Initialize() {

}


function Apply() {
	const packet = [];

	packet[0] = 0x11;
	packet[1] = 0xFF;
	packet[2] = 0x0A;
	packet[3] = 0x7E;

	device.write(packet, 20);
}

function SendNumpad(shutdown = false) {
	const vNumPadPostions = [
		[19, 2], [20, 2], [21, 2], [22, 2],
		[19, 3], [20, 3], [21, 3], [22, 3],
		[19, 4], [20, 4], [21, 4],
		[19, 5], [20, 5], [21, 5], [22, 5],
		[19, 6], [20, 6],
	];
	const vNumpadMap = [
		80, 81, 82, 83,
		92, 93, 94, 84,
		89, 90, 91,
		86, 87, 88, 85,
		95, 96

	];

	for(let iIdx = 0; iIdx < vNumpadMap.length; iIdx = iIdx + 4){

		const packet = [];
		packet[0] = 0x11;
		packet[1] = 0xFF;
		packet[2] = 0x0A;

		const zone = 0x1C;
		packet[3] = zone;

		for (let index = 0; index < 4 && index+iIdx < vNumpadMap.length ;index++) {
			const keyNumber = index+iIdx;
			const iKeyPosX = vNumPadPostions[keyNumber][0];
			const iKeyPosY = vNumPadPostions[keyNumber][1];
			var color;

			if(shutdown){
				color = hexToRgb(shutdownColor);
			}else if (LightingMode === "Forced") {
				color = hexToRgb(forcedColor);
			}else{
				color = device.color(iKeyPosX, iKeyPosY);
			}
			const keyValue = vNumpadMap[keyNumber];


			packet[4 + index*4] = keyValue;
			packet[5 + index*4] = color[0];
			packet[6 + index*4] = color[1];
			packet[7 + index*4] = color[2];

		}

		device.write(packet, 20);
		//Apply();

		//device.pause(1);
	}
}

function SendGkeys(shutdown = false) {
	const vGkeyPostions = [
		[0, 2],
		[0, 3],
		[0, 4],
		[0, 5],
		[0, 6],
	];

	for(let iIdx = 0; iIdx < vGkeyPostions.length; iIdx = iIdx + 4){

		const packet = [];
		packet[0] = 0x11;
		packet[1] = 0xFF;
		packet[2] = 0x0A;

		const zone = 0x1F;
		packet[3] = zone;

		for (let index = 0; index < 4 && index+iIdx < vGkeyPostions.length ;index++) {
			const keyNumber = index+iIdx;
			const iKeyPosX = vGkeyPostions[keyNumber][0];
			const iKeyPosY = vGkeyPostions[keyNumber][1];
			var color;

			if(shutdown){
				color = hexToRgb(shutdownColor);
			}else if (LightingMode === "Forced") {
				color = hexToRgb(forcedColor);
			}else{
				color = device.color(iKeyPosX, iKeyPosY);
			}
			const keyValue = vKeymap[keyNumber];


			packet[4 + index*4] = 0xB4 + keyNumber;
			packet[5 + index*4] = color[0];
			packet[6 + index*4] = color[1];
			packet[7 + index*4] = color[2];

		}

		device.write(packet, 20);
		//Apply();

		//device.pause(1);
	}
}

function SendLogoZone(shutdown = false){
	//1B 210 vLogoPositions

	for(let iIdx = 0; iIdx < 2; iIdx++){

		var color;

		if(shutdown){
			color = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			if(iIdx === 0) {
				color = device.color(0, 0);
			} else {
				color = device.color(4, 0);
			}
		}
		const packet = [];
		packet[0] = 0x11;
		packet[1] = 0xFF;
		packet[2] = 0x0A;

		if(iIdx === 0) {
			packet[3] = 0x1B;
			packet[4] = 0xD2;
		} else {
			packet[3] = 0x19;
			packet[4] = 0x99;
		}

		packet[5] = color[0];
		packet[6] = color[1];
		packet[7] = color[2];
		packet[8] = 0xFF;
		device.write(packet, 20);
		//Apply();

		//device.pause(1);
	}
}

function SendMediaZones(shutdown = false){
	const zones = [
		[12, 0], [14, 0], [13, 0], [11, 0]
	];

	for(let iIdx = 0; iIdx < zones.length; iIdx++){
		const iKeyPosX = zones[iIdx][0];
		const iKeyPosY = zones[iIdx][1];
		var color;

		if(shutdown){
			color = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iKeyPosX, iKeyPosY);
		}
		const packet = [];
		packet[0] = 0x11;
		packet[1] = 0xFF;
		packet[2] = 0x0A;

		packet[3] = 0x1B;

		packet[4] = 155+iIdx;
		packet[5] = color[0];
		packet[6] = color[1];
		packet[7] = color[2];
		packet[8] = 0xFF;
		device.write(packet, 20);
		//Apply();

		//device.pause(1);
	}
}

function SendPacket(shutdown = false) {
	//1B 210 vLogoPositions
	let count = 0;

	const RGBData = [];
	let TotalKeys = 0;

	for (let iIdx = 0; iIdx < vKeymap.length; iIdx++){

		const iKeyPosX = vLedPositions[iIdx][0];
		const iKeyPosY = vLedPositions[iIdx][1];
		var color;

		if(shutdown){
			color = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iKeyPosX, iKeyPosY);
		}

		if(OldValue[iIdx] != -1){
			//device.log(`test ${OldValue[iIdx]} ${color} ${arrayEquals(OldValue[iIdx], color)}`)
			if(arrayEquals(OldValue[iIdx], color)){
				count++;
				continue;
			}
		}

		OldValue[iIdx] = color;

		let keyValue = vKeymap[iIdx];

		if(keyValue >= 80){keyValue += 24;}

		if(vKeymap[iIdx] >= 88){keyValue -= 14;}

		RGBData[TotalKeys*4] = keyValue;
		RGBData[TotalKeys*4+1] = color[0];
		RGBData[TotalKeys*4+2] = color[1];
		RGBData[TotalKeys*4+3] = color[2];
		TotalKeys++;
	}

	while(TotalKeys > 0){
		let packet = [];
		packet[0] = 0x11;
		packet[1] = 0xFF;
		packet[2] = 0x0A;

		const zone = 0x18;
		//if(vKeymap[iIdx] >= 80){zone = 0x1D;}
		//if(vKeymap[iIdx] >= 88){zone = 0x1C;}
		packet[3] = zone;

		packet = packet.concat(RGBData.splice(0, 16));
		TotalKeys -= 4;
		device.set_endpoint(2, 0x0002, 0xff00); // Lighting IF
		device.write(packet, 20);
	}

	//device.log(`Saved ${count/4} packets of ${vKeymap.length/4}`)
}

const OldValue = new Array(250).fill(-1);

function arrayEquals(a, b) {
	return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
}


export function Render() {
	SendPacket();
	SendLogoZone();
	SendMediaZones();
	SendGkeys();
	SendNumpad();
	Apply();
}


export function Shutdown() {
	SendPacket(true);
	SendLogoZone(true);
	SendMediaZones(true);
	SendGkeys(true);
	SendNumpad(true);
	Apply();
}


export function Validate(endpoint) {
	return (endpoint.interface === 2 && endpoint.usage === 0x0001) ||
           (endpoint.interface === 2 && endpoint.usage === 0x0002);
}

