/// <reference path="./Asus_Zephyrus.d.ts" />
export function Name() { return "Asus Laptop"; }
export function VendorId() { return 0x0B05; }
export function Documentation(){ return "troubleshooting/asus"; }
export function ProductId() { return 0x1866; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [2, 2]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
deviceType:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"deviceType", "group":"lighting", "label":"Laptop Model", "type":"combobox", "values":[ "Zephyrus", "G513", "G533" ], "default":"G513"},
	];
}

let vKeys = [ 0 ];

let vKeyNames = [ "Keyboard Zone" ];

/** @type {LedPosition[]} */
let vKeyPositions = [ [0, 0] ];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Initialize() {
	device.write([0x5d, 0x41, 0x53, 0x55, 0x53, 0x20, 0x54, 0x65, 0x63, 0x68, 0x2e, 0x49, 0x6e, 0x63, 0x2e, 0x00], 64); //Fancy Init Asus Tech Inc. This returns an indentical packet on good devices.
	device.write([0x5d, 0x05, 0x20, 0x31, 0x00, 0x01a], 64); //Some kind of read
	deviceLEDConfig();
}

export function Render() {
	sendColors();
}

export function Shutdown() {
	sendColors(true);
}

export function ondeviceTypeChanged() {
	deviceLEDConfig();
}

function grabColors(shutdown) {
	const RGBData = [];

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		let color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}
		const deviceConfig = library[deviceType];

		const iLedIdx = vKeys[iIdx] * 3;
		RGBData[iLedIdx] = color[deviceConfig.colorConfig[0]];
		RGBData[iLedIdx+1] = color[deviceConfig.colorConfig[1]];
		RGBData[iLedIdx+2] = color[deviceConfig.colorConfig[2]];
	}

	return RGBData;
}

function sendColors(shutdown = false) {
	switch(deviceType) {
	case "G533":
		sendPerledLaptopColors(shutdown);
		break;
	case "Zephyrus":
		sendZephyrusColors(shutdown);
		break;
	case "G513":
		sendG513Colors(shutdown);
		break;
	}
}

function sendG513Colors(shutdown) {
	const RGBData = grabColors(shutdown);
	device.write([0x5d, 0xbc, 0x01, 0x01, 0x04].concat(RGBData), 64);
}

function sendPerledLaptopColors(shutdown) { //OH THIS IS PERLED
	const RGBData = grabColors(shutdown);

	let TotalLedCount = 168;
	let packetCount = 0;

	while(TotalLedCount > 0){
		const ledsToSend = TotalLedCount >= 16 ? 16 : TotalLedCount;

		device.write([0x5d, 0xbc, 0x00, 0x01, 0x01, 0x01, (packetCount*16), ledsToSend, 0x00].concat(RGBData.splice(0, ledsToSend*3)), 65);

		TotalLedCount -= ledsToSend;
		packetCount++;
	}

	device.log("RGBData Length:" + RGBData.length);
	device.write([0x5d, 0xbc, 0x00, 0x01, 0x04, 0x00].concat(RGBData), 64);
}

function sendZephyrusColors(shutdown) {

	let color;

	if(shutdown) {
		color = hexToRgb(shutdownColor);
	} else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	} else {
		color = device.color(0, 0);
	}

	device.write([0x5D, 0xB3, 0x00, 0x00, color[0], color[1], color[2], 0xE1], 64);
}

function deviceLEDConfig() {
	vKeys = [];
	vKeyNames = [];
	vKeyPositions = [];

	const deviceConfig = library[deviceType];

	vKeys.push(...deviceConfig.vKeys);
	vKeyNames.push(...deviceConfig.vKeyNames);
	vKeyPositions.push(...deviceConfig.vKeyPositions);
	device.setSize(deviceConfig.size);
	device.setControllableLeds(vKeyNames, vKeyPositions);
}

const library = {
	"G513" : {
		vKeys : [ 1, 2, 3, 4, 12, 11, 10, 9, 8, 7  ],
		vKeyNames : [ "Keyboard Zone 1",  "Keyboard Zone 2",  "Keyboard Zone 3",  "Keyboard Zone 4",  "Outer LED 1",  "Outer LED 2",  "Outer LED 3",  "Outer LED 4",  "Outer LED 5",  "Outer LED 6" ],
		/** @type {LedPosition[]} */
		vKeyPositions : [ [1, 0], [2, 0], [3, 0], [4, 0], [0, 2], [0, 3], [2, 3], [3, 3], [5, 3], [5, 2] ],
		size : [ 6, 4 ],
		colorConfig : [2, 0, 1]
	},
	"Zephyrus M15" : {
		vKeys : [ 0 ],
		vKeyNames : [ "Single Zone Keyboard" ],
		/** @type {LedPosition[]} */
		vKeyPositions : [ [0, 0] ],
		size : [ 2, 2 ],
		colorConfig : [2, 0, 1]
	},
	"G533" : {
		vKeys :
		[
			0,
			178, 179,
			2, 3, 4, 5, 6, //5
			21, 23, 24, 25, 26, 28, 29, 30, 31, 33, 34, 35, 36, 37, //14
			42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 56, 58,
			63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 78, 79,
			84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 98, 100,
			105, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 118, 120, 121,
			126, 127, 128, 129, 132, 135, 136, 137, 0, 0, 140,
			178, 179, 180, 181, 182, 183,
		],
		vKeyNames :
		[
			"ROG Logo", //1
			"Under Screen LED 1", "Under Screen LED 2", //2
			"Volume Down", "Volume Up", "Microphone Mute", "Fan Mode", "Asus Button", //5
			"Esc",     "F1", "F2", "F3", "F4",   "F5", "F6", "F7", "F8",    "F9", "F10", "F11", "F12",  "Del", //14
			"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",        "Play", //15
			"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                        "Stop", //15
			"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",						"Rewind_Track", //14
			"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                           "Up Arrow", "Skip_Track", //14
			"Left Ctrl", "Fn", "Left Win", "Left Alt", "Space", "Right Alt", "PrtSc", "Right Ctrl",  "Left Arrow",  "Down Arrow", "Right Arrow", //10
			"Outer LED 1",  "Outer LED 2",  "Outer LED 3",  "Outer LED 4",  "Outer LED 5",  "Outer LED 6" //6
		],
		/** @type {LedPosition[]} */
		vKeyPositions :
		[
			[8, 0],
			[4, 2], [12, 2],
			[3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
			[1, 4], [3, 4], [4, 4], [5, 4], [6, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4],
			[1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5],  [9, 5],  [10, 5], [11, 5], [12, 5], [13, 5], [15, 5], [16, 5],
			[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6],  [9, 6],  [10, 6], [11, 6], [12, 6], [13, 6], [15, 6], [16, 6],
			[1, 7], 	    [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7],  [9, 7],  [10, 7], [11, 7], [12, 7], [13, 7], [15, 7], [16, 7],
			[1, 8], 	    [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8],  [9, 8],  [10, 8], [11, 8], [12, 8], [13, 8], [15, 8], [16, 8],
			[1, 9], [2, 9], [3, 9], [4, 9],					[7, 9],					  [10, 9], [11, 9], [12, 9], [14, 9], [15, 9], [16, 9],
			[0, 10], [0, 11], [5, 11], [10, 11], [16, 11], [16, 10]
		],
		size : [ 17, 12 ],
		colorConfig : [0, 1, 2]
	}
};

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint) {
	return endpoint.usage === 0x0079;
}

export function ImageUrl(){ //Use as placeholder.
	return "https://assets.signalrgb.com/devices/brands/asus/misc/rog-strix-scar-2022-laptop.png";
}