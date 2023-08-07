export function Name() { return "NZXT Kraken X2"; }
export function VendorId() { return 0x1E71; }
export function ProductId() { return 0x170E; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/nzxt"; }
export function Size() { return [9, 9]; }
export function DefaultPosition(){return [165, 60];}
export function DefaultScale(){return 3.0;}
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
const vLedNames = [
	"Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Logo"
];

const vLedPositions = [
	[4, 0], [5, 2], [7, 3], [5, 5], [4, 7], [3, 5], [1, 3], [3, 2], [4, 1], [4, 4]
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}
export function Initialize() {

}

export function Render() {
	sendColors();
	sendLogo();
}

export function Shutdown() {
	sendColors(true);
	sendLogo(true);
}

function sendColors(shutdown = false) {
	const packet = [];

	// Header.
	packet[0] = 0x02;
	packet[1] = 0x4C;
	packet[2] = 0x02; //channel
	packet[3] = 0x00; //direct mode

	// Speed?
	packet[4] = 0x04;
	packet[4] |= 0 << 3;
	packet[4] |= 0 << 5;

	// Colors.
	for(let iIdx=0; iIdx < 9; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		let col;

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		const iLedIdx = (iIdx * 3) + 5;
		packet[iLedIdx]     = col[0];
		packet[iLedIdx+1]   = col[1];
		packet[iLedIdx+2]   = col[2];
	}

	device.write(packet, 64);
	device.pause(1);

}

function sendLogo(shutdown = false) {
	const packet = [];

	// Header.
	packet[0] = 0x02;
	packet[1] = 0x4C;
	packet[2] = 0x01; //channel
	packet[3] = 0x00;

	// Speed?
	packet[4] = 0x04;
	packet[4] |= 0 << 3;
	packet[4] |= 0 << 5;

	// Logo Colors.
	const iPxX = vLedPositions[9][0];
	const iPxY = vLedPositions[9][1];
	let col;

	if(shutdown) {
		col = hexToRgb(shutdownColor);
	} else if (LightingMode === "Forced") {
		col = hexToRgb(forcedColor);
	} else {
		col = device.color(iPxX, iPxY);
	}

	packet[5] = col[1]; //green
	packet[6] = col[0]; //red
	packet[7] = col[2]; //blue

	device.write(packet, 64);
	device.pause(1);
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/nzxt/aio/kraken-x72-aio.png";
}