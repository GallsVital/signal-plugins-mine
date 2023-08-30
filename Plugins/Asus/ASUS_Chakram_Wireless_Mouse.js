export function Name() { return "ASUS Chakram Wireless"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return [0x18E3, 0x18E5]; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/asus"; }
export function Size() { return [5, 5]; }
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

const vKeyNames = [
	"Scroll Wheel", "Logo", "Front Zone",
];

const vKeyPositions = [
	[1, 4], [1, 1], [1, 0],
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
	for(let i = 0; i < 3; i++){
		sendColors(i);
	}
}
export function Shutdown(SystemSuspending) {
	// Go Dark on System Sleep/Shutdown
	for(let i = 0; i < 3; i++){
		sendColors(i, SystemSuspending ? "#000000" : shutdownColor);
	}
}

function sendColors(zone, overrideColor){

	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x51;
	packet[2] = 0x28;
	packet[3] = zone;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = 0x04;

	const iPxX = vKeyPositions[zone][0];
	const iPxY = vKeyPositions[zone][1];
	let col;

	if(overrideColor){
		col = hexToRgb(overrideColor);
	}else if (LightingMode === "Forced") {
		col = hexToRgb(forcedColor);
	}else{
		col = device.color(iPxX, iPxY);
	}

	packet[7] = col[0];
	packet[8] = col[1];
	packet[9] = col[2];

	device.write(packet, 65);
}

//function sendMouseSettings(){
// 	let savedDpi1 = dpi1;
// 	let savedDpi2 = dpi2;
// 	let savedDpi3 = dpi3;
// 	let savedDpi4 = dpi4;
// 	let savedAngleSnapping = angleSnapping;
// 	let savedPollingRate = pollingDict[mousePolling];
// 	let savedMouseResponse = responseDict[mouseResponse];
//
// 	device.write([0, 51, 31, 6, 0, savedAngleSnapping ? 1 : 0], 65);
// 	device.write([0, 51, 31, 4, 0, savedPollingRate], 65);
// 	device.write([0, 51, 31, 5, 0, savedMouseResponse], 65);
// 	device.write([0, 51, 31, 0, 0, savedDpi1/100 + 1], 65);
// 	device.write([0, 51, 31, 1, 0, savedDpi2/100 + 1], 65);
// 	device.write([0, 51, 31, 2, 0, savedDpi3/100 + 1], 65);
// 	device.write([0, 51, 31, 3, 0, savedDpi4/100 + 1], 65);
// 	device.write([0, 50, 3, 3], 65);
//
//}

export function Validate(endpoint) {
	return endpoint.interface === 0;
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
	return "https://marketplace.signalrgb.com/devices/brands/asus/mice/chakram-wireless.png";
}