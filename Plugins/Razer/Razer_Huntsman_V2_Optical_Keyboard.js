export function Name() { return "Razer Huntsman V2 Analog"; }
export function VendorId() { return 0x1532; }
export function Documentation(){ return "troubleshooting/razer"; }
export function ProductId() { return 0x0266; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [24, 9]; }
export function Type() { return "Hid"; }
export function DefaultPosition() {return [75, 70]; }
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
	"LightBar Left 1", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",   "LightBar Right 1",  "Button 1", "Button 2", "Button 3", "Button 4",
	"LightBar Left 2", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -", "LightBar Right 2",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",
	"LightBar Left 3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                              "Num 4", "Num 5", "Num 6",   "LightBar Right 3",
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",
	"LightBar Bottom 1", "LightBar Bottom 2", "LightBar Bottom 3", "LightBar Bottom 4", "LightBar Bottom 5", "LightBar Bottom 6", "LightBar Bottom 7", "LightBar Bottom 8", "LightBar Bottom 9", "LightBar Bottom 10", "LightBar Bottom 11", "LightBar Bottom 12", "LightBar Bottom 13", "LightBar Bottom 14", "LightBar Bottom 15",
	"Wrist Rest Bar Left 1", "Wrist Rest Bar Right 1",
	"Wrist Rest Bar Left 2", "Wrist Rest Bar Right 2",
	"Wrist Rest Bar Bottom 1", "Wrist Rest Bar Bottom 2", "Wrist Rest Bar Bottom 3", "Wrist Rest Bar Bottom 4", "Wrist Rest Bar Bottom 5", "Wrist Rest Bar Bottom 6", "Wrist Rest Bar Bottom 7", "Wrist Rest Bar Bottom 8", "Wrist Rest Bar Bottom 9", "Wrist Rest Bar Bottom 10", "Wrist Rest Bar Bottom 11", "Wrist Rest Bar Bottom 12", "Wrist Rest Bar Bottom 13", "Wrist Rest Bar Bottom 14", "Wrist Rest Bar Bottom 15",
];
const vKeymap = [


	144,    1,    3, 4, 5, 6,   7, 8, 9, 10,     11, 12, 13, 14,        15, 16, 17,         18, 19, 20, 21,     149,
	145,    23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,     37, 38, 39,         40, 41, 42, 43,        150,
	45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,                  59, 60, 61,         62, 63, 64, 65,
	146,    67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 80,                                       84, 85, 86,             151,
	89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 102,                         104,       106, 107, 108, 109,
	111, 112, 113,            117,     121, 122, 123, 124,         125, 126, 127,    129, 130,

	147, 148,   131, 132, 133, 134, 135, 136, 137,   138, 139, 140, 141, 142, 143,
	152,                                                             169,
	153,                                                             170,
	153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167,

];
const RowDict = {
	0: 22,
	1: 22,
	2: 22,
	3: 22,
	4: 22,
	5: 22,
	6: 20, //Light Bar Starts
	7: 20,
	8: 20,
	9: 20,
};
const vLedPositions = [
	[0, 1],  [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],           [15, 0], [16, 0], [17, 0],   [18, 0], [19, 0], [20, 0], [21, 0], [22, 1],
	[0, 2],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],   [15, 1], [16, 1], [17, 1],   [18, 1], [19, 1], [20, 1], [21, 1], [22, 3],
	[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],   [18, 2], [19, 2], [20, 2], [21, 2],
	[0, 5],  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3],         [14, 3],                             [18, 3], [19, 3], [20, 3],         [22, 5],
	[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],                 [14, 4],           [16, 4],           [18, 4], [19, 4], [20, 4], [21, 4],
	[1, 5], [2, 5], [3, 5],                      [7, 5],                       [11, 5], [12, 5], [13, 5], [14, 5],   [15, 5], [16, 5], [17, 5],   [18, 5],         [20, 5],


	[1, 6], [2, 6], [3, 6], [4, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [14, 6], [15, 6], [18, 6], [19, 6], [20, 6],
	[0, 7],                                                                                                                  [22, 7],
	[0, 8],                                                                                                                  [22, 8],
	[1, 8], [2, 8], [3, 8], [4, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [14, 8], [15, 8], [18, 8], [19, 8]


];

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}


export function Initialize() {

}

export function Render() {
	SendColors();
}


export function Shutdown() {
	SendColors(true);
}

function packetSend(packet, length) //Wrapper for always including our CRC
{
	const packetToSend = packet;
	packetToSend[89] = CalculateCrc(packet);
	device.send_report(packetToSend, length);
}

function CalculateCrc(report) {
	let iCrc = 0;

	for (let iIdx = 3; iIdx < 89; iIdx++) {
		iCrc ^= report[iIdx];
	}

	return iCrc;
}

function SendColors(shutdown = false) {

	const RGBData = new Array(586).fill(0);
	let TotalLedCount = 0;

	for(let iIdx = 0; iIdx < vKeymap.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var color;

		if(shutdown){
			color = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iPxX, iPxY);
		}

		RGBData[vKeymap[iIdx]*3] = color[0];
		RGBData[vKeymap[iIdx]*3+1] = color[1];
		RGBData[vKeymap[iIdx]*3+2] = color[2];
		TotalLedCount += 1;
	}

	const sentLeds = 0;
	let PacketCount = 0;

	for(let i = 0; i < Object.keys(RowDict).length ;i++) {
		const LedsToSend = RowDict[PacketCount];

		let packet = [];
		packet[0] = 0x00;
		packet[1] = 0x00;
		packet[2] = 0x1F;
		packet[3] = 0x00;
		packet[4] = 0x00;
		packet[5] = 0x00;
		packet[6] = 0x4A;
		packet[7] = 0x0F;
		packet[8] = 0x03;
		packet[11] = PacketCount++;
		packet[13] = 0x16;
		packet = packet.concat(RGBData.splice(0, LedsToSend*3));

		packetSend(packet, 91);
	}
}

export function Validate(endpoint) {
	return endpoint.interface === 3;
}

export function ImageUrl(){
	return "https://assets.signalrgb.com/devices/brands/razer/keyboards/huntsman-v2%20-%20analog.png";
}