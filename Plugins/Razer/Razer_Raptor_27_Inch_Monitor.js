export function Name() { return "Razer Raptor 27 Inch"; }
export function VendorId() { return 0x1532; }
export function ProductId() { return [0x0F12, 0x0F28]; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/razer"; }
export function Size() { return [15, 10]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [50, 100];}
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

const vLedNames = [
	"Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10", "Led 11", "Led 12"
];
const vLedPositions = [
	[0, 1], [0, 3], [0, 7], [0, 9], [5, 9], [7, 9], [11, 9], [14, 9], [14, 7], [14, 5], [14, 3], [14, 1]
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
	const color = SystemSuspending ? "#000000" : shutdownColor;
	sendColors(color);
}

function sendColors(overrideColor) {
	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x00;
	packet[2] = 0x1F;
	packet[3] = 0x00;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = 0x29;
	packet[7] = 0x0f;
	packet[8] = 0x03;
	packet[9] = 0x00;
	packet[10] = 0x00;
	packet[11] = 0x00;
	packet[12] = 0x00;
	packet[13] = 0x0B;

	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++){

		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		let col;

		if(overrideColor){
			col = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		}else{
			col = device.color(iPxX, iPxY);
		}
		const iLedIdx = (iIdx*3) + 14;
		packet[iLedIdx] = col[0];
		packet[iLedIdx+1] = col[1];
		packet[iLedIdx+2] = col[2];
	}

	packet[89] = CalculateCrc(packet);

	device.send_report(packet, 91);

}

function CalculateCrc(report) {
	let iCrc = 0;

	for (let iIdx = 3; iIdx < 89; iIdx++) {
		iCrc ^= report[iIdx];
	}

	return iCrc;
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
	return (endpoint.interface === -1 || endpoint.interface === 0) && endpoint.usage === 0x0001 && endpoint.usage_page === 0x000C;
}

export function ImageUrl(){
	return "https://assets.signalrgb.com/devices/brands/razer/misc/raptor-27-inch-monitor.png";
}
