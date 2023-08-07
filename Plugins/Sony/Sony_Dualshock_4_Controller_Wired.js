export function Name() { return "Sony Dualshock 4"; }
export function VendorId() { return 0x054C; }
export function ProductId() { return [0x05C4, 0x09CC]; }
export function Publisher() { return "Rafee/Derek Huber"; }
export function Size() { return [3, 3]; }
export function DefaultPosition(){return [240, 120];}
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

const vLedNames = [ "Light Bar" ];

const vLedPositions = [ [1, 1] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	return "Sony Init.";
}

export function Render() {
	SendColorPacket();
	device.pause(1);
}

export function Shutdown() {
	SendColorPacket(true);
}

function SendColorPacket(shutdown = false) {
	const iX = vLedPositions[0][0];
	const iY = vLedPositions[0][1];

	let color;

	if(shutdown) {
		color = hexToRgb(shutdownColor);
	} else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	} else {
		color = device.color(iX, iY);
	}
	const packet = [0x05, 0x07, 0x00, 0x00, 0x00, 0x00, color[0], color[1], color[2]];

	device.write(packet, 32);
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
	// 0x05C4 first revision, 0x09CC second revision - different interface values intentional
	return ((endpoint.interface === -1 || endpoint.interface === 0) && device.productId() === 0x05C4) ||
		(endpoint.interface === 3 && device.productId() === 0x09CC);
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/sony/dualshock-controller.png";
}