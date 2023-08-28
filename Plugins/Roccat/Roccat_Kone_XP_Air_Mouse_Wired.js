export function Name() { return "Roccat Kone XP Air - Wired"; }
export function VendorId() { return 0x1e7d; }
export function ProductId() { return 0x2cb2; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition(){return [240, 120];}
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

const vLedNames = [ "Scroll Wheel", "Left Front", "Right Front", "Left Back", "Right Back" ];
const vLedPositions = [ [1, 0], [0, 1], [2, 1], [0, 2], [2, 2] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.send_report([0x06, 0x00, 0x13, 0x07, 0x02], 30);
	device.pause(30);
	device.send_report([0x06, 0x00, 0x00, 0x04], 30);
	device.pause(30);
	device.send_report([0x06, 0x00, 0x00, 0x05], 30); //since these are 0 flagged, probably talking to receiver.
	device.pause(30);
	device.send_report([0x06, 0x00, 0x35, 0x07], 30);
	device.pause(30);
	device.send_report([0x06, 0x00, 0x00, 0x04], 30);
	device.pause(30);
	device.send_report([0x06, 0x00, 0x00, 0x05], 30); //since these are 0 flagged, probably talking to receiver.
	device.pause(30);
	device.send_report([0x06, 0x00, 0x4E, 0x06, 0x04, 0x01, 0x01, 0x01, 0xff], 30); //Lighting setup
	device.pause(30);
	device.send_report([0x06, 0x00, 0x44, 0x07], 30); //Apply iirc
	device.pause(30);
	device.send_report([0x06, 0x00, 0x49, 0x06, 0x01, 0x04], 30);
	device.pause(30);
	device.send_report([0x06, 0x00, 0x44, 0x07], 30); //Apply iirc
}

export function Render() {
	sendZone();
}

export function Shutdown() {
	sendZone(true);
}

function sendZone(shutdown = false) {
	const packet = [0x06, 0x00, 0x4D, 0x06, 0x15, 0x6d, 0x70, 0x61, 0x00];

	for(let iIdx = 0; iIdx < vLedNames.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var col;

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		packet[iIdx*3 + 8] = col[0];
		packet[iIdx*3 + 9] = col[1];
		packet[iIdx*3 + 10] = col[2];

	}

	device.send_report(packet, 30);
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
	return endpoint.interface === 2 && endpoint.usage === 0xff00;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/roccat/mice/kone-xp-air.png";
}