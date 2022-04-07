export function Name() { return "ThermalTake Argent MP1 Mousepad"; }
export function VendorId() { return 0x264A; }
export function ProductId() { return 0x9011; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [11, 11]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}
let vKeymap = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 ];
let vLedNames = [ "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Zone 10", "Zone 11", "Zone 12", "Zone 13", "Zone 14", "Zone 15", "Zone 16", "Zone 17", "Zone 18", "Zone 19", "Zone 20" ];
let vLedPositions = [ [4, 0], [2, 0], [0, 0], [0, 2], [0, 4], [0, 6], [0, 8], [0, 10], [2, 10], [4, 10], [6, 10], [8, 10], [10, 10], [10, 8], [10, 6], [10, 4], [10, 2], [10, 0], [8, 0], [6, 0] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	var packet = [];
	packet[0x01] = 0x41;
	packet[0x02] = 0x03;
	device.write(packet, 64);

	var packet = [];
	packet[0x01] = 0x12;
	packet[0x02] = 0x22;
	device.write(packet, 64);
}

export function Render() {
	SendPacket(0, 15);
	SendPacket(0x0f, 5);
}

export function Shutdown() {
	SendPacket(0, 15, true);
	SendPacket(0x0f, 5, true);
}
let ColorPacket = [0x00, 0xC0, 0x01];

function SendPacket(startIdx, count, shutdown = false) {

	ColorPacket[3] = count;

	for(let iIdx = 0; iIdx < count; iIdx++){
		let iLedIdx = (iIdx * 4) + 5;
		let iKeyIdx = startIdx + iIdx;
		let iKeyPosX = vLedPositions[iKeyIdx][0];
		let iKeyPosY = vLedPositions[iKeyIdx][1];
		var color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iKeyPosX, iKeyPosY);
		}

		ColorPacket[iLedIdx] = vKeymap[iKeyIdx];
		ColorPacket[iLedIdx+1] = color[0];
		ColorPacket[iLedIdx+2] = color[1];
		ColorPacket[iLedIdx+3] = color[2];
	}

	device.write(ColorPacket, 65);
	device.pause(1);
}


export function Validate(endpoint) {
	return endpoint.interface === 1;
}

function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	let colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}