export function Name() { return "Corsair Virtuoso XT Headset"; }
export function VendorId() { return 0x1b1c; }
export function ProductId() { return 0x0A64; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/corsair"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [145, 85];}
export function DefaultScale(){return 10.0;}
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

const vLedNames = ["Logo"];

const vLedPositions = [
	[0, 0]
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

function EnableSoftwareControl() {
	device.write([0x02, 0x09, 0x01, 0x03, 0x00, 0x02], 64); // Enable Software Mode
	device.write([0x02, 0x09, 0x0D, 0x00, 0x01], 64); //Open lighting endpoint
}

function ReturnToHardwareControl() {
	device.write([0x02, 0x09, 0x01, 0x03, 0x00, 0x01], 64);
}

export function Initialize() {
	EnableSoftwareControl();
	console.log("Developed on Firmware: 5.11.88");
}

export function Render() {
	sendColors();
}

export function Shutdown(SystemSuspending) {
	if(SystemSuspending){
		// Go Dark on System Sleep/Shutdown
		sendColors("#000000");
	}else{
		ReturnToHardwareControl();
	}
}

function sendColors(overrideColor){
	const packet = [];
	let col;

	if(overrideColor){
		col = hexToRgb(overrideColor);
	}else if (LightingMode === "Forced") {
		col = hexToRgb(forcedColor);
	}else{
		col = device.color(0, 0);
	}

	packet[0]	= 0x02;
	packet[1]	= 0x09;
	packet[2]	= 0x06;
	packet[4]   = 0x09;
	packet[8]	= col[0];
	packet[11]	= col[1];
	packet[14]	= col[2];

	device.write(packet, 64);
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
	return endpoint.interface === 3 && endpoint.usage === 0x0001 && endpoint.usage_page === 0xFF42;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/default/audio/headset-render.png";
}