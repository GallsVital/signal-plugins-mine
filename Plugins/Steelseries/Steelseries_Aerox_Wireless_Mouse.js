export function Name() { return "SteelSeries Aerox Mouse"; }
export function VendorId() { return 0x1038; }
export function Documentation(){ return "troubleshooting/steelseries"; }
export function ProductId() { return Object.keys(Aerox.deviceDictionary); }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
smartIllumination:readonly
highEfficiencyMode:readonly
settingControl:readonly
dpiStages:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
dpi5:readonly
sleepTimeout:readonly
dimTimeout:readonly
pollingRate:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"settingControl", "group":"mouse", "label":"Enable Setting Control", "type":"boolean", "default":"false"},
		{"property":"dpiStages", "group":"mouse", "label":"Number of DPI Stages", "step":"1", "type":"number", "min":"1", "max":"5", "default":"5"},
		{"property":"dpi1", "group":"mouse", "label":"DPI 1", "step":"50", "type":"number", "min":"200", "max":"18000", "default":"800", "live" : "false"},
		{"property":"dpi2", "group":"mouse", "label":"DPI 2", "step":"50", "type":"number", "min":"200", "max":"18000", "default":"1200", "live" : "false"},
		{"property":"dpi3", "group":"mouse", "label":"DPI 3", "step":"50", "type":"number", "min":"200", "max":"18000", "default":"2400", "live" : "false"},
		{"property":"dpi4", "group":"mouse", "label":"DPI 4", "step":"50", "type":"number", "min":"200", "max":"18000", "default":"3200", "live" : "false"},
		{"property":"dpi5", "group":"mouse", "label":"DPI 5", "step":"50", "type":"number", "min":"200", "max":"18000", "default":"4800", "live" : "false"},
		{"property":"smartIllumination", "group":"lighting", "label":"Enable Smart Illumination", "type":"boolean", "default":"false", "tooltip":"Smart Illumination Turns Off Lighting When the Mouse is in Motion to Preserve Battery."},
		{"property":"highEfficiencyMode", "group":"lighting", "label":"Enable High Efficiency Mode", "type":"boolean", "default":"false", "tooltip":"High Efficiency Mode lowers Polling Rate, Enables Smart Illumination, and lowers the Light Dim Timer to Preserve Battery."},
		{"property":"sleepTimeout", "group":"mouse", "label":"Sleep Timeout (Minutes)", "step":"1", "type":"number", "min":"0", "max":"20", "default":"10"},
		{"property":"dimTimeout", "group":"mouse", "label":"Dim Timeout (Minutes)", "step":"1", "type":"number", "min":"0", "max":"20", "default":"10"},
		{"property":"pollingRate", "group":"mouse", "label":"Polling Rate", "type":"combobox", "values":[ "1000", "500", "250", "125" ], "default":"1000"},
	]; //This mouse does really unreliable things and needs some more love/investigation.
}

const vLedNames = [ "Front Zone", "Mid Zone", "Rear Zone" ];

const vLedPositions = [ [1, 0], [1, 1], [1, 2] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.set_endpoint(3, 0x0001, 0xffc0);
	device.addFeature("battery");
	device.setName(Aerox.deviceDictionary[device.productId()]);
	getDeviceBatteryStatus();

	if(settingControl) {
		Aerox.setDPI(dpiStages);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}

}

export function Render() {
	SendColorPacket();
	getDeviceBatteryStatus();
}

export function Shutdown() {
	SendColorPacket(true);
}

export function onsettingControlChanged() {
	if(settingControl) {
		Aerox.setDPI(dpiStages);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function ondpiStagesChanged() {
	if(settingControl) {
		Aerox.setDPI(dpiStages);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function ondpi1Changed() {
	if(settingControl) {
		Aerox.setDPI(dpiStages, 1);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function ondpi2Changed() {
	if(settingControl) {
		Aerox.setDPI(dpiStages, 2);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function ondpi3Changed() {
	if(settingControl) {
		Aerox.setDPI(dpiStages, 3);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}
export function ondpi4Changed() {
	if(settingControl) {
		Aerox.setDPI(dpiStages, 4);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function ondpi5Changed() {
	if(settingControl) {
		Aerox.setDPI(dpiStages, 5);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function onpollingRateChanged() {
	if(settingControl) {
		Aerox.setDPI(dpiStages);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function onsleepTimeoutChanged() {
	if(settingControl) {
		Aerox.setDPI(dpiStages);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function ondimTimeoutChanged() {
	if(settingControl) {
		Aerox.setDPI(dpiStages);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function onsmartIlluminationChanged() {
	if(settingControl) {
		Aerox.setDPI(dpiStages);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

export function onhighEfficiencyModeChanged() {
	if(settingControl) {
		Aerox.setDPI(dpiStages);
		Aerox.setSleepTimeout(sleepTimeout);
		Aerox.setHighEfficiencyMode(highEfficiencyMode);
	}
}

const PollModeInternal = 15000;
let savedPollTimer = Date.now();

function getDeviceBatteryStatus() {
	if (Date.now() - savedPollTimer < PollModeInternal) {
		return;
	}

	savedPollTimer = Date.now();

	Aerox.getBatteryInfo();
}

function SendColorPacket(shutdown = false) {
	for(let iIdx = 0; iIdx < 3; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];

		let color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}

		device.write([0x00, 0x61, 0x01, iIdx, color[0], color[1], color[2]], 65);

		const returnPacket = device.read([0x00, 0x61, 0x01, iIdx, color[0], color[1], color[2]], 65);

		if(returnPacket[1] === 0x40) { device.log("No connection?"); device.pause(1000); }

		device.pause(1);
	}

	device.pause(10);
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
	return endpoint.interface === 3;
}

class AeroxMouse {
	constructor() {
		this.pollingDict =
		{
			"125" : 0x03,
			"250" : 0x02,
			"500" : 0x01,
			"1000" : 0x00,
		};

		this.deviceDictionary = {
			0x1838 : "Steelseries Aerox 3", //These are all wireless Mice. The Wired Only Mice need a separate file.
			0x183A : "Steelseries Aerox 3",
			0x1852 : "Steelseries Aerox 5",
			0x1854 : "Steelseries Aerox 5",
			0x1860 : "Steelseries Aerox 5 Diablo IV Edition",
			0x233a : "Steelseries Aerox 5 Diablo IV Edition",
			0x1858 : "Steelseries Aerox 9",
			0x185A : "Steelseries Aerox 9"
		};
	}

	getBatteryInfo() {
		device.clearReadBuffer();

		device.write([0x00, 0xD2], 65);
		device.pause(1);

		const returnpacket = device.read([0x00, 0xD2], 65, 10);

		const batteryPercentage = ((returnpacket[2] & ~0b10000000) - 1) * 5;

		device.log(batteryPercentage);

		const batteryState = (returnpacket[2] & 0b10000000) === 128;
		device.log(`Battery Charging State ${batteryState}`);

		battery.setBatteryLevel(batteryPercentage);
		battery.setBatteryState(batteryState+1);
	}

	setPollingRate(pollingRate) {
		device.write([0x00, 0x6b, this.pollingDict[pollingRate]], 65);
		device.read([0x00, 0x6b, this.pollingDict[pollingRate]], 65);
		device.pause(20);
	}

	setDPI(dpiStages, currentStage = 1) {
		const packet = [0x00, 0x6D, dpiStages, currentStage, (dpi1/100), (dpi2/100), (dpi3/100), (dpi4/100), (dpi5/100)]; //5 is number of stage
		device.write(packet, 65);
		device.read(packet, 65);
		device.pause(20);
	}

	setSleepTimeout(sleepTimeout) {
		const DeviceSleepTimeout = sleepTimeout * 60 * 1000;
		const byte1 = DeviceSleepTimeout >> 16 & 0xFF;
		const byte2 = DeviceSleepTimeout & 0xFF;
		const byte3 = DeviceSleepTimeout >> 8 & 0xFF;
		const packet = [0x00, 0x69, byte1, byte2, byte3];
		device.write(packet, 65);
		device.read(packet, 65);
		device.pause(20);
	}

	setHighEfficiencyMode(highEfficiencyMode) {
		const packet = [0x00, 0x68, highEfficiencyMode]; //0x00 for off
		device.write(packet, 65);
		device.read(packet, 65);
		this.setLightDimTimer(highEfficiencyMode ? 0x00 : dimTimeout, highEfficiencyMode ? highEfficiencyMode : smartIllumination);
		this.setPollingRate(highEfficiencyMode ? 0x03 : this.pollingDict[pollingRate]);
		device.pause(20);
	}

	setLightDimTimer(dimTimeout, smartIllumination = false) {
		const DeviceDimTimeout = dimTimeout * 60 * 1000;
		const byte1 = DeviceDimTimeout >> 16 & 0xFF;
		const byte2 = DeviceDimTimeout & 0xFF;
		const byte3 = DeviceDimTimeout >> 8 & 0xFF;

		device.write([0x00, 0x63, 0x0f, 0x01, smartIllumination, 0x00, byte1, byte2, byte3], 65);
		device.read([0x00, 0x63, 0x0f, 0x01, smartIllumination, 0x00, byte1, byte2, byte3], 65);
		device.pause(20);
	}

	Apply() {
		const packet = [0x00, 0x51];
		device.write(packet, 65);
		device.read(packet, 65);
	}
}

const Aerox = new AeroxMouse();

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/default/mouse.png";
}