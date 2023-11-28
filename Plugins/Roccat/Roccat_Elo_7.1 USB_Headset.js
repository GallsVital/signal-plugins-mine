export function Name() { return "Roccat Elo 7.1 USB"; }
export function VendorId() { return 0x1e7d; }
export function ProductId() { return 0x3a34;}
export function Documentation(){ return "troubleshooting/roccat"; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [7, 7]; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 7.0;}
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

const vKeys = [ 0 ];
const vLedNames = [ "Cans" ];
const vLedPositions = [ [1, 0], ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	sendPacketString("ff 01 ", 16);

	sendPacketString("ff 02 ", 16);
	device.pause(10);
	sendPacketString("ff 03 00 01", 16);
	device.pause(10);
	sendPacketString("ff 04 00 00 f4", 16);
	device.pause(10);
	sendPacketString("ff 01", 16);
	device.pause(10);
}

export function Render() {
	sendZone();
}

export function Shutdown() {
	// Lighting IF
	sendZone(true);
}

function sendZone(shutdown = false) {
	const packet = [];
	packet[0] = 0xFF;
	packet[1] = 0x04;

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var col;

		if(shutdown){
			col = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		}else{
			col = device.color(iPxX, iPxY);
		}

		packet[vKeys[iIdx]*3+4] = col[0];
		packet[vKeys[iIdx]*3+5] = col[1];
		packet[vKeys[iIdx]*3+6] = col[2];

	}

	device.write(packet, 17);
}

function sendPacketString(string, size){
	const packet= [];
	const data = string.split(' ');

	for(let i = 0; i < data.length; i++){
		packet[parseInt(i, 16)] =parseInt(data[i], 16);//.toString(16)
	}

	device.write(packet, size);
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
	return endpoint.interface === 3;
}

export function ImageUrl(){
	return "https://assets.signalrgb.com/devices/brands/roccat/audio/elo-7-1-usb.png";
}