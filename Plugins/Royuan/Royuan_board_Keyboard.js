export function Name() { return "Royuan board"; }
export function VendorId() { return 0x3151; }
export function ProductId() { return [0x4003, 0x4015]; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/brand"; }
export function Size() { return [1, 1]; }
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
	"Keyboard"
];

const vLedPositions = [
	[0, 0]
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.send_report([0x00, 0x07, 0x15, 0x04, 0x04, 0x07, 0x00, 0x00, 0x00, 0xD4], 65);
}

export function Render() {
	sendColors();
	device.pause(1000);
}

export function Shutdown(SystemSuspending) {
	if(SystemSuspending){
		sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		sendColors(shutdownColor);
	}
}

function sendColors(overrideColor) {

	const packet = [];
	packet[0] = 0x00; //Zero Padding
	packet[1] = 0x0E;
	packet[8] = 0x29;

	const iPxX = vLedPositions[0][0];
	const iPxY = vLedPositions[0][1];
	let color;

	if(overrideColor){
		color = hexToRgb(overrideColor);
	}else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	}else{
		color = device.color(iPxX, iPxY);
	}

	packet[2]   = color[0];
	packet[3]   = color[1];
	packet[4]   = color[2];

	device.send_report(packet, 65); // Send commands
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
	if (device.productId() === 0x4015){
		return endpoint.interface === 2 && endpoint.usage === 0x0002 && endpoint.usage_page === 0xffff && endpoint.collection === 0x0000;
	}

	return endpoint.interface === 0 && endpoint.usage === 0x0006 && endpoint.usage_page === 0x0001 && endpoint.collection === 0x0000;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/default/keyboard-60.png";
}