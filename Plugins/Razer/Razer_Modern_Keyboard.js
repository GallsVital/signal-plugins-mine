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
	Razer.setNumberOfLEDs(Razer.getDeviceLEDPositions().length);
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
		deviceInitialization();
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

	const eventData = { key : Razer.getInputDict()[input], keyCode : 0, "released": released };
	device.log(`${Razer.getInputDict()[input]} Hit. Release Status: ${released}`);
	keyboard.sendEvent(eventData, "Key Press");
}

function grabLighting(overrideColor) {
	const RGBData = [];
	const vLedPositions = Razer.getDeviceLEDPositions();
	const vKeys = Razer.getDeviceLEDIndexes();
	const ledsToSend = Razer.getNumberOfLEDsPacket();
	const packetsTotal = Math.ceil(vKeys.length / ledsToSend);

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
	let packetCount = 0;

	do {
		Razer.setKeyboardDeviceColor(ledsToSend, RGBData.splice(0, ledsToSend*3), packetCount);
		packetCount++;
	}while(packetCount < packetsTotal);
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
			0x24 : "M5"
		};

		this.PIDLibrary = {
			0x0271 : "Blackwidow V3 Mini",
			0x0258 : "Blackwidow V3 Mini",
			0x0287 : "Blackwidow V4",
			//0x0000 : "Blackwidow V4 X",
			0x028D : "Blackwidow V4 Pro",
			0x02A5 : "Blackwidow V4 75%",
			0x02A7 : "Huntsman V3 Pro TKL"
		};

		this.LEDLibrary = //I'm tired of not being able to copy paste between files.
		{
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
				ledsToSend : 15,
				image: "",
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
				ledsToSend : 23,
				image: "https://marketplace.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-pro.png"
			},
			"Blackwidow V4 X" :
			{
				size : [25, 13],
				vKeys :
				[
					138,																													155,
					139,  1,   2,   4,   5,   6,   7,   8,  9,   10,  11,  12,  13,  14,  15,       16,  17,  18,	19,  20,  21,  22,	    154,
					140, 24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,   42,  43,  44,  45,      153,
					141, 47,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  60,  61,	62,  63,  64,   65,  66,  67,  68,      152,
					142, 70,  71,  72,  73,  74,  75,  76,  77,  78,  79,  80,  81,  82,       84,					88,  89,  90, 		    151,
					143, 93,  94,  96,  97,  98,  99,  100, 101, 102, 103, 104, 105, 107,     			 109,		111, 112, 113, 114,     150,
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
					"Underglow Left LED 5", "M3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                  		          "Num 4", "Num 5", "Num 6",               "Underglow Right LED 5", //19
					"Underglow Left LED 6", "M2", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",                            "Num 1", "Num 2", "Num 3", "Num Enter",  "Underglow Right LED 6", //20
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
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],                           		              [20, 4], [21, 4], [22, 4],		  [24, 4], //19
					[0, 5], [1, 5], [2, 5], 		[4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],  		            		[18, 5],          [20, 5], [21, 5], [22, 5], [23, 5], [24, 5], //19
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
				ledsToSend : 23,
				image: "https://marketplace.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-pro.png"
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
					142, 70,  71,  72,  73,  74,  75,  76,  77,  78,  79,  80,  81,  82,       84,					88,  89,  90, 		    151,
					143, 93,  94,  96,  97,  98,  99,  100, 101, 102, 103, 104, 105, 107,     			 109,		111, 112, 113, 114,     150,
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
					"Underglow Left LED 5", "M3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                  		          "Num 4", "Num 5", "Num 6",               "Underglow Right LED 5", //19
					"Underglow Left LED 6", "M2", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                   	   "Up Arrow",                            "Num 1", "Num 2", "Num 3", "Num Enter",  "Underglow Right LED 6", //20
					"Underglow Left LED 7", "M1", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",      "Left Arrow",  "Down Arrow", "Right Arrow",     "Num 0", "Num .",                        "Underglow Right LED 7", //16
					"Underglow Left LED 8", "Underglow Right LED 8",
					"Underglow Left LED 9", "Underglow Right LED 9",
					"Underglow Left LED 10", "Underglow Right LED 10",
					"Underglow Left LED 11", "Underglow Right LED 11",
					"Underglow Left LED 12", "Underglow Right LED 12",
					"Underglow Left LED 13", "Underglow Bottom 1", "Underglow Bottom 2", "Underglow Bottom 3", "Underglow Bottom 4", "Underglow Bottom 5", "Underglow Bottom 6", "Underglow Bottom 7", "Underglow Bottom 8", "Underglow Bottom 9", "Underglow Bottom 10", "Underglow Bottom 11", "Underglow Bottom 12", "Underglow Right LED 13",
				],
				vLedPositions :
				[
					[0, 0],																																																		  [24, 0], //2
					[0, 1], [1, 1], [2, 1],			[4, 1], [5, 1], [6, 1], [7, 1],			[9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 1], [21, 1], [22, 1], [23, 1], [24, 1], //23
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], 		   [17, 2], [18, 2], [19, 2], [20, 2], [21, 2], [22, 2], [23, 2], [24, 2], //24
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], 		   [17, 3], [18, 3], [19, 3], [20, 3], [21, 3], [22, 3], [23, 3], [24, 3], //24
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4],                           		              [20, 4], [21, 4], [22, 4],		  [24, 4], //19
					[0, 5], [1, 5], [2, 5], 		[4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],  		            		[18, 5],          [20, 5], [21, 5], [22, 5], [23, 5], [24, 5], //19
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
				ledsToSend : 23,
				image: "https://marketplace.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-pro.png"
			},
			"Blackwidow V4 75%" :
			{
				size : [17, 9],
				vKeys :
				[
					0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  13,  14,		//15
					23,  24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  37,  38,		//15
					46,  47,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  60,		//15
					69,  70,  71,  72,  73,  74,  75,  76,  77,  78,  79,  80,  82,       83,		//14
					92,  94,  95,  96,  97,  98,  99, 100, 101, 102, 103, 105, 106, 107,			//14
					115, 116, 117, 119,                122,                123, 125, 126, 127, 128,	//10

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
				ledsToSend : 18,
				image: "https://marketplace.signalrgb.com/devices/brands/razer/keyboards/blackwidow-v4-75.png"
			},
			"Huntsman V3 Pro TKL" :
			{
				size : [17, 6],
				vKeys :
				[
					2,   4,   5,   6,   7,   8,  9,   10,  11,  12,  13,  14,  15,       16,  17,  18,
					25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,
					48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  60,  61,	62,  63,  64,
					71,  72,  73,  74,  75,  76,  77,  78,  79,  80,  81,  82,       84,
					94,  96,  97,  98,  99,  100, 101, 102, 103, 104, 105, 107,     			 109,
					117, 118, 119,                123,                127, 128, 129, 130, 131, 132, 133,
				],
				vLedNames :
				[
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break", //15
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",           "Insert", "Home", "Page Up",  //17
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                  "Del", "End", "Page Down", //17
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", 										//13
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                          "Up Arrow", //13
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",    "Left Arrow", "Down Arrow", "Right Arrow", //11
				],
				vLedPositions :
				[
					[0, 0], 		[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],   [14, 0], [15, 0], [16, 0], //15
					[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],   [14, 1], [15, 1], [16, 1], //17
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2], //17
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], 		   [13, 3],								 //13
					[0, 4], 		[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],            [15, 4],			 //13
					[0, 5], [1, 5], [2, 5],                 		[6, 5],                       	[10, 5], [11, 5], [12, 5], [13, 5],   [14, 5], [15, 5], [16, 5], //11
				],
				endpoint : { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
				DeviceType : "Keyboard",
				ledsToSend : 23,
				image: ""
			}
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
			deviceEndpoint: { "interface": 3, "usage": 0x0001, "usage_page": 0x000C },
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
			/** Is the device connected and able to receive commands? */
			DeviceInitialized : false,
			/** Variable Used to Indicate if a Device Requires an Apply Packet for Lighting Data. */
			requiresApplyPacket : false,
			/** Variable Used to Indicate if a Device Uses the Standard Modern Matrix. */
			supportsModernMatrix : false,

			SupportedFeatures:
			{
				BatterySupport: false,
				PollingRateSupport: false,
				FirmwareVersionSupport: false,
				SerialNumberSupport: false,
				DeviceModeSupport: false,
				HyperspeedSupport: false,
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

	/** Function for getting the number of LEDs a device has on it.*/
	getNumberOfLEDs() { return this.Config.NumberOfLEDs; }
	/** Function for setting the number of LEDs a device has on it.*/
	setNumberOfLEDs(NumberOfLEDs) { this.Config.NumberOfLEDs = NumberOfLEDs; }

	/** Function for setting the number of LEDs a device has to send on each packet */
	getNumberOfLEDsPacket() { return this.Config.ledsToSend; }
	/** Function for setting device led per packet properties.*/
	setNumberOfLEDsPacket(NumberOfLEDsPacket) { this.Config.ledsToSend = NumberOfLEDsPacket; }

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
			this.setNumberOfLEDsPacket(layout.ledsToSend);
			this.setDeviceProductId(device.productId()); //yay edge cases!
			this.setDeviceImage(layout.image);

			if(layout.vKeys) {
				this.setDeviceLEDIndexes(layout.vKeys);
			}

			if(layout.DeviceType) {
				this.setDeviceType(layout.DeviceType);
			}

			if(layout.requiresApplyPacket) {
				device.log("Device Requires Apply Packet");
				this.setRequiresApplyPacket(layout.requiresApplyPacket);
			}

		} else {
			device.log("No Valid Library Config found.");
		}

		device.setControllableLeds(this.getDeviceLEDNames(), this.getDeviceLEDPositions());

		if (layout.hyperflux) { this.setHyperFluxProperties(); }
	}
	setDeviceMacroProperties() {
		this.setInputDict(razerDeviceLibrary.keyboardInputDict);
	}
	setHyperFluxProperties() {
		device.log("Device has a Hyperflux Pad!");
		this.setHyperFlux(true);

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
	/* eslint-disable complexity */
	/** Function for detection all of the features that a device supports.*/
	detectSupportedFeatures() { //This list is not comprehensive, but is a good start.
		const BatterySupport = this.getDeviceBatteryLevel();

		if (BatterySupport !== -1) {
			this.Config.SupportedFeatures.BatterySupport = true;
			device.addFeature("battery");
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
	/** Function to set a modern mouse to software lighting control mode.*/
	setSoftwareLightingMode() {
		this.setSupportsModernMatrix(true);
		this.setModernSoftwareLightingMode();
		console.log("May there be light!");
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
		this.setDeviceMode("Software Mode"); // Software mode

		return this.setModernMatrixEffect([0x00, 0x00, 0x08, 0x00, 0x01]);
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
	/** Function to set a modern keyboard's led colors.*/
	setKeyboardDeviceColor(NumberOfLEDs, RGBData, packetidx) {
		this.StandardPacketSend([(NumberOfLEDs*3 + 5), 0x0F, 0x03, 0x00, 0x00, packetidx, 0x00, NumberOfLEDs].concat(RGBData));
	}
}

const Razer = new RazerProtocol();

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
	return endpoint.interface === 1 || endpoint.interface === 3;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png";
}