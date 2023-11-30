export function Name() { return "Corsair Virtuoso Wireless Gaming Headset"; }
export function VendorId() { return 0x1B1C; }
export function ProductId() { return [0x0A44, 0x0A4B, 0x0A4C, 0x0A5C]; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/corsair"; }
export function Size() { return [3, 3]; }
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

const vLedNames = ["Left Cans", "Right Can", "Mic"];

const vLedPositions = [
	[0, 2], [2, 2], [1, 0]
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.write([0x02, 0x09, 0x01, 0x03, 0x00, 0x02], 64); // Enable Software Mode
	device.write([0x02, 0x09, 0x0D, 0x00, 0x01], 64); //Open lighting endpoint
}

export function Render() {
	sendColors();
}

export function Shutdown() {
	device.write([0x02, 0x09, 0x01, 0x03, 0x00, 0x01], 64);
}

function sendColors(shutdown = false){

	const red = new Array(3).fill(0);
	const green = new Array(3).fill(0);
	const blue = new Array(3).fill(0);


	let packet = [];

	packet[0x00]   = 0x02;
	packet[0x01]   = 0x09;
	packet[0x02]   = 0x06;
	packet[0x03]   = 0x00;
	packet[0x04]   = 0x09;
	packet[0x05]   = 0x00;
	packet[0x06]   = 0x00;
	packet[0x07]   = 0x00;

	for(let zone_idx = 0; zone_idx < vLedPositions.length; zone_idx++) {
		const iX = vLedPositions[zone_idx][0];
		const iY = vLedPositions[zone_idx][1];
		let col;

		if(shutdown){
			col = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		}else{
			col = device.color(iX, iY);
		}

		red[zone_idx] = col[0];
		green[zone_idx] = col[1];
		blue[zone_idx] = col[2];
	}

	packet = packet.concat(red);
	packet = packet.concat(green);
	packet = packet.concat(blue);

	device.write(packet, 64);
}

export function Validate(endpoint) {
	return endpoint.interface === 4 && endpoint.usage === 1;
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/audio/headset-render.png";
}
