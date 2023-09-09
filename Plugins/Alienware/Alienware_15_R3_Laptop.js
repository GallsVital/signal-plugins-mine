export function Name() { return "Alienware 15 R3"; }
export function VendorId() { return 0x187C; }
export function ProductId() { return 0x0530; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [7, 5]; }
export function DefaultPosition(){return [10, 100];}
const DESIRED_HEIGHT = 85;
export function DefaultScale(){return Math.floor(DESIRED_HEIGHT/Size()[1]);}
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
	"Keyboard Zone 4", "Keyboard Zone 3", "Keyboard Zone 2", "Keyboard Zone 1", "Alien Logo", "Alienware Logo", "Trackpad", "Power Button", "Bottom Left Bar", "Bottom Right Bar", "Top Left Bar", "Top Right Bar", "Macro Keys"
];

const vLedPositions = [
	[5, 2], [4, 2], [3, 2], [2, 2], [3, 0], [3, 1], [3, 1], [3, 3], [0, 3], [6, 3], [0, 0], [6, 0], [1, 2]
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {

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

function sendColors(overrideColor){
	const RGBData = [];
	device.write([0x02, 0x07, 0x04], 12);
	device.pause(1);

	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var mxPxColor;

		if(overrideColor){
			mxPxColor = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			mxPxColor = hexToRgb(forcedColor);
		}else{
			mxPxColor = device.color(iPxX, iPxY);
		}

		const packet = [0x02, 0x03, iIdx+1, ((zones[iIdx] & 0xff0000) >> 16), ((zones[iIdx] & 0xff00) >> 8), (zones[iIdx] & 0xff), mxPxColor[0], mxPxColor[1], mxPxColor[2]];
		device.write(packet, 12);
		device.write([0x02, 0x04], 12); //End zone block
	}

	device.write([0x02, 0x05], 12); //Apply
}

const zones = [ //Fancy zone dict for the for loop.
	0x000001, 0x000002, 0x000004, 0x000008, 0x000020, 0x000040, 0x000080, 0x000100, 0x000400, 0x000800, 0x001000, 0x002000, 0x004000
];

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint) {
	return endpoint.interface === -1 || endpoint.interface === 0;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/alienware/misc/15-r3-laptop.png";
}