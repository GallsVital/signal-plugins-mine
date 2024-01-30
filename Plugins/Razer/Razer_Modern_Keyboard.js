export function Name() { return "Razer Keyboard"; }
export function VendorId() { return 0x1532; }
export function ProductId() { return Object.keys(razerDeviceLibrary.PIDLibrary); }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/razer"; }
export function Size() { return [1, 1]; }
export function Type() { return "Hid"; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
dpi5:readonly
dpi6:readonly
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
let macroTracker;

export function LedNames() {
	return Razer.getDeviceLEDNames();
}

export function LedPositions() {
	return Razer.getDeviceLEDPositions();
}

export function Initialize() {
	deviceInitialization();
}

export function Render() {

	detectInputs();

	if (!Razer.Config.deviceSleepStatus) {
		grabLighting();
		getDeviceBatteryStatus();
	}

}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		grabLighting("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		grabLighting(shutdownColor);
		Razer.setModernMatrixEffect([0x00, 0x00, 0x03]); //Hardware mode baby.
	}
}

function deviceInitialization() {
	Razer.detectDeviceEndpoint();
	device.set_endpoint(Razer.Config.deviceEndpoint[`interface`], Razer.Config.deviceEndpoint[`usage`], Razer.Config.deviceEndpoint[`usage_page`]);
	Razer.getDeviceTransactionID();
	Razer.detectSupportedFeatures();
	Razer.setDeviceProperties();
	Razer.setDeviceMacroProperties();
	Razer.setSoftwareLightingMode(); //we'll need the wake handler at some point for keebs, but for now we don't do features because I could not be bothered.
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
		deviceInitialization(true);
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
	device.addFeature("keyboard");
}

function processInputs(Added, Removed) {

	for (let values = 0; values < Added.length; values++) {
		const input = Added.pop();

		processKeyboardInputs(input);

	}

	for (let values = 0; values < Removed.length; values++) {
		const input = Removed.pop();

		processKeyboardInputs(input, true);

	}
}

function processKeyboardInputs(input, released = false) {
	if(input === 0x01) {
		return;
	}

	const eventData = { key : Razer.getInputDict()[input], keyCode : input, "released": released };
	console.log(eventData);
	device.log(`${Razer.getInputDict()[input]} Hit. Release Status: ${released}`);
	keyboard.sendEvent(eventData, "Key Press");
}

function grabLighting(overrideColor) {
	const RGBData = [];
	const vLedPositions = Razer.getDeviceLEDPositions();
	const vKeys = Razer.getDeviceLEDIndexes();
	const LEDsPerPacket = Razer.getNumberOfLEDsPacket();

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++) {
		let col;
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}
		const iLedIdx		= vKeys[iIdx] * 3;
		RGBData[iLedIdx] 	= col[0];
		RGBData[iLedIdx+1]	= col[1];
		RGBData[iLedIdx+2]	= col[2];
	}
	const packetsTotal = Math.ceil((RGBData.length / 3) / LEDsPerPacket);
	let packetCount = 0;

	do {
		Razer.setKeyboardDeviceColor(LEDsPerPacket, RGBData.splice(0, LEDsPerPacket*3), packetCount);
		packetCount++;
	}while(packetCount <= packetsTotal);
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export class deviceLibrary {
	constructor() {

		this.keyboardInputDict = {
			0x20 : "M1",
			0x21 : "M2",
			0x22 : "M3",
			0x23 : "M4",
			0x24 : "M5",
			0x52 : "Mute",
			0x55 : "Play/Pause",
		};

		this.PIDLibrary =
		{
			0x0228 : "Blackwidow Elite",
			//0x024E : "Blackwidow V3", // Quartz // TODO
			0x0258 : "Blackwidow V3 Mini", // Wired
			0x0271 : "Blackwidow V3 Mini",
			0x0287 : "Blackwidow V4",
			0x0293 : "Blackwidow V4 X",
			0x028D : "Blackwidow V4 Pro",
			0x02A5 : "Blackwidow V4 75%",
			0x0257 : "Huntsman Mini",
			0x005E : "Huntsman Mini",
			0x026C : "Huntsman V2",
			//0x0266 : "Huntsman V2 Analog", // TODO
			//0x026B : "Huntsman V2 TKL", // TODO
			0x02A6 : "Huntsman V3 Pro",
			0x02A7 : "Huntsman V3 Pro TKL",
			//0x025D : "Ornata V2", // TODO
			//0x0000 : "Huntsman V3 Pro Mini", // TODO
		};

		this.LEDLibrary = //I'm tired of not being able to copy paste between files.
		{
			"Blackwidow Elite" :
			{
				size : [21, 7],
				vKeys :
				[
					1,		3,	4,	5,	6,	7,  8,	9,  10, 11, 12, 13, 14,		15, 16, 17,		18,	19,	20,	21,
					23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,		37, 38, 39, 	40, 41, 42, 43,
					45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,		59, 60, 61, 	62, 63, 64, 65,
					67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,     80,						84, 85, 86,
					89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,	   102,	 	    104,		106, 107, 108, 109,
					111, 112, 113,           116,       120, 122, 123, 124,		125, 126, 127,	129,	130,
					121,
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",		"Print Screen", "Scroll Lock", "Pause Break",	"MediaPreviousTrack", "MediaPlayPause", "MediaNextTrack", "AudioMute",
					"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",		"Insert",       "Home",        "Page Up",		"NumLock", "Num /", "Num *", "Num -",		//22
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",				"Del",          "End",         "Page Down",		"Num 7", "Num 8", "Num 9", "Num +",		//22
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",																"Num 4", "Num 5", "Num 6",				//17
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",						"Num 1", "Num 2", "Num 3", "Num Enter",	//18
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",	"Left Arrow",  "Down Arrow", "Right Arrow",		"Num 0", "Num .",							//14
					"RazerLogo",
				],
				vLedPositions :
				[
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],		[14, 0], [15, 0], [16, 0],	[17, 0], [18, 0], [19, 0], [20, 0], //21
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],		[14, 1], [15, 1], [16, 1],	[17, 1], [18, 1], [19, 1], [20, 1],	//22
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],		[14, 2], [15, 2], [16, 2],	[17, 2], [18, 2], [19, 2], [20, 2],	//22
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 		   [13, 3],									[17, 3], [18, 3], [19, 3],			//17
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],				 [15, 4],			[17, 4], [18, 4], [19, 4], [20, 4],	//18
					[0, 5], [1, 5], [2, 5],                 		[6, 5],                       	[10, 5], [11, 5], [12, 5], [13, 5],		[14, 5], [15, 5], [16, 5],	[17, 5],		  [19, 5],	//14
					[11, 6],
				],
				endpoint : { "interface": 2, "usage": 0x0002, "usage_page": 0x0001 },
				DeviceType : "Keyboard",
				LEDsPerPacket : 22,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-elite.png"
			},
			"Blackwidow V3" :
			{
				size : [25, 9],
				vKeys :
				[
					2,   4,   5,   6,   7,   8,  9,   10,  11,  12,  13,  14,  15,       16,  17,  18, //21
					25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,   42,  43,  44,  45,	//22
					48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  60,  61,	62,  63,  64,   65,  66,  67,  68,	//22
					71,  72,  73,  74,  75,  76,  77,  78,  79,  80,  81,  82,       84,					88,  89,  90,		//17
					94,  96,  97,  98,  99,  100, 101, 102, 103, 104, 105, 107,     			 109,		111, 112, 113, 114,	//18
					117, 118, 119,                123,                127, 128, 129, 130, 131, 132, 133,	135,	  136,		//14
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",		"Print Screen", "Scroll Lock", "Pause Break",					//21
					"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",		"Insert",       "Home",        "Page Up",		"NumLock", "Num /", "Num *", "Num -",		//22
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",				"Del",          "End",         "Page Down",		"Num 7", "Num 8", "Num 9", "Num +",		//22
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",																"Num 4", "Num 5", "Num 6",				//17
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",						"Num 1", "Num 2", "Num 3", "Num Enter",	//18
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",	"Left Arrow",  "Down Arrow", "Right Arrow",		"Num 0", "Num .",							//14
				],
				vLedPositions :
				[
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],   [14, 0], [15, 0],	[16, 0],	//21
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],   [14, 1], [15, 1], [16, 1],	[17, 1], [18, 1], [19, 1], [20, 1],	//22
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],	[17, 2], [18, 2], [19, 2], [20, 2],	//22
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 		   [13, 3],									[17, 3], [18, 3], [19, 3],			//17
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],            [15, 4],				[17, 4], [18, 4], [19, 4], [20, 4],	//18
					[0, 5], [1, 5], [2, 5],                 		[6, 5],                       	[10, 5], [11, 5], [12, 5], [13, 5],   [14, 5], [15, 5], [16, 5],	[17, 5],		  [19, 5],			//14
				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				LEDsPerPacket : 22,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v3.png"
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

				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				LEDsPerPacket : 15,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v3-mini.png"
			},
			"Blackwidow V4" :
			{
				size : [25, 9],
				vKeys :
				[
					1,   2,   4,   5,   6,   7,   8,  9,   10,  11,  12,  13,  14,  15,       16,  17,  18,	19,  20,  21,  22,	//21
					24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,   42,  43,  44,  45,	//22
					47,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  60,  61,	62,  63,  64,   65,  66,  67,  68,	//22
					70,  71,  72,  73,  74,  75,  76,  77,  78,  79,  80,  81,  82,       84,					88,  89,  90,		//17
					93,  94,  96,  97,  98,  99,  100, 101, 102, 103, 104, 105, 107,     			 109,		111, 112, 113, 114,	//18
					116, 117, 118, 119,                123,                127, 128, 129, 130, 131, 132, 133,	135,	  136,		//14

					138, 147, //2
					139, 148, //2
					140, 149, //2
					141, 150, //2
					142, 151, //2
					143, 152, //2
					144, 153, //2
					145, 154, //2
					146, 155, //2
				],
				vLedNames :
				[
					"M6", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",   "Print Screen", "Scroll Lock", "Pause Break", "Rewind", "Pause", "Skip", "Mute",					//21
					"M5", "`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",           "Insert",       "Home",        "Page Up",     "NumLock", "Num /", "Num *", "Num -",		//22
					"M4", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                      "Del",          "End",         "Page Down",   "Num 7", "Num 8", "Num 9", "Num +",		//22
					"M3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                  		          "Num 4", "Num 5", "Num 6",				//17
					"M2", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",                            "Num 1", "Num 2", "Num 3", "Num Enter",	//18
					"M1", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",      "Left Arrow",  "Down Arrow", "Right Arrow",     "Num 0", "Num .",							//14

					"Underglow Left LED 1", "Underglow Right LED 1", //2
					"Underglow Left LED 2", "Underglow Right LED 2", //2
					"Underglow Left LED 3", "Underglow Right LED 3", //2
					"Underglow Left LED 4", "Underglow Right LED 4", //2
					"Underglow Left LED 5", "Underglow Right LED 5", //2
					"Underglow Left LED 6", "Underglow Right LED 6", //2
					"Underglow Left LED 7", "Underglow Right LED 7", //2
					"Underglow Left LED 8", "Underglow Right LED 8", //2
					"Underglow Left LED 9", "Underglow Right LED 9", //2
				],
				vLedPositions :
				[
					[1, 1], [2, 1],			[4, 1], [5, 1], [6, 1], [7, 1],			[9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 1], [21, 1], [22, 1], [23, 1],	//21
					[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], 		   [17, 2], [18, 2], [19, 2], [20, 2], [21, 2], [22, 2], [23, 2],	//22
					[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], 		   [17, 3], [18, 3], [19, 3], [20, 3], [21, 3], [22, 3], [23, 3],	//22
					[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],                           		              [20, 4], [21, 4], [22, 4],			//17
					[1, 5], [2, 5], 		[4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],  		            		[18, 5],          [20, 5], [21, 5], [22, 5], [23, 5],	//18
					[1, 6], [2, 6], [3, 6], [4, 6],                                 [9, 6],                            [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6], [19, 6], [20, 6], 			[22, 6],			//14

					[0, 0], [24, 0], //2
					[0, 1], [24, 1], //2
					[0, 2], [24, 2], //2
					[0, 3], [24, 3], //2
					[0, 4], [24, 4], //2
					[0, 5], [24, 5], //2
					[0, 6], [24, 6], //2
					[0, 7], [24, 7], //2
					[0, 8], [24, 8], //2

				],
				endpoint : { "interface": 3, "usage": 0x0000, "usage_page": 0x0001 },
				DeviceType : "Keyboard",
				LEDsPerPacket : 23,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4.png"
			},
			"Blackwidow V4 X" :
			{
				size : [23, 6],
				vKeys :
				[
					0,   1,   3,   4,   5,   6,   7,  8,   9,  10,  11,  12,  13,  14,       15,  16,  17,
					22,  23,  24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,   40,  41,  42,  43,
					44,  45,  46,  47,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,	59,  60,  61,   62,  63,  64, 65,
					66,  67,  68,  69,  70,  71,  72,  73,  74,  75,  76,  77,  78,       80,					84,  85,  86,
					88,  89,  	91,  92,  93,  94,  95, 96, 97, 98, 99, 100,     102,  		            104,	106, 107, 108, 109,
					110, 111, 112, 113,                117,                121, 122, 123, 124, 125, 126, 127,	129,	  130,
				],
				vLedNames :
				[
					"M6", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",   		"Print Screen", "Scroll Lock", "Pause Break",					//21
					"M5", "`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",           "Insert",       "Home",        "Page Up",     "NumLock", "Num /", "Num *", "Num -",		//22
					"M4", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                      "Del",          "End",         "Page Down",   "Num 7", "Num 8", "Num 9", "Num +",		//22
					"M3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                  		          "Num 4", "Num 5", "Num 6",				//17
					"M2", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",                            "Num 1", "Num 2", "Num 3", "Num Enter",	//18
					"M1", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",      "Left Arrow",  "Down Arrow", "Right Arrow",     "Num 0", "Num .",							//14
				],
				vLedPositions :
				[
					[0, 0], [1, 0],			[3, 0], [4, 0], [5, 0], [6, 0],			[8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], 	[16, 0], [17, 0], [18, 0],	//21
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],			[16, 1], [17, 1], [18, 1],	[19, 1], [20, 1], [21, 1], [22, 1],	//22
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], 		   	[16, 2], [17, 2], [18, 2],	[19, 2], [20, 2], [21, 2], [22, 2],	//22
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],													[19, 3], [20, 3], [21, 3],			//17
					[0, 4], [1, 4], 		[3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4],  		            		 [17, 4],			[19, 4], [20, 4], [21, 4], [22, 4],	//18
					[0, 5], [1, 5], [2, 5], [3, 5],                                 [8, 5],                           [12, 5], [13, 5], [14, 5], [15, 5], 	[16, 5], [17, 5], [18, 5],	[19, 5], 		  [21, 5],			//14
				],
				endpoint : { "interface": 2, "usage": 0x0002, "usage_page": 0x0001 },
				DeviceType : "Keyboard",
				LEDsPerPacket : 21,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-x.png"
			},
			"Blackwidow V4 Pro" :
			{
				size : [25, 13],
				vKeys :
				[
					138,																													155,
					139,  1,   2,   4,   5,   6,   7,   8,  9,   10,  11,  12,  13,  14,  15,       16,  17,  18,	19,  20,  21,  22,	    154,
					140, 24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,   42,  43,  44,  45,      153,
					141, 47,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  60,  61,	62,  63,  64,   65,  66,  67,  68,      152,
					142, 70,  71,  72,  73,  74,  75,  76,  77,  78,  79,  80,  81,  82,  83,  84,					88,  89,  90, 		    151,
					143, 93,  94,  95,  96,  97,  98,  99,  100, 101, 102, 103, 104, 105, 107,			 109,		111, 112, 113, 114,     150,
					144, 116, 117, 118, 119,                123,                127, 128, 129, 130, 131, 132, 133,	135,	  136,			149,
					145, 148,
					146, 147,
					161, 180,
					162, 179,
					163, 178,
					164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177
				],

				vLedNames :
				[
					"Underglow Left LED 1",																																															   "Underglow Right LED 1", //2
					"Underglow Left LED 2", "Volume Wheel", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",   "Print Screen", "Scroll Lock", "Pause Break", "Rewind", "Pause", "Skip", "Mute",       "Underglow Right LED 2", //23
					"Underglow Left LED 3", "M5", "`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",           "Insert",       "Home",        "Page Up",     "NumLock", "Num /", "Num *", "Num -",	   "Underglow Right LED 3", //24
					"Underglow Left LED 4", "M4", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                      "Del",          "End",         "Page Down",   "Num 7", "Num 8", "Num 9", "Num +",      "Underglow Right LED 4", //24
					"Underglow Left LED 5", "M3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ISO_#", "Enter",														  "Num 4", "Num 5", "Num 6",               "Underglow Right LED 5", //19
					"Underglow Left LED 6", "M2", "Left Shift", "ISO_<", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",					 "Up Arrow",					  "Num 1", "Num 2", "Num 3", "Num Enter",  "Underglow Right LED 6", //20
					"Underglow Left LED 7", "M1", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",      "Left Arrow",  "Down Arrow", "Right Arrow",     "Num 0", "Num .",                        "Underglow Right LED 7", //16
					"Underglow Left LED 8", "Underglow Right LED 8",
					"Underglow Left LED 9", "Underglow Right LED 9",
					"Underglow Left LED 10", "Underglow Right LED 10",
					"Underglow Left LED 11", "Underglow Right LED 11",
					"Underglow Left LED 12", "Underglow Right LED 12",
					"Underglow Left LED 13",  "Underglow Bottom 1", "Underglow Bottom 2", "Underglow Bottom 3", "Underglow Bottom 4", "Underglow Bottom 5", "Underglow Bottom 6", "Underglow Bottom 7", "Underglow Bottom 8", "Underglow Bottom 9", "Underglow Bottom 10", "Underglow Bottom 11", "Underglow Bottom 12", "Underglow Right LED 13",
				],

				vLedPositions :
				[
					[0, 0],																																																		  [24, 0], //2
					[0, 1], [1, 1], [2, 1],			[4, 1], [5, 1], [6, 1], [7, 1],			[9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 1], [21, 1], [22, 1], [23, 1], [24, 1], //23
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], 		   [17, 2], [18, 2], [19, 2], [20, 2], [21, 2], [22, 2], [23, 2], [24, 2], //24
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], 		   [17, 3], [18, 3], [19, 3], [20, 3], [21, 3], [22, 3], [23, 3], [24, 3], //24
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4],                  		              [20, 4], [21, 4], [22, 4],		  [24, 4], //19
					[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],  		            		[18, 5],          [20, 5], [21, 5], [22, 5], [23, 5], [24, 5], //19
					[0, 6], [1, 6], [2, 6], [3, 6], [4, 6],                                 [9, 6],                            [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6], [19, 6], [20, 6], 			[22, 6],		  [24, 6],
					[0, 7], [24, 7],
					[0, 8], [24, 8],
					[0, 9], [24, 9],
					[0, 10], [24, 10],
					[0, 11], [24, 11],
					[0, 12], [1, 12], [3, 12], [5, 12], [7, 12], [9, 12], [11, 12], [13, 12], [15, 12], [17, 12], [19, 12], [21, 12], [23, 12], [24, 12]

				],
				endpoint : { "interface": 3, "usage": 0x0000, "usage_page": 0x0001 },
				DeviceType : "Keyboard",
				LEDsPerPacket : 23,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-pro.png"
			},
			"Blackwidow V4 75%" :
			{
				size : [17, 9],
				vKeys :
				[
					0,  1,   2,   3,  4,   5,   6,   7,   8,   9,   10,    11,   12,   13,  14,	//15
					18, 19,  20,  21,  22,  23,  24,  25,  26,  27,   28,   29,	  30,   32,  33,	//15
					36, 37,  38,  39,  40,  41,  42,  43,  44,  45,   46,   47,   48,   49,  50,	//15
					54, 55,  56,  57,  58,  59,  60,  61,  62,  63,   64,   65,         67,  68,	//14
					72,      74,  75,  76,  77,  78,  79,  80,  81,   82,   83,   85,   86,  87,	//14
					90, 91, 92,                  94,            97,   98,   100,   101,   102,  103,	//10

					108, 117,	//2
					109, 118,	//2
					110, 119,	//2
					111, 120,	//2
					112, 121,	//2
					113, 122,	//2
					114, 123,	//2
					115, 124,	//2
					116, 125,	//2
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Play/Pause", "Mute",						//15
					"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace", "Del",									//15
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Page Up",											//15
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", "Page Down",									//14
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "Insert",						//14
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn",  "Right Ctrl", "Left Arrow",  "Down Arrow", "Right Arrow", //10

					"Underglow Left LED 1", "Underglow Right LED 1", //2
					"Underglow Left LED 2", "Underglow Right LED 2", //2
					"Underglow Left LED 3", "Underglow Right LED 3", //2
					"Underglow Left LED 4", "Underglow Right LED 4", //2
					"Underglow Left LED 5", "Underglow Right LED 5", //2
					"Underglow Left LED 6", "Underglow Right LED 6", //2
					"Underglow Left LED 7", "Underglow Right LED 7", //2
					"Underglow Left LED 8", "Underglow Right LED 8", //2
					"Underglow Left LED 9", "Underglow Right LED 9", //2
				],
				vLedPositions :
				[
					[1, 1],	[2, 1], [3, 1], [4, 1], [5, 1],	[6, 1],	[7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1],	//15
					[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2],	//15
					[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3],	//15
					[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], 			[14, 4], [15, 4],	//14
					[1, 5],  		[3, 5],	[4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5],	//14
					[1, 6], [2, 6], [3, 6],					[6, 6],							[10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6],	//10

					[0, 0], [16, 0], //2
					[0, 1], [16, 1], //2
					[0, 2], [16, 2], //2
					[0, 3], [16, 3], //2
					[0, 4], [16, 4], //2
					[0, 5], [16, 5], //2
					[0, 6], [16, 6], //2
					[0, 7], [16, 7], //2
					[0, 8], [16, 8], //2

				],
				endpoint : { "interface": 3, "usage": 0x0000, "usage_page": 0x0001 },
				DeviceType : "Keyboard",
				LEDsPerPacket : 18,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-75.png"
			},
			"Huntsman Mini" :
			{
				size : [15, 5],
				vKeys :
				[
					1,  2,  3,  4,  5,  6,  7,  8,  9,  10,  11, 12, 13,     14,
					16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,     29,
					31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,     44,
					46,     48, 49, 50, 51, 52, 53, 54, 55, 56, 57,     59,
					61, 62, 63,             67,                 71, 72, 73, 74,
				],

				vLedNames :
				[
					"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",
				],

				vLedPositions :
				[
					[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0],			[14, 0],           //15
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1],			[14, 1],           //15
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2],		   [13, 2],            //14
					[0, 3],			[2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],		   [13, 3],                    //14
					[0, 4], [1, 4], [2, 4],							[6, 4],									 [11, 4], [12, 4], [13, 4], [14, 4],           //10
				],
				endpoint : { "interface": 2, "usage": 0x0002, "usage_page": 0x0001 },
				DeviceType : "Keyboard",
				LEDsPerPacket : 15,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/huntsman-mini.png"
			},
			"Huntsman V2" :
			{
				size : [21, 6],
				vKeys :
				[
					0,	2,	3,	4,	5,	6,  7,	8,  9, 10, 11, 12, 13,			14, 15, 16,	 	17, 18, 19, 20,
					22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,		36, 37, 38,		39, 40, 41, 42,
					44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,		58, 59, 60,		61, 62, 63, 64,
					66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,		79,						83, 84, 85,
					88,		90, 91, 92, 93, 94, 95, 96, 97, 98, 99,	  	101,		103,		105, 106, 107, 108,
					110, 111, 112,           116,		120, 121, 122,	123,	124, 125, 126,	128,	129,
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",		"Print Screen", "Scroll Lock", "Pause Break",	"MediaPreviousTrack", "MediaPlayPause", "MediaNextTrack", "AudioMute",
					"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",		"Insert",       "Home",        "Page Up",		"NumLock", "Num /", "Num *", "Num -",		//22
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",				"Del",          "End",         "Page Down",		"Num 7", "Num 8", "Num 9", "Num +",		//22
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",																"Num 4", "Num 5", "Num 6",				//17
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",						"Num 1", "Num 2", "Num 3", "Num Enter",	//18
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",	"Left Arrow",  "Down Arrow", "Right Arrow",		"Num 0", "Num .",							//14
				],
				vLedPositions :
				[
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],		[14, 0], [15, 0], [16, 0],	[17, 0], [18, 0], [19, 0], [20, 0], //21
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],		[14, 1], [15, 1], [16, 1],	[17, 1], [18, 1], [19, 1], [20, 1],	//22
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],		[14, 2], [15, 2], [16, 2],	[17, 2], [18, 2], [19, 2], [20, 2],	//22
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 		   [13, 3],									[17, 3], [18, 3], [19, 3],			//17
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],				 [15, 4],			[17, 4], [18, 4], [19, 4], [20, 4],	//18
					[0, 5], [1, 5], [2, 5],                 		[6, 5],                       	[10, 5], [11, 5], [12, 5], [13, 5],		[14, 5], [15, 5], [16, 5],	[17, 5],		  [19, 5],	//14
				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				LEDsPerPacket : 22,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/huntsman-v2.png"
			},
			"Huntsman V2 TKL" :
			{
				size : [17, 6],
				vKeys :
				[
					1,		3,	4,	5,	6,	7,  8,	9,  10, 11, 12, 13, 14,		15, 16, 17,
					23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,		37, 38, 39,
					45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,		59, 60, 61,
					67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,     80,
					89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,	   102,	 	    104,
					111, 112, 113,           116,       120, 122, 123, 124,		125, 126, 127,
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",		"Print Screen", "Scroll Lock", "Pause Break",
					"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",		"Insert",       "Home",        "Page Up",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",				"Del",          "End",         "Page Down",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",	"Left Arrow",  "Down Arrow", "Right Arrow",
				],
				vLedPositions :
				[
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],		[14, 0], [15, 0], [16, 0],
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],		[14, 1], [15, 1], [16, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],		[14, 2], [15, 2], [16, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 		   [13, 3],
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],				 [15, 4],
					[0, 5], [1, 5], [2, 5],                 		[6, 5],                       	[10, 5], [11, 5], [12, 5], [13, 5],		[14, 5], [15, 5], [16, 5],
				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				LEDsPerPacket : 22,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/huntsman-v2-tkl.png"
			},
			"Huntsman V2 Analog" :
			{
				size : [21, 6],
				vKeys :
				[
					0,    0,    0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0,		0, 0, 0,		0, 0, 0, 0,		0,
					0,    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			0, 0, 0,		0, 0, 0, 0,		0,
						  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			0, 0, 0,		0, 0, 0, 0,
					0,    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,							0, 0, 0,		0,
						  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,					0,			0, 0, 0, 0,
						  0, 0, 0,			0,			0, 0, 0, 0,			0, 0, 0,		0,	0,

					0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
					0, 0,
					0, 0,
					0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
				],
				vLedNames :
				[
					"LightBar Left 1", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",			"Print Screen", "Scroll Lock", "Pause Break",   "Button 1", "Button 2", "Button 3", "Button 4", "LightBar Right 1",
					"LightBar Left 2", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",				"Insert", "Home", "Page Up",					"NumLock", "Num /", "Num *", "Num -",			"LightBar Right 2",
									   "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",						"Del", "End", "Page Down",						"Num 7", "Num 8", "Num 9", "Num +",
					"LightBar Left 3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",																	"Num 4", "Num 5", "Num 6",						"LightBar Right 3",
									   "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",					"Up Arrow",									"Num 1", "Num 2", "Num 3", "Num Enter",
									   "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",		"Left Arrow", "Down Arrow", "Right Arrow",		"Num 0",		"Num .",

					"LightBar Bottom 1", "LightBar Bottom 2", "LightBar Bottom 3", "LightBar Bottom 4", "LightBar Bottom 5", "LightBar Bottom 6", "LightBar Bottom 7", "LightBar Bottom 8", "LightBar Bottom 9", "LightBar Bottom 10", "LightBar Bottom 11", "LightBar Bottom 12", "LightBar Bottom 13", "LightBar Bottom 14", "LightBar Bottom 15",
					"Wrist Rest Bar Left 1", "Wrist Rest Bar Right 1",
					"Wrist Rest Bar Left 2", "Wrist Rest Bar Right 2",
					"Wrist Rest Bar Bottom 1", "Wrist Rest Bar Bottom 2", "Wrist Rest Bar Bottom 3", "Wrist Rest Bar Bottom 4", "Wrist Rest Bar Bottom 5", "Wrist Rest Bar Bottom 6", "Wrist Rest Bar Bottom 7", "Wrist Rest Bar Bottom 8", "Wrist Rest Bar Bottom 9", "Wrist Rest Bar Bottom 10", "Wrist Rest Bar Bottom 11", "Wrist Rest Bar Bottom 12", "Wrist Rest Bar Bottom 13", "Wrist Rest Bar Bottom 14", "Wrist Rest Bar Bottom 15",
				],
				vLedPositions :
				[
					[0, 0],  [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],			[15, 0], [16, 0], [17, 0],   [18, 0], [19, 0], [20, 0], [21, 0], [22, 0],
					[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],   [15, 1], [16, 1], [17, 1],   [18, 1], [19, 1], [20, 1], [21, 1], [22, 1],
							 [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],   [18, 2], [19, 2], [20, 2], [21, 2],
					[0, 3],  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3],			 [14, 3],								 [18, 3], [19, 3], [20, 3],			 [22, 3],
							 [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],					 [14, 4],			 [16, 4],			 [18, 4], [19, 4], [20, 4], [21, 4],
							 [1, 5], [2, 5], [3, 5],                      [7, 5],							  [11, 5], [12, 5], [13, 5], [14, 5],   [15, 5], [16, 5], [17, 5],   [18, 5],		   [20, 5],
							 [1, 6], [2, 6], [3, 6], [4, 6],		 [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6],					 [14, 6], 	[15, 6], 					 [18, 6], [19, 6], [20, 6],

					[0, 7],																																															 [22, 7],
					[0, 8],																																															 [22, 8],
							 [1, 8], [2, 8], [3, 8], [4, 8],		 [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8],			 [14, 8], [15, 8],						 [18, 8], [19, 8]
				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				LEDsPerPacket : 23,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/huntsman-v2%20-%20analog.png"
			},
			"Huntsman V3 Pro" :
			{
				size : [21, 6],
				vKeys :
				[
					1,		3,	4,	5,	6,	7,  8,	9,  10, 11, 12, 13, 14,		15, 16, 17,			18,		130,
					23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,		37, 38, 39, 	40, 41, 42, 43,
					45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,		59, 60, 61, 	62, 63, 64, 65,
					67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,     80,						84, 85, 86,
					89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,	   102,	 	    104,		106, 107, 108, 109,
					111, 112, 113,           117,       121, 122, 123, 124,		125, 126, 127,	128,	129,
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",		"Print Screen", "Scroll Lock", "Pause Break",			"MediaPlayPause",	"AudioMute",					//21
					"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",		"Insert",       "Home",        "Page Up",		"NumLock", "Num /", "Num *", "Num -",		//22
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",				"Del",          "End",         "Page Down",		"Num 7", "Num 8", "Num 9", "Num +",		//22
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",																"Num 4", "Num 5", "Num 6",				//17
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",						"Num 1", "Num 2", "Num 3", "Num Enter",	//18
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",	"Left Arrow",  "Down Arrow", "Right Arrow",		"Num 0", "Num .",							//14
				],
				vLedPositions :
				[
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],   [14, 0], [15, 0], [16, 0],			 [18, 0],		   [20, 0],	//21
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],   [14, 1], [15, 1], [16, 1],	[17, 1], [18, 1], [19, 1], [20, 1],	//22
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],	[17, 2], [18, 2], [19, 2], [20, 2],	//22
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 		   [13, 3],									[17, 3], [18, 3], [19, 3],			//17
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],            [15, 4],				[17, 4], [18, 4], [19, 4], [20, 4],	//18
					[0, 5], [1, 5], [2, 5],                 		[6, 5],                       	[10, 5], [11, 5], [12, 5], [13, 5],   [14, 5], [15, 5], [16, 5],	[17, 5],		  [19, 5],			//14
				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				LEDsPerPacket : 22,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/huntsman-v3-pro.png"
			},
			"Huntsman V3 Pro TKL" :
			{
				size : [17, 6],
				vKeys :
				[
					1,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  13,  14,       15,       18,
					23,  24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,
					45,  46,  47,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  60,  61,
					67,  68,  69,  70,  71,  72,  73,  74,  75,  76,  77,  78,       80,
					89,  91,  92,  93,  94,  95,  96,  97,  98,  99,  100,  102,                104,
					111, 112, 113,                117,                121, 122, 123, 124, 125, 126, 127,
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Media buttons", "Volume Wheel", //15
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",           "Insert", "Home", "Page Up",  //17
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                  "Del", "End", "Page Down", //17
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", 										//13
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                          "Up Arrow", //13
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",    "Left Arrow", "Down Arrow", "Right Arrow", //11
				],
				vLedPositions :
				[
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],   [14, 0], 			[16, 0], //15
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],   [14, 1], [15, 1], [16, 1], //17
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2], //17
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 		   [13, 3],								 //13
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],            [15, 4],			 //13
					[0, 5], [1, 5], [2, 5],                 		[6, 5],                       	[10, 5], [11, 5], [12, 5], [13, 5],   [14, 5], [15, 5], [16, 5], //11
				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				LEDsPerPacket : 22,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/huntsman-v3-pro-tkl.png"
			},
			"Huntsman V3 Pro Mini" :
			{
				size : [14, 5],
				vKeys :
				[
					0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 14,
					16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
					32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45,
					48,     50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 61,
					64, 65, 66,             70,         74, 75, 76,
				],

				vLedNames :
				[
					"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Right Ctrl",
				],

				vLedPositions :
				[
					[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],           //15
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],         //15
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2],          //14
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],                 //14
					[0, 4], [1, 4], [2, 4],                         [6, 4],                 [9, 4], [10, 4], [11, 4],         //10
				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				LEDsPerPacket : 15,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/huntsman-v3-pro-mini.png"
			},
			"Ornata V2" :
			{
				size : [21, 7],
				vKeys :
				[
					1,		3,	4,	5,	6,	7,  8,	9,  10, 11, 12, 13, 14,		15, 16, 17,		18,	19,	20,	21,
					23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,		37, 38, 39, 	40, 41, 42, 43,
					45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,		59, 60, 61, 	62, 63, 64, 65,
					67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,     80,						84, 85, 86,
					89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,	   102,	 	    104,		106, 107, 108, 109,
					111, 112, 113,           116,       120, 122, 123, 124,		125, 126, 127,	129,	130,
					121,
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",		"Print Screen", "Scroll Lock", "Pause Break",	"MediaPreviousTrack", "MediaPlayPause", "MediaNextTrack", "AudioMute",
					"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",		"Insert",       "Home",        "Page Up",		"NumLock", "Num /", "Num *", "Num -",		//22
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",				"Del",          "End",         "Page Down",		"Num 7", "Num 8", "Num 9", "Num +",		//22
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",																"Num 4", "Num 5", "Num 6",				//17
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",						"Num 1", "Num 2", "Num 3", "Num Enter",	//18
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",	"Left Arrow",  "Down Arrow", "Right Arrow",		"Num 0", "Num .",							//14
					"RazerLogo",
				],
				vLedPositions :
				[
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],		[14, 0], [15, 0], [16, 0],	[17, 0], [18, 0], [19, 0], [20, 0], //21
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],		[14, 1], [15, 1], [16, 1],	[17, 1], [18, 1], [19, 1], [20, 1],	//22
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],		[14, 2], [15, 2], [16, 2],	[17, 2], [18, 2], [19, 2], [20, 2],	//22
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 		   [13, 3],									[17, 3], [18, 3], [19, 3],			//17
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],				 [15, 4],			[17, 4], [18, 4], [19, 4], [20, 4],	//18
					[0, 5], [1, 5], [2, 5],                 		[6, 5],                       	[10, 5], [11, 5], [12, 5], [13, 5],		[14, 5], [15, 5], [16, 5],	[17, 5],		  [19, 5],	//14
					[11, 6],
				],
				endpoint : { "interface": 2, "usage": 0x0002, "usage_page": 0x0001 },
				DeviceType : "Keyboard",
				LEDsPerPacket : 22,
				image: "https://assets.signalrgb.com/devices/brands/razer/keyboards/ornata-v2.png"
			},
		};
	}
}

const razerDeviceLibrary = new deviceLibrary();

export class RazerProtocol {
	constructor() {
		/** Defines for the 3 device modes that a Razer device can be set to. FactoryMode should never be used, but is here as reference. */
		this.DeviceModes = Object.freeze(
			{
				"Hardware Mode": 0x00,
				"Factory Mode": 0x02,
				"Software Mode": 0x03,
				0x00: "Hardware Mode",
				0x02: "Factory Mode",
				0x03: "Software Mode"
			});
		/** Defines for responses coming from a device in response to commands. */
		this.DeviceResponses = Object.freeze(
			{
				0x01: "Device Busy",
				0x02: "Command Success",
				0x03: "Command Failure",
				0x04: "Command Time Out",
				0x05: "Command Not Supported"
			});
		/** These are used to identify what LED zone we're poking at on a device. Makes no difference for RGB Sends as it doesn't work with Legacy devices, but it does tell us what zones a modern device has to some extent.*/
		this.LEDIDs = Object.freeze(
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
			});

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
			/** Variable that holds current device's layout. */
			DeviceLayout : 0,
			/** Variable that holds the current device's Product ID. */
			DeviceProductId : 0x00,
			/** Dict for button inputs to map them with names and things. */
			inputDict : {},
			/** Is the device connected and able to receive commands? */
			DeviceInitialized : false,
			/** Variable Used to Indicate if a Device Requires an Apply Packet for Lighting Data. */
			requiresApplyPacket : false,
			/** Variable Used to Indicate if a Device Uses the Standard Modern Matrix. */
			supportsModernMatrix : false,

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

	getDeviceInitializationStatus() { return this.Config.DeviceInitialized; }
	setDeviceInitializationStatus(initStatus) { this.Config.DeviceInitialized = initStatus; }

	getDeviceProductId() { return this.Config.DeviceProductId; }
	setDeviceProductId(productId) { this.Config.DeviceProductId = productId; }

	getDeviceLEDNames(){ return this.Config.DeviceLEDNames; }
	setDeviceLEDNames(DeviceLEDNames) { this.Config.DeviceLEDNames = DeviceLEDNames; }

	getDeviceLEDPositions(){ return this.Config.DeviceLEDPositions; }
	setDeviceLEDPositions(DeviceLEDPositions){ this.Config.DeviceLEDPositions = DeviceLEDPositions; }

	getDeviceLEDIndexes(){ return this.Config.DeviceLedIndexes; }
	setDeviceLEDIndexes(DeviceLedIndexes){ this.Config.DeviceLedIndexes = DeviceLedIndexes; }

	getRequiresApplyPacket() { return this.Config.requiresApplyPacket; }
	setRequiresApplyPacket(requiresApplyPacket) { this.Config.requiresApplyPacket = requiresApplyPacket; }

	getHyperFlux() { return this.Config.SupportedFeatures.Hyperflux; }
	setHyperFlux(HyperFlux) { this.Config.SupportedFeatures.Hyperflux = HyperFlux; }
	/** Function to set our TransactionID*/
	setTransactionID(TransactionID) { this.Config.TransactionID = TransactionID; }

	getDeviceType() { return this.Config.DeviceType; }
	setDeviceType(DeviceType) { this.Config.DeviceType = DeviceType; }

	getInputDict() { return this.Config.inputDict; }
	setInputDict(InputDict) { this.Config.inputDict = InputDict; }

	getSupportsModernMatrix() { return this.Config.supportsModernMatrix; }
	setSupportsModernMatrix(supportsModernMatrix) { this.Config.supportsModernMatrix = supportsModernMatrix; }

	/** Function for setting the number of LEDs a device has to send on each packet */
	getNumberOfLEDsPacket() { return this.Config.LEDsPerPacket; }
	/** Function for setting device led per packet properties.*/
	setNumberOfLEDsPacket(NumberOfLEDsPacket) { this.Config.LEDsPerPacket = NumberOfLEDsPacket; }

	/** Function for getting the device image property */
	getDeviceImage() { return this.Config.image; }
	/** Function for setting the device image property */
	setDeviceImage(image) { this.Config.image = image; }

	/** Function for setting device led properties.*/
	setDeviceProperties() {
		const layout = razerDeviceLibrary.LEDLibrary[razerDeviceLibrary.PIDLibrary[device.productId()]];

		if (layout) {
			device.log("Valid Library Config found.");
			device.setName("Razer " + razerDeviceLibrary.PIDLibrary[device.productId()]);
			device.setSize(layout.size);
			device.setImageFromUrl(layout.image);

			this.setDeviceLEDNames(layout.vLedNames);
			this.setDeviceLEDPositions(layout.vLedPositions);
			this.setNumberOfLEDsPacket(layout.LEDsPerPacket);
			this.setDeviceProductId(device.productId()); //yay edge cases!
			this.setDeviceImage(layout.image);
			this.getDeviceLayout();

			if(layout.vKeys) {
				this.setDeviceLEDIndexes(layout.vKeys);
			}

			if(layout.DeviceType) {
				this.setDeviceType(layout.DeviceType);
			}

		} else {
			device.log("No Valid Library Config found.");
		}

		device.setControllableLeds(this.getDeviceLEDNames(), this.getDeviceLEDPositions());

	}
	setDeviceMacroProperties() {
		this.setInputDict(razerDeviceLibrary.keyboardInputDict);
	}
	/* eslint-disable complexity */
	/** Function for detection all of the features that a device supports.*/
	detectSupportedFeatures() { //This list is not comprehensive, but is a good start.
		const BatterySupport = this.getDeviceBatteryLevel();

		if (BatterySupport !== -1) {
			this.Config.SupportedFeatures.BatterySupport = true;
			device.addFeature("battery");
		}
		const DPIStageSupport = RazerMouse.getDeviceDPIStages();

		if (DPIStageSupport !== -1) {
			this.Config.SupportedFeatures.DPIStageSupport = true;
		}
		const PollingRateSupport = this.getDevicePollingRate();

		if (PollingRateSupport !== -1) {
			this.Config.SupportedFeatures.PollingRateSupport = true;
		}
		const FirmwareVersionSupport = this.getDeviceFirmwareVersion();

		if (FirmwareVersionSupport !== -1) {
			this.Config.SupportedFeatures.FirmwareVersionSupport = true;
		}
		const SerialNumberSupport = this.getDeviceSerial();

		if (SerialNumberSupport !== -1) {
			this.Config.SupportedFeatures.SerialNumberSupport = true;
		}
		const DeviceModeSupport = this.getDeviceMode();

		if (DeviceModeSupport !== -1) {
			this.Config.SupportedFeatures.DeviceModeSupport = true;
		}
		const HyperspeedSupport = this.getCurrentlyConnectedDongles();

		if (HyperspeedSupport !== -1) {
			this.Config.SupportedFeatures.HyperspeedSupport = true;
		}
		const ScrollAccelerationSupport = RazerMouse.getDeviceScrollAccel();

		if (ScrollAccelerationSupport !== -1) {
			this.Config.SupportedFeatures.ScrollAccelerationSupport = true;
		}
		const ScrollModeSupport = RazerMouse.getDeviceScrollMode();

		if (ScrollModeSupport !== -1) {
			this.Config.SupportedFeatures.ScrollModeSupport = true;
		}
		const SmartReelSupport = RazerMouse.getDeviceSmartReel();

		if (SmartReelSupport !== -1) {
			this.Config.SupportedFeatures.SmartReelSupport = true;
		}
		const IdleTimeoutSupport = this.getDeviceIdleTimeout();

		if (IdleTimeoutSupport !== -1) {
			this.Config.SupportedFeatures.IdleTimeoutSupport = true;
		}

		const lowBatteryPercentageSupport = this.getDeviceLowPowerPercentage();

		if(lowBatteryPercentageSupport !== -1) {
			this.Config.SupportedFeatures.LowPowerPercentage = true;
		}
	}
	/* eslint-enable complexity */
	/** Function to Detect if we have a Basilisk V3 Attached. */
	detectDeviceEndpoint() {//Oh look at me. I'm a basilisk V3. I'm special

		const deviceEndpoints = device.getHidEndpoints();
		const devicePID = device.productId();

		const layout = razerDeviceLibrary.LEDLibrary[razerDeviceLibrary.PIDLibrary[device.productId()]];

		for (let endpoints = 0; endpoints < deviceEndpoints.length; endpoints++) {
			const endpoint = deviceEndpoints[endpoints];

			if (endpoint) {
				if(layout.endpoint) {
					this.Config.deviceEndpoint[`interface`] = layout.endpoint[`interface`];
					this.Config.deviceEndpoint[`usage`] = layout.endpoint[`usage`];
					this.Config.deviceEndpoint[`usage_page`] = layout.endpoint[`usage_page`];

					return; //If we found one in the config table, no reason to check for the Basilisk V3.
				}

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
		let loops = 0;

		do {
			for (let testTransactionID = 0x00; testTransactionID < possibleTransactionIDs.length; testTransactionID++) {
				const TransactionID = possibleTransactionIDs[testTransactionID];
				const packet = [0x02, 0x00, 0x82];

				const [returnPacket, errorCode] = this.ConfigPacketSend(packet, TransactionID);

				if (errorCode !== 2) {

					device.log("Error fetching Device Charging Status. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });
				}

				const Serialpacket = returnPacket.slice(8, 23);

				if (Serialpacket.every(item => item !== 0)) {
					const SerialString = String.fromCharCode(...Serialpacket);

					devicesFound = this.checkDeviceTransactionID(TransactionID, SerialString, devicesFound);
					this.ConfigPacketRead(TransactionID);
				}

				if(devicesFound !== 0) {
					this.setDeviceInitializationStatus(true);
				}

				device.pause(400);
			}

			loops++;
		}
		while (devicesFound === 0 && loops < 5);
	}
	/**Function to ensure that a grabbed transaction ID is not for a device we've already found a transaction ID for.*/
	checkDeviceTransactionID(TransactionID, SerialString, devicesFound) {
		device.log(`Serial String ${SerialString}`);

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

		return -1;
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

		return -1;
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

			return -1;
		}

		if (returnPacket !== undefined) {

			const Serialpacket = returnPacket.slice(8, 23);
			const SerialString = String.fromCharCode(...Serialpacket);

			device.log("Device Serial: " + SerialString);

			return SerialString;
		}

		return -1;
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

			return -1;
		}

		if (returnPacket !== undefined) {
			const FirmwareByte1 = returnPacket[8];
			const FirmwareByte2 = returnPacket[9];
			device.log("Firmware Version: " + FirmwareByte1 + "." + FirmwareByte2);

			return [FirmwareByte1, FirmwareByte2];
		}


		return -1;
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

			return -1;
		}

		if (returnPacket[8] !== undefined) {
			const deviceMode = returnPacket[8];
			device.log("Current Device Mode: " + this.DeviceModes[deviceMode]);

			return deviceMode;
		}

		return -1;
	}
	getDeviceLayout(retryAttempts = 5){
		let errorCode = 0;
		let returnPacket = [];
		let attempts = 0;

		do {
			 [returnPacket, errorCode] = this.ConfigPacketSend([0x02, 0x00, 0x86]);

			 if(errorCode !== 2) {
				device.pause(10);
				attempts++;
			 }
		}

		while(errorCode !== 2 && attempts < retryAttempts);

		if (errorCode !== 2) {

			device.log("Error fetching Device Layout. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			return -1;
		}

		if (returnPacket !== undefined) {
			const layoutMode = returnPacket[0];
			device.log("Current Layout: " + layoutMode);
			this.Config.DeviceLayout = layoutMode;

			return layoutMode;
		}

		return -1;
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

			return -1;
		}

		if (returnPacket[8] !== undefined) {
			const lowPowerPercentage = Math.ceil((returnPacket[8]*100)/255);
			device.log(`Low Battery Mode Percentage: ${lowPowerPercentage}%`);

			return lowPowerPercentage;
		}

		return -1;
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
				return -1;
			}

			return -1;
		}

		if (secondaryreturnPacket[9] !== 0 && secondaryreturnPacket[9] !== undefined) {
			pollingRate = secondaryreturnPacket[9];
			device.log("Polling Rate: " + 8000 / pollingRate + "Hz", { toFile: true });
			this.Config.HighPollingRateSupport = true;

			return pollingRate;
		}

		return -1;
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

			return -1;
		}
		const secondaryReturnValues = this.ConfigPacketSend([0x02, 0x00, 0x40, 0x01, 8000 / pollingRate]);
		const secondaryErrorCode = secondaryReturnValues[1];

		if (secondaryErrorCode !== 2) {

			device.log("Error fetching Current Device Polling Rate. Error Code: " + secondaryErrorCode, { toFile: true });

			if (secondaryErrorCode === 1) {
				return -1;
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

			return -1;
		}

		if (returnPacket[8] !== undefined && returnPacket[9] !== undefined) {
			const idleTimeout = BinaryUtils.ReadInt16BigEndian([returnPacket[8], returnPacket[9]]);
			device.log(`Current Device Idle Timeout: ${idleTimeout/60} Minutes.`);

			return idleTimeout;
		}

		return -1;
	}
	/** Function to set the device idle timeout on supported devices. */
	setDeviceIdleTimeout(timeout) {
		const returnValues = this.ConfigPacketSend([0x02, 0x07, 0x03, (timeout*60 >> 8 & 0xff), (timeout*60 & 0xff)]);
		device.pause(10);

		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Current Device Idle Timeout Setting. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			return -1;
		}

		return 0; //function went through
	}
	/** Function to set a modern mouse to software lighting control mode.*/
	setSoftwareLightingMode() {
		const ModernMatrix = this.getModernMatrixEffect();

		if (ModernMatrix > -1) {
			this.setSupportsModernMatrix(true);
			this.setModernSoftwareLightingMode();
			console.log("Modern matrix set!");
		} else if (this.Config.MouseType === "Modern") {
			this.setLegacyMatrixEffect(); ///MMM Edge cases are tasty.
			console.log("Legacy matrix set!");
		}

		console.log("May there be light!");
	}
	/** Function to set a legacy device's effect. Why is the Mamba TE so special?*/
	setLegacyMatrixEffect() {
		const returnValues = this.ConfigPacketSend([0x02, 0x03, 0x0A, 0x05, 0x00]);

		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Legacy Matrix Effect. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

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

			return -1;
		}

		return 0;
	}
	/** Function to set a modern device's effect to custom. */
	setModernSoftwareLightingMode() {//Not all devices require this, but it seems to be sent to all of them?
		return this.setModernMatrixEffect([0x00, 0x00, 0x08, 0x00, 0x01]);
	}
	/** Function to set the Chroma Charging Dock brightness.*/
	getChargingDockBrightness() {
		const [returnPacket, errorCode] = this.ConfigPacketSend([0x01, 0x07, 0x82]);

		if (errorCode !== 2) {

			device.log("Error fetching Charging Dock Brightness. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

			return -1;
		}

		if (returnPacket[10] !== undefined && returnPacket[10] > -1) {
			const dockBrightness = returnPacket[10]; //TODO Test this.
			device.log("Dock Brightness: " + dockBrightness, { toFile: true });

			return dockBrightness;
		}

		return -1;
	}
	/** Function to set the Chroma Charging Dock brightness.*/
	setChargingDockBrightness(brightness) {
		const returnValues = this.ConfigPacketSend([0x01, 0x07, 0x02, brightness]);
		const errorCode = returnValues[1];

		if (errorCode !== 2) {

			device.log("Error setting Charging Dock Brightness. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

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

			return -1;
		}

		if (returnPacket !== undefined) {
			if (returnPacket[10] === undefined || returnPacket[11] === undefined || returnPacket[13] === undefined || returnPacket[14] === undefined) {
				device.log("Error fetching Devices Currently Connected to dongle, due to out of spec packet response.", { toFile: true });

				return -1; //return -1 as this should be a retry.
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

		return -1;
	}
	/** Function to fetch connected device dongles from the connected dongle?!?!?*/
	getNumberOfPairedDongles() {
		const [returnPacket, errorCode] = this.ConfigPacketSend([0x04, 0x00, 0x87], 0x88); //These values change depending on transaction ID. The expected transaction ID for the original device seems to give us the 2 Paired devices response. Most likely indicating Master. Transaction ID's for the newly paired device are for single paired device. Most likely indicating Slave.

		if (errorCode !== 2) {

			device.log("Error fetching number of devices current paired to dongle. Error Code: " + this.DeviceResponses[errorCode], { toFile: true });

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

		return -1;
	}
	/** Function to set a modern keyboard's led colors.*/
	setKeyboardDeviceColor(LEDsPerPacket, RGBData, packetidx) {
		this.StandardPacketSend([(LEDsPerPacket * 3) + 5, 0x0F, 0x03, 0x00, 0x00, packetidx, 0x00, LEDsPerPacket - 1].concat(RGBData));
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
	getCurrentStage() {
		return this.currentStage;
	}
	getMaxStage() {
		return this.maxDPIStage;
	}
	/** Enables or Disables the DPIHandler*/
	setEnableControl(EnableDpiControl) {
		this.enableDpiControl = EnableDpiControl;
	}
	/** GetDpi Value for a given stage.*/
	getDpiValue(stage) {
		// TODO - Bounds check
		// This is a dict of functions, make sure to call them
		device.log("Current DPI Stage: " + stage);
		device.log("Current DPI: " + this.dpiStageValues[stage]());

		return this.dpiStageValues[stage]();
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
		device.log("Sniper Mode: " + sniperMode);
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
	return endpoint.interface === 0 || endpoint.interface === 1 || endpoint.interface === 2 || endpoint.interface === 3 || endpoint.interface === 4;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png";
}