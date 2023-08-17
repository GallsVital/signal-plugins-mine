export function Name() { return "MSI GS63 Keyboard"; }
export function VendorId() { return 0x1770; }
export function ProductId() { return 0xff00; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/msi"; }
export function Size() { return [9, 3]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

const vLedNames = [
	"Zone 1", "Zone 2", "Zone 3"
];

const vLedPositions = [
	[1, 1], [4, 1], [7, 1]
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
}

export function Shutdown(SystemSuspending) {
	if(SystemSuspending){
		sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		sendColors(shutdownColor);
	}
}

function sendColors(overrideColor) {
	// https://github.com/bparker06/msi-keyboard/blob/master/keyboard.cpp

	const packet = [];
	packet[0] = 0x01;
	packet[1] = 0x02;
	packet[2] = 0x40;
	packet[7] = 0xEC;

	for (let idx = 0; idx < 3; idx++) {
		const iPxX = vLedPositions[idx][0];
		const iPxY = vLedPositions[idx][1];
		let color;

		if(overrideColor){
			color = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iPxX, iPxY);
		}

		packet[3] 	= idx + 1;
		packet[4] 	= color[0];
		packet[5] 	= color[1];
		packet[6] 	= color[2];
		device.send_report(packet, 8); // Send commands
	}

	for (let idx2 = 4; idx2 < 8; idx2++) {
		device.send_report([0x01, 0x02, 0x40, idx2, 0x00, 0x00, 0x00, 0xEC], 8); // Send commands
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
	return true;
}

export function Image() {
	return "";
}
