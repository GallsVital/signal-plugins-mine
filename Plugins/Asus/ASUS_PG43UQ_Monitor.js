export function Name() { return "ASUS PG43UQ"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return 0x1931	; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/asus"; }
export function Size() { return [1, 1]; }
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

const vLedNames = [ "Logo" ];

const vLedPositions = [ [0, 0] ];

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

	const iPxX = vLedPositions[0][0];
	const iPxY = vLedPositions[0][1];
	let color;

	if(overrideColor) {
		color = hexToRgb(overrideColor);
	}else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	}else {
		color = device.color(iPxX, iPxY);
	}

	device.send_report([0x03, 0x02, 0xa1, 0x80, 0x20, 0x01, 0x00, 0x00], 8);
	device.send_report([0x03, 0x02, 0xa1, 0x80, 0x30, 0x01, 0x00, 0x00], 8);
	device.send_report([0x03, 0x02, 0xa1, 0x80, 0xa0, 0x01, 0x00, 0x00], 8);

	device.send_report([0x03, 0x02, 0xa1, 0x80, 0x00, color[0], 0x00, 0x00], 8); // R
	device.send_report([0x03, 0x02, 0xa1, 0x80, 0x01, color[2], 0x00, 0x00], 8); // B
	device.send_report([0x03, 0x02, 0xa1, 0x80, 0x02, color[1], 0x00, 0x00], 8); // G
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
	return endpoint.interface === -1 || endpoint.interface === 0;
}

export function Image() {
	return "";
}