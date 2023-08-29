export function Name() { return "ASUS Chakram X"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return 0x1a1a; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/asus"; }
export function Size() { return [3, 4]; }
export function DefaultPosition() {return [225, 120]; }
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

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

const vKeyNames = [
	"Scroll Wheel", "Logo", "Front Zone", "Front Zone 2", "Front Zone 3",
];

const vKeyPositions = [
	[1, 1], [1, 3], [0, 0], [1, 0], [2, 0],
];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Initialize() {
}

export function Render() {
	sendColors(4, 5);
	sendColors(5, 0);
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		sendColors(4, 5, "#000000"); // Go Dark on System Sleep/Shutdown
		sendColors(5, 0, "#000000");
	}else{
		sendColors(4, 5, shutdownColor);
		sendColors(5, 0, shutdownColor);
	}

}

function sendColors(zone, zone2, overrideColor){

	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x51;
	packet[2] = 0x29;
	packet[3] = zone;
	packet[4] = 0x00;
	packet[5] = zone2;

	for(let iIdx = 0; iIdx < vKeyPositions.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		var color;

		if(overrideColor) {
			color = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}

		packet[iIdx*3+6]   = color[0];
		packet[iIdx*3+6+1] = color[1];
		packet[iIdx*3+6+2] = color[2];
	}

	device.write(packet, 65);
}

export function Validate(endpoint) {
	return endpoint.interface === 0;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/asus/mice/chakram-wireless.png";
}