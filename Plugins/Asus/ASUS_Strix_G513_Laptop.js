export function Name() { return "Asus Strix G15 G513 Laptop"; }
export function VendorId() { return 0x0b05; }
export function ProductId() { return 0x1866; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return ""; }
export function Size() { return [6, 4]; }
export function DefaultPosition(){return [10, 100]; }
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

const vKeys = [ 1, 2, 3, 4, 12, 11, 10, 9, 8, 7  ];

const vKeyNames =
[
	"Keyboard Zone 1",  "Keyboard Zone 2",  "Keyboard Zone 3",  "Keyboard Zone 4",  "Outer LED 1",  "Outer LED 2",  "Outer LED 3",  "Outer LED 4",  "Outer LED 5",  "Outer LED 6",
];

const vKeyPositions =
[
	[1, 0], [2, 0], [3, 0], [4, 0], [0, 2], [0, 3], [2, 3], [3, 3], [5, 3], [5, 2],
];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Initialize() {
	device.write([0x5d, 0x41, 0x53, 0x55, 0x53, 0x20, 0x54, 0x65, 0x63, 0x68, 0x2e, 0x49, 0x6e, 0x63, 0x2e], 64);
}

export function Render() {
	sendColors();
}

export function Shutdown() {
	sendColors(true);
}


function grabColors(shutdown ) {
	const rgbdata = [];

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

		const iLedIdx = vKeys[iIdx] * 3;
		rgbdata[iLedIdx] = color[2];
		rgbdata[iLedIdx+1] = color[0];
		rgbdata[iLedIdx+2] = color[1];
	}

	return rgbdata;
}

function sendColors(shutdown = false) {
	const RGBData = grabColors(shutdown);
	device.write([0x5d, 0xbc, 0x01, 0x01, 0x04].concat(RGBData), 64);
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
	return endpoint.interface === -1;
}

export function Image() {
	return "";
}