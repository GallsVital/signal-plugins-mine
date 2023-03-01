export function Name() { return "SteelSeries Rival 3 Wireless"; }
export function VendorId() { return 0x1038; }
export function Documentation(){ return "troubleshooting/steelseries"; }
export function ProductId() { return 0x1830; }
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
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"DpiControl", "group":"mouse", "label":"Enable Dpi Control", "type":"boolean", "default":"false"},
		{"property":"dpi1", "group":"mouse", "label":"DPI", "step":"50", "type":"number", "min":"200", "max":"12400", "default":"800"},
	];
}

const vLedNames = [
	"Scroll Zone 1", "Scroll Zone 2",
];

const vLedPositions = [
	[1, 0], [1, 0]
];

let savedDpi1;

export function Initialize() {
	const packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0x09;
	device.write(packet, 69);


	if(savedDpi1 != dpi1 && DpiControl) {
		setDpi(dpi1);
	}
}

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Shutdown() {
	SendColorPacket(true);
}

export function Validate(endpoint) {
	return endpoint.interface === 3;
}

function SendColorPacket(shutdown = false) {

	var packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0xE8;
	device.write(packet, 65);


	var packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0x03;
	packet[0x05] = 0x30;
	packet[0x07] = 0x10;
	packet[0x08] = 0x27;

	packet[23] = 0x01;

	packet[31] = 0x01;

	for(let iIdx = 0; iIdx < 2; iIdx++){
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var color;

		if(shutdown){
			color = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iPxX, iPxY);
		}

		const iLedIdx = 32 + iIdx * 3;
		packet[iLedIdx] = color[0];
		packet[iLedIdx+1] = color[1];
		packet[iLedIdx+2] = color[2];

	}

	device.write(packet, 65);


	var packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0x03;
	packet[0x02] = 0x00;
	packet[0x03] = 0x30;
	packet[0x04] = 0x00;
	packet[0x05] = 0x2C;
	device.write(packet, 65);

	var packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0x05;
	packet[0x02] = 0x00;
	packet[0x03] = 0x10;
	packet[0x04] = 0xFF;
	packet[0x09] = 0x5C;
	device.write(packet, 65);

	var packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0x1c;
	packet[0x02] = 0x00;
	packet[0x03] = 0x55;
	packet[0x04] = 0x00;
	packet[0x05] = 0x0E;
	packet[0x06] = 0x01;
	packet[0x07] = 0x01;
	device.write(packet, 65);

	device.pause(100);
}

export function Render() {

	SendColorPacket();

	if(savedDpi1 != dpi1 && DpiControl){
		setDpi(dpi1);
	}

	device.pause(1);
}

function setDpi(dpi){
	savedDpi1 = dpi1;

	var packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0x20;
	packet[0x02] = 0x01;
	packet[0x03] = 0x01;
	packet[0x04] = Math.floor(dpi/100);
	device.write(packet, 65);

	var packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0xA0;
	device.write(packet, 65);

	packet[0x00] = 0x00;
	packet[0x01] = 0xE8;
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
