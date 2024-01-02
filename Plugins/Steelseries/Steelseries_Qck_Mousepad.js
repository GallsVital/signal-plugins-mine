export function Name() { return "Steelseries QcK Prism "; }
export function VendorId() { return 0x1038; }
export function ProductId() { return Object.keys(PIDLibrary); }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/steelseries"; }
export function Size() { return [2, 2]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

const PIDLibrary = {
	0x150A: "Medium",
	0x150D: "Medium",
	0x1516: "3XL",
	0x151A: "5XL",
	0x151E: "XL Destiny Edition",
	0x3769: "XL Destiny Edition",
	0x1520: "XL Destiny Lightfall Edition"
};

export function updateImage(){
	if(device.productId() === 0x150A || device.productId() === 0x150D){
		return "https://assets.signalrgb.com/devices/default/mousepad.png";
	}

	return "https://assets.signalrgb.com/devices/default/mousepad-xl.png";
}

const vLedNames = [
	"Mousemat Top", "Mousemap Bottom"
];

const vLedPositions = [
	[0, 0], [1, 1]
];

const vLeds = [
	5, 17
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.setName(Name() + PIDLibrary[device.productId()]);
	device.setImageFromUrl(updateImage());
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

export function sendColors(overrideColor) {

	// Most of this is grabbed using usblyzer.  Usblyzer sent 524 byte packets followed
	// by 64 byte commit packets.  Here, we sent the bytes we'll use and the engine will
	// pad the rest with zeroes.  Important to note that we add 1 to the send and write functions
	// because hid firstbyte is (almost) always zero.  Use usblyzer to verify the packets sent.
	const packet = [];

	packet[1] = 14;
	packet[3] = 2;
	packet[8] = 255;
	packet[9] = 50;
	packet[10] = 200;
	packet[14] = 1;
	packet[20] = 255;
	packet[21] = 50;
	packet[22] = 200;
	packet[25] = 1;
	packet[26] = 1;
	packet[28] = 1;

	for (let idx = 0; idx < vLeds.length; idx++) {
		const iPxX = vLedPositions[idx][0];
		const iPxY = vLedPositions[idx][1];
		let color;

		if(overrideColor){
			color = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iPxX, iPxY);
		}

		const iLedIdx 		= vLeds[idx];
		packet[iLedIdx] 	= color[0];
		packet[iLedIdx+1] 	= color[1];
		packet[iLedIdx+2] 	= color[2];
	}

	device.send_report(packet, 525);

	// We have to send 'write' vs 'send_report' here with only 0x0D as byte 1. (first byte
	// is always zero)
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
	// Qck has two interfaces - return 'true' if the endpoint is at interface
	// zero.
	return endpoint.interface === 0;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/mousepad-xl.png";
}
