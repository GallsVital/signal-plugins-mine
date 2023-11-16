export function Name() { return "Razer Strider Chroma"; }
export function VendorId() { return 0x1532; }
export function ProductId() { return 0x0c05; }
export function Publisher() { return "FeuerSturm"; }
export function Documentation(){ return "troubleshooting/razer"; }
export function Size() { return [10, 3]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [90, 100];}
export function DefaultScale(){return 20.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
ShutdownBehavior:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"ShutdownBehavior", "group":"lighting", "label":"Shutdown behavior", "type":"combobox", "values":["ShutdownColor", "HardwareMode"], "default":"ShutdownColor", "tooltip":"Select shutdown behavior!"},
	];
}

const vLedNames = [
	"Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10", "Led 11", "Led 12", "Led 13", "Led 14", "Led 15", "Led 16", "Led 17", "Led 18", "Led 19"
];

const vLedPositions = [
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 1], [8, 0], [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0]
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
}

function SendColorPacket(shutdown = false) {
	const packet = new Array(91).fill(0);
	packet[2] = 0x1F;
	packet[6] = 0x3E;
	packet[7] = 0x0F;
	packet[8] = 0x03;
	packet[13] = 0x12;

	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {

		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}

		const iLedIdx = (iIdx*3) + 14;
		packet[iLedIdx] = color[0];
		packet[iLedIdx+1] = color[1];
		packet[iLedIdx+2] = color[2];
	}

	packet[89] = CalculateCrc(packet);
	device.send_report(packet, 91);
}

export function Render() {
	SendColorPacket();
	device.pause(1);
}

export function Shutdown() {
	if(ShutdownBehavior == "ShutdownColor") {
		SendColorPacket(true);
	} else {
		returnToHardwareMode();
	}
}

function returnToHardwareMode() {
	const packet = new Array(91).fill(0);
	packet[2] = 0x1F;
	packet[6] = 0x0C;
	packet[7] = 0x0F;
	packet[8] = 0x82;
	packet[9] = 0x01;
	packet[10] = 0x05;
	packet[89] = CalculateCrc(packet);
	device.send_report(packet, 91);
	device.pause(1);
	packet[8] = 0x02;
	packet[9] = 0x01;
	packet[10] = 0x00;
	packet[11] = 0x04;
	packet[12] = 0x02;
	packet[13] = 0x28;
	packet[14] = 0x02;
	packet[89] = CalculateCrc(packet);
	device.send_report(packet, 91);
	device.pause(1);
	packet[6] = 0x02;
	packet[7] = 0x00;
	packet[8] = 0x84;
	packet[9] = 0x00;
	packet[10] = 0x00;
	packet[11] = 0x00;
	packet[12] = 0x00;
	packet[13] = 0x00;
	packet[14] = 0x00;
	packet[89] = CalculateCrc(packet);
	device.send_report(packet, 91);
	device.pause(1);
	packet[8] = 0x04;
	packet[89] = CalculateCrc(packet);
	device.send_report(packet, 91);
}

function CalculateCrc(report) {
	let iCrc = 0;

	for (let iIdx = 3; iIdx < 89; iIdx++) {
		iCrc ^= report[iIdx];
	}

	return iCrc;
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
	return endpoint.interface === 0 && endpoint.usage === 0x0002;
}

export function ImageUrl(){
	return "https://assets.signalrgb.com/devices/brands/razer/mousepads/strider-chroma.png";
}