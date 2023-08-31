export function Name() { return "ASUS Spatha X Wireless"; }
export function VendorId() { return 0x0B05; }
export function Documentation(){ return "troubleshooting/asus"; }
export function ProductId() { return [0x1979, 0x1977]; }
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
sleepTimeout:readonly
lowPowerPercentage:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"SettingControl", "group":"mouse", "label":"Enable Setting Control", "type":"boolean", "default":"false"},
		{"property":"angleSnapping", "group":"mouse", "label":"Angle snapping", "type":"boolean", "default":"false"},
		{"property":"mousePolling", "group":"mouse", "label":"Polling Rate", "type":"combobox", "values":["125Hz", "250Hz", "500Hz", "1000Hz"], "default":"500Hz"},
		{"property":"sleepTimeout", "group":"mouse", "label":"Sleep Mode Timeout (Minutes)", "type":"combobox", "values":["1", "2", "3", "5", "10", "Never"], "default":"5"},
		{"property":"lowPowerPercentage", "group":"mouse", "label":"Low Battery Warning Percentage", "type":"combobox", "values":["Never", "10%", "15%", "20%", "25%", "30%"], "default":"20%"},
		{"property":"dpi1", "group":"mouse", "label":"DPI 1", "step":"100", "type":"number", "min":"100", "max":"19000", "default":"800"},
		{"property":"dpi2", "group":"mouse", "label":"DPI 2", "step":"100", "type":"number", "min":"100", "max":"19000", "default":"1200"},
		{"property":"dpi3", "group":"mouse", "label":"DPI 3", "step":"100", "type":"number", "min":"100", "max":"19000", "default":"1500"},
		{"property":"dpi4", "group":"mouse", "label":"DPI 4", "step":"100", "type":"number", "min":"100", "max":"19000", "default":"2000"},

	];
}

const pollingDict =
{
	"125Hz"  : 0,
	"250Hz"  : 1,
	"500Hz"  : 2,
	"1000Hz" : 3,
};

const sleepModeDict =
{
	"1" : 0x00,
	"2" : 0x01,
	"3" : 0x02,
	"5" : 0x03,
	"10" : 0x04,
	"Never" : 0xff
};

const lowPowerPercentageDict =
{
	"Never" : 0x00,
	"10%" : 0x0A,
	"15%" : 0x0F,
	"20%" : 0x14,
	"25%" : 0x19,
	"30%" : 0x1E
};

const vKeyNames = [ "Scroll Wheel", "Logo", "Side Zone 1", "Side Zone 2" ];

const vKeyPositions = [ [1, 2], [1, 0], [0, 0], [0, 1] ];

export function LedNames() {
	return vKeyNames;
}

export function LedPositions() {
	return vKeyPositions;
}

export function Initialize() {
	sendMouseSettings();
	sendLightingSettings();
	directLightingMode();
}

export function Render() {
	sendColors();
}

export function Shutdown() {
	sendColors(true);
}

export function ondpi1Changed() {
	sendMouseSettings();
}

export function ondpi2Changed() {
	sendMouseSettings();
}

export function ondpi3Changed() {
	sendMouseSettings();
}

export function ondpi4Changed() {
	sendMouseSettings();
}

export function onmousePollingChanged() {
	sendMouseSettings();
}

export function onangleSnappingChanged() {
	sendMouseSettings();
}

export function onSettingControlChanged() {
	sendMouseSettings();
	sendLightingSettings();
}

function directLightingMode() {
	let packet = [0x00, 0x51, 0x28, 0x03, 0x00, 0x02, 0x64, 0x02]; //Direct Mode
	device.write(packet, 65);
	packet = [0x00, 0x51, 0x29, 0xff]; //Direct Lighting Packets
}

function sendColors(shutdown = false) {
	const RGBData = [];

	for(let iIdx = 0; iIdx < vKeyPositions.length; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		let color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}
		const iLedIdx = (iIdx * 3);
		RGBData[iLedIdx] = color[0];
		RGBData[iLedIdx+1] = color[1];
		RGBData[iLedIdx+2] = color[2];
	}

	const packet = [ 0x00, 0x51, 0x29, 0xff, 0x00, 0x00];
	packet.push(...RGBData);
	device.write(packet, 65);

}

function sendColorsFlash(shutdown = false) {
	for(let iIdx = 0; iIdx < 4; iIdx++) {
		const iPxX = vKeyPositions[iIdx][0];
		const iPxY = vKeyPositions[iIdx][1];
		let col;

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		const packet = [ 0x00, 0x51, 0x28, iIdx, 0x00, 0x00, 0x04, col[0], col[1], col[2] ];
		device.write(packet, 65);
	}

}

function sendMouseSettings() {
	if(SettingControl) {
		device.write([0x00, 0x51, 0x31, 0x06, 0x00, angleSnapping ? 0x01 : 0x00], 65);
		device.write([0x00, 0x51, 0x31, 0x04, 0x00, pollingDict[mousePolling]], 65);
		device.write([0x00, 0x51, 0x31, 0x00, 0x00, (dpi1/100 + 1)], 65);
		device.write([0x00, 0x51, 0x31, 0x01, 0x00, (dpi2/100 + 1)], 65);
		device.write([0x00, 0x51, 0x31, 0x02, 0x00, (dpi3/100 + 1)], 65);
		device.write([0x00, 0x51, 0x31, 0x03, 0x00, (dpi4/100 + 1)], 65);
		device.write([0x00, 0x50, 0x03, 0x03], 65);
	}
}

function sendLightingSettings() {
	if(SettingControl) {
		const lightingSettingsPacket = [0x00, 0x51, 0x37, 0x00, 0x00, sleepModeDict[sleepTimeout], 0x00, lowPowerPercentageDict[lowPowerPercentage]];
		device.write(lightingSettingsPacket, 65);

		const applyPacket = [0x00, 0x50, 0x03];
		device.write(applyPacket, 65);
	}
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
	return "https://marketplace.signalrgb.com/devices/brands/asus/mice/spatha-x.png";
}