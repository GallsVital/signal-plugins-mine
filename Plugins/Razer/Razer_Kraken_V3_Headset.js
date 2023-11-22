export function Name() { return "Razer Kraken V3"; }
export function VendorId() { return 0x1532; }
export function ProductId() { return [0x0533, 0x0537, 0x0549]; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/razer"; }
export function Size() { return [2, 2]; }
export function Type() { return "Hid"; }
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

const vLedNames = [
	"Both Cans"
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
	device.write([0x40, 0x01, 0x00, 0x00, 0x08], 9);//software control packet
}

export function Render() {
	SendPacket();
}

export function Shutdown(){
	SendPacket(true);
}

function SendPacket(shutdown = false) {
	const packet = [];
	packet[0] = 0x40;
	packet[1] = 0x03;
	packet[2] = 0x00;

	let color;
	const iPxX = vLedPositions[0][0];
	const iPxY = vLedPositions[0][1];

	if(shutdown){
		color = hexToRgb(shutdownColor);
	}else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	}else{
		color = device.color(iPxX, iPxY);
	}

	packet[3] = color[0];
	packet[4] = color[1];
	packet[5] = color[2];

	device.write(packet, 9);
	device.pause(1); // We need a pause here (between packets), otherwise the ornata can't keep up.

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
	return endpoint.interface === 3 && endpoint.usage === 0x0001 && endpoint.usage_page === 0x000c;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/razer/audio/kraken-v3.png";
}