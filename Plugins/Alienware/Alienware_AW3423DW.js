export function Name() { return "Alienware AW3423DW"; }
export function VendorId() { return 0x187c; }
export function ProductId() { return 0x100b; }
export function Publisher() { return "Bruno St. John"; }
export function Size() { return [17, 5]; }
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

const vLedIDs = [
	1, 2, 4, 8
];

const vLedNames = [
	"Middle", "Back_Big", "Back_Logo", "Switch"
];

const vLedPositions = [
	[8, 0], [8, 4], [13, 4], [16, 0]
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	const packet = [];
	packet[1] = 0x92;
	packet[2] = 0x37;
	packet[3] = 0x05;
	packet[4] = 0x00;
	packet[5] = 0x51;
	packet[6] = 0x82;
	packet[7] = 0xd0;
	packet[8] = 0xf4;
	packet[9] = 0x99;
	device.write(packet, 65);
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
	const packet = new Array(65).fill(0xFF);

	packet[1] = 0x92;
	packet[2] = 0x37;
	packet[3] = 0x0a;
	packet[4] = 0x00;
	packet[5] = 0x51;
	packet[6] = 0x87;
	packet[7] = 0xd0;
	packet[8] = 0x04;

	for(let idx = 0; idx < vLedIDs.length; idx++){
		const iPxX = vLedPositions[idx][0];
		const iPxY = vLedPositions[idx][1];
		const iLed = vLedIDs[idx];
		var color;

		if(overrideColor){
			color = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iPxX, iPxY);
		}

		packet[9]  = iLed;
		packet[10] = color[0];
		packet[11] = color[1];
		packet[12] = color[2];
		packet[13] = 0x23;
		packet[14] = 0xb8;

		device.write(packet, 65);
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
	return (endpoint.interface === -1 || endpoint.interface === 0) && endpoint.usage === 0x0001 && endpoint.usage_page === 0xff00;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/alienware/misc/aw3423dw-monitor.png";
}