export function Name() { return "Asus Mouse"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return Object.keys(ASUSdeviceLibrary.PIDLibrary); }
export function Publisher() { return "WhirlwindFx"; }
export function Documentation(){ return "troubleshooting/asus"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 1.0;}
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
	];
}

let savedPollTimer = Date.now();
const PollModeInternal = 15000;

export function Initialize() {
	ASUS.InitializeASUS();
}

export function Render() {
	ASUS.getDeviceBatteryStatus();
	ASUS.sendColors();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		ASUS.sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		ASUS.sendColors(shutdownColor);
	}

}

export class ASUS_Mouse_Protocol {
	constructor() {
		this.Config = {
			DeviceProductID: 0x0000,
			DeviceName: "Asus Mouse",
			DeviceEndpoint: { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
			DeviceProtocol: "Legacy",
			LedNames: [],
			LedPositions: [],
			SupportedFeatures:
			{
				AngleSnapSupport: false,
				PollingRateSupport: false,
				BatterySupport: false,
				SleepTimeoutSupport: false,
				LowPowerPercentage: false,
			}
		};
	}

	getDeviceProperties(deviceName) { return ASUSdeviceLibrary.LEDLibrary[deviceName];};

	getDeviceProductId() { return this.Config.DeviceProductID; }
	setDeviceProductId(productID) { this.Config.DeviceProductID = productID; }

	getDeviceName() { return this.Config.DeviceName; }
	setDeviceName(deviceName) { this.Config.DeviceName = deviceName; }

	getDeviceEndpoint() { return this.Config.DeviceEndpoint; }
	setDeviceEndpoint(deviceEndpoint) { this.Config.DeviceEndpoint = deviceEndpoint; }

	getDeviceProtocol() { return this.Config.DeviceProtocol; }
	setDeviceProtocol(deviceProtocol) { this.Config.DeviceProtocol = deviceProtocol; }

	getLedNames() { return this.Config.LedNames; }
	setLedNames(ledNames) { this.Config.LedNames = ledNames; }

	getLedPositions() { return this.Config.LedPositions; }
	setLedPositions(ledPositions) { this.Config.LedPositions = ledPositions; }

	getBatteryFeature() { return this.Config.SupportedFeatures.BatterySupport; }
	setBatteryFeature(battery) { this.Config.SupportedFeatures.BatterySupport = battery; }

	getAngleSnapFeature() { return this.Config.SupportedFeatures.AngleSnapSupport; }
	setAngleSnapFeature(angleSnapping) { this.Config.SupportedFeatures.AngleSnapSupport = angleSnapping; }

	getPollingFeature() { return this.Config.SupportedFeatures.PollingRateSupport; }
	setPollingFeature(polling) { this.Config.SupportedFeatures.PollingRateSupport = polling; }

	getSleepFeature() { return this.Config.SupportedFeatures.SleepTimeoutSupport; }
	setSleepFeature(sleep) { this.Config.SupportedFeatures.SleepTimeoutSupport = sleep; }

	getLowPowerFeature() { return this.Config.SupportedFeatures.LowPowerPercentage; }
	setLowPowerFeature(lowPower) { this.Config.SupportedFeatures.LowPowerPercentage = lowPower; }

	getDeviceImage(deviceName) { return ASUSdeviceLibrary.imageLibrary[deviceName]; }

	InitializeASUS() {
		//Initializing vars
		this.setDeviceProductId(device.productId());
		this.setDeviceName(ASUSdeviceLibrary.PIDLibrary[this.getDeviceProductId()]);

		const DeviceProperties = this.getDeviceProperties(this.getDeviceName());
		this.setDeviceEndpoint(DeviceProperties.endpoint);
		this.setDeviceProtocol(DeviceProperties.protocol);
		this.setLedNames(DeviceProperties.vLedNames);
		this.setLedPositions(DeviceProperties.vLedPositions);

		if(DeviceProperties.protocol === "Modern"){
			this.setAngleSnapFeature(true);
			this.setPollingFeature(true);

			device.addProperty({"property":"SettingControl", "group":"mouse", "label":"Enable Setting Control", "type":"boolean", "default" :"false"});
			device.addProperty({"property":"angleSnapping", "group":"mouse", "label":"Angle snapping", "type":"boolean", "default":"false"});
			device.addProperty({"property":"mousePolling", "group":"mouse", "label":"Polling Rate", "type":"combobox", "values":["125Hz", "250Hz", "500Hz", "1000Hz"], "default":"500Hz"});
			device.addProperty({"property":"dpi1", "group":"mouse", "label":"DPI 1", "step":"100", "type":"number", "min":"100", "max": DeviceProperties.maxDPI, "default": "800", "live" : false});
			device.addProperty({"property":"dpi2", "group":"mouse", "label":"DPI 2", "step":"100", "type":"number", "min":"100", "max": DeviceProperties.maxDPI, "default":"1200", "live" : false});
			device.addProperty({"property":"dpi3", "group":"mouse", "label":"DPI 3", "step":"100", "type":"number", "min":"100", "max": DeviceProperties.maxDPI, "default":"1500", "live" : false});
			device.addProperty({"property":"dpi4", "group":"mouse", "label":"DPI 4", "step":"100", "type":"number", "min":"100", "max": DeviceProperties.maxDPI, "default":"2000", "live" : false});

			this.modernDirectLightingMode();
			this.sendAllMouseSettings();
			console.log("This is a Modern device");

			if(DeviceProperties.battery){
				this.setBatteryFeature(true);
				this.setSleepFeature(true);
				this.setLowPowerFeature(true);

				device.addFeature("battery");
				console.log("Device has a battery and it's wireless");
				device.addProperty({"property":"sleepTimeout", "group":"mouse", "label":"Sleep Mode Timeout (Minutes)", "type":"combobox", "values":["1", "2", "3", "5", "10", "Never"], "default":"5"});
				device.addProperty({"property":"lowPowerPercentage", "group":"mouse", "label":"Low Battery Warning Percentage", "type":"combobox", "values":["Never", "10%", "15%", "20%", "25%", "30%"], "default":"20%"});

				this.sendLightingSettings();
				this.modernFetchBatteryLevel();
			}
		}else {
			console.log("This is a Legacy device");
		}

		device.log(`Device model found: ` + this.getDeviceName());
		device.setName("ASUS " + this.getDeviceName());
		device.setSize(DeviceProperties.size);
		device.setControllableLeds(this.getLedNames(), this.getLedPositions());
		device.setImageFromUrl(this.getDeviceImage(this.getDeviceName()));
		device.set_endpoint(DeviceProperties.endpoint[`interface`], DeviceProperties.endpoint[`usage`], DeviceProperties.endpoint[`usage_page`], DeviceProperties.endpoint[`collection`]);

	}

	modernDirectLightingMode() {
		const packet = [0x00, 0x51, 0x28, 0x03, 0x00, 0x02, 0x64, 0x02]; //Direct Mode
		device.write(packet, 65);
	}

	sendColors(overrideColor) {

		switch (this.getDeviceProtocol()) {
		case "Legacy":
			this.sendColorsLegacy(overrideColor);
			break;
		case "ChakramX":
			this.sendColorsChakramX(overrideColor);
			break;
		case "Modern":
			this.sendColorsModern(overrideColor);
			break;
		default:
			this.sendColorsLegacy(overrideColor);
			break;
		}

	}

	sendColorsLegacy(overrideColor) {

		const deviceLeds = this.getLedPositions();

		for (let iIdx = 0; iIdx < deviceLeds.length; iIdx++) {
			const iPxX = deviceLeds[iIdx][0];
			const iPxY = deviceLeds[iIdx][1];
			let color;

			if(overrideColor){
				color = hexToRgb(overrideColor);
			}else if (LightingMode === "Forced") {
				color = hexToRgb(forcedColor);
			}else{
				color = device.color(iPxX, iPxY);
			}

			const packet = [0x00, 0x51, 0x28, iIdx, 0x00, 0x00, 0x04, color[0], color[1], color[2]];
			device.write(packet, 65);
		}

	}

	sendColorsModern(overrideColor) {

		const deviceLeds = this.getLedPositions();
		console.log(deviceLeds);

		const RGBData = [];

		for(let iIdx = 0; iIdx < deviceLeds.length; iIdx++) {
			const iPxX = deviceLeds[iIdx][0];
			const iPxY = deviceLeds[iIdx][1];
			let color;

			if(overrideColor) {
				color = hexToRgb(overrideColor);
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

		const packet = [0x00, 0x51, 0x29, 0xff, 0x00, 0x00];
		packet.push(...RGBData);
		device.write(packet, 65);

	}

	sendColorsChakramX(overrideColor) {

		const deviceLeds = this.getLedPositions();
		const RGBData = [];

		for(let iIdx = 0; iIdx < deviceLeds.length; iIdx++) {
			const iPxX = deviceLeds[iIdx][0];
			const iPxY = deviceLeds[iIdx][1];
			let color;

			if(overrideColor) {
				color = hexToRgb(overrideColor);
			} else if (LightingMode === "Forced") {
				color = hexToRgb(forcedColor);
			} else {
				color = device.color(iPxX, iPxY);
			}

			const iLedIdx 		= (iIdx * 3);
			RGBData[iLedIdx] 	= color[0];
			RGBData[iLedIdx+1] 	= color[1];
			RGBData[iLedIdx+2] 	= color[2];

		}

		[[4, 5], [5, 0]].forEach(zones => {
			const packet = [0x00, 0x51, 0x29, zones[0], 0x00, zones[1]];
			packet.push(...RGBData);
			device.write(packet, 65);
		});

	}

	getDeviceBatteryStatus() {

		if(this.getBatteryFeature()){
			if (Date.now() - savedPollTimer < PollModeInternal) {
				return;
			}

			console.log("Device has battery, polling info...");
			savedPollTimer = Date.now();

			this.modernFetchBatteryLevel();
		}

	}

	modernFetchBatteryLevel() {
		device.clearReadBuffer();
		device.write([0x00, 0x12, 0x07], 65);

		const returnPacket = device.read([0x00, 0x12, 0x07], 65);

		const batteryState = returnPacket[4];
		const batteryLevel = returnPacket[5];

		battery.setBatteryLevel(batteryLevel);
		battery.setBatteryState(batteryState + 1);
	}

	sendMouseSetting(setting) {
		if(SettingControl) {
			console.log("Changing mouse property: " + setting);

			switch (setting) {
			case 0:
				device.write([0x00, 0x51, 0x31, 0x00, 0x00, (dpi1/100 + 1)], 65);
				device.write([0x00, 0x50, 0x03, 0x03], 65);
				break;
			case 1:
				device.write([0x00, 0x51, 0x31, 0x01, 0x00, (dpi2/100 + 1)], 65);
				device.write([0x00, 0x50, 0x03, 0x03], 65);
				break;
			case 2:
				device.write([0x00, 0x51, 0x31, 0x02, 0x00, (dpi3/100 + 1)], 65);
				device.write([0x00, 0x50, 0x03, 0x03], 65);
				break;
			case 3:
				device.write([0x00, 0x51, 0x31, 0x03, 0x00, (dpi4/100 + 1)], 65);
				device.write([0x00, 0x50, 0x03, 0x03], 65);
				break;
			case 4:
				device.write([0x00, 0x51, 0x31, 0x04, 0x00, ASUSdeviceLibrary.pollingDict[mousePolling]], 65);
				device.write([0x00, 0x50, 0x03, 0x03], 65);
				break;
			case 6:
				device.write([0x00, 0x51, 0x31, 0x06, 0x00, angleSnapping ? 0x01 : 0x00], 65);
				device.write([0x00, 0x50, 0x03, 0x03], 65);
				break;
			default:
				console.log("Not a valid mouse setting: " + setting);
				break;
			}

		}
	}

	sendAllMouseSettings() {
		if(SettingControl) {
			device.write([0x00, 0x51, 0x31, 0x06, 0x00, angleSnapping ? 0x01 : 0x00], 65);
			device.write([0x00, 0x51, 0x31, 0x04, 0x00, ASUSdeviceLibrary.pollingDict[mousePolling]], 65);
			device.write([0x00, 0x51, 0x31, 0x00, 0x00, (dpi1/100 + 1)], 65);
			device.write([0x00, 0x51, 0x31, 0x01, 0x00, (dpi2/100 + 1)], 65);
			device.write([0x00, 0x51, 0x31, 0x02, 0x00, (dpi3/100 + 1)], 65);
			device.write([0x00, 0x51, 0x31, 0x03, 0x00, (dpi4/100 + 1)], 65);
			device.write([0x00, 0x50, 0x03, 0x03], 65);
		}
	}

	sendLightingSettings() {
		if(SettingControl) {
			const lightingSettingsPacket = [0x00, 0x51, 0x37, 0x00, 0x00, ASUSdeviceLibrary.sleepModeDict[sleepTimeout], 0x00, ASUSdeviceLibrary.lowPowerPercentageDict[lowPowerPercentage]];
			device.write(lightingSettingsPacket, 65);

			const applyPacket = [0x00, 0x50, 0x03];
			device.write(applyPacket, 65);
		}
	}

}

export class deviceLibrary {
	constructor(){
		this.PIDLibrary	=	{
			0x1958: "Chakram Core",
			0x18E3: "Chakram Wireless", // Wired Mode
			0x18E5: "Chakram Wireless",
			0x1A1A: "Chakram X",
			0x18DD: "Gladius II Core",
			0x1877: "Gladius II Origin",
			0x1845: "Gladius II Origin",
			0x189E: "Gladius II Wireless", // Wired Mode
			0x18A0: "Gladius II Wireless",
			0x197D: "Gladius III Wireless", // Wired mode
			0x197F: "Gladius III Wireless",
			0x1A72: "Gladius III Aimpoint",
			0x1A70: "Gladius III Aimpoint",
			0x18E1: "Impact II",
			0x19D2: "Impact II",
			0x1956: "Impact II Electro Punk",
			0x1947: "Impact II Wireless",
			0x1949: "Impact II Wireless",
			0x195C: "ROG Keris",
			0x1960: "ROG Keris",
			0x195E: "ROG Keris",
			0x1A59: "ROG Keris",
			0x1846: "Pugio I",
			0x1906: "Pugio II",
			0x181C: "Spatha",
			0x1979: "Spatha X Wireless",
			0x1977: "Spatha X Wireless"
		};

		this.LEDLibrary	=	{
			"Chakram Core":
			{
				size: [5, 5],
				vLedNames: ["Scroll Wheel", "Logo"],
				vLedPositions: [[1, 4], [1, 1]],
				maxDPI: 16000,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 }, // NEED CONFIRM
				protocol: "Legacy",
			},
			"Chakram Wireless":
			{
				size: [5, 5],
				vLedNames: ["Scroll Wheel", "Logo", "Front Zone"],
				vLedPositions: [[1, 4], [1, 1], [1, 0]],
				maxDPI: 16000,
				battery: true,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 }, // NEED CONFIRM
				protocol: "Legacy",

			},
			"Chakram X":
			{
				size: [3, 4],
				vLedNames: ["Scroll Wheel", "Logo", "Front Zone", "Front Zone 2", "Front Zone 3"],
				vLedPositions: [[1, 1], [1, 3], [0, 0], [1, 0], [2, 0]],
				maxDPI: 36000,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 }, // NEED CONFIRM
				protocol: "ChakramX",

			},
			"Gladius II Core":
			{
				size: [7, 8],
				vLedNames: ["Logo", "Scroll Wheel"],
				vLedPositions: [[3, 5], [3, 0]],
				maxDPI: 6200,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 }, // NEED CONFIRM
				protocol: "Legacy",

			},
			"Gladius II Origin":
			{
				size: [7, 8],
				vLedNames: ["Scroll Wheel", "Logo", "Underglow"],
				vLedPositions: [[3, 0], [3, 5], [3, 6]],
				maxDPI: 12000,
				endpoint : { "interface": 2, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
				protocol: "Legacy",

			},
			"Gladius II Wireless":
			{
				size: [3, 3],
				vLedNames: ["Scroll Wheel", "Logo"],
				vLedPositions: [[1, 2], [1, 0]],
				maxDPI: 16000,
				battery: true,
				endpoint: 1,
				protocol: "Legacy",

			},
			"Gladius III Wireless":
			{
				size: [3, 3],
				vLedNames: ["Scroll Wheel", "Logo", "Side Zone 1"],
				vLedPositions: [[1, 2], [1, 0], [0, 0]],
				maxDPI: 19000,
				battery: true,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
				protocol: "Modern",

			},
			"Gladius III Aimpoint":
			{
				size: [3, 3],
				vLedNames: [ "Logo" ],
				vLedPositions: [[1, 0]],
				maxDPI: 36000,
				battery: true,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
				protocol: "Modern",
			},
			"Impact II":
			{
				size: [3, 3],
				vLedNames: ["Scroll Wheel", "Logo"],
				vLedPositions: [[1, 2], [1, 0]],
				maxDPI: 6200,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 }, // NEED CONFIRM
				protocol: "Legacy",

			},
			"Impact II Electro Punk": //This is highly suspicious. Why does this have an extra zone?
			{
				size: [3, 3],
				vLedNames: ["Scroll Wheel", "Logo", "Underglow"],
				vLedPositions: [[1, 1], [1, 2], [1, 0]],
				maxDPI: 6200,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 }, // NEED CONFIRM
				protocol: "Legacy",

			},
			"Impact II Wireless":
			{
				size: [3, 3],
				vLedNames: ["Scroll Wheel", "Logo"],
				vLedPositions: [[1, 2], [1, 0]],
				maxDPI: 16000,
				battery: true,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 }, // NEED CONFIRM
				protocol: "Legacy",

			},
			"ROG Keris":
			{
				size: [7, 8],
				vLedNames: ["Logo", "Scroll Wheel"],
				vLedPositions: [[3, 5], [3, 0]],
				maxDPI: 16000,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
				protocol: "Legacy",
			},
			"Pugio I":
			{
				size: [7, 8],
				vLedNames: ["Scroll Wheel", "Logo", "Underglow"],
				vLedPositions: [[3, 0], [3, 5], [3, 6]],
				maxDPI: 7200,
				endpoint : { "interface": 2, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
				protocol: "Legacy",

			},
			"Pugio II":
			{
				size: [7, 8],
				vLedNames: ["Logo", "Scroll Wheel", "Underglow"],
				vLedPositions: [[3, 5], [3, 0], [3, 6]],
				maxDPI: 16000,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
				protocol: "Legacy",

			},
			"Spatha":
			{
				size: [3, 3],
				vLedNames: ["Scroll Wheel", "Logo", "Side Zone 1", "Side Zone 2"],
				vLedPositions: [[1, 2], [1, 0], [0, 0], [0, 1]],
				maxDPI: 16000,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
				protocol: "Legacy",
			},
			"Spatha X Wireless":
			{
				size: [3, 3],
				vLedNames: ["Scroll Wheel", "Logo", "Side Zone 1", "Side Zone 2"],
				vLedPositions: [[1, 2], [1, 0], [0, 0], [0, 1]],
				maxDPI: 19000,
				battery: true,
				endpoint : { "interface": 0, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
				protocol: "Modern",
			},
		};

		this.imageLibrary = {
			"Chakram Core": 		"https://marketplace.signalrgb.com/devices/brands/asus/mice/chakram-standard.png",
			"Chakram Wireless": 	"https://marketplace.signalrgb.com/devices/brands/asus/mice/chakram-wireless.png",
			"Chakram X": 			"https://marketplace.signalrgb.com/devices/brands/asus/mice/chakram-wireless.png",
			"Gladius II Core": 		"https://marketplace.signalrgb.com/devices/brands/asus/mice/gladius-ii-core.png",
			"Gladius II Origin": 	"https://marketplace.signalrgb.com/devices/brands/asus/mice/gladius-ii-origin.png",
			"Gladius II Wireless": 	"https://marketplace.signalrgb.com/devices/brands/asus/mice/gladius-ii-wireless.png",
			"Gladius III Wireless": "https://marketplace.signalrgb.com/devices/brands/asus/mice/gladius-ii-wireless.png",
			"Gladius III Aimpoint": "https://marketplace.signalrgb.com/devices/brands/asus/mice/gladius-iii-aimpoint.png",
			"Impact II": 			"https://marketplace.signalrgb.com/devices/brands/asus/mice/impact-ii-standard.png",
			"Impact II Electro Punk": "https://marketplace.signalrgb.com/devices/brands/asus/mice/impact-ii-electropunk.png",
			"Impact II Wireless": 	"https://marketplace.signalrgb.com/devices/brands/asus/mice/impact-ii-wireless.png",
			"ROG Keris": 			"https://marketplace.signalrgb.com/devices/brands/asus/mice/keris-wireless.png",
			"Pugio I": 				"https://marketplace.signalrgb.com/devices/brands/asus/mice/pugio-ii.png",
			"Pugio II": 			"https://marketplace.signalrgb.com/devices/brands/asus/mice/pugio-ii.png",
			"Spatha X Wireless": 	"https://marketplace.signalrgb.com/devices/brands/asus/mice/spatha-x.png"
		};

		this.pollingDict =
		{
			"125Hz"  : 0,
			"250Hz"  : 1,
			"500Hz"  : 2,
			"1000Hz" : 3,
		};

		this.sleepModeDict =
		{
			"1" : 0x00,
			"2" : 0x01,
			"3" : 0x02,
			"5" : 0x03,
			"10" : 0x04,
			"Never" : 0xff
		};

		this.lowPowerPercentageDict =
		{
			"Never" : 0x00,
			"10%" : 0x0A,
			"15%" : 0x0F,
			"20%" : 0x14,
			"25%" : 0x19,
			"30%" : 0x1E
		};
	}
}

const ASUSdeviceLibrary = new deviceLibrary();
const ASUS = new ASUS_Mouse_Protocol();

export function ondpi1Changed() {
	ASUS.sendMouseSetting(0);
}

export function ondpi2Changed() {
	ASUS.sendMouseSetting(1);
}

export function ondpi3Changed() {
	ASUS.sendMouseSetting(2);
}

export function ondpi4Changed() {
	ASUS.sendMouseSetting(3);
}

export function onmousePollingChanged() {
	ASUS.sendMouseSetting(4);
}

export function onangleSnappingChanged() {
	ASUS.sendMouseSetting(6);
}

export function onSettingControlChanged() {
	ASUS.sendAllMouseSettings();
	ASUS.sendLightingSettings();
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
	return endpoint.interface === 0 || endpoint.interface === 1 || endpoint.interface === 2;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/asus/mice/chakram-standard.png";
}
