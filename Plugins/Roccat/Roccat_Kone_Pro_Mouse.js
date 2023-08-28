export function Name() { return "Roccat Kone Pro"; }
export function VendorId() { return 0x1e7d; }
export function ProductId() { return 0x2C88; }
export function Documentation(){ return "troubleshooting/roccat"; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
DpiControl:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
dpi5:readonly
pollingrate:readonly
angleSnapping:readonly
timeout:readonly
timeoutlength:readonly
debounce:readonly
lod:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"DpiControl", "group":"mouse", "label":"Enable Dpi Control", "type":"boolean", "default":"false"},
		{"property":"dpi1", "group":"mouse", "label":"DPI 1", "step":"50", "type":"number", "min":"50", "max":"19000", "default":"800"},
		{"property":"dpi2", "group":"mouse", "label":"DPI 2", "step":"50", "type":"number", "min":"50", "max":"19000", "default":"1200"},
		{"property":"dpi3", "group":"mouse", "label":"DPI 3", "step":"50", "type":"number", "min":"50", "max":"19000", "default":"1600"},
		{"property":"dpi4", "group":"mouse", "label":"DPI 4", "step":"50", "type":"number", "min":"50", "max":"19000", "default":"2000"},
		{"property":"dpi5", "group":"mouse", "label":"DPI 5", "step":"50", "type":"number", "min":"50", "max":"19000", "default":"3200"},
		{"property":"pollingrate", "group":"mouse", "label":"Polling Rate", "type":"combobox", "values":["125Hz", "250Hz", "500Hz", "1000Hz"], "default":"500Hz"},
		{"property":"angleSnapping", "group":"mouse", "label":"Angle Snapping", "type":"boolean", "default":"false", "tooltip":"This toggles smoothing of the cursor. Increases smoothness of mouse movement, but decreases accuracy."},
		{"property":"timeout", "group":"", "label":"Led Timeout", "type":"boolean", "default":"true", "tooltip":"This toggles whether the leds will shut off after the Led Timeout Length"},
		{"property":"timeoutlength", "group":"", "label":"Led Timeout Length (Minutes)", "step":"1", "type":"number", "min":"0", "max":"30", "default":"15", "tooltip":"This sets the amount of time in minutes that the mouse is idle before the leds turn off"},
		{"property":"debounce", "group":"mouse", "label":"Debounce (ms)", "step":"1", "type":"number", "min":"0", "max":"10", "default":"10", "tooltip":"This sets how long the mouse waits before it responds to a double click in milliseconds."},
		{"property":"lod", "group":"mouse", "label":"Lift Off Distance", "type":"combobox", "values":["Low", "High"], "default":"Low", "tooltip":"Determines how high the mouse is off of your table before it stops registering movement."},
	];
}

const SettingReport =
[
	0x06, 0xae, 0x00, 0x06, 0x06, 0x1f, 0x02, 0x08, 0x00, 0x10, 0x00, 0x18, 0x00, 0x20, 0x00, 0x48, 0x01, 0x08, 0x00, 0x10, 0x00, 0x18, 0x00, 0x20, 0x00, 0x40, 0x00, 0x00,
	0x00, 0x01, 0x0a, 0x06, 0xff, 0x0f, 0x00, 0x00, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff,
	0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64,
	0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48,
	0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff,
	0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x64, 0x14, 0xff, 0x00, 0x48, 0xff, 0x60, 0x01, 0x64, 0xff, 0xc5, 0x0b, 0xdc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x14, 0x3d
];

const PollingDict =
{
	"125Hz": 0x00,
	"250Hz": 0x01,
	"500Hz": 0x02,
	"1000Hz": 0x03,
};

const vKeys = [
	0,
	1
];
const vLedNames = [
	"Left", "Right"
];
const vLedPositions = [
	[1, 0],
	[2, 0],
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
	sendReportString("0E 06 01 01 00 FF", 6);

	if(DpiControl){
		UpdateSettings();
		SetDebounce();
		SetLiftOffDistance();
	}
}

export function ondpi1Changed() {
	UpdateSettings();
}

export function ondpi2Changed() {
	UpdateSettings();
}

export function ondpi3Changed() {
	UpdateSettings();
}

export function ondpi4Changed() {
	UpdateSettings();
}

export function ondpi5Changed() {
	UpdateSettings();
}

export function onPollingRateChanged() {
	UpdateSettings();
}

export function onanglesnappingChanged() {
	UpdateSettings();
}

export function ontimeoutChanged() {
	UpdateSettings();
}

export function ontimeoutlengthChanged() {
	UpdateSettings();
}

export function ondebounceChanged() {
	SetDebounce();
}

export function onlodChanged() {
	SetLiftOffDistance();
}

function sendReportString(string, size) {
	const packet= [];
	const data = string.split(' ');

	for(let i = 0; i < data.length; i++){
		packet[parseInt(i, 16)] =parseInt(data[i], 16);//.toString(16)
	}

	device.send_report(packet, size);
}

function sendZone(shutdown = false) {
	const packet = [];
	packet[0] = 0x0D;
	packet[1] = 0x0B;

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var col;

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		packet[vKeys[iIdx]*3+2] = col[0];
		packet[vKeys[iIdx]*3+3] = col[1];
		packet[vKeys[iIdx]*3+4] = col[2];
	}

	device.send_report(packet, 11);
	device.pause(1);

}

function SetDebounce() //for some reason this has its own function?
{
	const packet = [];
	packet[0] = 0x11;
	packet[1] = 0x0d;
	packet[2] = debounce;

	packet[19] = debounce+30;

	device.send_report(packet, 20);
	sendReportString("0E 06 01 01 00 FF", 6);

}

function SetLiftOffDistance() //also has its own function?
{
	const packet = [];
	packet[0] = 0x0f;
	packet[1] = 0x06;

	if(lod == "Low") {
	 packet[2] = 0x00;
	}

	if(lod == "High") {
		packet[2] = 0x01;
	}

	device.send_report(packet, 6);
	sendReportString("0E 06 01 00 00 FF", 6);//Software mod

}

function UpdateSettings() {
	SettingReport[7] =    (dpi1/50)%256;
	SettingReport[8] =   Math.floor(dpi1/50/256);
	SettingReport[9] =    (dpi2/50)%256;
	SettingReport[10] =   Math.floor(dpi2/50/256);
	SettingReport[11] =    (dpi3/50)%256;
	SettingReport[12] =   Math.floor(dpi3/50/256);
	SettingReport[13] =    (dpi4/50)%256;
	SettingReport[14] =   Math.floor(dpi4/50/256);
	SettingReport[15] =    (dpi5/50)%256;
	SettingReport[16] =   Math.floor(dpi5/50/256);

	SettingReport[27] = angleSnapping;
	SettingReport[29] = PollingDict[pollingrate];
	SettingReport[34] = (timeout ? 0x00 : 0xff);
	SettingReport[33] = timeoutlength;

	device.send_report(SettingReport, 174);

	sendReportString("0E 06 01 01 00 FF", 6);
}

export function Render() {
	sendZone();
}


export function Shutdown() {
	// Lighting IF
	sendZone(true);
	sendReportString("0E 06 00 00 00 FF", 6);

}


export function Validate(endpoint) {
	return endpoint.interface === 3;
}


export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/roccat/mice/kone-pro.png";
}