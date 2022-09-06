export function Name() { return "Corsair K70 Pro Mini"; }
export function VendorId() { return 0x1b1c; }
export function ProductId() { return 0x1bb6; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [22, 8]; }
export function DefaultPosition(){return [10, 100];}
const DESIRED_HEIGHT = 85;
export function DefaultScale(){return Math.floor(DESIRED_HEIGHT/Size()[1]);}
export function ControllableParameters(){
	return [
		{"property":"startupMode",  "group":"", "label":"Start Up Mode", "type":"boolean", "default":"true"},
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}
export function Documentation(){ return "troubleshooting/corsair"; }

let endpointVal;
let savedStartUpValue = true;

function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	let colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Initialize() {
	sendPacketString("00 08 01 03 00 02", 1025);  //Critical Software control packet

	if(savedStartUpValue){

		sendPacketString("00 08 02 6E", 1025);
		sendPacketString(`00 08 0D 01 22`, 1025);          //Open
		endpointVal = 1;
	}else{
		sendPacketString("00 08 02 6E", 1025);
		sendPacketString(`00 08 0D 00 22`, 1025);          //Open
		endpointVal = 0;
	}

	savedStartUpValue = startupMode;

	return "Startup Ran" + savedStartUpValue;
}

function sendPacketString(string, size){

	let packet= [];
	let data = string.split(' ');

	for(let i = 0; i < data.length; i++){
		packet[parseInt(i, 16)] =parseInt(data[i], 16);
	}

	device.write(packet, size);
}

export function Shutdown() {
	sendPacketString("00 08 01 03 00 01", 1025);  // hardware control packet
}

let vKeys = [
	119,  120,  121,  122,  123,  124,  125,  126,  127,  128,  129,
	156,37,   26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 41, 42, 38,167,
	    39,   16, 22, 4, 17, 19, 24, 20, 8, 14, 15, 43,   44, 45,
	157,53,   0, 18, 3, 5, 6, 7, 9, 10, 11, 47, 48,           36,168,
	158,102,  25, 23, 2, 21, 1, 13, 12, 50, 51, 52,          106,169,
	159,101,  104, 103,       -4,    40,  -3,  107, 118, 97, 105,170,
	189,  190,  191,  192,  193,  194,  195,  196,  197,  198,  199,
	96, 46 //ISO
];

let vKeyNames = [
	"TopBar1", "TopBar2", "TopBar3", "TopBar4", "TopBar5", "TopBar6", "TopBar7", "TopBar8", "TopBar9", "TopBar10", "TopBar11",
	"LeftBar1","Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace","RightBar1",
	"LeftBar2","Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\","RightBar2",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
	"LeftBar3","Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift","RightBar3",
	"LeftBar4","Left Ctrl", "Left Win", "Left Alt", "Space Left", "Space", "Space Right", "Right Alt", "Fn", "Menu", "Right Ctrl","RightBar4",
	"BottomBar1", "BottomBar2", "BottomBar3", "BottomBar4", "BottomBar5", "BottomBar6", "BottomBar7", "BottomBar8", "BottomBar9", "BottomBar10", "BottomBar11",
	"ISO #", "ISO <"
];

let vKeyPositions = [
	[0, 1], [1, 1],         [3, 1], [4, 1],         [6, 1], [7, 1],         [9, 1],  [10, 1], [11, 1], [12, 1], [13, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],  [10, 2], [11, 2], [12, 2], [13, 2],[14, 2],[15, 2],
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],  [10, 3], [11, 3], [12, 3], [13, 3],[14, 3],[15, 3],
	[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],  [10, 4], [11, 4],          [13, 4],
	[0, 5],         [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],  [10, 5], [11, 5],          [13, 5],[14, 5],[15, 5],
	[0, 6], [1, 6], [2, 6],         [4, 6],         [6, 6],         [8, 6],          [10, 6], [11, 6], [12, 6], [13, 6],[14, 6],[15, 6],
	[0, 7], [1, 7],         [3, 7], [4, 7],         [6, 7], [7, 7],         [9, 7],  [10, 7], [11, 7], [12, 7], [13, 7],
	//ISO
	[2, 5], [12, 4]
];


export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Render() {
	if(savedStartUpValue != startupMode){
		Initialize();
	}

	sendColors();
}

function sendColors(shutdown = false){

	let packet = [];
	packet[0x00]   = 0x00;
	packet[0x01]   = 0x08;
	packet[0x02]   = 0x06;
	packet[0x03]   = endpointVal;
	packet[0x04]   = 0x73;
	packet[0x05]   = 0x01;
	packet[0x06]   = 0x00;
	packet[0x07]   = 0x00;
	packet[0x08]   = 0x12;


	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		let iPxX = vKeyPositions[iIdx][0];
		let iPxY = vKeyPositions[iIdx][1];
		var mxPxColor;

		if(shutdown){
			mxPxColor = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			mxPxColor = hexToRgb(forcedColor);
		}else{
			mxPxColor = device.color(iPxX, iPxY);
		}

		packet[22+vKeys[iIdx]*3] = mxPxColor[0];
		packet[22+vKeys[iIdx]*3 +1 ] = mxPxColor[1];
		packet[22+vKeys[iIdx]*3 +2 ] = mxPxColor[2];
	}

	device.write(packet, 1025);

	//Check for Error

	packet[3] = 0x00;
	packet = device.read(packet, 1025);

	if(packet[3] == 3){

		sendPacketString(`00 08 05 ${savedStartUpValue}`, 1025);
		savedStartUpValue = savedStartUpValue == 1 ? 0 : 1;
		device.log("Selected Lighting Handle: " + savedStartUpValue);
		Initialize();

	}

}


export function Validate(endpoint) {
	return endpoint.interface === 1;
}


export function Image() {
}