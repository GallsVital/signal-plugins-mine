export function Name() { return "ROG STRIX IMPACT II ELECTRO PUNK"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return 0x1956; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
SettingControl:readonly
angleSnapping:readonly
mousePolling:readonly
mouseResponse:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"SettingControl", "group":"mouse", "label":"Enable Setting Control", "type":"boolean", "default":"false"},
		{"property":"angleSnapping", "group":"mouse", "label":"angle snapping", "type":"boolean", "default":"false"},
		{"property":"mousePolling", "group":"mouse", "label":"Polling Rate", "type":"combobox", "values":["125Hz", "250Hz", "500Hz", "1000Hz"], "default":"500Hz"},
		{"property":"mouseResponse", "group":"mouse", "label":"button response", "type":"combobox", "values":["12ms", "16ms", "20ms", "24ms", "28ms", "32ms"], "default":"16ms"},
		{"property":"dpi1", "group":"mouse", "label":"DPI 1", "step":"100", "type":"number", "min":"100", "max":"16000", "default":"800"},
		{"property":"dpi2", "group":"mouse", "label":"DPI 2", "step":"100", "type":"number", "min":"100", "max":"16000", "default":"1200"},
		{"property":"dpi3", "group":"mouse", "label":"DPI 3", "step":"100", "type":"number", "min":"100", "max":"16000", "default":"1500"},
		{"property":"dpi4", "group":"mouse", "label":"DPI 4", "step":"100", "type":"number", "min":"100", "max":"16000", "default":"2000"},

	];
}
let savedDpi1;
let savedDpi2;
let savedDpi3;
let savedDpi4;
let savedAngleSnapping;
let savedPollingRate;
let savedMouseResponse;
const pollingDict = {
	"125Hz"  : 0,
	"250Hz"  : 1,
	"500Hz"  : 2,
	"1000Hz" : 3,
};
const responseDict = {
	"12ms" :2,
	"16ms" :3,
	"20ms" :4,
	"24ms" :5,
	"28ms" :6,
	"32ms" :7,
};

const vKeyNames = [
	"Scroll Wheel", "Logo", "Underglow"
];

const vKeyPositions = [
	[1, 1], [1, 2], [1, 0]
];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}
export function Initialize() {
	if(SettingControl){
		sendMouseSettings();
	}
}

export function Render() {
	sendColors(0);
	sendColors(1);
	sendColors(2);

	if((savedDpi1 != dpi1 ||
        savedDpi2 != dpi2 ||
        savedDpi3 != dpi3 ||
        savedDpi4 != dpi4 ||
        savedAngleSnapping != angleSnapping ||
        savedPollingRate != pollingDict[mousePolling] ||
        savedMouseResponse != responseDict[mouseResponse]) &&
        SettingControl){
		sendMouseSettings();
	}
}

export function Shutdown() {

}

function sendColors(zone, shutdown = false){

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

	if(shutdown){
		col = hexToRgb(shutdownColor);
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

function sendMouseSettings(){
	savedDpi1 = dpi1;
	savedDpi2 = dpi2;
	savedDpi3 = dpi3;
	savedDpi4 = dpi4;
	savedAngleSnapping = angleSnapping;
	savedPollingRate = pollingDict[mousePolling];
	savedMouseResponse = responseDict[mouseResponse];

	sendPacketString(`00 51 31 06 00 ${savedAngleSnapping ? "01" : "00"}`, 65);
	sendPacketString(`00 51 31 04 00 ${savedPollingRate.toString(16)}`, 65);
	sendPacketString(`00 51 31 05 00 ${savedMouseResponse.toString(16)}`, 65);
	sendPacketString(`00 51 31 00 00 ${(savedDpi1/100 + 1).toString(16)}`, 65);
	sendPacketString(`00 51 31 01 00 ${(savedDpi2/100 + 1).toString(16)}`, 65);
	sendPacketString(`00 51 31 02 00 ${(savedDpi3/100 + 1).toString(16)}`, 65);
	sendPacketString(`00 51 31 03 00 ${(savedDpi4/100 + 1).toString(16)}`, 65);
	sendPacketString(`00 50 03 03`, 65);

}

function sendPacketString(string, size){

	const packet= [];
	const data = string.split(' ');

	for(let i = 0; i < data.length; i++){
		packet[i] =parseInt(data[i], 16);//.toString(16)
	}

	device.write(packet, size);
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

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/asus/mice/impact-ii-electropunk.png";
}
