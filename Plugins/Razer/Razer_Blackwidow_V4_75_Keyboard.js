export function Name() { return "Razer Blackwidow V4 75%"; }
export function VendorId() { return 0x1532; }
export function ProductId() { return 0x02A5; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/razer"; }
export function Size() { return [17, 9]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

const vLeds = [
	 0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  13,  14,		//15
	23,  24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  37,  38,		//15
	46,  47,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  60,		//15
	69,  70,  71,  72,  73,  74,  75,  76,  77,  78,  79,  80,  82,       83,		//14
	92,  94,  95,  96,  97,  98,  99, 100, 101, 102, 103, 105, 106, 107,			//14
	115, 116, 117, 119,                122,                123, 125, 126, 127, 128,	//10

	138, 147, //2
	139, 148, //2
	140, 149, //2
	141, 150, //2
	142, 151, //2
	143, 152, //2
	144, 153, //2
	145, 154, //2
	146, 155, //2
];

const vLedNames = [
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Play/Pause", "Mute",						//15
	"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace", "Del",									//15
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Page Up",											//15
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", "Page Down",									//14
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "Insert",						//14
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn",  "Right Ctrl", "Left Arrow",  "Down Arrow", "Right Arrow", //10

	"Underglow Left LED 1", "Underglow Right LED 1", //2
	"Underglow Left LED 2", "Underglow Right LED 2", //2
	"Underglow Left LED 3", "Underglow Right LED 3", //2
	"Underglow Left LED 4", "Underglow Right LED 4", //2
	"Underglow Left LED 5", "Underglow Right LED 5", //2
	"Underglow Left LED 6", "Underglow Right LED 6", //2
	"Underglow Left LED 7", "Underglow Right LED 7", //2
	"Underglow Left LED 8", "Underglow Right LED 8", //2
	"Underglow Left LED 9", "Underglow Right LED 9", //2
];

const vLedPositions = [
	[1, 1],	[2, 1], [3, 1], [4, 1], [5, 1],	[6, 1],	[7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1],	//15
	[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2],	//15
	[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3],	//15
	[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], 			[14, 4], [15, 4],	//14
	[1, 5],  		[3, 5],	[4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5],	//14
	[1, 6], [2, 6], [3, 6],					[6, 6],							[10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6],	//10

	[0, 0], [16, 0], //2
	[0, 1], [16, 1], //2
	[0, 2], [16, 2], //2
	[0, 3], [16, 3], //2
	[0, 4], [16, 4], //2
	[0, 5], [16, 5], //2
	[0, 6], [16, 6], //2
	[0, 7], [16, 7], //2
	[0, 8], [16, 8], //2
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {

	let packet = [0x00, 0x00, 0x1F, 0x00, 0x00, 0x00, 0x02, 0x00, 0x04, 0x03];
	packet[89] = CalculateCrc(packet);
	device.send_report(packet, 91); // Software mode

	packet = [0x00, 0x00, 0x1F, 0x00, 0x00, 0x00, 0x06, 0x0f, 0x02, 0x00, 0x00, 0x08, 0x00, 0x01];
	packet[89] = CalculateCrc(packet);
	device.send_report(packet, 91); // Matrix mode
}

export function Render() {
	sendColors();
	device.pause(1);
}

export function Shutdown(SystemSuspending) {
	if(SystemSuspending){
		sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		sendColors(shutdownColor);
	}
}

function sendColors(overrideColor) {

	const RGBData	= [];

	for (let idx = 0; idx < vLedPositions.length; idx++) {
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

		RGBData[(vLeds[idx]*3)]		= color[0];
		RGBData[(vLeds[idx]*3)+1]	= color[1];
		RGBData[(vLeds[idx]*3)+2]	= color[2];
	}

	for(let idx = 0; idx < 7; idx++){
		let packet = [];
		packet = [0x00, 0x00, 0x1F, 0x00, 0x00, 0x00, 0x3B, 0x0F, 0x03, 0x00, 0x00, idx, 0x00, 0x11].concat(RGBData.splice(0, 23*3));
		packet[89] = CalculateCrc(packet);
		device.send_report(packet, 91); // Send commands
	}
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
	return endpoint.interface === 3 && endpoint.usage === 0x0000 && endpoint.usage_page === 0x0001;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-75.png";
}
