export function Name() { return "Steelseries QcK Prism"; }
export function VendorId() { return  0x1038; }
export function ProductId() { return 0x1514; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/steelseries"; }
export function Size() { return [5, 5]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

const vLedNames = [
	"Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10", "Led 11", "Led 12",
];

const vLedPositions = [
	//left mid/bot
	[0, 2], [0, 3],

	//bottom
	[1, 4], [2, 4], [3, 4],
	//right
	[4, 3], [4, 2], [4, 1],

	//top
	[3, 1], [2, 1], [1, 1],
	//left top
	[0, 1],
];

export function Initialize() {
	return "Hello, there!";
}

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Shutdown() {
	sendColors(true);
}

export function Validate(endpoint) {

	return endpoint.interface === 0;
}

export function Render() {
	sendColors();

}

function sendPacketString(string, size){

	const packet= [];
	const data = string.split(' ');

	for(let i = 0; i < data.length; i++){
		packet[parseInt(i, 16)] =parseInt(data[i], 16);//.toString(16)
	}

	device.write(packet, size);
}

function sendColors(shutdown = false) {
//0E 00 0C 00
//EE FF 00 00 00 00 00 00 00 01 00 00
//EE FF 00 00 00 00 00 00 00 01 00 01
//EE FF 00 00 00 00 00 00 00 01 00 02
//EE FF 00 00 00 00 00 00 00 01 00 03
//EE FF 00 00 00 00 00 00 00 01 00 04
//EE FF 00 00 00 00 00 00 00 01 00 05
//EE FF 00 00 00 00 00 00 00 01 00 06
//EE FF 00 00 00 00 00 00 00 01 00 07
//EE FF 00 00 00 00 00 00 00 01 00 08
//EE FF 00 00 00 00 00 00 00 01 00 09
//EE FF 00 00 00 00 00 00 00 01 00 0A
//EE FF 00 00 00 00 00 00 00 01 00 0B


	//0E 00 0C 00
	//E2 11 31 00 00 00 00 00 00 01 00 00
	//E2 11 31 00 00 00 00 00 00 01 00 01
	//E2 11 31 00 00 00 00 00 00 01 00 02
	//E2 11 31 00 00 00 00 00 00 01 00 03
	//D4 0F 4A 00 00 00 00 00 00 01 00 04
	//D4 0F 4A 00 00 00 00 00 00 01 00 05
	//C5 0D 64 00 00 00 00 00 00 01 00 06
	//C5 0D 64 00 00 00 00 00 00 01 00 07
	//B5 0B 7E 00 00 00 00 00 00 01 00 08
	//B5 0B 7E 00 00 00 00 00 00 01 00 09
	//A7 09 97 00 00 00 00 00 00 01 00 0A
	//A7 09 97 00 00 00 00 00 00 01 00 0B


	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x0E;
	packet[2] = 0x00;
	packet[3] = 0x0C;
	packet[4] = 0x00;

	var color;

	if(shutdown){
		color = hexToRgb(shutdownColor);
	}else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	}else{
		color = device.color(iPxX, iPxY);
	}

	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
		var iPxX = vLedPositions[iIdx][0];
		var iPxY = vLedPositions[iIdx][1];

		var color;

		if(shutdown){
			color = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iPxX, iPxY);
		}

		packet[iIdx*12 + 5] = color[0];
		packet[iIdx*12 + 6] = color[1];
		packet[iIdx*12 + 7] = color[2];
		packet[iIdx*12 + 8] = 0x00;
		packet[iIdx*12 + 9] = 0x00;
		packet[iIdx*12 + 10] = 0x00;
		packet[iIdx*12 + 11] = 0x00;
		packet[iIdx*12 + 12] = 0x00;
		packet[iIdx*12 + 13] = 0x00;
		packet[iIdx*12 + 14] = 0x01;
		packet[iIdx*12 + 15] = 0x00;
		packet[iIdx*12 + 16] = iIdx;

	}

	device.send_report(packet, 525);
	sendPacketString("00 0D", 65);
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}
