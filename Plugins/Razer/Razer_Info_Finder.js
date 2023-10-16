export function Name() { return "Razer Device Information Extractor"; }
export function VendorId() { return 0x1532; }
export function Documentation() { return "troubleshooting/razer"; }
export function ProductId() { return 0x0000; } //Add a PID as needed.
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function Type() { return "Hid"; }
export function DefaultPosition() { return [225, 120]; }
export function DefaultScale() { return 15.0; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
deviceType:readonly
*/
export function ControllableParameters() {
	return [
		{ "property": "shutdownColor", "group": "lighting", "label": "Shutdown Color", "min": "0", "max": "360", "type": "color", "default": "009bde" },
		{ "property": "LightingMode", "group": "lighting", "label": "Lighting Mode", "type": "combobox", "values": ["Canvas", "Forced"], "default": "Canvas" },
		{ "property": "forcedColor", "group": "lighting", "label": "Forced Color", "min": "0", "max": "360", "type": "color", "default": "#009bde" },
		{ "property": "deviceType", "group": "", "label": "Testing Device Type", "type": "combobox", "values": ["Keyboard", "Mouse", "Other"], "default": "Canvas" },
	];
}

let macroTracker;

export function LedNames() {
	return Razer.getDeviceLEDNames(); //The point of this file is to be a barebones test harness. It can handle every type of device as far as I'm aware, but most variables need set manually.
} //This includes all RGB send functions. By default I have placed both a grabber for keyboard lighting and mouse lighting, but they are never called and have no led setups attached to them.

export function LedPositions() {
	return Razer.getDeviceLEDPositions();
}

export function Initialize() {
	Razer.setDeviceEndpoint(0, 0x0002, 0x0001); //Set Main communication endpoint.
	device.set_endpoint(Razer.Config.deviceEndpoint[`interface`], Razer.Config.deviceEndpoint[`usage`], Razer.Config.deviceEndpoint[`usage_page`]);
	Razer.getDeviceTransactionID(); //Fetch all available transaction ids for connected devices. This does include multipaired devices to a single dongle.
	Razer.detectSupportedFeatures(); //Detect most supported features, excluding lighting. Logged to file.
	Razer.getDeviceLEDZones(); //Fetch all possible LED Zones a device has.
	Razer.setDeviceMode("Software Mode"); //Set to software mode, so that we can properly detect any and all extra keys a device has.
	Razer.setDeviceType(deviceType); //set Device Type for setting effect and handling key inputs.
	Razer.setDeviceMacroProperties(); //set macro device settings, such as device type.
	Razer.setSoftwareLightingMode(); //Detect if it supports legacy or Modern Matrix. If it supports neither it's legacy or it's a keeb.
}

export function Render() {
	detectInputs(); //get all macro key inputs.
}

export function Shutdown() {
	if(Razer.getDeviceType() === "Mouse") {
		Razer.setModernMatrixEffect([0x00, 0x00, 0x03]); //0x00, led, effect. We don't know what 8 is for the first position, but it's used for mouse software mode for lighting on some mice.
		RazerMouse.setModernMouseLEDBrightness(100, 0); //Mouse
	} else if(Razer.getDeviceType() === "Keyboard") {
		Razer.setModernMatrixEffect([0x00, 0x05, 0x03]); //5 is macro or keyboard. I can get fancy with this as we fetch zones that exist.
		RazerMouse.setModernMouseLEDBrightness(100, 5); //Keyboard
	}

	Razer.setDeviceMode("Hardware Mode");
}

function detectInputs() {

	device.set_endpoint(1, 0x00000, 0x0001);

	const packet = device.read([0x00], 16, 0);

	const currentMacroArray = packet.slice(1, 10);

	if (Razer.Config.SupportedFeatures.HyperspeedSupport) {
		device.set_endpoint(1, 0x00000, 0x0001, 0x0006);
	} else {
		device.set_endpoint(1, 0x00000, 0x0001, 0x0005);
	}


	const sleepPacket = device.read([0x00], 16, 0);

	if (sleepPacket[0] === 0x05 && sleepPacket[1] === 0x09 && sleepPacket[2] === 0x03) { //additional arg to most likely represent which device it is to the receiver as BWV3 Mini reports 0x02 for byte 3
		device.log(`Device woke from sleep. Reinitializing and restarting render loop.`);
		Razer.Config.deviceSleepStatus = false;
		device.pause(3000);
	}

	if (sleepPacket[0] === 0x05 && sleepPacket[1] === 0x09 && sleepPacket[2] === 0x02) {
		device.log(`Device went to sleep. Suspending render loop until device wakes.`);
		Razer.Config.deviceSleepStatus = true;
	}

	device.set_endpoint(Razer.Config.deviceEndpoint[`interface`], Razer.Config.deviceEndpoint[`usage`], Razer.Config.deviceEndpoint[`usage_page`]);

	if (!macroTracker) { macroTracker = new ByteTracker(currentMacroArray); spawnMacroHelpers(); device.log("Macro Tracker Spawned."); }

	if (packet[0] === 0x04) {

		if (macroTracker.Changed(currentMacroArray)) {
			processInputs(macroTracker.Added(), macroTracker.Removed());
		}
	}
}

function spawnMacroHelpers() {
	if(Razer.getDeviceType() === "Keyboard") {
		device.addFeature("keyboard");
	} else if(Razer.getDeviceType() === "Mouse"){
		device.addFeature("mouse");
	}
}

function processInputs(Added, Removed) {

	for (let values = 0; values < Added.length; values++) {
		const input = Added.pop();

		if(Razer.getDeviceType() === "Keyboard") {
			processKeyboardInputs(input);
		} else if(Razer.getDeviceType() === "Mouse") {
			processMouseInputs(input);
		}
	}

	for (let values = 0; values < Removed.length; values++) {
		const input = Removed.pop();

		if(Razer.getDeviceType() === "Keyboard") {
			processKeyboardInputs(input, true);
		} else if(Razer.getDeviceType() === "Mouse") {
			processMouseInputs(input, true);
		}
	}
}

function processKeyboardInputs(input, released = false) {
	if(input === 0x01) {
		return;
	}

	const eventData = { key : Razer.getInputDict()[input], keyCode : 0, "released": released };
	device.log(`${Razer.getInputDict()[input]} Hit. Release Status: ${released}`);
	keyboard.sendEvent(eventData, "Key Press");
}

function processMouseInputs(input, released = false) {
	if(released) {
		if(input === 0x51) {
			device.log("DPI Clutch Released.");
		} else {
			const eventData = { "buttonCode": 0, "released": true, "name": Razer.getInputDict()[input] };
			device.log(Razer.getInputDict()[input] + " released.");
			mouse.sendEvent(eventData, "Button Press");
		}

		return;
	}

	switch (input) {
	case 0x20:
		device.log("DPI Up");
		break;
	case 0x21:
		device.log("DPI Down");
		break;

	case 0x51:
		device.log("DPI Clutch Hit.");
		break;
	case 0x52:
		device.log("DPI Cycle Hit.");
		break;
	default:
		const eventData = { "buttonCode": 0, "released": false, "name": Razer.getInputDict()[input] };
		device.log(Razer.getInputDict()[input] + " hit.");
		mouse.sendEvent(eventData, "Button Press");
	}
}

function grabKeyboardLighting(shutdown = false) { //You must set the led arrays before calling this.
	const RGBData = [];
	const vLedPositions = Razer.getDeviceLEDPositions();
	const vKeys = Razer.getDeviceLEDIndexes();

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		let col;
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}
		const iLedIdx = vKeys[iIdx] * 3;
		RGBData[iLedIdx] = col[0];
		RGBData[iLedIdx+1] = col[1];
		RGBData[iLedIdx+2] = col[2];
	}

	let packetCount = 0;

	do {
		const ledsToSend = Math.min(15, (RGBData.length/3));

		Razer.setKeyboardDeviceColor(ledsToSend, RGBData.splice(0, (ledsToSend+1)*3), packetCount);
		packetCount++;
	}
	while(RGBData.length > 15);
}

function grabMouseColors(shutdown = false) { //You must set the led arrays before calling this.
	const vLedPositions = Razer.getDeviceLEDPositions();

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

		this.mouseInputDict = {
			0x20 : "DPI Up",
			0x21 : "DPI Down",
			0x22 : "Right Back Button",
			0x23 : "Right Forward Button",
			0x50 : "Profile Button",
			0x51 : "DPI Clutch",
			0x52 : "DPI Cycle",
			0x54 : "Scroll Accel Button"
		};

		this.keyboardInputDict = {
			0x20 : "M1",
			0x21 : "M2",
			0x22 : "M3",
			0x23 : "M4"
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
			"Macro": 0x05, //pretty sure this just screams that it's a keyboard.
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
			/** Variable that holds current device's LED Names. */
			DeviceLEDNames : [],
			/** Variable that holds current device's LED Positions. */
			DeviceLEDPositions : [],
			/** Variable that holds current device's LED vKeys. */
			DeviceLedIndexes : [],
			/** Variable that holds the current device's Product ID. */
			DeviceProductId : 0x00,
			/** Dict for button inputs to map them with names and things. */
			inputDict : {},

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

	setDeviceEndpoint(deviceInterface, usage, usage_page) {
		this.Config.deviceEndpoint = { "interface": deviceInterface, "usage": usage, "usage_page": usage_page };
	}

	getDeviceProductId() { return this.Config.DeviceProductId; }
	setDeviceProductId(productId) { this.Config.DeviceProductId = productId; }

	/** Function to set our TransactionID*/
	setTransactionID(TransactionID) { this.Config.TransactionID = TransactionID; }

	getDeviceType() { return this.Config.DeviceType; }
	setDeviceType(DeviceType) { this.Config.DeviceType = DeviceType; }

	getInputDict() { return this.Config.inputDict; }
	setInputDict(InputDict) { this.Config.inputDict = InputDict; }

	getNumberOfLEDs() { return this.Config.NumberOfLEDs; }
	/** Function for setting the number of LEDs a device has on it.*/
	setNumberOfLEDs(NumberOfLEDs) { this.Config.NumberOfLEDs = NumberOfLEDs; }

	getDeviceLEDNames(){ return this.Config.DeviceLEDNames; }
	setDeviceLEDNames(DeviceLEDNames) { this.Config.DeviceLEDNames = DeviceLEDNames; }

	getDeviceLEDPositions(){ return this.Config.DeviceLEDPositions; }
	setDeviceLEDPositions(DeviceLEDPositions){ this.Config.DeviceLEDPositions = DeviceLEDPositions; }

	getDeviceLEDIndexes(){ return this.Config.DeviceLedIndexes; }
	setDeviceLEDIndexes(DeviceLedIndexes){ this.Config.DeviceLedIndexes = DeviceLedIndexes; }

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

		if (HyperspeedSupport !== -1) {
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
			device.log(`Device Transaction ID: ${TransactionID.toString(16)}`);
			this.Config.LastSerial = SerialString; //Store a serial to compare against later.
		} else if (SerialString.length === 15 && devicesFound > 0 && this.Config.LastSerial !== SerialString) {
			if (SerialString in this.Config.AdditionalDeviceSerialNumbers) { return devicesFound; } //This deals with the edge case of a device having nonconcurrent transaction ID's. We skip this function if the serials match.

			device.log("Multiple Devices Found, Assuming this is a Hyperspeed Dongle and has more than 1 device connected.");
			this.Config.SupportedFeatures.HyperspeedSupport = true;
			this.Config.AdditionalDeviceTransactionIDs.push(TransactionID);
			device.log(`Additional Devices Transaction ID: ${TransactionID.toString(16)}`);
			device.log("Valid Serial Returned:" + SerialString);
			this.Config.AdditionalDeviceSerialNumbers.push(SerialString);
			this.Config.LastSerial = SerialString; //Store a serial to compare against later.
		}

		return devicesFound;
	}
	setDeviceMacroProperties() {
		if (this.getDeviceType() === "Keyboard") {
			this.setInputDict(razerDeviceLibrary.keyboardInputDict);
		} else {
			this.setInputDict(razerDeviceLibrary.mouseInputDict);
		}
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
			device.log("Device uses Modern Mouse Protocol for Lighting.", { toFile: true });

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
		const returnValues = this.ConfigPacketSend([0x06, 0x0f, 0x02].concat(data)); //flash, zone, effect are additional args after length and idk what f and 2 are.

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
	/** Function to set a modern keyboard's led colors.*/
	setKeyboardDeviceColor(NumberOfLEDs, RGBData, packetidx) {
		this.StandardPacketSend([(NumberOfLEDs*3 + 5), 0x0F, 0x03, 0x00, 0x00, packetidx, 0x00, NumberOfLEDs].concat(RGBData));
	}
}

const Razer = new RazerProtocol();

class RazerMouseFunctions {
	constructor() {
	}

	/** Function to set a device's lift off distance.*/
	setDeviceLOD(asymmetricLOD, liftOffDistance) { //I don't have the getter for this.
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
	setMouseLighting(RGBData, NumberOfLEDs = Razer.getNumberOfLEDs(), hyperflux = false) { //no returns on this or the led color sets. I do not care.
		if(Razer.getDeviceProductId() === 0x0046) { //I'll leave this behind for now.
			Razer.StandardPacketSend([(NumberOfLEDs * 3 + 5), 0x03, 0x0C, 0x00, 0x00, 0x00, 0x00, NumberOfLEDs - 1].concat(RGBData));
		} else {
			Razer.StandardPacketSend([(NumberOfLEDs * 3 + 5), 0x0F, 0x03, hyperflux ? 1 : 0, 0x00, 0x00, 0x00, NumberOfLEDs - 1].concat(RGBData));
		}
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
	return endpoint.interface === 0 || endpoint.interface === 1 || endpoint.interface === 2 || endpoint.interface === 3 || endpoint.interface === 4;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-pro.png";
}