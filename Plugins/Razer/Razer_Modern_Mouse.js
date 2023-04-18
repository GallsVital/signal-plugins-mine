export function Name() { return "Razer Mouse"; }
export function VendorId() { return 0x1532; }
export function Documentation() { return "troubleshooting/razer"; }
export function ProductId() { return Object.keys(razerDeviceLibrary.PIDLibrary); }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function Type() { return "Hid"; }
export function DefaultPosition() { return [225, 120]; }
export function DefaultScale() { return 15.0; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
SettingControl:readonly
DPIRollover:readonly
OnboardDPI:readonly
dpiStages:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
dpi5:readonly
dpi6:readonly
pollingRate:readonly
liftOffDistance:readonly
asymmetricLOD:readonly
ScrollMode:readonly
ScrollAccel:readonly
SmartReel:readonly
idleTimeout:readonly
lowPowerPercentage:readonly
*/
export function ControllableParameters() {
	const DeviceInfo = razerDeviceLibrary.LEDLibrary[razerDeviceLibrary.PIDLibrary[device.productId()]];

	const UserProps = [
		{ "property": "shutdownColor", "group": "lighting", "label": "Shutdown Color", "min": "0", "max": "360", "type": "color", "default": "009bde" },
		{ "property": "LightingMode", "group": "lighting", "label": "Lighting Mode", "type": "combobox", "values": ["Canvas", "Forced"], "default": "Canvas" },
		{ "property": "forcedColor", "group": "lighting", "label": "Forced Color", "min": "0", "max": "360", "type": "color", "default": "#009bde" },
		{ "property": "SettingControl", "group": "mouse", "label": "Enable Setting Control", "type": "boolean", "default": "false", "tooltip":"Enable SignalRGB control of device settings." },
		{ "property": "DPIRollover", "group": "mouse", "label": "DPI Stage Rollover", "type": "boolean", "default": "true", "tooltip":"Make the DPI Stage rollover to the lowest when cycling the highest stage and vice versa." },
		{ "property": "OnboardDPI", "group": "mouse", "label": "Save DPI to Onboard Storage", "type": "boolean", "default": "false", "tooltip":"Make DPI settings persist when SignalRGB is closed." },
		{ "property": "dpiStages", "group": "mouse", "label": "Number of DPI Stages", "step": "1", "type": "number", "min": "1", "max": "5", "default": "5" },
		{ "property": "dpi1", "group": "mouse", "label": "DPI 1", "step": "50", "type": "number", "min": "200", "max": DeviceInfo.maxDPI, "default": "400" },
		{ "property": "dpi2", "group": "mouse", "label": "DPI 2", "step": "50", "type": "number", "min": "200", "max": DeviceInfo.maxDPI, "default": "800" },
		{ "property": "dpi3", "group": "mouse", "label": "DPI 3", "step": "50", "type": "number", "min": "200", "max": DeviceInfo.maxDPI, "default": "1200" },
		{ "property": "dpi4", "group": "mouse", "label": "DPI 4", "step": "50", "type": "number", "min": "200", "max": DeviceInfo.maxDPI, "default": "1600" },
		{ "property": "dpi5", "group": "mouse", "label": "DPI 5", "step": "50", "type": "number", "min": "200", "max": DeviceInfo.maxDPI, "default": "2000" },
		{ "property": "dpi6", "group": "mouse", "label": "Sniper Button DPI", "step": "50", "type": "number", "min": "200", "max": DeviceInfo.maxDPI, "default": "200" },
		{ "property": "pollingRate", "group": "mouse", "label": "Polling Rate", "type": "combobox", "values": ["1000", "500", "125"], "default": "1000" },
		{ "property": "liftOffDistance", "group": "mouse", "label": "Lift Off Distance (MM)", "step": "1", "type": "number", "min": "1", "max": "3", "default": "1" },
		{ "property": "asymmetricLOD", "group": "mouse", "label": "Asymmetric Lift Off Distance", "type": "boolean", "default": "false" },
	];

	if (DeviceInfo.wireless) {
		UserProps.push(...[
			{ "property": "idleTimeout", "group": "", "label": "Device Idle Timeout Length (S)", "step": "15", "type": "number", "min": "60", "max": "900", "default": "60" }, //This may need to be switched over to a combobox.
			{ "property": "lowPowerPercentage", "group": "", "label": "Device Low Power Mode Percentage", "step": "1", "type": "number", "min": "1", "max": "100", "default": "15" },
		]);
	}

	if (DeviceInfo.hyperscrollWheel) {
		UserProps.push(...[
			{ "property": "ScrollMode", "group": "mouse", "label": "Freespin Scrolling", "type": "boolean", "default": "false" },
			{ "property": "ScrollAccel", "group": "mouse", "label": "Scroll Acceleration", "type": "boolean", "default": "true" },
			{ "property": "SmartReel", "group": "mouse", "label": "Smart-Reel", "type": "boolean", "default": "false" },
		]);
	}

	return UserProps;
}

let vLedNames = [];
let vLedPositions = [];
let savedPollTimer = Date.now();
const PollModeInternal = 15000;
let macroTracker;

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	deviceInitialization();
}

export function Render() {

	detectInputs();

	if (!Razer.Config.deviceSleepStatus) {
		grabColors();
		getDeviceBatteryStatus();
	}

}

export function Shutdown() {
	grabColors(true);
	//Razer.setModernMatrixEffect([0x00, 0x00, 0x03]); //Hardware mode baby.
	RazerMouse.setDeviceDPIToHardware();
	Razer.setDeviceMode("Hardware Mode");
}

export function onSettingControlChanged() {
	if (SettingControl) {
		DpiHandler.setEnableControl(true);

		deviceInitialization(true); //technically not a wake command, but this sets everything cleanly.
	} else {
		Razer.setDeviceMode("Hardware Mode");
		DpiHandler.setEnableControl(false);
	}
}

export function ondpiStagesChanged() {
	DpiHandler.maxDPIStage = dpiStages;
}

export function ondpi1Changed() {
	DpiHandler.DPIStageUpdated(1);
}

export function ondpi2Changed() {
	DpiHandler.DPIStageUpdated(2);
}

export function ondpi3Changed() {
	DpiHandler.DPIStageUpdated(3);
}

export function ondpi4Changed() {
	DpiHandler.DPIStageUpdated(4);
}

export function ondpi5Changed() {
	DpiHandler.DPIStageUpdated(5);
}

export function ondpi6Changed() {
	DpiHandler.DPIStageUpdated(6);
}

export function onOnboardDPIChanged() {
	if(SettingControl) {
		if (OnboardDPI) {
			Razer.setDeviceMode("Hardware Mode");
			DpiHandler.setEnableControl(false);
			RazerMouse.setDeviceDPI(1, dpiStages, true);
		} else {
			Razer.setDeviceMode("Software Mode");
			device.addFeature("mouse");
			DpiHandler.setEnableControl(true);
			DpiHandler.setDpi();
		}
	}

}

export function onidleTimeoutChanged() {
	if (SettingControl) {
		Razer.setDeviceIdleTimeout(idleTimeout);
	}
}

export function onlowPowerPercentageChanged() {
	if (SettingControl) {
		Razer.setDeviceLowPowerPercentage(lowPowerPercentage);
	}
}

export function onScrollModeChanged() {
	if (SettingControl) {
		RazerMouse.setDeviceScrollMode(ScrollMode);
	}
}

export function onScrollAccelChanged() {
	if (SettingControl) {
		RazerMouse.setDeviceScrollAccel(ScrollAccel);
	}
}

export function onSmartReelChanged() {
	if (SettingControl) {
		RazerMouse.setDeviceSmartReel(SmartReel);
	}
}

function deviceInitialization(wake = false) {
	if (!wake) {
		Razer.detectDeviceEndpoint();
		device.set_endpoint(Razer.Config.deviceEndpoint[`interface`], Razer.Config.deviceEndpoint[`usage`], Razer.Config.deviceEndpoint[`usage_page`]);
		Razer.getDeviceTransactionID();
		Razer.detectSupportedFeatures();
		Razer.setDeviceLightingProperties();
		Razer.setNumberOfLEDs(vLedPositions.length);
		Razer.setSoftwareLightingMode();

		if (SettingControl) {
			if (OnboardDPI) {
				Razer.setDeviceMode("Hardware Mode");
				DpiHandler.setEnableControl(false);
				RazerMouse.setDeviceDPI(1, dpiStages, true);
				Razer.setDeviceMode("Hardware Mode");
			} else {
				Razer.setDeviceMode("Software Mode");
				device.addFeature("mouse");
			}
		}
	}

	device.set_endpoint(Razer.Config.deviceEndpoint[`interface`], Razer.Config.deviceEndpoint[`usage`], Razer.Config.deviceEndpoint[`usage_page`]);

	if (SettingControl) {
		if (razerDeviceLibrary.LEDLibrary[razerDeviceLibrary.PIDLibrary[device.productId()]]["hyperscrollWheel"]) {
			RazerMouse.setDeviceScrollMode(ScrollMode);
			RazerMouse.setDeviceScrollAccel(ScrollAccel);
			RazerMouse.setDeviceSmartReel(SmartReel);
		}

		if (razerDeviceLibrary.LEDLibrary[razerDeviceLibrary.PIDLibrary[device.productId()]]["wireless"]) {
			Razer.setDeviceIdleTimeout(idleTimeout);
			Razer.setDeviceLowPowerPercentage(lowPowerPercentage);
		}

		RazerMouse.setDeviceLOD(asymmetricLOD, liftOffDistance);
		Razer.setDevicePollingRate(pollingRate);
		DpiHandler.setEnableControl(true);
		DpiHandler.maxDPIStage = dpiStages;
		DpiHandler.dpiRollover = DPIRollover;

		if (!OnboardDPI) {
			Razer.setDeviceMode("Software Mode");
			device.addFeature("mouse");
			DpiHandler.setEnableControl(true);
			DpiHandler.setDpi();
		}
	}
}

function getDeviceBatteryStatus() {
	if (Date.now() - savedPollTimer < PollModeInternal && !Razer.Config.deviceSleepStatus) {
		return;
	}

	savedPollTimer = Date.now();

	if (Razer.Config.SupportedFeatures.BatterySupport) {
		const battstatus = Razer.getDeviceChargingStatus();
		const battlevel = Razer.getDeviceBatteryLevel();

		if (battlevel !== -1) {
			battery.setBatteryState(battstatus);
			battery.setBatteryLevel(battlevel);
		}
	}
}

function detectInputs() {

	device.set_endpoint(1, 0x00000, 0x0001);

	const packet = device.read([0x00], 16, 1);

	const currentMacroArray = packet.slice(1, 10);

	if (Razer.Config.SupportedFeatures.HyperspeedSupport) {
		device.set_endpoint(1, 0x00000, 0x0001, 0x0006);
	} else {
		device.set_endpoint(1, 0x00000, 0x0001, 0x0005);
	}


	const sleepPacket = device.read([0x00], 16, 1);

	if (sleepPacket[0] === 0x05 && sleepPacket[1] === 0x09 && sleepPacket[2] === 0x03) {
		device.log(`Device woke from sleep. Reinitializing and restarting render loop.`);
		Razer.Config.deviceSleepStatus = false;
		device.pause(3000);
		deviceInitialization(true);
	}

	if (sleepPacket[0] === 0x05 && sleepPacket[1] === 0x09 && sleepPacket[2] === 0x02) {
		device.log(`Device went to sleep. Suspending render loop until device wakes.`);
		Razer.Config.deviceSleepStatus = true;
	}

	device.set_endpoint(Razer.Config.deviceEndpoint[`interface`], Razer.Config.deviceEndpoint[`usage`], Razer.Config.deviceEndpoint[`usage_page`]);

	if (!macroTracker) { macroTracker = new ByteTracker(currentMacroArray); device.log("Macro Tracker Spawned."); }

	if (packet[0] === 0x04) {

		if (macroTracker.Changed(currentMacroArray)) {
			processInputs(macroTracker.Added(), macroTracker.Removed());
		}
	}
}

function processInputs(Added, Removed) {

	for (let values = 0; values < Added.length; values++) {
		const input = Added.pop();

		switch (input) {
		case 0x20:
			device.log("DPI Up");
			DpiHandler.increment();
			break;
		case 0x21:
			device.log("DPI Down");
			DpiHandler.decrement();
			break;

		case 0x51:
			device.log("DPI Clutch Hit.");
			DpiHandler.SetSniperMode(true);
			break;
		case 0x52:
			device.log("DPI Cycle Hit.");
			DpiHandler.increment();
			break;
		default:
			const eventData = { "buttonCode": 0, "released": false, "name": razerDeviceLibrary.inputDict[input] };
			device.log(razerDeviceLibrary.inputDict[input] + " hit.");
			mouse.sendEvent(eventData, "Button Press");
		}
	}

	for (let values = 0; values < Removed.length; values++) {
		const input = Removed.pop();

		if(input === 0x51) {
			device.log("DPI Clutch Released.");
			DpiHandler.SetSniperMode(false);
		} else {
			const eventData = { "buttonCode": 0, "released": true, "name": razerDeviceLibrary.inputDict[input] };
			device.log(razerDeviceLibrary.inputDict[input] + " released.");
			mouse.sendEvent(eventData, "Button Press");
		}

	}
}

function grabColors(shutdown = false) {


	if (Razer.Config.SupportedFeatures.Hyperflux) {
		let RGBData = [];
		const PadRGBData = [];
		const hyperflux = razerDeviceLibrary.LEDLibrary["Hyperflux Pad"];

		for (let iIdx = 0; iIdx < hyperflux.vLedPositions.length; iIdx++) {

			const iPxX = hyperflux.vLedPositions[iIdx][0];
			const iPxY = hyperflux.vLedPositions[iIdx][1];


			let col;

			if (shutdown) {
				col = hexToRgb(shutdownColor);
			} else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			} else {
				col = device.subdeviceColor("Hyperflux", iPxX, iPxY);
			}

			const iLedIdx = iIdx * 3;
			PadRGBData[iLedIdx] = col[0];
			PadRGBData[iLedIdx + 1] = col[1];
			PadRGBData[iLedIdx + 2] = col[2];
		}

		for (let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
			const iPxX = vLedPositions[iIdx][0];
			const iPxY = vLedPositions[iIdx][1];
			let col;

			if (shutdown) {
				col = hexToRgb(shutdownColor);
			} else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			} else {
				col = device.color(iPxX, iPxY);
			}
			const iLedIdx = (iIdx * 3);
			RGBData[iLedIdx] = col[0];
			RGBData[iLedIdx + 1] = col[1];
			RGBData[iLedIdx + 2] = col[2];
		}

		RGBData = PadRGBData.concat(RGBData);
		RazerMouse.setMouseLighting(RGBData, 16); //MMM Hardcoding.

	} else {
		const RGBData = [];

		for (let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
			const iPxX = vLedPositions[iIdx][0];
			const iPxY = vLedPositions[iIdx][1];
			let col;

			if (shutdown) {
				col = hexToRgb(shutdownColor);
			} else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			} else {
				col = device.color(iPxX, iPxY);
			}
			const iLedIdx = (iIdx * 3);
			RGBData[iLedIdx] = col[0];
			RGBData[iLedIdx + 1] = col[1];
			RGBData[iLedIdx + 2] = col[2];
		}

		if(vLedPositions.length > 0) {
			RazerMouse.setMouseLighting(RGBData);
		}
	}
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [0, 0, 0];

	if (result !== null) {
		colors[0] = parseInt(result[1], 16);
		colors[1] = parseInt(result[2], 16);
		colors[2] = parseInt(result[3], 16);
	}


	return colors;
}

export class deviceLibrary {
	constructor() {

		this.inputDict = {
			0x20 : "DPI Up",
			0x21 : "DPI Down",
			0x22 : "Right Back Button",
			0x23 : "Right Forward Button",
			0x50 : "Profile Button",
			0x51 : "DPI Clutch",
			0x52 : "DPI Cycle",
			0x54 : "Scroll Accel Button"
		};

		this.PIDLibrary =
		{
			0x006B: "Abyssus Essential",
			0x0065: "Basilisk Essential",
			0x0086: "Basilisk Ultimate",
			0x0088: "Basilisk Ultimate",
			0x0064: "Basilisk",
			0x0085: "Basilisk V2",
			0x0099: "Basilisk V3",
			0x00aa: "Basilisk V3 Pro",
			0x00ab: "Basilisk V3 Pro",
			0x0083: "Basilisk X Hyperspeed",
			0x005C: "Deathadder Elite",
			0x008C: "Deathadder Mini",
			0x0084: "Deathadder V2",
			0x007C: "Deathadder V2 Pro",
			0x007D: "Deathadder V2 Pro",
			0x00B7: "Deathadder V3 Pro",
			0x0059: "Lancehead",
			0x0070: "Lancehead",
			0x006f: "Lancehead",
			0x0060: "Lancehead Tournament Edition",
			0x006c: "Mamba Elite",
			0x0073: "Mamba",
			0x0072: "Mamba",
			//0x0068: "Mamba Hyperflux", //99% sure this is busted.
			0x0046: "Mamba Tournament Edition",
			0x0053: "Naga Chroma",
			0x008D: "Naga Lefthand",
			0x008F: "Naga Pro",
			0x0090: "Naga Pro",
			0x00a8: "Naga Pro V2",
			0x00a7: "Naga Pro V2",
			0x0067: "Naga Trinity",
			0x0096: "Naga X",
			0x0094: "Orochi V2",
			0x0091: "Viper 8KHz",
			0x008a: "Viper Mini",
			0x0078: "Viper",
			0x00a6: "Viper V2 Pro",
			0x00a5: "Viper V2 Pro",
			0x007A: "Viper Ultimate",
			0x007B: "Viper Ultimate"
		};

		this.LEDLibrary = //I'm tired of not being able to copy paste between files.
		{
			"Abyssus Essential":
			{
				size: [10, 10],
				vLedNames: ["ScrollWheel", "Logo", "SideBarLeft1"],
				vLedPositions: [[5, 0], [7, 5], [0, 1]],
				maxDPI: 12400
			},
			"Basilisk Essential":
			{
				size: [3, 3],
				vLedNames: ["Logo"],
				vLedPositions: [[1, 0]],
				maxDPI: 6400
			},
			"Basilisk Ultimate":
			{
				size: [7, 13],
				vLedNames: ["ScrollWheel", "Logo", "SideBar1", "SideBar2", "SideBar3", "SideBar4", "SideBar5", "SideBar6", "SideBar7", "SideBar8", "SideBar9", "SideBar10", "SideBar11"],
				vLedPositions: [[3, 0], [3, 11], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11]],
				maxDPI: 20000,
				wireless: true
			},
			"Basilisk":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo"],
				vLedPositions: [[1, 0], [1, 2]],
				maxDPI: 12400
			},
			"Basilisk V2":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo"],
				vLedPositions: [[1, 0], [1, 2]],
				maxDPI: 12400
			},
			"Basilisk V3":
			{
				size: [7, 8],
				vLedNames: ["Logo", "Scrollwheel", "UnderLeft1", "UnderLeft2", "UnderLeft3", "UnderLeft4", "UnderLeft5", "UnderRight1", "UnderRight2", "UnderRight3", "UnderRight4"],
				vLedPositions: [[3, 5], [3, 1], [1, 1], [0, 2], [0, 3], [0, 4], [2, 6], [4, 6], [5, 3], [6, 2], [6, 1]],
				maxDPI: 26000,
				hyperscrollWheel: true
			},
			"Basilisk V3 Pro":
			{
				size: [6, 7],
				vLedNames: ["Logo", "Scrollwheel", "UnderLeft1", "UnderLeft2", "UnderLeft3", "UnderLeft4", "UnderLeft5", "UnderBottom", "UnderRight1", "UnderRight2", "UnderRight3", "UnderRight4", "UnderRight5"],
				vLedPositions: [[3, 4], [3, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [3, 6], [4, 4], [5, 3], [5, 2], [5, 1], [5, 0]],
				maxDPI: 30000,
				hyperscrollWheel: true,
				wireless: true
			},
			"Basilisk X Hyperspeed":
			{
				size: [0, 0],
				vLedNames: [],
				vLedPositions: [],
				maxDPI: 16000
			},
			"Deathadder Elite":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo", "Side Panel"],
				vLedPositions: [[1, 0], [1, 2], [0, 1]],
				maxDPI: 12400
			},
			"Deathadder Mini":
			{
				size: [3, 3],
				vLedNames: ["Logo"],
				vLedPositions: [[1, 2]],
				maxDPI: 12400
			},
			"Deathadder V2":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo"],
				vLedPositions: [[1, 0], [1, 2]],
				maxDPI: 20000
			},
			"Deathadder V2 Pro":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo", "Side Panel"],
				vLedPositions: [[1, 0], [1, 2], [0, 1]],
				maxDPI: 20000,
				wireless: true
			},
			"Deathadder V3 Pro":
			{
				size: [0, 0],
				vLedNames: [],
				vLedPositions: [],
				maxDPI: 30000,
				wireless: true
			},
			"Hyperflux Pad":
			{
				/** @type {number[]} */
				size: [5, 5],
				vLedNames: ["Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10", "Led 11", "Led 12"],
				/** @type {LedPosition[]} */
				vLedPositions: [[1, 0], [2, 0], [3, 0], [4, 1], [4, 2], [4, 3], [3, 4], [2, 4], [1, 4], [0, 3], [0, 2], [0, 1]],
			},
			"Lancehead":
			{
				size: [10, 10],
				vLedNames: ["ScrollWheel", "Logo", "SideBarLeft1"],
				vLedPositions: [[5, 0], [7, 5], [0, 1]],
				maxDPI: 12400,
				wireless: true
			},
			"Lancehead Tournament Edition":
			{
				size: [5, 9],
				vLedNames: ["ScrollWheel", "Logo", "Left Side Bar 1", "Left Side Bar 2", "Left Side Bar 3", "Left Side Bar 4", "Left Side Bar 5", "Left Side Bar 6", "Left Side Bar 7", "Right Side Bar 1", "Right Side Bar 2", "Right Side Bar 3", "Right Side Bar 4", "Right Side Bar 5", "Right Side Bar 6", "Right Side Bar 7"],
				vLedPositions: [[2, 0], [2, 8], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6]],
				maxDPI: 16000,
			},
			"Mamba Elite":
			{
				size: [10, 11],
				vLedNames: ["ScrollWheel", "Logo", "SideBarLeft1", "SideBarLeft2", "SideBarLeft3", "SideBarLeft4", "SideBarLeft5", "SideBarLeft6", "SideBarLeft7", "SideBarLeft8", "SideBarLeft9", "SideBarRight1", "SideBarRight2", "SideBarRight3", "SideBarRight4", "SideBarRight5", "SideBarRight6", "SideBarRight7", "SideBarRight8", "SideBarRight9"],
				vLedPositions: [[5, 0], [5, 8], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 7], [0, 8], [0, 9], [0, 10], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 7], [9, 8], [9, 9], [9, 10]],
				maxDPI: 16000
			},
			"Mamba":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo"],
				vLedPositions: [[1, 0], [1, 2]],
				maxDPI: 16000,
				wireless: true
			},
			"Mamba Hyperflux":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo"],
				vLedPositions: [[1, 0], [1, 2]],
				maxDPI: 16000,
				hyperflux: true,
				wireless: true
			},
			"Mamba Tournament Edition":
			{
				size: [5, 7],
				vLedNames: ["Left Side Bar 1", "Left Side Bar 2", "Left Side Bar 3", "Left Side Bar 4", "Left Side Bar 5", "Left Side Bar 6", "Left Side Bar 7", "Right Side Bar 1", "Right Side Bar 2", "Right Side Bar 3", "Right Side Bar 4", "Right Side Bar 5", "Right Side Bar 6", "Right Side Bar 7", "Logo", "ScrollWheel"],
				vLedPositions: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [2, 5], [2, 0]],
				maxDPI: 16000
			},
			"Naga Chroma":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo", "Side Panel"],
				vLedPositions: [[0, 0], [0, 2], [1, 1]],
				maxDPI: 18000
			},
			"Naga Pro":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo", "Side Panel"],
				vLedPositions: [[1, 0], [1, 2], [0, 1]],
				maxDPI: 18000,
				wireless: true
			},
			"Naga Pro V2":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo", "Side Panel"],
				vLedPositions: [[1, 0], [1, 2], [0, 1]],
				maxDPI: 30000,
				wireless: true
			},
			"Naga Lefthand":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo", "Side Panel"],
				vLedPositions: [[0, 0], [0, 2], [1, 1]],
				maxDPI: 16000
			},
			"Naga Trinity":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Logo", "Side Panel"],
				vLedPositions: [[0, 0], [0, 2], [1, 1]],
				maxDPI: 12400
			},
			"Naga X":
			{
				size: [3, 3],
				vLedNames: ["ScrollWheel", "Side Panel"],
				vLedPositions: [[1, 0], [0, 1]],
				maxDPI: 18000
			},
			"Orochi V2":
			{
				size: [0, 0],
				vLedNames: [],
				vLedPositions: [],
				maxDPI: 18000
			},
			"Viper 8KHz":
			{
				size: [2, 2],
				vLedNames: ["Mouse"],
				vLedPositions: [[1, 1]],
				maxDPI: 12400
			},
			"Viper":
			{
				size: [2, 2],
				vLedNames: ["Mouse"],
				vLedPositions: [[1, 1]],
				maxDPI: 12400
			},
			"Viper V2 Pro":
			{
				size: [0, 0],
				vLedNames: [],
				vLedPositions: [],
				maxDPI: 30000
			},
			"Viper Mini":
			{
				size: [2, 2],
				vLedNames: ["Mouse"],
				vLedPositions: [[1, 1]],
				maxDPI: 12400
			},
			"Viper Ultimate":
			{
				size: [2, 2],
				vLedNames: ["Mouse"],
				vLedPositions: [[1, 1]],
				maxDPI: 12400,
				wireless: true
			},

		};
	}
}

const razerDeviceLibrary = new deviceLibrary();

export class RazerProtocol {
	constructor() {
		/** Defines for the 3 device modes that a Razer device can be set to. FactoryMode should never be used, but is here as reference. */
		this.DeviceModes =
		{
			"Hardware Mode": 0x00,
			"Factory Mode": 0x02,
			"Software Mode": 0x03,
			0x00: "Hardware Mode",
			0x02: "Factory Mode",
			0x03: "Software Mode"
		};
		/** Defines for responses coming from a device in response to commands. */
		this.DeviceResponses =
		{
			0x01: "Device Busy",
			0x02: "Command Success",
			0x03: "Command Failure",
			0x04: "Command Time Out",
			0x05: "Command Not Supported"
		};
		/** These are used to identify what LED zone we're poking at on a device. Makes no difference for RGB Sends as it doesn't work with Legacy devices, but it does tell us what zones a modern device has to some extent.*/
		this.LEDIDs =
		{
			"Scroll_Wheel": 0x01,
			"Battery": 0x02,
			"Logo": 0x03,
			"Backlight": 0x04,
			"Macro": 0x05,
			"Game": 0x06,
			"Underglow": 0x0A,
			"Red_Profile": 0x0C,
			"Green_Profile": 0x0D,
			"Blue_Profile": 0x0E,
			"Unknown6": 0x0F,
			"Right_Side_Glow": 0x10,
			"Left_Side_Glow": 0x11,
			"Charging": 0x20,
			0x01: "Scroll_Wheel",
			0x02: "Battery",
			0x03: "Logo",
			0x04: "Backlight",
			0x05: "Macro",
			0x06: "Game",
			0x0A: "Underglow",
			0x0C: "Red_Profile",
			0x0D: "Green_Profile",
			0x0E: "Blue_Profile",
			0x0F: "Unknown6",
			0x10: "Right_Side_Glow",
			0x11: "Left_Side_Glow",
			0x20: "Charging"
		};

		this.Config =
		{
			/** ID used to tell which device we're talking to. Most devices have a hardcoded one, but hyperspeed devices can have multiple if a dongle has multiple connected devices. */
			TransactionID: 0x1f,
			/** @type {number[]} Reserved for Hyperspeed Pairing. Holds additional Transaction ID's for extra paired hyperspeed devices.*/
			AdditionalDeviceTransactionIDs: [],
			/** Stored Firmware Versions for Hyperspeed dongles. We're keeping an array here in case a device has two nonconsecutive transaction ID's. @type {number[]} */
			AdditionalDeviceFirmwareVersions: [],
			/** @type {string[]} Stored Serials for Hyperspeed dongles. */
			AdditionalDeviceSerialNumbers: [],
			/** Variable to indicate how many LEDs a device has, used in the color send packet for mice. Does not apply for keyboards. */
			NumberOfLEDs: -1,
			/** Variable to indicate how many leds should be sent per packet. */
			LEDsPerPacket: -1,
			/** Variable to indicate what type of device is connected. */
			DeviceType: "Mouse", //Default to mouse. Also this won't work with hyperspeed.
			/** Variable to indicate if a device supports above 1000Hz polling. */
			HighPollingRateSupport: false,
			/** Stored Serial Number to compare against for hyperspeed dongles. We'll update this each time so that we find any and all devices.@type {number[]} */
			LastSerial: [],
			/** Array to hold discovered legacy led zones. */
			LegacyLEDsFound: [],
			/** Object for the device endpoint to use. Basilisk V3 Uses interface 3 because screw your standardization. */
			deviceEndpoint: { "interface": 0, "usage": 0x0002, "usage_page": 0x0001 },
			/** Bool to handle render suspension if device is sleeping. */
			deviceSleepStatus: false,

			SupportedFeatures:
			{
				BatterySupport: false,
				DPIStageSupport: false,
				PollingRateSupport: false,
				FirmwareVersionSupport: false,
				SerialNumberSupport: false,
				DeviceModeSupport: false,
				HyperspeedSupport: false,
				ScrollAccelerationSupport: false,
				ScrollModeSupport: false,
				SmartReelSupport: false,
				IdleTimeoutSupport: false,
				LowPowerPercentage: false,
				Hyperflux: false
			}
		};
	}
	/** Function to set our TransactionID*/
	setTransactionID(TransactionID) {
		this.Config.TransactionID = TransactionID;
	}
	/** Function for setting the number of LEDs a device has on it.*/
	setNumberOfLEDs(NumberOfLEDs) {
		this.Config.NumberOfLEDs = NumberOfLEDs;
	}
	/** Function for setting device led properties.*/
	setDeviceLightingProperties() {
		const layout = razerDeviceLibrary.LEDLibrary[razerDeviceLibrary.PIDLibrary[device.productId()]];
		vLedNames = [];
		vLedPositions = [];

		if (layout) {
			device.log("Valid Library Config found.");
			device.setName("Razer " + razerDeviceLibrary.PIDLibrary[device.productId()]);
			device.setSize(layout.size);
			vLedNames.push(...layout.vLedNames);
			vLedPositions.push(...layout.vLedPositions);
		} else {
			device.log("No Valid Library Config found.");

		}

		device.setControllableLeds(vLedNames, vLedPositions);
		this.getDeviceLEDZones();

		if (layout.hyperflux) {
			device.log("Device has a Hyperflux Pad!");
			this.Config.SupportedFeatures.Hyperflux = true;

			const hyperflux = razerDeviceLibrary.LEDLibrary["Hyperflux Pad"];

			device.createSubdevice("Hyperflux");
			// Parent Device + Sub device Name + Ports
			device.setSubdeviceName("Hyperflux", `Hyperflux Mousepad`);
			//device.setSubdeviceImage("Hyperflux", Razer_Mamba.image);

			if (hyperflux.size[0] !== undefined && hyperflux.size[1] !== undefined) {
				device.setSubdeviceSize("Hyperflux", hyperflux.size[0], hyperflux.size[1]);
			}

			device.setSubdeviceLeds("Hyperflux", hyperflux.vLedNames, hyperflux.vLedPositions);
		}
	}
	/* eslint-disable complexity */
	/** Function for detection all of the features that a device supports.*/
	detectSupportedFeatures() { //This list is not comprehensive, but is a good start.
		const BatterySupport = this.getDeviceBatteryLevel();

		if (BatterySupport > -1) {
			this.Config.SupportedFeatures.BatterySupport = true;
			device.addFeature("battery");
		}
		const DPIStageSupport = RazerMouse.getDeviceDPIStages();

		if (DPIStageSupport > -1) {
			this.Config.SupportedFeatures.DPIStageSupport = true;
		}
		const PollingRateSupport = this.getDevicePollingRate();

		if (PollingRateSupport > -1) {
			this.Config.SupportedFeatures.PollingRateSupport = true;
		}
		const FirmwareVersionSupport = this.getDeviceFirmwareVersion();

		if (FirmwareVersionSupport > -1) {
			this.Config.SupportedFeatures.FirmwareVersionSupport = true;
		}
		const SerialNumberSupport = this.getDeviceSerial();

		if (SerialNumberSupport > -1) {
			this.Config.SupportedFeatures.SerialNumberSupport = true;
		}
		const DeviceModeSupport = this.getDeviceMode();

		if (DeviceModeSupport > -1) {
			this.Config.SupportedFeatures.DeviceModeSupport = true;
		}
		const HyperspeedSupport = this.getCurrentlyConnectedDongles();

		if (HyperspeedSupport > -1) {
			this.Config.SupportedFeatures.HyperspeedSupport = true;
		}
		const ScrollAccelerationSupport = RazerMouse.getDeviceScrollAccel();

		if (ScrollAccelerationSupport > -1) {
			this.Config.SupportedFeatures.ScrollAccelerationSupport = true;
		}
		const ScrollModeSupport = RazerMouse.getDeviceScrollMode();

		if (ScrollModeSupport > -1) {
			this.Config.SupportedFeatures.ScrollModeSupport = true;
		}
		const SmartReelSupport = RazerMouse.getDeviceSmartReel();

		if (SmartReelSupport > -1) {
			this.Config.SupportedFeatures.SmartReelSupport = true;
		}
		const IdleTimeoutSupport = this.getDeviceIdleTimeout();

		if (IdleTimeoutSupport > -1) {
			this.Config.SupportedFeatures.IdleTimeoutSupport = true;
		}

		const lowBatteryPercentageSupport = this.getDeviceLowPowerPercentage();

		if(lowBatteryPercentageSupport > -1) {
			this.Config.SupportedFeatures.LowPowerPercentage = true;
		}
	}
	/* eslint-enable complexity */
	/** Function to Detect if we have a Basilisk V3 Attached. */
	detectDeviceEndpoint() {//Oh look at me. I'm a basilisk V3. I'm special

		const deviceEndpoints = device.getHidEndpoints();
		const devicePID = device.productId();

		for (let endpoints = 0; endpoints < deviceEndpoints.length; endpoints++) {
			const endpoint = deviceEndpoints[endpoints];

			if (endpoint) {
				if (endpoint[`interface`] === 3 && devicePID === 0x0099) {
					this.Config.deviceEndpoint[`interface`] = endpoint[`interface`];
					this.Config.deviceEndpoint[`usage`] = endpoint[`usage`];
					this.Config.deviceEndpoint[`usage_page`] = endpoint[`usage_page`];
					device.log("Basilisk V3 Found.");
				}
			}
		}
	}
	/** Wrapper function for Writing Config Packets without fetching a response.*/
	ConfigPacketSendNoResponse(packet, TransactionID = this.Config.TransactionID) {
		this.StandardPacketSend(packet, TransactionID);
		device.pause(10);
	}
	/** Wrapper function for Writing Config Packets and fetching a response.*/
	/** @returns {[number[], number]} */
	ConfigPacketSend(packet, TransactionID = this.Config.TransactionID) {
		this.StandardPacketSend(packet, TransactionID);
		device.pause(10);

		const returnPacket = this.ConfigPacketRead();
		let errorCode = 0;

		if (returnPacket[0] !== undefined) {
			errorCode = returnPacket[0];
		}

		return [returnPacket, errorCode];
	}
	/** Wrapper function for Reading Config Packets.*/
	ConfigPacketRead(TransactionID = this.Config.TransactionID) {
		let returnPacket = [];

		returnPacket = device.get_report([0x00, 0x00, TransactionID], 91);

		return returnPacket.slice(1, 90);
	}
	/** Wrapper function for Writing Standard Packets, such as RGB Data.*/
	StandardPacketSend(data, TransactionID = this.Config.TransactionID) {//Wrapper for always including our CRC
		let packet = [0x00, 0x00, TransactionID, 0x00, 0x00, 0x00];
		packet = packet.concat(data);
		packet[89] = this.CalculateCrc(packet);
		device.send_report(packet, 91);
	}
	/**Razer Specific CRC Function that most devices require.*/
	CalculateCrc(report) {
		let iCrc = 0;

		for (let iIdx = 3; iIdx < 89; iIdx++) {
			iCrc ^= report[iIdx];
		}

		return iCrc;
	}
	/**Function to grab a device's transaction ID using the serial mumber command.*/
	getDeviceTransactionID() {//Most devices return at minimum 2 Transaction ID's. We throw away any besides the first one.
		const possibleTransactionIDs = [0x1f, 0x2f, 0x3f, 0x4f, 0x5f, 0x6f, 0x7f, 0x8f, 0x9f];
		let devicesFound = 0;

		do {
			for (let testTransactionID = 0x00; testTransactionID < possibleTransactionIDs.length; testTransactionID++) {
				const TransactionID = possibleTransactionIDs[testTransactionID];
				const packet = [0x02, 0x00, 0x82];
				this.ConfigPacketSend(packet, TransactionID);

				const returnPacket = this.ConfigPacketRead(TransactionID);
				const Serialpacket = returnPacket.slice(8, 23);

				if (Serialpacket.every(item => item !== 0)) {
					const SerialString = String.fromCharCode(...Serialpacket);

					devicesFound = this.checkDeviceTransactionID(TransactionID, SerialString, devicesFound);
					this.ConfigPacketRead(TransactionID);
				}

				device.pause(400);
			}
		}
		while (devicesFound === 0);
	}
	/**Function to ensure that a grabbed transaction ID is not for a device we've already found a transaction ID for.*/
	checkDeviceTransactionID(TransactionID, SerialString, devicesFound) {
		if (SerialString.length === 15 && devicesFound === 0) {
			this.Config.TransactionID = TransactionID;
			devicesFound++;
			device.log("Valid Serial Returned:" + SerialString);
			this.Config.LastSerial = SerialString; //Store a serial to compare against later.
		} else if (SerialString.length === 15 && devicesFound > 0 && this.Config.LastSerial !== SerialString) {
			if (SerialString in this.Config.AdditionalDeviceSerialNumbers) { return devicesFound; } //This deals with the edge case of a device having nonconcurrent transaction ID's. We skip this function if the serials match.

			device.log("Multiple Devices Found, Assuming this is a Hyperspeed Dongle and has more than 1 device connected.");
			this.Config.SupportedFeatures.HyperspeedSupport = true;
			this.Config.AdditionalDeviceTransactionIDs.push(TransactionID);
			device.log("Valid Serial Returned:" + SerialString);
			this.Config.AdditionalDeviceSerialNumbers.push(SerialString);
			this.Config.LastSerial = SerialString; //Store a serial to compare against later.
		}

		return devicesFound;
	}
	/** Function to check if a device is charging or discharging. */
	getDeviceChargingStatus() {
		const [returnPacket, errorCode] = this.ConfigPacketSend([0x02, 0x07, 0x84]);

		if (errorCode !== 2) {

			device.log("Error fetching Device Charging Status. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {
			const batteryStatus = returnPacket[9];

			device.log("Charging Status: " + batteryStatus);

			if (batteryStatus === undefined || batteryStatus > 1 || batteryStatus < 0) {
				device.log(`Error fetching Device Charging Status. Device returned out of spec response. Response: ${batteryStatus}`, { toFile: true });

				return -1;
			}

			return batteryStatus + 1;
		}

		return -3;
	}
	/** Function to check a device's battery percentage.*/
	getDeviceBatteryLevel(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			[returnPacket, errorCode] = this.ConfigPacketSend([0x02, 0x07, 0x80]);

			if(errorCode !== 2) {
			   device.pause(10);
			   attempts++;
			}
	   }

	   while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Device Battery Level. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {
			if (returnPacket[9] !== undefined) {

				const batteryLevel = Math.floor(((returnPacket[9]) * 100) / 255);

				if(batteryLevel > 0) {
					device.log("Device Battery Level: " + batteryLevel);

					return batteryLevel;
				}

				return -1;
			}

			return -1;
		}

		return -3;
	}
	/** Function to fetch a device's serial number. This serial is the same as the one printed on the physical device.*/
	getDeviceSerial(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = this.ConfigPacketSend([0x16, 0x00, 0x82]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Device Serial. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {

			const Serialpacket = returnPacket.slice(8, 23);
			const SerialString = String.fromCharCode(...Serialpacket);

			device.log("Device Serial: " + SerialString);

			return SerialString;
		}

		return -3;
	}
	/** Function to check a device's firmware version.*/
	getDeviceFirmwareVersion(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = this.ConfigPacketSend([0x02, 0x00, 0x81]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Device Firmware Version. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {
			const FirmwareByte1 = returnPacket[8];
			const FirmwareByte2 = returnPacket[9];
			device.log("Firmware Version: " + FirmwareByte1 + "." + FirmwareByte2);

			return [FirmwareByte1, FirmwareByte2];
		}


		return -3;
	}
	/** Function to fetch all of a device's LED Zones.*/
	getDeviceLEDZones() {
		const activeZones = [];

		for (let zones = 0; zones < 30; zones++) {
			RazerMouse.setModernMouseLEDBrightness(100, 0, true);

			const ledExists = RazerMouse.getModernMouseLEDBrightness(zones, true); //iirc main reason I use this is that it only applies to mice?


			if (ledExists === 100) {
				device.log(`LED Zone ${this.LEDIDs[zones]} Exists`, { toFile: true });
				activeZones.push(zones);

			}

		}

		if (activeZones.length > 0) {
			device.log("Device uses Modern Protocol for Lighting.", { toFile: true });

			return activeZones;
		}

		return -1; //Return -1 if we have no zones. I.E. device has no led zones 💀
	}
	/** Function to check if a device is in Hardware Mode or Software Mode. */
	getDeviceMode(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = this.ConfigPacketSend([0x02, 0x00, 0x84]); //2,3,1

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Current Device Mode. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[8] !== undefined) {
			const deviceMode = returnPacket[8];
			device.log("Current Device Mode: " + this.DeviceModes[deviceMode]);

			return deviceMode;
		}

		return -3;
	}
	/** Function to set a device's mode between hardware and software.*/
	setDeviceMode(mode, retryAttempts = 5) {
		let errorCode = 0;
		let attempts = 0;

		do {
			const returnValues = this.ConfigPacketSend([0x02, 0x00, 0x04, this.DeviceModes[mode]]); //2,3,1
			errorCode = returnValues[1];

			if(errorCode !== 2) {
			   device.pause(10);
			   attempts++;
			}
	   }

	   while(errorCode !== 2 && attempts < retryAttempts);


		if (errorCode !== 2) {

			device.log("Error Setting Device Mode. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return this.getDeviceMode(); //Log device mode after switching modes.
	}
	/** Function to fetch what battery percentage a device will enter low power mode at.*/
	getDeviceLowPowerPercentage(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = this.ConfigPacketSend([0x01, 0x07, 0x81]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Device Low Power Percentage. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[8] !== undefined) {
			const lowPowerPercentage = Math.ceil((returnPacket[8]*100)/255);
			device.log(`Low Battery Mode Percentage: ${lowPowerPercentage}%`);

			return lowPowerPercentage;
		}

		return -3;
	}
	/** Function to set at what battery percentage a device will enter low power mode.*/
	setDeviceLowPowerPercentage(lowPowerPercentage, retryAttempts = 5) {
		let errorCode = 0;
		let attempts = 0;

		do {
			const returnValues = this.ConfigPacketSend([0x01, 0x07, 0x01, Math.floor(((lowPowerPercentage) * 255) / 100)]);
			errorCode = returnValues[1];

			if(errorCode !== 2) {
			   device.pause(10);
			   attempts++;
			}
	   }

	   while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error setting Device Low Power Percentage. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to fetch a device's polling rate. We do not currently parse this at all.*/
	getDevicePollingRate() {
		let pollingRate;
		const [returnPacket, errorCode] = Razer.ConfigPacketSend([0x01, 0x00, 0x85]);

		if (errorCode !== 2) {

			device.log("Error fetching Current Device Polling Rate. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[8] !== 0 && returnPacket[8] !== undefined) {
			pollingRate = returnPacket[8];
			device.log("Polling Rate: " + 1000 / pollingRate + "Hz", { toFile: true });

			return pollingRate;
		}
		const [secondaryreturnPacket, secondaryErrorCode] = Razer.ConfigPacketSend([0x01, 0x00, 0xC0]);

		if (secondaryErrorCode !== 2) {

			device.log("Error fetching Current Device High Polling Rate. Error Code: " + secondaryErrorCode, { toFile: true });

			if (secondaryErrorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (secondaryreturnPacket[9] !== 0 && secondaryreturnPacket[9] !== undefined) {
			pollingRate = secondaryreturnPacket[9];
			device.log("Polling Rate: " + 8000 / pollingRate + "Hz", { toFile: true });
			this.Config.HighPollingRateSupport = true;

			return pollingRate;
		}

		return -3;
	}
	/** Function to set a device's polling rate.*/
	setDevicePollingRate(pollingRate) {
		if (this.Config.HighPollingRateSupport) {
			return this.setDeviceHighPollingRate(pollingRate);
		}

		return this.setDeviceStandardPollingRate(pollingRate);
	}
	/** Function to set a device's polling rate on devices supporting 1000hz polling rates.*/
	setDeviceStandardPollingRate(pollingRate) {
		const returnValues = this.ConfigPacketSend([0x01, 0x00, 0x05, 1000 / pollingRate]);
		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error fetching Current Device Polling Rate. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to set a device's polling rate on devices supporting above 1000hz polling rate.*/
	setDeviceHighPollingRate(pollingRate) {
		const returnValues = this.ConfigPacketSend([0x02, 0x00, 0x40, 0x00, 8000 / pollingRate]); //Most likely onboard saving and current. iirc if you save things to flash they don't apply immediately.
		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error fetching Current Device Polling Rate. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}
		const secondaryReturnValues = this.ConfigPacketSend([0x02, 0x00, 0x40, 0x01, 8000 / pollingRate]);
		const secondaryErrorCode = secondaryReturnValues[1];

		if (secondaryErrorCode !== 2) {

			device.log("Error fetching Current Device Polling Rate. Error Code: " + secondaryErrorCode, { toFile: true });

			if (secondaryErrorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to fetch the device idle timeout on supported devices. */
	getDeviceIdleTimeout() {
		const [returnPacket, errorCode] = this.ConfigPacketSend([0x02, 0x07, 0x83]);

		if (errorCode !== 2) {

			device.log("Error fetching Current Device Idle Timeout Setting. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[8] !== undefined && returnPacket[9] !== undefined) {
			const idleTimeout = BinaryUtils.ReadInt16BigEndian([returnPacket[8], returnPacket[9]]);
			device.log(`Current Device Idle Timeout: ${idleTimeout} Seconds.`);

			return idleTimeout;
		}

		return -3;
	}
	/** Function to set the device idle timeout on supported devices. */
	setDeviceIdleTimeout(timeout) {
		const returnValues = this.ConfigPacketSend([0x02, 0x07, 0x03, (timeout >> 8 & 0xff), (timeout & 0xff)]);
		device.pause(10);

		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Current Device Idle Timeout Setting. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0; //function went through
	}
	/** Function to set a modern mouse to software lighting control mode.*/
	setSoftwareLightingMode() {
		const ModernMatrix = this.getModernMatrixEffect();

		if (ModernMatrix > -1) {
			this.setModernSoftwareLightingMode();
		} else if (this.Config.MouseType === "Modern") {
			this.setLegacyMatrixEffect(); ///MMM Edge cases are tasty.
		}
	}
	/** Function to set a legacy device's effect. Why is the Mamba TE so special?*/
	setLegacyMatrixEffect() {
		const returnValues = this.ConfigPacketSend([0x02, 0x03, 0x0A, 0x05, 0x00]);

		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Legacy Matrix Effect. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to set a modern device's effect*/
	getModernMatrixEffect() {
		const returnValues = this.ConfigPacketSend([0x06, 0x0f, 0x82, 0x00]);

		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error fetching Modern Matrix Effect. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to set a modern device's effect*/
	setModernMatrixEffect(data) {
		const packet = [0x06, 0x0f, 0x02]; //6 is length of argument
		data = data || [0x00, 0x00, 0x00]; //flash, zone, effect
		packet.push(...data);

		const returnValues = this.ConfigPacketSend(packet);

		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Modern Matrix Effect. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to set a modern device's effect to custom. */
	setModernSoftwareLightingMode() {//Not all devices require this, but it seems to be sent to all of them?
		return this.setModernMatrixEffect([0x00, 0x00, 0x08, 0x01, 0x01]);
	}
	/** Function to set the Chroma Charging Dock brightness.*/
	getChargingDockBrightness() {
		const [returnPacket, errorCode] = this.ConfigPacketSend([0x01, 0x07, 0x82]);

		if (errorCode !== 2) {

			device.log("Error fetching Charging Dock Brightness. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[10] !== undefined && returnPacket[10] > -1) {
			const dockBrightness = returnPacket[10]; //TODO Test this.
			device.log("Dock Brightness: " + dockBrightness, { toFile: true });

			return dockBrightness;
		}

		return -3;
	}
	/** Function to set the Chroma Charging Dock brightness.*/
	setChargingDockBrightness(brightness) {
		const returnValues = this.ConfigPacketSend([0x01, 0x07, 0x02, brightness]);
		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Charging Dock Brightness. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to switch a Hyperspeed Dongle into Pairing Mode.*/
	setDonglePairingMode() {//Used for pairing multiple devices to a single hyperspeed dongle. The Class is smart enough to separate transaction ID's.
		const returnValues = this.ConfigPacketSend([0x01, 0x00, 0x46, 0x01]);

		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Hyperspeed Dongle to Pairing Mode. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to fetch paired device dongles from the connected dongle?!?!?*/
	getCurrentlyConnectedDongles() { //Also of note: return[0] gives 2, and return[4] gives 1 on Blackwidow. Dualpaired Naga.
		const [returnPacket, errorCode] = this.ConfigPacketSend([0x07, 0x00, 0xbf], 0x0C); //Were you expecting this to give you paired devices? Well you'll be disappointed.
		//Naga itself returns 1 for return[1], and 0 for return[4]

		if (errorCode !== 2) {

			device.log("Error fetching Devices Currently Connected to Hyperspeed Dongle. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {
			if (returnPacket[10] === undefined || returnPacket[11] === undefined || returnPacket[13] === undefined || returnPacket[14] === undefined) {
				device.log("Error fetching Devices Currently Connected to dongle, due to out of spec packet response.", { toFile: true });

				return -2; //return -2 as this should be a retry.
			}

			const device1ConnectionStatus = returnPacket[1];
			const device2ConnectionStatus = returnPacket[4];

			const PID1 = returnPacket[10].toString(16) + returnPacket[11].toString(16);
			const PID2 = returnPacket[13].toString(16) + returnPacket[14].toString(16);
			const pairedPids = [];

			if (PID1 !== "ffff") {
				device.log("Paired Receiver ID 1: 0x" + PID1, { toFile: true });
				pairedPids.push(PID1);
			}

			if (PID2 !== "ffff") {
				device.log("Paired Receiver ID 2: 0x" + PID2, { toFile: true });
				pairedPids.push(PID2);
			}

			if (device1ConnectionStatus === 0x01) {
				device.log(`Device 1 with PID 0x${PID1} is connected.`, { toFile: true });
			}

			if (device2ConnectionStatus === 0x01) {
				device.log(`Device 2 with PID 0x${PID2} is connected.`, { toFile: true });
			}

			return pairedPids;
		}

		return -3;
	}
	/** Function to fetch connected device dongles from the connected dongle?!?!?*/
	getNumberOfPairedDongles() {
		const [returnPacket, errorCode] = this.ConfigPacketSend([0x04, 0x00, 0x87], 0x88); //These values change depending on transaction ID. The expected transaction ID for the original device seems to give us the 2 Paired devices response. Most likely indicating Master. Transaction ID's for the newly paired device are for single paired device. Most likely indicating Slave.

		if (errorCode !== 2) {

			device.log("Error fetching number of devices current paired to dongle. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {
			let numberOfPairedDongles = 0;

			if (returnPacket[8] === 0x02 && returnPacket[9] === 0x02 && returnPacket[10] === 0x00) {
				device.log("Dongle has single paired device.", { toFile: true });
				numberOfPairedDongles = 1;
			}

			if (returnPacket[8] === 0x02 && returnPacket[9] === 0x01 && returnPacket[10] === 0x01) {
				device.log("Dongle has 2 Paired devices.", { toFile: true });
				numberOfPairedDongles = 2;
			}//Speculation: Byte 1 is free slots?, Byte 2 is number of additional paired devices?

			return numberOfPairedDongles;
		}

		return -3;
	}
}

const Razer = new RazerProtocol();

class RazerMouseFunctions {
	constructor() {
	}

	/** Function to set a device's lift off distance.*/
	setDeviceLOD(asymmetricLOD, liftOffDistance) {
		const returnValues = Razer.ConfigPacketSend([0x04, 0x0b, 0x0b, 0x00, 0x04, (asymmetricLOD ? 0x02 : 0x01), (liftOffDistance - 1)]);
		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Device Lift Off Distance. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to fetch a device's onboard DPI levels. We do not currently parse this at all.*/
	getDeviceCurrentDPI() {
		const [returnPacket, errorCode] = Razer.ConfigPacketSend([0x07, 0x04, 0x85, 0x00]);

		if (errorCode !== 2) {

			device.log("Error fetching Current Device DPI. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {
			if (returnPacket[9] === undefined || returnPacket[10] === undefined || returnPacket[11] === undefined || returnPacket[12] === undefined) {
				device.log("Error fetching Current Device DPI. Device returned out of spec response", { toFile: true });

				return -2;
			}

			const dpiX = returnPacket[9] * 256 + returnPacket[10];
			const dpiY = returnPacket[11] * 256 + returnPacket[12];
			device.log("Current DPI X Value: " + dpiX), { toFile: true };
			device.log("Current DPI Y Value: " + dpiY), { toFile: true };

			return [dpiX, dpiY];
		}

		return -3;
	}
	/** Function to set a device's current stage dpi. We leverage this with software buttons to emulate multiple stages.*/
	setDeviceSoftwareDPI(dpi) {
		const returnValues = Razer.ConfigPacketSend([0x07, 0x04, 0x05, 0x00, dpi >> 8, dpi & 0xff, dpi >> 8, dpi & 0xff]);
		device.pause(10);

		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Device Software DPI. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		device.pause(10);

		const currentStage = DpiHandler.getCurrentStage();
		const maxDPIStage = DpiHandler.getMaxStage();
		this.setDeviceDPI(currentStage, maxDPIStage); //Yay for the stupid dpi light. Insert rant here.

		return 0;
	}
	/** Function to fix the edge case we create by fixing the dpi button/light on shutdown.*/
	setDeviceDPIToHardware(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = Razer.ConfigPacketSend([0x26, 0x04, 0x86, 0x01]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Device Onboard DPI Stages. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {
			const currentStage = returnPacket[9];
			const numberOfStages = returnPacket[10];

			const dpi1X = BinaryUtils.ReadInt16BigEndian([returnPacket[12], returnPacket[13]]); //This is technically unnecessary as we get the returns, but this is more organized.
			const dpi1Y = BinaryUtils.ReadInt16BigEndian([returnPacket[14], returnPacket[15]]);
			const dpi2X = BinaryUtils.ReadInt16BigEndian([returnPacket[19], returnPacket[20]]);
			const dpi2Y = BinaryUtils.ReadInt16BigEndian([returnPacket[21], returnPacket[22]]);
			const dpi3X = BinaryUtils.ReadInt16BigEndian([returnPacket[26], returnPacket[27]]);
			const dpi3Y = BinaryUtils.ReadInt16BigEndian([returnPacket[28], returnPacket[29]]);
			const dpi4X = BinaryUtils.ReadInt16BigEndian([returnPacket[33], returnPacket[34]]);
			const dpi4Y = BinaryUtils.ReadInt16BigEndian([returnPacket[35], returnPacket[36]]);
			const dpi5X = BinaryUtils.ReadInt16BigEndian([returnPacket[40], returnPacket[41]]);
			const dpi5Y = BinaryUtils.ReadInt16BigEndian([returnPacket[42], returnPacket[43]]);

			const packet = [0x26, 0x04, 0x06, 0x00, currentStage, numberOfStages, 0x00];

			packet[7] = dpi1X >> 8;
			packet[8] = dpi1X & 0xff;
			packet[9] = dpi1Y >> 8;
			packet[10] = dpi1Y & 0xff;
			packet[13] = 0x01;
			packet[14] = dpi2X >> 8;
			packet[15] = dpi2X & 0xff;
			packet[16] = dpi2Y >> 8;
			packet[17] = dpi2Y & 0xff;
			packet[20] = 0x02;
			packet[21] = dpi3X >> 8;
			packet[22] = dpi3X & 0xff;
			packet[23] = dpi3Y >> 8;
			packet[24] = dpi3Y & 0xff;
			packet[27] = 0x03;
			packet[28] = dpi4X >> 8;
			packet[29] = dpi4X & 0xff;
			packet[30] = dpi4Y >> 8;
			packet[31] = dpi4Y & 0xff;
			packet[34] = 0x04;
			packet[35] = dpi5X >> 8;
			packet[36] = dpi5X & 0xff;
			packet[37] = dpi5Y >> 8;
			packet[38] = dpi5Y & 0xff;

			let errorCode = 0;
			let attempts = 0;

			do {
			 const returnValues = Razer.ConfigPacketSend(packet);
			 errorCode = returnValues[1];

			 if(errorCode !== 2) {
					device.pause(10);
					attempts++;
			 }
			}

			while(errorCode !== 2 && attempts < retryAttempts);


			if (errorCode !== 2) {

				device.log("Error setting Onboard Device DPI Stages. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

				if (errorCode === 1) {
					return -2;
				}

				return -1;
			}

			device.pause(10);
		}

		return -3;
	}
	/** Function to fetch a device's onboard DPI levels.*/
	getDeviceDPIStages(retryAttempts = 5) {//DPI6 does not get included in here.

		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = Razer.ConfigPacketSend([0x26, 0x04, 0x86, 0x01]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Device Onboard DPI Stages. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket !== undefined) {
			//const stage1Flag = returnPacket[11];
			//const stage2Flag = returnPacket[18];
			//const stage3Flag = returnPacket[25];
			//const stage4Flag = returnPacket[32];
			//const stage5Flag = returnPacket[39];
			const numberOfStages = returnPacket[10];
			const currentStage = returnPacket[9];

			const dpi1X = BinaryUtils.ReadInt16BigEndian([returnPacket[12], returnPacket[13]]);
			const dpi1Y = BinaryUtils.ReadInt16BigEndian([returnPacket[14], returnPacket[15]]);
			const dpi2X = BinaryUtils.ReadInt16BigEndian([returnPacket[19], returnPacket[20]]);
			const dpi2Y = BinaryUtils.ReadInt16BigEndian([returnPacket[21], returnPacket[22]]);
			const dpi3X = BinaryUtils.ReadInt16BigEndian([returnPacket[26], returnPacket[27]]);
			const dpi3Y = BinaryUtils.ReadInt16BigEndian([returnPacket[28], returnPacket[29]]);
			const dpi4X = BinaryUtils.ReadInt16BigEndian([returnPacket[33], returnPacket[34]]);
			const dpi4Y = BinaryUtils.ReadInt16BigEndian([returnPacket[35], returnPacket[36]]);
			const dpi5X = BinaryUtils.ReadInt16BigEndian([returnPacket[40], returnPacket[41]]);
			const dpi5Y = BinaryUtils.ReadInt16BigEndian([returnPacket[42], returnPacket[43]]);

			device.log("Current Hardware DPI Stage: " + currentStage, { toFile: true });
			device.log("Number of Hardware DPI Stages: " + numberOfStages, { toFile: true });
			device.log("DPI Stage 1 X Value: " + dpi1X, { toFile: true });
			device.log("DPI Stage 1 Y Value: " + dpi1Y, { toFile: true });
			device.log("DPI Stage 2 X Value: " + dpi2X, { toFile: true });
			device.log("DPI Stage 2 Y Value: " + dpi2Y, { toFile: true });
			device.log("DPI Stage 3 X Value: " + dpi3X, { toFile: true });
			device.log("DPI Stage 3 Y Value: " + dpi3Y, { toFile: true });
			device.log("DPI Stage 4 X Value: " + dpi4X, { toFile: true });
			device.log("DPI Stage 4 Y Value: " + dpi4Y, { toFile: true });
			device.log("DPI Stage 5 X Value: " + dpi5X, { toFile: true });
			device.log("DPI Stage 5 Y Value: " + dpi5Y, { toFile: true });

			return [numberOfStages, currentStage, dpi1X, dpi1Y, dpi2X, dpi2Y, dpi3X, dpi3Y, dpi4X, dpi4Y, dpi5X, dpi5Y]; //Return 0 until I take the time to parse this properly.
		}

		return -3;
	}
	/** Function to set multiple dpi stages. We can set how many stages a device has, and this is saved onboard. This works with hardware buttons.*/
	setDeviceDPI(stage, dpiStages, saveToFlash = false, retryAttempts = 5) {
		const packet = [0x26, 0x04, 0x06, saveToFlash, stage, dpiStages, 0x00];

		packet[7] = dpi1 >> 8;
		packet[8] = dpi1 & 0xff;
		packet[9] = dpi1 >> 8;
		packet[10] = dpi1 & 0xff;
		packet[13] = 0x01;
		packet[14] = dpi2 >> 8;
		packet[15] = dpi2 & 0xff;
		packet[16] = dpi2 >> 8;
		packet[17] = dpi2 & 0xff;
		packet[20] = 0x02;
		packet[21] = dpi3 >> 8;
		packet[22] = dpi3 & 0xff;
		packet[23] = dpi3 >> 8;
		packet[24] = dpi3 & 0xff;
		packet[27] = 0x03;
		packet[28] = dpi4 >> 8;
		packet[29] = dpi4 & 0xff;
		packet[30] = dpi4 >> 8;
		packet[31] = dpi4 & 0xff;
		packet[34] = 0x04;
		packet[35] = dpi5 >> 8;
		packet[36] = dpi5 & 0xff;
		packet[37] = dpi5 >> 8;
		packet[38] = dpi5 & 0xff;

		let errorCode = 0;
		let attempts = 0;

		do {
			 const returnValues = Razer.ConfigPacketSend(packet);
			 errorCode = returnValues[1];

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);


		if (errorCode !== 2) {

			device.log("Error setting Onboard Device DPI Stages. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		device.pause(10);

		return 0;
	}
	/** Function to fetch the scroll mode from supported mice. */
	getDeviceScrollMode(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = Razer.ConfigPacketSend([0x02, 0x02, 0x94]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Current Device Scroll Mode. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[9] !== undefined) {
			const ScrollMode = returnPacket[9];
			device.log("Free Scroll is set to: " + ScrollMode, { toFile: true });

			return ScrollMode;
		}

		return -3;
	}
	/** Function to set the scroll mode for supported mice. */
	setDeviceScrollMode(ScrollMode, retryAttempts = 5) {
		let errorCode = 0;
		let attempts = 0;

		do {
			 const returnValues = Razer.ConfigPacketSend([0x02, 0x02, 0x14, 0x01, (ScrollMode ? 0x01 : 0x00)]);
			 errorCode = returnValues[1];

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error setting Current Device Scroll Mode. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to fetch the Scroll Acceleration mode from supported mice. */
	getDeviceScrollAccel(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = Razer.ConfigPacketSend([0x02, 0x02, 0x96]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Current Scroll Acceleration Setting. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[9] !== undefined) {
			if (returnPacket[9] < 2 && returnPacket[9] >= 0) {
				const ScrollAccel = returnPacket[9];
				device.log("Scroll Acceleration is set to: " + ScrollAccel, { toFile: true });

				return ScrollAccel;
			}

			return -2; //An invalid response but not an invalid packet should prompt a refetch.
		}

		return -3;
	}
	/** Function to set whether Scroll Acceleration is on for supported mice. */
	setDeviceScrollAccel(ScrollAccel, retryAttempts = 5) {
		let errorCode = 0;
		let attempts = 0;

		do {
			 const returnValues = Razer.ConfigPacketSend([0x02, 0x02, 0x16, 0x01, (ScrollAccel ? 0x01 : 0x00)]);
			 errorCode = returnValues[1];

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error setting Device Scroll Acceleration Mode. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to fetch the SmartReel Status of a supported mouse */
	getDeviceSmartReel(retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = Razer.ConfigPacketSend([0x02, 0x02, 0x97]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Current Device Smart Reel Setting. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[9] !== undefined) {
			if (returnPacket[9] < 2 && returnPacket[9] >= 0) {
				const SmartReel = returnPacket[9];
				device.log("Smart Reel is set to: " + SmartReel, { toFile: true });

				return SmartReel;
			}
		}

		return -3;
	}
	/** Function to set whether SmartReel is on for supported mice. */
	setDeviceSmartReel(SmartReel, retryAttempts = 5) {
		let errorCode = 0;
		let attempts = 0;

		do {
		 const returnValues = Razer.ConfigPacketSend([0x02, 0x02, 0x17, 0x01, (SmartReel ? 0x01 : 0x00)]);
		 errorCode = returnValues[1];

		 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
		 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error setting Device Smart Reel Mode. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
	/** Function to set Mouse Lighting.*/
	setMouseLighting(RGBData, NumberOfLEDs = Razer.Config.NumberOfLEDs, hyperflux = false) { //no returns on this or the led color sets. I do not care.
		let packet = [(NumberOfLEDs * 3 + 5), 0x0F, 0x03, hyperflux, 0x00, 0x00, 0x00, Razer.Config.NumberOfLEDs - 1];
		packet = packet.concat(RGBData);

		Razer.StandardPacketSend(packet);
	}
	/** Function to set a legacy mouse's led brightness. You cannot use zero for this one as it wants a specific zone. That being said we could scan for specific zones on a device.*/
	getModernMouseLEDBrightness(led = 0, detection = false, retryAttempts = 5) {
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] =  Razer.ConfigPacketSend([0x03, 0x0f, 0x84, 0x00, led]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			if(!detection) {
				device.log("Error fetching Modern Mouse LED Brightness. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });
			}

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		if (returnPacket[10] !== undefined) {
			const brightness = returnPacket[10] ?? 0;
			device.log(`LED ${led} is set to ${brightness * 100 / 255}% brightness.`, { toFile: true });

			return brightness * 100 / 255;
		}

		return -3;
	}
	/** Function to set a modern mouse's led brightness. If we use 0, it does all of the zones in the matrix.*/
	setModernMouseLEDBrightness(brightness, led = 0, detection = false, retryAttempts = 5) {
		let errorCode = 0;
		let attempts = 0;

		do {
			 const returnValues = Razer.ConfigPacketSend([0x03, 0x0f, 0x04, 0x01, led, brightness * 255 / 100]);
			 errorCode = returnValues[1];

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			if(!detection) {
				device.log("Error setting Modern Mouse LED Brightness. Error Code: " + Razer.DeviceResponses[errorCode], { toFile: true });
			}

			if (errorCode === 1) {
				return -2;
			}

			return -1;
		}

		return 0;
	}
}

const RazerMouse = new RazerMouseFunctions();

class DPIManager {
	constructor(DPIConfig) {
		this.currentStage = 1;
		this.sniperStage = 6;

		this.DPISetCallback = function () { device.log("No Set DPI Callback given. DPI Handler cannot function!"); };

		if (DPIConfig.hasOwnProperty("callback")) {
			this.DPISetCallback = DPIConfig.callback;
		}

		this.sniperMode = false;
		this.enableDpiControl = false;
		this.maxDPIStage = 5; //Default to 5 as it's most common if not defined
		this.dpiRollover = false;
		this.dpiStageValues = {};

		if (DPIConfig.hasOwnProperty("callback")) {
			this.dpiStageValues = DPIConfig.stages;
		} else {
			device.log("No Set DPI Callback given. DPI Handler cannot function!");
		}
	}

	/** Fetch Which DPI Stage We Are Currently Set To. Frequently used for DPI Lights. */
	getCurrentStage() { return this.currentStage; }
	/** Override Currently Set Stage Number. */
	setCurrentStage(currentStage) { this.currentStage = currentStage; }

	/** Get Current Max DPI Stage that the DPI Handler will increment through. */
	getMaxStage() { return this.maxDPIStage; }
	/** Set Max DPI Stage for the DPIHandler to increment through*/
	setMaxStage(maxDPIStage) { this.maxDPIStage = maxDPIStage; }

	/** Enables or Disables the DPIHandler*/
	setEnableControl(EnableDpiControl) {
		this.enableDpiControl = EnableDpiControl;
	}
	/** GetDpi Value for a given stage.*/
	getDpiValue(stage) {
		// This is a dict of functions, make sure to call them
		if(this.dpiStageValues[stage]() !== undefined && stage <= this.getMaxStage && stage > 0) {
			device.log("Current DPI Stage: " + stage);
			device.log("Current DPI: " + this.dpiStageValues[stage]());

			return this.dpiStageValues[stage]();
		}

		console.log("Failed to get DPI Value for given stage.", {toFile : true});

		return -1;
	}
	/** SetDpi Using Callback. Bypasses setStage.*/
	setDpi() {
		if (!this.enableDpiControl) {
			return;
		}

		if (this.sniperMode) {
			this.DPISetCallback(this.getDpiValue(6));
		} else {
			this.DPISetCallback(this.getDpiValue(this.currentStage));
		}
	}
	/** Increment DPIStage */
	increment() {
		this.setStage(this.currentStage + 1);
	}
	/** Decrement DPIStage */
	decrement() {
		this.setStage(this.currentStage - 1);
	}
	/** Set DPIStage and then set DPI to that stage.*/
	setStage(stage) {
		if (stage > this.maxDPIStage) {
			this.currentStage = this.dpiRollover ? 1 : this.maxDPIStage;
		} else if (stage < 1) {
			this.currentStage = this.dpiRollover ? this.maxDPIStage : 1;
		} else {
			this.currentStage = stage;
		}

		this.setDpi();
	}
	/** Stage update check to update DPI if current stage values are changed.*/
	DPIStageUpdated(stage) {
		// if the current stage's value was changed by the user
		// reapply the current stage with the new value
		if (stage === this.currentStage) {
			this.setDpi();
		}
	}
	/** Set Sniper Mode on or off. */
	SetSniperMode(sniperMode) {
		this.sniperMode = sniperMode;
		this.setDpi();
	}

}

const DPIConfig =
{
	stages:
	{
		1: function () { return dpi1; },
		2: function () { return dpi2; },
		3: function () { return dpi3; },
		4: function () { return dpi4; },
		5: function () { return dpi5; },
		6: function () { return dpi6; }
	},
	callback: function (dpi) { return RazerMouse.setDeviceSoftwareDPI(dpi); }
};

const DpiHandler = new DPIManager(DPIConfig);


class ByteTracker {
	constructor(vStart) {
		this.vCurrent = vStart;
		this.vPrev = vStart;
		this.vAdded = [];
		this.vRemoved = [];
	}

	Changed(avCurr) {
		// Assign Previous value before we pull new one.
		this.vPrev = this.vCurrent; //Assign previous to current.
		// Fetch changes.
		this.vAdded = avCurr.filter(x => !this.vPrev.includes(x)); //Check if we have anything in Current that wasn't in previous.
		this.vRemoved = this.vPrev.filter(x => !avCurr.includes(x)); //Check if there's anything in previous not in Current. That's removed.

		// Reassign current.
		this.vCurrent = avCurr;

		// If we've got any additions or removals, tell the caller we've changed.
		const bChanged = this.vAdded.length > 0 || this.vRemoved.length > 0;

		return bChanged;
	}

	Added() {
		return this.vAdded;
	}

	Removed() {
		return this.vRemoved;
	}
};

class BinaryUtils {
	static WriteInt16LittleEndian(value) {
		return [value & 0xFF, (value >> 8) & 0xFF];
	}
	static WriteInt16BigEndian(value) {
		return this.WriteInt16LittleEndian(value).reverse();
	}
	static ReadInt16LittleEndian(array) {
		return (array[0] & 0xFF) | (array[1] & 0xFF) << 8;
	}
	static ReadInt16BigEndian(array) {
		return this.ReadInt16LittleEndian(array.slice(0, 2).reverse());
	}
	static ReadInt32LittleEndian(array) {
		return (array[0] & 0xFF) | ((array[1] << 8) & 0xFF00) | ((array[2] << 16) & 0xFF0000) | ((array[3] << 24) & 0xFF000000);
	}
	static ReadInt32BigEndian(array) {
		if (array.length < 4) {
			array.push(...new Array(4 - array.length).fill(0));
		}

		return this.ReadInt32LittleEndian(array.slice(0, 4).reverse());
	}
	static WriteInt32LittleEndian(value) {
		return [value & 0xFF, ((value >> 8) & 0xFF), ((value >> 16) & 0xFF), ((value >> 24) & 0xFF)];
	}
	static WriteInt32BigEndian(value) {
		return this.WriteInt32LittleEndian(value).reverse();
	}
}

export function Validate(endpoint) {
	return endpoint.interface === 0 && endpoint.usage === 0x0002 || endpoint.interface === 1 && endpoint.usage === 0x0000 || endpoint.interface === 3 && endpoint.usage === 0x0001;
}

export function Image() {
	return "iVBORw0KGgoAAAANSUhEUgAAA+gAAAH0CAYAAAHZLze7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGTGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTI4VDE0OjM2OjQ5LTA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTAxLTI4VDE0OjM2OjQ5LTA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yOFQxNDozNjo0OS0wODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowZTlmMmUxNC1iZWE5LTM5NDgtODg3MS0zNGMwYWJjNWM4MTkiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo0MmE5NWZmYS1kMzVjLTZiNGEtOTU0Ni1jOGUxMzhkN2EwMTkiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowYWIxNzI3MS02ZTFhLTFlNDItODhkNy00NzA5NzhhMDcxMzYiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowYWIxNzI3MS02ZTFhLTFlNDItODhkNy00NzA5NzhhMDcxMzYiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjhUMTQ6MzY6NDktMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MGU5ZjJlMTQtYmVhOS0zOTQ4LTg4NzEtMzRjMGFiYzVjODE5IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTI4VDE0OjM2OjQ5LTA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPkVENDcyMDdGNDVFODc3QTkyNjRGNEQ4MzQ1MEQ2Q0U1PC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Rni0EgABo4hJREFUeJzs/XmcbMd13wl+Tyz33sys7dXb8PCwEAuxESBBEhAXcBepXbRs0fZ40dhqdbvtz7gt221Pu7tn2jP+jHvksbyNW93tkTdZVluyVkuyLdqiJEqiKJEESRAECBLEvrx9qyWXeyPizB+RiUoUHkCQBIl8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Dl/QnTvlNrbh4daIXTguoltfsE+63raYr9/vtkV92/W2yy3P1zn3w+ULunM/JrZE7KsFHY4X68KtRW/bLrB9y311fbsLW277Iu7cKeALunM/ZjYWz83K+M0F+6Trzdu25faLFu6Nn/OF3LlTxBd0537M3WGBX7n7jjlr93Wbx3HOnTK+oDv3GnPCwuuLsXOvcfqjfgLOOeece+V8QXfOOedeA3xBd845514DfEF3zjnnXgN8QXfOOedeA3xBd845514DfEF3zjnnXgN8QXfOOedeA3xBd879WJK1aTXOOe8U55z7MXHCAn7SkBnnfuL4gu6cO9VeYiS++llf2N1PHN9yd86dWndYzF/unzn3muQLunPuVLrNYr451/12P+fcTwxf0J1zP0588XbuBL6gO+d+XGwu2nf62rmfKL6gO+dOnS3b7Sd97Yu8cxNf0J1zp91LXbR9EXc/kXxBd879OJG7uO3cTyQ/h+7cy+SNypxzp4lH6M65Hyd2F7ed+4nkC7pz7rTbXKxf6tfO/UTwBd05dxrd7aLti7tzE1/QnXM/Lnzxdu42fEF3zv04OWnR9sXc/cTzBd05d1rdbvG2Lbfv9u8795rkC7pz7jS73aL8cv/MudckP4funDvtVovz3Rz894Xc/cTyBd059+Nic7GWLd9z7ieWmPl/D84559yPO8+hO+ecc68BvqA755xzrwG+oDvnnHOvAb6gO+ecc68BvqA755xzrwG+oDvnnHOvAb6gO+ecc68BvqA755xzrwG+oDvnnHOvAb6gO+ecc68BvqA755xzrwG+oDvnnHOvAT6cxTnnnHPOOeecOwV8x90555xzzjnnnDsFPEB3zjnnnHPOOedOAQ/QnXPOOeecc865U8ADdOecc84555xz7hTwAN0555xzzjnnnDsFPEB3zjnnnHPOOedOAQ/QnXPOOeecc865U8ADdOecc84555xz7hTwAN0555xzzjnnnDsFPEB3zjnnnHPOOedOAQ/QnXPOOeecc865U8ADdOecc84555xz7hTwAN0555xzzjnnnDsFPEB3zjnnnHPOOedOAQ/QnXPOOeecc865U8ADdOecc84555xz7hTwAN0555xzzjnnnDsFPEB3zjnnnHPOOedOAQ/QnXPOOeecc865U8ADdOecc84555xz7hTwAN0555xzzjnnnDsFPEB3zjnnnHPO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";
}