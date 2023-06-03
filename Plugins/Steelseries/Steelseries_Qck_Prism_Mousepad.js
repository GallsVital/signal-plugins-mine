export function Name() { return "Steelseries QcK "; }
export function VendorId() { return  0x1038; }
export function ProductId() { return Object.keys(PIDLibrary); }
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
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

const PIDLibrary = {
	0x1507: "Prism",
	0x1514: "Prism",
	0x151c: "Prism Neo Noir Edition",
};

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

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.setName(Name() + PIDLibrary[ProductId]);
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

	const packet = [];
	packet[1] = 0x0E;
	packet[3] = 0x0C;

	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];

		let color;

		if(overrideColor){
			color = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iPxX, iPxY);
		}

		packet[iIdx*12 + 5] = color[0];
		packet[iIdx*12 + 6] = color[1];
		packet[iIdx*12 + 7] = color[2];
		packet[iIdx*12 + 14] = 0x01;
		packet[iIdx*12 + 16] = iIdx;

	}

	device.send_report(packet, 525);
	device.write([0x00, 0x0D], 65);
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
	return endpoint.interface === 0;
}

export function ImageResource() {
	if(device.productId() === 0x1507 || device.productId() === 0x1514){
		return "default/mousepad";
	}

	return "default/mousepadXL";

}