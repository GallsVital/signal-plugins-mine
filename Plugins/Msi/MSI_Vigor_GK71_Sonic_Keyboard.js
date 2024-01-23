export function Name() { return "MSI Vigor GK71 Sonic"; }
export function VendorId() { return 0x0DB0; }
export function ProductId() { return 0x0B7A; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/MSI"; }
export function Size() { return [1, 1]; }
export function Type() { return "Hid"; }
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

export function DeviceMessages() {
	return [
		{property: "Limited Zone", message:"Limited Zone", tooltip: "This device's firmware is limited to a single zone on direct control"},
	];
}

const vLeds = [
	0
];

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
	device.write([0x00, 0x56, 0x20, 0x01], 65); //Software mode
}

export function Render() {
	sendColors();
	device.pause(1);
}

export function Shutdown(SystemSuspending) {
	const color = SystemSuspending ? "#000000" : shutdownColor;
	sendColors(color);
}

function sendColors(overrideColor) {

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

	device.write([0x00, 0x56, 0x21, 0x01, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x0b, 0x00, 0x0b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x00, 0x01, 0x00, 0x00, 0x01, 0x00, 0xc1, 0x00, 0x00, 0x00, 0x00, color[0], color[1], color[2], 0xff, 0x00, 0x00, 0x00, 0x00, 0x18, 0x00, 0x00, 0x00, 0x50, 0x30, 0x00, 0x00], 65); // Send commands
	device.write([0x00, 0x51, 0x28, 0x00, 0x00, 0x01], 65); //Apply?
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
	return endpoint.interface === 1 && endpoint.usage === 0x0001 && endpoint.usage_page === 0xFF00 && endpoint.collection === 0x0000;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/msi/keyboards/vigor-gk71-sonic.png";
}