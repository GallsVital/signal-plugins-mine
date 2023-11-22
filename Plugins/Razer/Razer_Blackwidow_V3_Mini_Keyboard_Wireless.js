export function Name() { return "Razer Blackwidow V3 Mini"; }
export function VendorId() { return 0x1532; }
export function Documentation(){ return "troubleshooting/razer"; }
export function ProductId() { return 0x0271; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [16, 6]; }
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
	Razer.detectSupportedFeatures();
	Razer.getDeviceLEDZones();

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

	if(Razer.Config.SupportedFeatures.BatterySupport) {
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

	if(Razer.Config.spawnedSubdevices.length > 0) {

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

class RazerLEDLibrary {
	constructor() {

		this.PIDLibrary =
		{
			0x006B : "Abyssus Essential",
			0x0065 : "Basilisk Essential",
			0x0086 : "Basilisk Ultimate",
			0x0088 : "Basilisk Ultimate",
			0x0085 : "Basilisk V2",
			0x00aa : "Basilisk V3 Pro",
			0x00ab : "Basilisk V3 Pro",
			0x0271 : "Blackwidow V3 Mini",
			0x0258 : "Blackwidow V3 Mini",
			0x005C : "Deathadder Elite",
			0x008C : "Deathadder Mini",
			0x0084 : "Deathadder V2",
			0x007C : "Deathadder V2 Pro",
			0x007D : "Deathadder V2 Pro",
			0x0059 : "Lancehead",
			0x0070 : "Lancehead",
			0x006f : "Lancehead",
			0x0060 : "Lancehead Tournament Edition",
			0x006c : "Mamba Elite",
			0x0073 : "Mamba",
			0x0072 : "Mamba",
			0x0068 : "Mamba Hyperflux",
			0x0046 : "Mamba Tournament Edition",
			0x0053 : "Naga Chroma",
			0x008D : "Naga Lefthand",
			0x008F : "Naga Pro",
			0x0090 : "Naga Pro",
			0x0067 : "Naga Trinity",
			0x0096 : "Naga X",
			0x0091 : "Viper 8KHz",
			0x008a : "Viper Mini",
			0x0078 : "Viper",
			0x007A : "Viper Ultimate",
			0x007B : "Viper Ultimate"
		};

		this.LEDLibrary = //I'm tired of not being able to copy paste between files.
		{
			"Abyssus Essential" :
			{
				size : [10, 10],
				vLedNames : [ "ScrollWheel", "Logo", "SideBarLeft1" ],
				vLedPositions : [ [5, 0], [7, 5], [0, 1] ],
				maxDPI : 12400
			},
			"Basilisk Essential" :
			{
				size : [3, 3],
				vLedNames : [ "Logo" ],
				vLedPositions : [ [1, 0] ],
				maxDPI : 6400
			},
			"Basilisk Ultimate" :
			{
				size : [7, 13],
				vLedNames : [ "ScrollWheel", "Logo", "SideBar1", "SideBar2", "SideBar3", "SideBar4", "SideBar5", "SideBar6", "SideBar7", "SideBar8", "SideBar9", "SideBar10", "SideBar11" ],
				vLedPositions : [ [3, 0], [3, 11], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11] ],
				maxDPI : 20000
			},
			"Basilisk V2" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo" ],
				vLedPositions : [ [1, 0], [1, 2] ],
				maxDPI : 12400
			},
			"Basilisk V3 Pro" :
			{
				size : [6, 7],
				vLedNames : [ "Logo", "Scrollwheel", "UnderLeft1", "UnderLeft2", "UnderLeft3", "UnderLeft4", "UnderLeft5", "UnderBottom", "UnderRight1", "UnderRight2", "UnderRight3", "UnderRight4", "UnderRight5" ],
				vLedPositions : [ [3, 4], [3, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [3, 6], [4, 4], [5, 3], [5, 2], [5, 1], [5, 0] ],
				maxDPI : 30000
			},
			"Blackwidow V3 Mini" :
			{
				size : [15, 6],
				vKeys :
				[
					0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 14, 15,
					16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31,
					32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45,     47,
					48,     50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 61, 62, 63,
					64, 65, 66,             70,         74, 75, 76, 77, 78, 79,
					// eslint-disable-next-line indent
											71,
				],

				vLedNames :
				[
					"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",  "Del",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",           "Page Up",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",        "Page Down",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "Insert",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",
														 "Razer Logo",
				],

				vLedPositions :
				[
					[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0],           //15
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],           //15
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2],  		[14, 2],           //14
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],                    //14
					[0, 4], [1, 4], [2, 4],                         [6, 4],                 [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],           //10
					// eslint-disable-next-line indent
																	[6, 5],

				]
			},
			"Deathadder Elite" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo", "Side Panel" ],
				vLedPositions : [ [1, 0], [1, 2], [0, 1] ],
				maxDPI : 12400
			},
			"Deathadder Mini" :
			{
				size : [3, 3],
				vLedNames : [ "Logo" ],
				vLedPositions : [ [1, 2] ],
				maxDPI : 12400
			},
			"Deathadder V2" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo" ],
				vLedPositions : [ [1, 0], [1, 2] ],
				maxDPI : 20000
			},
			"Deathadder V2 Pro" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo", "Side Panel" ],
				vLedPositions : [ [1, 0], [1, 2], [0, 1] ],
				maxDPI : 20000
			},
			"Hyperflux Pad" :
			{
				size : [5, 5],
				vLedNames : [ "Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10", "Led 11", "Led 12" ],
				vLedPositions : [ [1, 0], [2, 0], [3, 0], [4, 1], [4, 2], [4, 3], [3, 4], [2, 4], [1, 4], [0, 3], [0, 2], [0, 1] ],
			},
			"Lancehead" :
			{
				size : [10, 10],
				vLedNames : [ "ScrollWheel", "Logo", "SideBarLeft1" ],
				vLedPositions : [ [5, 0], [7, 5], [0, 1] ],
				maxDPI : 12400
			},
			"Lancehead Tournament Edition" :
			{
				size : [5, 9],
				vLedNames : [ "ScrollWheel", "Logo", "Left Side Bar 1", "Left Side Bar 2", "Left Side Bar 3", "Left Side Bar 4", "Left Side Bar 5", "Left Side Bar 6", "Left Side Bar 7", "Right Side Bar 1", "Right Side Bar 2", "Right Side Bar 3", "Right Side Bar 4", "Right Side Bar 5", "Right Side Bar 6", "Right Side Bar 7" ],
				vLedPositions : [ [2, 0], [2, 8], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6] ],
				maxDPI : 16000,
			},
			"Mamba Elite" :
			{
				size : [10, 11],
				vLedNames : [ "ScrollWheel", "Logo", "SideBarLeft1", "SideBarLeft2", "SideBarLeft3", "SideBarLeft4", "SideBarLeft5", "SideBarLeft6", "SideBarLeft7", "SideBarLeft8", "SideBarLeft9", "SideBarRight1", "SideBarRight2", "SideBarRight3", "SideBarRight4", "SideBarRight5", "SideBarRight6", "SideBarRight7", "SideBarRight8", "SideBarRight9" ],
				vLedPositions : [ [5, 0], [5, 8], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 7], [0, 8], [0, 9], [0, 10], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 7], [9, 8], [9, 9], [9, 10] ],
				maxDPI : 16000
			},
			"Mamba" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo" ],
				vLedPositions : [ [1, 0], [1, 2] ],
				maxDPI : 16000
			},
			"Mamba Hyperflux" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo" ],
				vLedPositions : [ [1, 0], [1, 2] ],
				maxDPI : 16000,
				hyperflux : true
			},
			"Mamba Tournament Edition" :
			{
				size : [5, 7],
				vLedNames : [ "Left Side Bar 1", "Left Side Bar 2", "Left Side Bar 3", "Left Side Bar 4", "Left Side Bar 5", "Left Side Bar 6", "Left Side Bar 7", "Right Side Bar 1", "Right Side Bar 2", "Right Side Bar 3", "Right Side Bar 4", "Right Side Bar 5", "Right Side Bar 6", "Right Side Bar 7", "Logo", "ScrollWheel" ],
				vLedPositions : [ [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [2, 5], [2, 0] ],
				maxDPI : 16000
			},
			"Naga Chroma" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo", "Side Panel" ],
				vLedPositions : [ [0, 0], [0, 2], [1, 1] ],
				maxDPI : 18000
			},
			"Naga Pro" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo", "Side Panel" ],
				vLedPositions : [ [1, 0], [1, 2], [0, 1] ],
				maxDPI : 18000
			},
			"Naga Lefthand" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo", "Side Panel" ],
				vLedPositions : [ [0, 0], [0, 2], [1, 1] ],
				maxDPI : 16000
			},
			"Naga Trinity" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Logo", "Side Panel" ],
				vLedPositions : [ [0, 0], [0, 2], [1, 1] ],
				maxDPI : 12400
			},
			"Naga X" :
			{
				size : [3, 3],
				vLedNames : [ "ScrollWheel", "Side Panel" ],
				vLedPositions : [ [1, 0], [0, 1] ],
				maxDPI : 18000
			},
			"Viper 8KHz" :
			{
				size : [2, 2],
				vLedNames : ["Mouse"],
				vLedPositions : [ [1, 1] ],
				maxDPI : 12400
			},
			"Viper" :
			{
				size : [2, 2],
				vLedNames : ["Mouse"],
				vLedPositions : [ [1, 1] ],
				maxDPI : 12400
			},
			"Viper Mini" :
			{
				size : [2, 2],
				vLedNames : ["Mouse"],
				vLedPositions : [ [1, 1] ],
				maxDPI : 12400
			},
			"Viper Ultimate" :
			{
				size : [2, 2],
				vLedNames : ["Mouse"],
				vLedPositions : [ [1, 1] ],
				maxDPI : 12400
			},

		};
	}
}

const RazerDevices = new RazerLEDLibrary();

class RazerProtocol {
	constructor() {
		/** Defines for the 3 device modes that a Razer device can be set to. FactoryMode should never be used, but is here as reference. */
		this.DeviceModes =
		{
			"HardwareMode" : 0x00,
			"FactoryMode"  : 0x02,
			"SoftwareMode" : 0x03,
		};
		/** Defines for responses coming from a device in response to commands. */
		this.DeviceResponses =
		{
			0x01 : "Device Busy",
			0x02 : "Command Success",
			0x03 : "Command Failure",
			0x04 : "Command Time Out",
			0x05 : "Command Not Supported"
		};

		this.LEDIDs =
		{
			"Scroll_Wheel" 		: 0x01,
			"Battery"	   		: 0x02,
			"Logo"         		: 0x03,
			"Backlight"    		: 0x04,
			"Macro"        		: 0x05, //Indicates this is a keeb.
			"Game"         		: 0x06,
			"Underglow"	   		: 0x0A,
			"Red_Profile"  		: 0x0C,
			"Green_Profile"		: 0x0D,
			"Blue_Profile" 		: 0x0E,
			"Unknown6"     		: 0x0F,
			"Right_Side_Glow"   : 0x10,
			"Left_Side_Glow"    : 0x11,
			"Charging"     		: 0x20,
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
			/** Variable to indicate how many LEDs a device has, used in the color send packet for mice. Does not apply for keyboards. */
			NumberOfLEDs   		: -1,
			/** Variable to indicate how many leds should be sent per packet. */
			LEDsPerPacket   	: -1,
			/** Variable to indicate what type of device is connected. */
			DeviceType			: "Mouse", //Default to mouse. Also this won't work with hyperspeed.
			/** Variable to indicate if a mouse uses the modern or legacy lighting standard. */
			MouseType	   		: "Modern", //if this isn't set default to modern as it is the most common
			/** Variable to indicate if a device supports above 1000Hz polling. */
			HighPollingRateSupport : false,
			 /** Stored Firmware Version to compare against for hyperspeed dongles. We'll update this each time so that we find any and all devices. @type {number[]} */
			LastFirmwareVersion: [],
			 /** Stored Serial Number to compare against for hyperspeed dongles. We'll update this each time so that we find any and all devices.@type {number[]} */
			LastSerial: [],
			/** Array to hold discovered legacy led zones. */
			LegacyLEDsFound : [],
			/** Array to hold discovered multipaired device pids. */
			HyperspeedPIDs : [],
			/** Array to hold spawned subdevices for Hyperspeed dongles. */
			spawnedSubdevices : [],

			SupportedFeatures :
			{
				BatterySupport : false,
				DPIStageSupport : false,
				PollingRateSupport : false,
				FirmwareVersionSupport : false,
				SerialNumberSupport : false,
				DeviceModeSupport : false,
				HyperspeedSupport : false,
				ScrollAccelerationSupport : false,
				ScrollModeSupport : false,
				SmartReelSupport : false,
				IdleTimeoutSupport : false,
				Hyperflux	: false
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
	/** Function for setting whether a mouse uses modern or legacy lighting.*/
	setMouseType(MouseType) {
		this.Config.MouseType = MouseType;
	}
	setDeviceLightingProperties() {
		const layout = RazerDevices.LEDLibrary[RazerDevices.PIDLibrary[device.productId()]];
		vLedNames = [];
		vLedPositions = [];

		if(layout) {
			device.log("Valid Library Config found.");
			device.setName("Razer " + RazerDevices.PIDLibrary[device.productId()]);
			device.setSize(layout.size);
			vLedNames.push(...layout.vLedNames);
			vLedPositions.push(...layout.vLedPositions);

			device.setControllableLeds(vLedNames, vLedPositions);
			this.getDeviceLEDZones();
		} else {
			device.log("No Valid Library Config found.");
			this.getDeviceLEDZones();
		}

		if(layout.hyperflux) {
			device.log("Device has a Hyperflux Pad!");
			this.Config.SupportedFeatures.Hyperflux = true;

			const hyperflux = RazerDevices.LEDLibrary["Hyperflux Pad"];

			device.createSubdevice("Hyperflux");
			// Parent Device + Sub device Name + Ports
			device.setSubdeviceName("Hyperflux", `Hyperflux Mousepad`);
			//device.setSubdeviceImage("Hyperflux", Razer_Mamba.image);
			device.setSubdeviceSize("Hyperflux", hyperflux.size[0], hyperflux.size[1]);
			device.setSubdeviceLeds("Hyperflux", hyperflux.vLedNames, hyperflux.vLedPositions);
		}
	}
	/** Function for detection all of the features that a device supports.*/
	detectSupportedFeatures() { //This list is not comprehensive, but is a good start.
		const BatterySupport = this.getDeviceBatteryLevel();

		if(BatterySupport !== -1) {
			this.Config.SupportedFeatures.BatterySupport = true;
			device.addFeature("battery");
		}
		const DPIStageSupport = this.getDeviceDPIStages();

		if(DPIStageSupport !== -1) {
			this.Config.SupportedFeatures.DPIStageSupport = true;
		}
		const PollingRateSupport = this.getDevicePollingRate();

		if(PollingRateSupport !== -1) {
			this.Config.SupportedFeatures.PollingRateSupport = true;
		}
		const FirmwareVersionSupport = this.getDeviceFirmwareVersion();

		if(FirmwareVersionSupport !== -1) {
			this.Config.SupportedFeatures.FirmwareVersionSupport = true;
		}
		const SerialNumberSupport = this.getDeviceSerial();

		if(SerialNumberSupport !== -1) {
			this.Config.SupportedFeatures.SerialNumberSupport = true;
		}
		const DeviceModeSupport = this.getDeviceMode();

		if(DeviceModeSupport !== -1) {
			this.Config.SupportedFeatures.DeviceModeSupport = true;
		}
		const HyperspeedSupport = this.getCurrentlyConnectedDongles();

		if(HyperspeedSupport !== -1) {
			this.Config.SupportedFeatures.HyperspeedSupport = true;
			this.Config.HyperspeedPIDs = HyperspeedSupport;
		}
		const ScrollAccelerationSupport = this.getDeviceScrollAccel();

		if(ScrollAccelerationSupport !== -1) {
			this.Config.SupportedFeatures.ScrollAccelerationSupport = true;
		}
		const ScrollModeSupport = this.getDeviceScrollMode();

		if(ScrollModeSupport !== -1) {
			this.Config.SupportedFeatures.ScrollModeSupport = true;
		}
		const SmartReelSupport = this.getDeviceSmartReel();

		if(SmartReelSupport !== -1) {
			this.Config.SupportedFeatures.SmartReelSupport = true;
		}
		const IdleTimeoutSupport = this.getDeviceIdleTimeout();

		if(IdleTimeoutSupport !== -1) {
			this.Config.SupportedFeatures.IdleTimeoutSupport = true;
		}

		this.determineMouseType();
	}
	/** Autodetect if a mouse is modern or legacy.*/
	determineMouseType() {
		const LegacyMouse = this.getLegacyMouseLEDBrightness(0);

		if(LegacyMouse !== -1) {
			this.Config.MouseType = "Legacy";
		}
	}
	/** Wrapper function for Writing Config Packets.*/
	ConfigPacketSend(packet, TransactionID = this.Config.TransactionID) {
		this.StandardPacketSend(packet, TransactionID);
		device.pause(10);
	}
	/** Wrapper function for Reading Config Packets.*/
	ConfigPacketRead(TransactionID = this.Config.TransactionID) {
		let returnPacket = [];

		returnPacket = device.get_report([0x00, 0x00, TransactionID], 91);

		return returnPacket.slice(1, 90);
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

				const returnPacket = this.ConfigPacketRead(TransactionID);
				const Serialpacket = returnPacket.slice(8, 23);

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
			this.Config.SupportedFeatures.HyperspeedSupport = true;
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

				const returnPacket = this.ConfigPacketRead(TransactionID);
				const FirmwareVersion = returnPacket.slice(8, 10);

				devicesFound = this.checkDeviceTransactionID(TransactionID, FirmwareVersion, devicesFound);
			}
		}
		while(devicesFound === 0);
	}
	/**Deprecated function to ensure that a grabbed transaction ID is not for a device we've already found a transaction ID for. Uses Firmware Version rather than serial, which has the possibility for overlap.*/
	checkDeviceTransactionIDFirmware(TransactionID, FirmwareVersion, devicesFound) {
		if(FirmwareVersion[0] !== 0 && devicesFound === 0|| FirmwareVersion[1] !== 0 && devicesFound === 0) {
			this.Config.TransactionID = TransactionID;
			devicesFound++;
			device.log("Valid Firmware Version Reported:" + FirmwareVersion);
			this.Config.LastFirmwareVersion = FirmwareVersion; //Store a firmware version to compare against later.
		} else if(FirmwareVersion[0] !== 0 && devicesFound > 0 && this.Config.LastFirmwareVersion[0] !== FirmwareVersion[0] || FirmwareVersion[1] !== 0 && devicesFound > 0&& this.Config.LastFirmwareVersion[1] !== FirmwareVersion[1]) {
			if(FirmwareVersion in this.Config.AdditionalDeviceFirmwareVersions) {return devicesFound; } //This deals with the edge case of a device having nonconcurrent transaction ID's. We skip this function if the serials match.

			device.log("Multiple Devices Found, Assuming this is a Hyperspeed Dongle and has more than 1 device connected.");
			this.Config.SupportedFeatures.HyperspeedSupport = true;
			this.Config.AdditionalDeviceTransactionIDs.push(TransactionID);
			this.Config.AdditionalDeviceFirmwareVersions.push(FirmwareVersion);
			device.log("Valid Firmware Version Reported:" + FirmwareVersion);
			this.Config.LastFirmwareVersion = FirmwareVersion; //Store a firmware version to compare against later.
		}

		return devicesFound;
	}
	/** Function to check if a device is charging or discharging. */
	getDeviceChargingStatus() {
		this.ConfigPacketSend([ 0x02, 0x07, 0x84 ]);

		const returnPacket = this.ConfigPacketRead();
		const batteryStatus = returnPacket[9];
		device.log("Charging Status: " + batteryStatus);

		return batteryStatus+1;
	}
	/** Function to check a device's battery percentage.*/
	getDeviceBatteryLevel() {
		this.ConfigPacketSend([0x02, 0x07, 0x80]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {

			device.log("Error fetching Device Battery Level. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		const batteryLevel = Math.floor(((returnPacket[9])*100)/255);
		device.log("Device Battery Level: " + batteryLevel);

		return batteryLevel;
	}
	/** Function to fetch a device's serial number. This serial is the same as the one printed on the physical device.*/
	getDeviceSerial() {
		this.ConfigPacketSend([ 0x16, 0x00, 0x82 ]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Device Serial. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		const Serialpacket = returnPacket.slice(8, 23);
		const SerialString = String.fromCharCode(...Serialpacket);
		device.log("Device Serial: " + SerialString);

		return SerialString;
	}
	/** Function to check a device's firmware version.*/
	getDeviceFirmwareVersion() {
		this.ConfigPacketSend([ 0x02, 0x00, 0x81 ]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Device Firmware Version. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}
		const FirmwareByte1 = returnPacket[8];
		const FirmwareByte2 = returnPacket[9];
		device.log("Firmware Version: " + FirmwareByte1 + "." + FirmwareByte2);

		return [FirmwareByte1, FirmwareByte2];
	}
	/** Function to fetch all of a device's LED Zones.*/
	getDeviceLEDZones() {
		const activeZones = [];

		for(let zones = 0; zones < 30; zones++) {
			const ledExists = this.getModernMouseLEDBrightness(zones, true);

			if(ledExists !== -1) {
				device.log(`LED Zone ${zones} Exists`);
				activeZones.push(zones);
				this.setModernMouseLEDBrightness(100, zones);
			}

		}

		if(activeZones.length > 0) {
			device.log("Device uses Modern Protocol for Lighting.");

			return activeZones;
		}

		for(let zones = 0; zones < 30; zones++) {
			const ledExists = this.getLegacyMouseLEDBrightness(zones, true);

			if(ledExists !== -1) {
				device.log(`LED Zone ${zones} Exists`);
				activeZones.push(zones);
			}
		}

		if(activeZones.length > 0) {
			device.log("Device uses Legacy Protocol for Lighting.");

			return activeZones;
		}

		return -1; //Return -1 if we have no zones. I.E. device has no led zones 💀
	}
	/** Function to check if a device is in Hardware Mode or Software Mode. */
	getDeviceMode() {

		this.ConfigPacketSend([ 0x02, 0x00, 0x84 ]); //2,3,1

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device Mode. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}
		const deviceMode = returnPacket[8];
		device.log("Current Device Mode: " + deviceMode);

		return deviceMode;
	}
	/** Function to set a device's mode between hardware and software.*/
	setDeviceMode(mode) {
		this.ConfigPacketSend([0x02, 0x00, 0x04, this.DeviceModes[mode]]);
		this.getDeviceMode(); //Log device mode after switching modes.
	}
	/** Function to fetch what battery percentage a device will enter low power mode at.*/
	getDeviceLowPowerPercentage() {
		this.ConfigPacketSend([0x01, 0x07, 0x81]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device Low Battery Percentage. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		device.log("Low Battery Return Packet" + returnPacket); //Most likely it's in slot 2.

		return 0;
	}
	/** Function to set at what battery percentage a device will enter low power mode.*/
	setDeviceLowPowerPercentage(lowPowerPercentage) {
		this.ConfigPacketSend([0x01, 0x07, 0x01, Math.floor(((lowPowerPercentage)*100)/255)]);
	}
	/** Function to fetch a device's polling rate. We do not currently parse this at all.*/
	getDevicePollingRate() {
		let pollingRate = -1;
		this.ConfigPacketSend([ 0x01, 0x00, 0x85 ]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device Polling Rate. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		if(returnPacket[8] !== 0) {
			pollingRate = returnPacket[8];
			device.log("Polling Rate: " + 1000/pollingRate + "Hz");
		} else {
			const secondaryreturnPacket = this.ConfigPacketSend([0x01, 0x00, 0xC0]);

			if(secondaryreturnPacket[9] !== 0) {
				pollingRate = returnPacket[9];
				device.log("Polling Rate: " + 8000/pollingRate + "Hz");
				this.Config.HighPollingRateSupport = true;
			}
		}

		return pollingRate;
	}
	/** Function to set a device's polling rate.*/
	setDevicePollingRate(pollingRate) {
		if(this.Config.HighPollingRateSupport) {

			this.ConfigPacketSend([0x02, 0x00, 0x40, 0x00, 8000/pollingRate]); //Most likely onboard saving and current. iirc if you save things to flash they don't apply immediately.
			this.ConfigPacketSend([0x02, 0x00, 0x40, 0x01, 8000/pollingRate]);
		} else {
			this.ConfigPacketSend([0x01, 0x00, 0x05, 1000/pollingRate]);
		}
	}

	/** Function to set a device's lift off distance.*/
	setDeviceLOD(asymmetricLOD, liftOffDistance) {
		this.ConfigPacketSend([0x04, 0x0b, 0x0b, 0x00, 0x04, (asymmetricLOD ? 0x02 : 0x01), (liftOffDistance - 1)]);
	}
	/** Function to fetch a device's onboard DPI levels. We do not currently parse this at all.*/
	getDeviceCurrentDPI() {
		this.ConfigPacketSend([ 0x07, 0x04, 0x85, 0x00 ]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device DPI. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		const dpiX = returnPacket[9]*256 + returnPacket[10];
		const dpiY = returnPacket[11]*256 + returnPacket[12];
		device.log("Current DPI X Value: " + dpiX);
		device.log("Current DPI Y Value: " + dpiY);

		return [dpiX, dpiY];
	}
	/** Function to set a device's current stage dpi. We leverage this with software buttons to emulate multiple stages.*/
	setDeviceSoftwareDPI(dpi) {
		this.ConfigPacketSend([0x07, 0x04, 0x05, 0x00, Math.floor(dpi/256), dpi%256, Math.floor(dpi/256), dpi%256]);
		device.pause(20);
	}
	/** Function to fetch a device's onboard DPI levels.*/
	getDeviceDPIStages() //DPI6 does not get included in here.
	{
		this.ConfigPacketSend([ 0x26, 0x04, 0x86, 0x00 ]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device Mode. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}
		const stage1Flag = returnPacket[11];
		const stage2Flag = returnPacket[18];
		const stage3Flag = returnPacket[25];
		const stage4Flag = returnPacket[32];
		const stage5Flag = returnPacket[39];
		const numberOfStages = returnPacket[10];
		const dpi1X = returnPacket[12]*256 + returnPacket[13];
		const dpi1Y = returnPacket[14]*256 + returnPacket[15];
		const dpi2X = returnPacket[19]*256 + returnPacket[20];
		const dpi2Y = returnPacket[21]*256 + returnPacket[22];
		const dpi3X = returnPacket[26]*256 + returnPacket[27];
		const dpi3Y = returnPacket[28]*256 + returnPacket[29];
		const dpi4X = returnPacket[33]*256 + returnPacket[34];
		const dpi4Y = returnPacket[35]*256 + returnPacket[36];
		const dpi5X = returnPacket[40]*256 + returnPacket[41];
		const dpi5Y = returnPacket[42]*256 + returnPacket[43];

		device.log("DPI Stage 1 X Value: " + dpi1X);
		device.log("DPI Stage 1 Y Value: " + dpi1Y);
		device.log("DPI Stage 2 X Value: " + dpi2X);
		device.log("DPI Stage 2 Y Value: " + dpi2Y);
		device.log("DPI Stage 3 X Value: " + dpi3X);
		device.log("DPI Stage 3 Y Value: " + dpi3Y);
		device.log("DPI Stage 4 X Value: " + dpi4X);
		device.log("DPI Stage 4 Y Value: " + dpi4Y);
		device.log("DPI Stage 5 X Value: " + dpi5X);
		device.log("DPI Stage 5 Y Value: " + dpi5Y);

		return 0; //Return 0 until I take the time to parse this properly.
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

	}
	/** Function to fetch the scroll mode from supported mice. */
	getDeviceScrollMode() {
		this.ConfigPacketSend([0x02, 0x02, 0x94]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device Scroll Mode. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		const ScrollMode = returnPacket[9];
		device.log("Free Scroll is set to: " + ScrollMode);

		return ScrollMode;
	}
	/** Function to set the scroll mode for supported mice. */
	setDeviceScrollMode(ScrollMode) {
		this.ConfigPacketSend([0x02, 0x02, 0x14, 0x01, (ScrollMode ? 0x01 : 0x00)]);
	}
	/** Function to fetch the Scroll Acceleration mode from supported mice. */
	getDeviceScrollAccel() {
		this.ConfigPacketSend([0x02, 0x02, 0x96]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device Scroll Acceleration Setting. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		const ScrollAccel = returnPacket[9];
		device.log("Scroll Acceleration is set to: " + ScrollAccel);

		return ScrollAccel;
	}
	/** Function to set whether Scroll Acceleration is on for supported mice. */
	setDeviceScrollAccel(ScrollAccel) {
		this.ConfigPacketSend([0x02, 0x02, 0x16, 0x01, (ScrollAccel ? 0x01 : 0x00)]);
	}
	/** Function to fetch the SmartReel Status of a supported mouse */
	getDeviceSmartReel() {
		this.ConfigPacketSend([0x02, 0x02, 0x97]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device Smart Reel Setting. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		const SmartReel = returnPacket[9];
		device.log("Smart Reel is set to: " + SmartReel);

		return SmartReel;
	}
	/** Function to set whether SmartReel is on for supported mice. */
	setDeviceSmartReel(SmartReel) {
		this.ConfigPacketSend([0x02, 0x02, 0x17, 0x01, (SmartReel ? 0x01 : 0x00)]);
	}
	/** Function to fetch the device idle timeout on supported devices. */
	getDeviceIdleTimeout() {
		this.ConfigPacketSend([0x02, 0x07, 0x83]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Current Device Idle Timeout Setting. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}
		const idleTimeout = returnPacket[8]; //8 or 9 most likely
		device.log("Idle Timeout is set to: " + idleTimeout);

		return 0; //Needs parsing.
	}

	/** Function to set a legacy mouse's led effect.*/
	setLegacyLEDEffect(zone) //This only needs set once, that being said if you only set it once it does a stupid gradient. This is technically bypassing the gradient by forcing the effect. Interesting.
	{
		this.StandardPacketSend([ 0x03, 0x03, 0x02, 0x00, zone ]);//Applies to Deathadder Chroma and older mice 0x00 is save to flash variable
	}
	setSoftwareLightingMode() {
		const ModernMatrix = this.getModernMatrixEffect();

		if(ModernMatrix !== -1) {
			this.setModernSoftwareLightingMode();
		} else if(this.Config.MouseType === "Modern") {
			this.setLegacyMatrixEffect(); ///MMM Edge cases are tasty.
		}
	}
	/** Function to set a legacy device's effect. Why is the Mamba TE so special?*/
	setLegacyMatrixEffect() {
		this.StandardPacketSend([ 0x02, 0x03, 0x0A, 0x05, 0x00 ]); //0x0a, 0x02, 0x0c, 0x01, 0x09 ,0x01, 0x01, 0x01, 0x09 is the Lancehead TE.

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error setting Legacy Matrix Effect. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		return 0;
	}
	/** Function to set a modern device's effect*/
	getModernMatrixEffect() {
		this.StandardPacketSend([ 0x06, 0x0f, 0x82, 0x00 ]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Modern Matrix Effect. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		return 0;
	}
	/** Function to set a modern device's effect*/
	setModernMatrixEffect(data) {
		const packet = [ 0x06, 0x0f, 0x02 ]; //6 is length of argument
		data  = data || [ 0x00, 0x00, 0x00 ]; //flash, zone, effect
		packet.push(...data);
		this.StandardPacketSend(packet);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error setting Modern Matrix Effect. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		return 0;
	}
	/** Function to set a modern device's effect to custom. */
	setModernSoftwareLightingMode()//Not all devices require this, but it seems to be sent to all of them?
	{
		this.setModernMatrixEffect([ 0x00, 0x00, 0x08, 0x01, 0x01]);
	}
	/** Handler function to set mouse lighting regardless of protocol.*/
	setMouseLighting(RGBData, NumberOfLEDs  = this.Config.NumberOfLEDs) {
		if(this.Config.MouseType === "Modern") {
			this.setModernMouseDeviceColor(RGBData, NumberOfLEDs);
		} else {
			this.setLegacyMouseLEDColor(RGBData);
		}
	}
	/** Function to set a legacy mouse's led color.*/
	setLegacyMouseLEDColor(zone, rgbdata) //Color for Deathadder Chroma
	{
		this.StandardPacketSend([ 0x05, 0x03, 0x01, 0x00, zone, rgbdata[0], rgbdata[1], rgbdata[2] ]);
		this.setLegacyLEDEffect(zone);
	}
	/** Function to set a modern mouse's led colors.*/
	setModernMouseDeviceColor(RGBData, NumberOfLEDs) {
		const packet = [(NumberOfLEDs*3 + 5), 0x0F, 0x03, 0x00, 0x00, 0x00, 0x00, this.Config.NumberOfLEDs-1];
		packet.push(...RGBData);

		this.StandardPacketSend(packet);
	}
	/** Function to set a modern keyboard's led colors.*/
	setKeyboardDeviceColor(NumberOfLEDs, RGBData, packetidx) {
		const packet = [(NumberOfLEDs*3 + 5), 0x0F, 0x03, 0x00, 0x00, packetidx, 0x00, NumberOfLEDs];
		packet.push(...RGBData);
		this.StandardPacketSend(packet);
	}
	/** Function to fetch a legacy mouse's led brightness.*/
	getLegacyMouseLEDBrightness(led = 0, detection=false) {
		this.ConfigPacketSend([ 0x03, 0x03, 0x83, 0x00, led]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			if(!detection) {
				device.log("Error fetching Legacy Device LED Brightness. Error Code: " + this.DeviceResponses[returnPacket[0]]);
			}

			return -1;
		}

		const brightness = returnPacket[10];
		device.log(`LED ${led} is set to ${brightness*100/255}% brightness.`);

		return brightness;
	}
	/** Function to set a legacy mouse's led brightness.*/
	setLegacyMouseLEDBrightness(brightness, led = 0) {
		this.ConfigPacketSend([ 0x03, 0x03, 0x03, 0x00, led, brightness*255/100]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error setting Legacy Device LED Brightness. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		return 0;
	}
	/** Function to set a legacy mouse's led brightness. You cannot use zero for this one as it wants a specific zone. That being said we could scan for specific zones on a device.*/
	getModernMouseLEDBrightness(led = 0, detection=false) {
		this.ConfigPacketSend([0x03, 0x0f, 0x84, 0x00, led]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			if(!detection) {
				device.log("Error fetching Modern Device LED Brightness. Error Code: " + this.DeviceResponses[returnPacket[0]]);
			}

			return -1;
		}
		const brightness = returnPacket[10];
		device.log(`LED ${led} is set to ${brightness*100/255}% brightness.`);

		return brightness;
	}
	/** Function to set a modern mouse's led brightness. If we use 0, it does all of the zones in the matrix.*/
	setModernMouseLEDBrightness(brightness, led = 0) {
		this.ConfigPacketSend([0x03, 0x0f, 0x04, 0x01, led, brightness*255/100]);

		const returnPacket = this.ConfigPacketRead();

		if(returnPacket[0] !== 2) {
			device.log("Error setting Modern Device LED Brightness. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		return 0;
	}
	/** Function to set the Chroma Charging Dock brightness.*/
	getChargingDockBrightness() {
		this.ConfigPacketSend([ 0x01, 0x07, 0x82 ]);

		const returnPacket = this.ConfigPacketRead();
		const dockBrightness = returnPacket[10]; //TODO Test this.
		device.log("Dock Brightness: " + dockBrightness);

		return dockBrightness;
	}
	/** Function to set the Chroma Charging Dock brightness.*/
	setChargingDockBrightness(brightness) {
		this.ConfigPacketSend([ 0x01, 0x07, 0x02, brightness]);
	}
	/** Function to switch a Hyperspeed Dongle into Pairing Mode.*/
	setDonglePairingMode() //Used for pairing multiple devices to a single hyperspeed dongle. The Class is smart enough to separate transaction ID's.
	{
		this.ConfigPacketSend([0x01, 0x00, 0x46, 0x01]);
	}
	/** Function to fetch paired device dongles from the connected dongle?!?!?*/
	getCurrentlyConnectedDongles() { //Also of note: return[0] gives 2, and return[4] gives 1 on Blackwidow. Dualpaired Naga.
		this.ConfigPacketSend([0x07, 0x00, 0xbf], 0x0C); //Were you expecting this to give you paired devices? Well you'll be disappointed.
		//Naga itself returns 1 for return[1], and 0 for return[4]

		const returnPacket = this.ConfigPacketRead(0x0C);

		if(returnPacket[0] !== 2) {
			device.log("Error fetching Currently Connected Device Dongles. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		device.log(returnPacket);

		const device1ConnectionStatus = returnPacket[9];
		const device2ConnectionStatus = returnPacket[12];

		const PID1 = returnPacket[10].toString(16) + returnPacket[11].toString(16);
		const PID2 = returnPacket[13].toString(16) + returnPacket[14].toString(16);
		const pairedPids = [];

		if(PID1 !== "ffff" && PID1 !== "0000") {
			device.log("Paired Receiver ID 1: 0x" + PID1);
			pairedPids.push("0x0" + PID1);
		}

		if(PID2 !== "ffff" && PID2 !== "0000") {
			device.log("Paired Receiver ID 2: 0x" + PID2);
			pairedPids.push("0x0" + PID2);
		}

		if(device1ConnectionStatus === 0x01) {
			device.log(`Device 1 with PID 0x${PID1} is connected.`);
		}

		if(device2ConnectionStatus === 0x01) {
			device.log(`Device 2 with PID 0x${PID2} is connected.`);
		}

		if(device1ConnectionStatus === 0x01 && device2ConnectionStatus === 0x01) {
			device.notify("Hyperspeed Multipairing is Not Currently Supported", "This Hyperspeed Dongle has more than 1 device connected to it. SignalRGB Currently does not support multiple devices paired to a single dongle. Please use separate dongles for your Hyperspeed devices.", 3); //At current we're not going to
			device.log("yeeted notification at user.");
		}

		return pairedPids;
	}
	/** Function to fetch connected device dongles from the connected dongle?!?!?*/
	getNumberOfPairedDongles() {
		this.ConfigPacketSend([0x04, 0x00, 0x87], 0x88); //These values change depending on transaction ID. The expected transaction ID for the original device seems to give us the 2 Paired devices response. Most likely indicating Master. Transaction ID's for the newly paired device are for single paired device. Most likely indicating Slave.

		const returnPacket = this.ConfigPacketRead(0x88);

		if(returnPacket[0] !== 2) {
			device.log("Error fetching number of Currently Paired Device Dongles. Error Code: " + this.DeviceResponses[returnPacket[0]]);

			return -1;
		}

		let numberOfPairedDongles = 0;

		if(returnPacket[8] === 0x02 && returnPacket[9] === 0x02 && returnPacket[10] === 0x00) {
			device.log("Dongle has single paired device.");
			numberOfPairedDongles = 1;
		}

		if(returnPacket[8] === 0x02 && returnPacket[9] === 0x01 && returnPacket[10] === 0x01) {
			device.log("Dongle has 2 Paired devices.");
			numberOfPairedDongles = 2;
		}//Speculation: Byte 1 is free slots?, Byte 2 is number of additional paired devices?

		return numberOfPairedDongles;

	}
	/** Function to create subdevices for multipaired hyperspeed devices.*/
	createHyperspeedDevice() {
		if(this.Config.AdditionalDeviceTransactionIDs.length > 0) //Need to add association logic for mouse vs keeb for a given transaction ID.
		{
			for(let devices = 0; devices < 0; devices++) {
				const currentDevice = RazerDevices.LEDLibrary[RazerDevices.PIDLibrary[parseInt(this.Config.HyperspeedPIDs[devices])]];
				device.createSubdevice(RazerDevices.PIDLibrary[parseInt(this.Config.HyperspeedPIDs[devices])]);
				// Parent Device + Sub device Name + Ports
				device.setSubdeviceName(RazerDevices.PIDLibrary[parseInt(this.Config.HyperspeedPIDs[devices])], RazerDevices.PIDLibrary[parseInt(this.Config.HyperspeedPIDs[devices])]);
				//device.setSubdeviceImage(this.PIDLibrary[parseInt(this.Config.HyperspeedPIDs[devices])], Razer_Mamba.image);
				device.setSubdeviceSize(RazerDevices.PIDLibrary[parseInt(this.Config.HyperspeedPIDs[devices])], currentDevice.size[0], currentDevice.size[1]);
				device.setSubdeviceLeds(RazerDevices.PIDLibrary[parseInt(this.Config.HyperspeedPIDs[devices])], currentDevice.vLedNames, currentDevice.vLedPositions);
				this.Config.spawnedSubdevices.push(RazerDevices.PIDLibrary[parseInt(this.Config.HyperspeedPIDs[devices])]);
			}
		} else {
			device.log("No extra hyperspeed devices detected. Aborting addition of subdevices.");
		}
	}
}

const Razer = new RazerProtocol();

export function Validate(endpoint) {
	return endpoint.interface === 3;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v3-mini.png";
}