export function Name() { return "Razer Blackwidow V3 Mini"; }
export function VendorId() { return 0x1532; }
export function Documentation(){ return "troubleshooting/razer"; }
export function ProductId() { return 0x0258; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [15, 6]; }
export function Type() { return "Hid"; }
export function DefaultPosition() {return [75, 70]; }
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
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

const vKeys =
[
	0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 14, 15,
	16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31,
	32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45,     47,
	48,     50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 61, 62, 63,
	64, 65, 66,             70,         74, 75, 76, 77, 78, 79,
	// eslint-disable-next-line indent
							71,
];

const vLedNames =
[
	"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",  "Del",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",           "Page Up",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",        "Page Down",
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "Insert",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",
										 "Razer Logo",
];

const vLedPositions =
[
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0],           //15
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],           //15
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2],  		[14, 2],           //14
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],                    //14
	[0, 4], [1, 4], [2, 4],                         [6, 4],                 [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],           //10
	// eslint-disable-next-line indent
													[6, 5],

];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	Razer.getDeviceTransactionID();
	Razer.setAutomaticBatterySupport();
	//Razer.setNumberOfLEDs(vLedPositions.length); This won't work for a Keyboard
	Razer.getDeviceInfo();
	Razer.setDeviceMode(Razer.DeviceModes["SoftwareMode"]);
	Razer.setSoftwareLightingModeType2(); //This seems like it's more standard than the other one is.

}

export function Render() {
	grabLighting();
	getDeviceBatteryStatus();
}


export function Shutdown() {
	Razer.setDeviceMode(Razer.DeviceModes["HardwareMode"]);
}

function getDeviceBatteryStatus() {
	if (Date.now() - savedPollTimer < PollModeInternal) {
		return;
	}

	savedPollTimer = Date.now();

	if(Razer.Config.BatterySupport) {
		const battstatus = Razer.getDeviceChargingStatus();
		const battlevel = Razer.getDeviceBatteryLevel();

		battery.setBatteryState(battstatus);
		battery.setBatteryLevel(battlevel);
	}
}

function grabLighting(shutdown = false) {
	const RGBData = [];
	let TotalLedCount =  80; //This keeb only has 68 keys but we fall just under the last packet with offsets.

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

	while(TotalLedCount > 0) {
		const ledsToSend = TotalLedCount >= 15 ? 15 : TotalLedCount;

		TotalLedCount -= ledsToSend;
		Razer.setKeyboardDeviceColor(ledsToSend, RGBData.splice(0, (ledsToSend+1)*3), packetCount);
		packetCount++;
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

class RazerProtocol {
	constructor() {
		/** Defines for the 3 device modes that a Razer device can be set to. FactoryMode should never be used, but is here as reference. */
		this.DeviceModes =
		{
			"HardwareMode" : 0x00,
			"FactoryMode"  : 0x02,
			"SoftwareMode" : 0x03,
		};

		this.LEDIDs =
		{
			"Scroll_Wheel" : 0x01,
			"Battery"	   : 0x02,
			"Logo"         : 0x03,
			"Backlight"    : 0x04,
			"Macro"        : 0x05,
			"Game"         : 0x06,
			"Red_Profile"  : 0x0C,
			"Green_Profile": 0x0D,
			"Blue_Profile" : 0x0E,
			"Unknown6"     : 0x0F,
			"Right_Side"   : 0x10,
			"Left_Side"    : 0x11,
			"Charging"     : 0x20,
		};

		this.Config =
		{
			/** ID used to tell which device we're talking to. Most devices have a hardcoded one, but hyperspeed devices can have multiple if a dongle has multiple connected devices. */
			TransactionID  		: 0x1f,
			 /** Reserved for Hyperspeed Pairing. Holds additional Transaction ID's for extra paired hyperspeed devices. @type {number[]} */
			AdditionalDeviceTransactionIDs : [],
			 /** Stored Firmware Versions for Hyperspeed dongles. We're keeping an array here in case a device has two nonconsecutive transaction ID's. @type {number[]} */
			AdditionalDeviceFirmwareVersions : [],
			 /** Stored Serials for Hyperspeed dongles. @type {string[]} */
			AdditionalDeviceSerialNumbers : [],
			//TODO: Add backup logic for rechecking firmware versions. I also need to figure out if every device supports firmware version. If every device supports serial numbers, I would much prefer to use those.
			//Proper Serials would allow me to ensure that we can easily crosscheck devices.
			/** Variable defining how many writes a device requires to get the expected result out of it. */
			PacketWrites   		: 1,
			/** Variable defining how many reads a device requires to get the expected result out of it. */
			PacketReads    		: 1,
			/** Variable to tell how many LEDs a device has, used in the color send packet for mice. Does not apply for keyboards. */
			NumberOfLEDs   		: -1,
			/** Variable to tell how many leds should be sent per packet. */
			LEDsPerPacket   	: -1,
			MouseType	   		: "Modern", //if this isn't set default to modern as it is the most common
			/** Variable to tell if a device supports battery percentage. */
			BatterySupport 		: false,
			/** Variable to tell if a dongle has multiple devices paired to it. */
			HyperspeedSupport 	: false,
			 /** Stored Firmware Version to compare against for hyperspeed dongles. We'll update this each time so that we find any and all devices. @type {number[]} */
			LastFirmwareVersion: [],
			 /** Stored Serial Number to compare against for hyperspeed dongles. We'll update this each time so that we find any and all devices.@type {number[]} */
			LastSerial: []
		};
	}
	/** Function to set our TransactionID*/
	setTransactionID(TransactionID) {
		this.Config.TransactionID = TransactionID;
	}
	/** Function to set a device's required number of packet reads.*/
	setPacketReads(PacketReads) {
		this.Config.PacketReads = PacketReads;
	}
	/** Function to set a device's required number of packet reads.*/
	setPacketWrites(PacketWrites) {
		this.Config.PacketWrites = PacketWrites;
	}
	/** Function for setting the number of LEDs a device has on it.*/
	setNumberOfLEDs(NumberOfLEDs) {
		this.Config.NumberOfLEDs = NumberOfLEDs;
	}
	/** Function for setting whether a mouse uses modern or legacy lighting.*/
	setMouseType(MouseType) {
		this.Config.MouseType = MouseType;
	}
	/** Function for setting whether a mouse supports battery percentage or not using autodetection.*/
	setAutomaticBatterySupport() {
		const batterylevel = this.getDeviceBatteryLevel();

		if(batterylevel > 0) {
			device.addFeature("battery");
			this.Config.BatterySupport = true;
		}
	}

	setBatterySupport(BatterySupport) //I could probably make this automatic at some point.
	{
		this.Config.BatterySupport = BatterySupport;

		if(BatterySupport) {
			device.addFeature("battery");
		}
	}
	/** Wrapper function for Writing Config Packets.*/
	ConfigPacketSend(packet, TransactionID = this.Config.TransactionID) {
		for(let packetLoop = 0; packetLoop < this.Config.PacketWrites; packetLoop++) {
			this.StandardPacketSend(packet, TransactionID);
			device.pause(10);
		}
	}
	/** Wrapper function for Reading Config Packets.*/
	ConfigPacketRead(TransactionID = this.Config.TransactionID) {
		let returnpacket = [];

		for(let readLoop = 0; readLoop < this.Config.PacketReads; readLoop++) {
			returnpacket = device.get_report([0x00, 0x00, TransactionID], 91);
		}

		return returnpacket.slice(9, 90);
	}
	/** Wrapper function for Writing Standard Packets, such as RGB Data.*/
	StandardPacketSend(data, TransactionID = this.Config.TransactionID) //Wrapper for always including our CRC
	{
		const packet = [0x00, 0x00, TransactionID, 0x00, 0x00, 0x00];
		data  = data || [ 0x00, 0x00, 0x00 ];
		packet.push(...data);
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
	getDeviceTransactionID()//Most devices return at minimum 2 Transaction ID's. We throw away any besides the first one.
	{
		const possibleTransactionIDs = [0x1f, 0x2f, 0x3f, 0x4f, 0x5f, 0x6f, 0x7f, 0x8f, 0x9f];
		let devicesFound = 0;

		do {
			for(let testTransactionID = 0x00; testTransactionID < possibleTransactionIDs.length; testTransactionID++) {
				const TransactionID = possibleTransactionIDs[testTransactionID];
				const packet = [ 0x02, 0x00, 0x82 ];
				this.ConfigPacketSend(packet, TransactionID);

				const returnpacket = this.ConfigPacketRead(TransactionID);
				const Serialpacket = returnpacket.slice(0, 15);

				if(Serialpacket.every(item => item !== 0)) {
					const SerialString = String.fromCharCode(...Serialpacket);

					devicesFound = this.checkDeviceTransactionID(TransactionID, SerialString, devicesFound);
				}
			}
		}
		while(devicesFound === 0);
	}
	/**Function to ensure that a grabbed transaction ID is not for a device we've already found a transaction ID for.*/
	checkDeviceTransactionID(TransactionID, SerialString, devicesFound) {
		if(SerialString.length === 15 && devicesFound === 0) {
			this.Config.TransactionID = TransactionID;
			devicesFound++;
			device.log("Valid Serial Returned:" + SerialString);
			this.Config.LastSerial = SerialString; //Store a serial to compare against later.
		} else if(SerialString.length === 15 && devicesFound > 0 && this.Config.LastSerial !== SerialString) {
			if(SerialString in this.Config.AdditionalDeviceSerialNumbers) {return devicesFound; } //This deals with the edge case of a device having nonconcurrent transaction ID's. We skip this function if the serials match.

			device.log("Multiple Devices Found, Assuming this is a Hyperspeed Dongle and has more than 1 device connected.");
			this.Config.HyperspeedSupport = true;
			this.Config.AdditionalDeviceTransactionIDs.push(TransactionID);
			device.log("Valid Serial Returned:" + SerialString);
			this.Config.AdditionalDeviceSerialNumbers.push(SerialString);
			this.Config.LastSerial = SerialString; //Store a serial to compare against later.
		}

		return devicesFound;
	}
	/**Deprecated function to grab a device's transaction ID using the Firmware Version Command.*/
	getDeviceTransactionIDFirmware()//Hopefully deprecated
	{
		const possibleTransactionIDs = [0x1f, 0x2f, 0x3f, 0x4f, 0x5f, 0x6f, 0x7f, 0x8f, 0x9f];
		let devicesFound = 0;

		do {
			for(let testTransactionID = 0x00; testTransactionID < possibleTransactionIDs.length; testTransactionID++) {
				const TransactionID = possibleTransactionIDs[testTransactionID];
				const packet = [ 0x02, 0x00, 0x81 ];
				this.ConfigPacketSend(packet, TransactionID);

				const returnpacket = this.ConfigPacketRead(TransactionID);
				const FirmwareVersion = returnpacket.slice(0, 2);

				devicesFound = this.checkDeviceTransactionID(TransactionID, FirmwareVersion, devicesFound);
			}
		}
		while(devicesFound === 0);
	}
	/**Deprecated function to ensure that a grabbed transaction ID is not for a device we've already found a transaction ID for. Uses Firmware Version rather than serial, which has the possibility for overlap.*/
	checkDeviceTransactionIDFirmware(TransactionID, FirmwareVersion, devicesFound)//Hopefully deprecated
	{
		if(FirmwareVersion[0] !== 0 && devicesFound === 0|| FirmwareVersion[1] !== 0 && devicesFound === 0) {
			this.Config.TransactionID = TransactionID;
			devicesFound++;
			device.log("Valid Firmware Version Reported:" + FirmwareVersion);
			this.Config.LastFirmwareVersion = FirmwareVersion; //Store a firmware version to compare against later.
		} else if(FirmwareVersion[0] !== 0 && devicesFound > 0 && this.Config.LastFirmwareVersion[0] !== FirmwareVersion[0] || FirmwareVersion[1] !== 0 && devicesFound > 0&& this.Config.LastFirmwareVersion[1] !== FirmwareVersion[1]) {
			if(FirmwareVersion in this.Config.AdditionalDeviceFirmwareVersions) {return devicesFound; } //This deals with the edge case of a device having nonconcurrent transaction ID's. We skip this function if the serials match.

			device.log("Multiple Devices Found, Assuming this is a Hyperspeed Dongle and has more than 1 device connected.");
			this.Config.HyperspeedSupport = true;
			this.Config.AdditionalDeviceTransactionIDs.push(TransactionID);
			this.Config.AdditionalDeviceFirmwareVersions.push(FirmwareVersion);
			device.log("Valid Firmware Version Reported:" + FirmwareVersion);
			this.Config.LastFirmwareVersion = FirmwareVersion; //Store a firmware version to compare against later.
		}

		return devicesFound;
	}

	getDeviceInfo() {
		this.getDeviceFirmwareVersion();
		this.getDeviceSerial();
		this.getDeviceMode();
	}
	/** Function to check if a device is in Hardware Mode or Software Mode. */
	getDeviceMode() {
		const packet = [ 0x02, 0x00, 0x84 ]; //openrazer is 2,3,1
		this.ConfigPacketSend(packet);

		const returnpacket = this.ConfigPacketRead();
		const deviceMode = returnpacket[0];
		device.log("Current Device Mode: " + deviceMode);

		return deviceMode;
	}
	/** Function to check if a device is charging or discharging. */
	getDeviceChargingStatus() {
		const packet = [ 0x02, 0x07, 0x84 ];
		this.ConfigPacketSend(packet);

		const returnpacket = this.ConfigPacketRead();
		const batteryStatus = returnpacket[1];
		device.log("Charging Status: " + batteryStatus);

		return batteryStatus+1;
	}
	/** Function to check a device's battery percentage.*/
	getDeviceBatteryLevel() {
		const packet = [0x02, 0x07, 0x80];
		this.ConfigPacketSend(packet);

		const returnpacket = this.ConfigPacketRead();
		const batteryLevel = Math.floor(((returnpacket[1])*100)/255);
		device.log("Device Battery Level: " + batteryLevel);

		return batteryLevel;
	}
	/** Function to fetch a device's serial number. This serial is the same as the one printed on the physical device.*/
	getDeviceSerial() {
		const packet = [ 0x16, 0x00, 0x82 ];
		this.ConfigPacketSend(packet);

		const returnpacket = this.ConfigPacketRead();


		const Serialpacket = returnpacket.slice(0, 15);
		const SerialString = String.fromCharCode(...Serialpacket);
		device.log("Device Serial: " + SerialString);

		return SerialString;
	}
	/** Function to check a device's firmware version.*/
	getDeviceFirmwareVersion() {
		const packet = [ 0x02, 0x00, 0x81 ];
		this.ConfigPacketSend(packet);

		const returnpacket = this.ConfigPacketRead();
		const FirmwareByte1 = returnpacket[0];
		const FirmwareByte2 = returnpacket[1];
		device.log("Firmware Version: " + FirmwareByte1 + "." + FirmwareByte2);

		return [FirmwareByte1, FirmwareByte2];
	}
	/** Function to fetch a device's onboard DPI levels. We do not currently parse this at all.*/
	getDeviceDPI() //I may be able to use this to find a device's max DPI?
	{
		const packet = [ 0x26, 0x04, 0x86, 0x01 ];
		this.ConfigPacketSend(packet);

		let returnpacket = this.ConfigPacketRead();
		returnpacket = this.ConfigPacketRead();
		device.log(returnpacket);
	}
	/** Function to fetch a device's polling rate. We do not currently parse this at all.*/
	getDevicePollingRate() {
		const packet = [ 0x01, 0x00, 0x85 ];
		this.ConfigPacketSend(packet);

		const returnpacket = this.ConfigPacketRead();
		const pollingRate = returnpacket[0];
		device.log("Polling Rate: " + pollingRate);
	}
	/** Function to set a device's mode between hardware and software.*/
	setDeviceMode(mode) {
		const packet = [0x02, 0x00, 0x04, this.DeviceModes[mode]];
		this.ConfigPacketSend(packet);
		this.ConfigPacketRead();
	}
	/** Function to set at what battery percentage a device will enter low power mode.*/
	setDeviceLowPowerPercentage(lowPowerPercentage = 15) {
		const packet = [0x01, 0x07, 0x01, Math.floor(((lowPowerPercentage)*100)/255)];
		this.ConfigPacketSend(packet);
	}
	/** Function to set a device's polling rate.*/
	setDevicePollingRate(pollingRate = 1000) {
		const packet = [0x01, 0x00, 0x05, 1000/pollingRate];
		this.ConfigPacketSend(packet);
	}
	/** Function to set a device's lift off distance.*/
	setDeviceLOD(asymmetricLOD = true, liftOffDistance = 1) {
		const packet = [0x04, 0x0b, 0x0b, 0x00, 0x04, (asymmetricLOD ? 0x02 : 0x01), (liftOffDistance - 1)];
		this.ConfigPacketSend(packet);
	}
	/** Function to set a device's current stage dpi. We leverage this with software buttons to emulate multiple stages.*/
	setDeviceSoftwareDPI(dpi) {
		const packet = [0x07, 0x04, 0x05, 0x00, Math.floor(dpi/256), dpi%256, Math.floor(dpi/256), dpi%256];
		this.ConfigPacketSend(packet);
		device.pause(20);
	}
	/** Function to set multiple dpi stages. We can set how many stages a device has, and this is saved onboard. This works with hardware buttons.*/
	setDeviceDPI(stage = 1, dpiStages = 5, dpi1= 500, dpi2 = 1000, dpi3 = 2000, dpi4 = 3000, dpi5 = 6000) {
		const packet = [0x26, 0x04, 0x06, 0x01, stage, dpiStages, 0x00];

		packet[7] = Math.floor(dpi1/256);
		packet[8] = dpi1%256;
		packet[9] = Math.floor(dpi1/256);
		packet[10] = dpi1%256;
		packet[11] = 0x00;
		packet[12] = 0x00;
		packet[13] = 0x01;
		packet[14] = Math.floor(dpi2/256);
		packet[15] = dpi2%256;
		packet[16] = Math.floor(dpi2/256);
		packet[17] = dpi2%256;
		packet[18] = 0x00;
		packet[19] = 0x00;
		packet[20] = 0x02;
		packet[21] = Math.floor(dpi3/256);
		packet[22] = dpi3%256;
		packet[23] = Math.floor(dpi3/256);
		packet[24] = dpi3%256;
		packet[25] = 0x00;
		packet[26] = 0x00;
		packet[27] = 0x03;
		packet[28] = Math.floor(dpi4/256);
		packet[29] = dpi4%256;
		packet[30] = Math.floor(dpi4/256);
		packet[31] = dpi4%256;
		packet[32] = 0x00;
		packet[33] = 0x00;
		packet[34] = 0x04;
		packet[35] = Math.floor(dpi5/256);
		packet[36] = dpi5%256;
		packet[37] = Math.floor(dpi5/256);
		packet[38] = dpi5%256;

		this.ConfigPacketSend(packet);
		device.pause(50);
		this.getDeviceDPI();

	}

	setDeviceScrollMode(ScrollMode = false) {
		const packet = [0x02, 0x02, 0x14, 0x01, (ScrollMode ? 0x01 : 0x00)];
		this.ConfigPacketSend(packet);
	}

	setDeviceScrollAccel(ScrollAccel = false) {
		const packet = [0x02, 0x02, 0x16, 0x01, (ScrollAccel ? 0x01 : 0x00)];
		this.ConfigPacketSend(packet);
	}

	setDeviceSmartReel(SmartReel = false) {
		const packet = [0x02, 0x02, 0x17, 0x01, (SmartReel ? 0x01 : 0x00)];
		this.ConfigPacketSend(packet);
	}
	/** Function to set whether an led is on or off. I believe this may only apply to legacy devices and requires testing.*/
	setLEDState(led, saving, state) {
		const packet = [0x03, 0x03, 0x00, saving? 0x01 : 0x00, led, state? 0x01 : 0x00];
		this.StandardPacketSend(packet);
	}
	/** Function to set a legacy mouse's led effect.*/
	setStandardLEDEffect(zone) //This should only need set once?
	{
		const packet = [ 0x03, 0x03, 0x02, 0x00, zone ]; //Applies to Deathadder Chroma and older mice 0x00 is save to flash variable
		this.StandardPacketSend(packet);
	}
	/** Function to set a modern device's effect*/
	setExtendedMatrixEffect(data) {
		const packet = [ 0x06, 0x0f, 0x02 ]; //6 is length of argument
		data  = data || [ 0x00, 0x00, 0x00 ];
		packet.push(...data);
		this.StandardPacketSend(packet);
	}
	/** Function to set a modern device's effect to whatever signal uses. I believe it is static. This packet is rarely used.*/
	setSoftwareLightingModeType()//Not all devices require this, but it seems to be sent to all of them?
	{
		this.setExtendedMatrixEffect([ 0x00, 0x00, 0x08, 0x00, 0x00 ]);
	}
	/** Function to set a modern device's effect to whatever signal uses. I believe it is static. Most devices send this packet. */
	setSoftwareLightingModeType2()//Not all devices require this, but it seems to be sent to all of them?
	{
		this.setExtendedMatrixEffect([ 0x00, 0x00, 0x08, 0x01, 0x01 ]);
	}
	/** Handler function to set mouse lighting regardless of protocol.*/
	setMouseLighting(RGBData) {
		if(this.Config.MouseType === "Modern") {
			this.setModernMouseDeviceColor(RGBData);
		} else {
			this.setStandardMouseLEDColor(RGBData);
		}
	}
	/** Function to set a legacy mouse's led color.*/
	setStandardMouseLEDColor(zone, rgbdata) //Color for Deathadder Chroma
	{
		const packet = [ 0x05, 0x03, 0x01, 0x00, zone, rgbdata[0], rgbdata[1], rgbdata[2] ];
		this.StandardPacketSend(packet);
	}
	/** Function to set a modern mouse's led colors.*/
	setModernMouseDeviceColor(RGBData) {
		const packet = [(this.Config.NumberOfLEDs*3 + 5), 0x0F, 0x03, 0x00, 0x00, 0x00, 0x00, this.Config.NumberOfLEDs];
		packet.push(...RGBData);
		this.StandardPacketSend(packet);
	}
	/** Function to set a modern keyboard's led colors.*/
	setKeyboardDeviceColor(NumberOfLEDs, RGBData, packetidx) {
		const packet = [(NumberOfLEDs*3 + 5), 0x0F, 0x03, 0x00, 0x00, packetidx, 0x00, NumberOfLEDs];
		packet.push(...RGBData);
		this.StandardPacketSend(packet);
	}
}

const Razer = new RazerProtocol();

export function Validate(endpoint) {
	return endpoint.interface === 3;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v3-mini.png";
}