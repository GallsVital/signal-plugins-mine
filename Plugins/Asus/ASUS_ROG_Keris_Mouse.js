export function Name() { return "ASUS ROG Keris"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return [0x195C, 0x1960, 0x195e, 0x1A59]; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/asus"; }
export function Size() { return [7, 8]; }
export function DefaultPosition() {return [180, 100]; }
export function DefaultScale(){return 8.0;}
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

const vKeyNames = [ "Logo", "Scroll Wheel" ];

const vKeyPositions = [ [3, 5], [3, 0] ];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}
export function Initialize() {

}

export function Render() {
	sendColors(0);
	sendColors(1);
}

export function Shutdown() {
}

function sendColors(zone, shutdown = false) {
	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x51;
	packet[2] = 0x28;
	packet[3] = zone;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = 0x04;

	const iPxX = vKeyPositions[zone][0];
	const iPxY = vKeyPositions[zone][1];
	let col;

	if(shutdown) {
		col = hexToRgb(shutdownColor);
	} else if (LightingMode == "Forced") {
		col = hexToRgb(forcedColor);
	} else {
		col = device.color(iPxX, iPxY);
	}

	packet[7] = col[0];
	packet[8] = col[1];
	packet[9] = col[2];

	device.write(packet, 65);
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
	return endpoint.interface === 0;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/asus/mice/keris-wireless.png";
}