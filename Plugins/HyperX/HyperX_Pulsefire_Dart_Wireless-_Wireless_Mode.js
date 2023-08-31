export function Name() { return "HyperX PulseFire Dart Wireless Mode"; }
export function VendorId() { return 0x0951; }
export function ProductId() { return 0x16E1; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
DpiControl:readonly
dpi1:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"DpiControl", "group":"mouse", "label":"Enable Dpi Control", "type":"boolean", "default":"false"},
		{"property":"dpi1", "group":"mouse", "label":"DPI", "step":"50", "type":"number", "min":"200", "max":"12400", "default":"800"},
	];
}
export function ConflictingProcesses() {
	return ["NGenuity2.exe"];
}

const vLedNames = [ "Logo", "Scroll" ];

const vLedPositions = [ [1, 2], [1, 0] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	if(DpiControl) {
		setDpi(dpi1);
	}
}

export function Render() {
	sendColors(0);
	sendColors(16);
}

export function Shutdown() {
	sendColors(16, true);
	sendColors(0, true);
}

export function ondpi1Changed() {
	setDpi(dpi1);
}

function setDpi(dpi) {
	const packet = [0x00, 0xD3, 0x02, 0x00, 0x02, Math.round(dpi/50)];
	device.write(packet, 65);
}

function sendColors(zoneId, shutdown = false) {

	const packet = [0x00, 0xD2, zoneId, 0x00, 0x08];

	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
		const iX = vLedPositions[zoneId/16][0];
		const iY = vLedPositions[zoneId/16][1];

		var color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iX, iY);
		}

		packet[0x05+iIdx*3] = color[0];
		packet[0x06+iIdx*3] = color[1];
		packet[0x07+iIdx*3] = color[2];
	}

	packet[11] = 0x64;

	device.write(packet, 65);
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

export function Validate(endpoint) {
	return endpoint.interface === 2;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/hyperx/mice/pulsefire-dart-wireless.png";
}