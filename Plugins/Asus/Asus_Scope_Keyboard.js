export function Name() { return "Asus Scope Keyboard"; }
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
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

export function Initialize() {
	ASUS.InitializeASUS();
}

export function Render() {
	ASUS.sendColors();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		ASUS.sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		device.write([0x00, 0x51, 0x2C, 0x04, 0x00, 0x48, 0x64, 0x00, 0x00, 0x02, 0x07, 0x0E, 0xF5, 0x00, 0xFF, 0x1D, 0x00, 0x06, 0xFF, 0x2B, 0x00, 0xFA, 0xFF, 0x39, 0x01, 0xFF, 0x00, 0x48, 0xFF, 0xF6, 0x00, 0x56, 0xFF, 0x78, 0x07, 0x64, 0xFF, 0x00, 0x0D], 65);
		device.write([0x00, 0x50, 0x55], 65);
	}

}

export class ASUS_Mouse_Protocol {
	constructor() {
		this.Config = {
			DeviceProductID: 0x0000,
			DeviceName: "Asus Scope",
			DeviceEndpoint: { "interface": 1, "usage": 0x0001, "usage_page": 0xFF00, "collection": 0x0000 },
			Leds: [],
			LedNames: [],
			LedPositions: [],
		};
	}

	getDeviceProperties(deviceName) { return ASUSdeviceLibrary.LEDLibrary[deviceName];};

	getDeviceProductId() { return this.Config.DeviceProductID; }
	setDeviceProductId(productID) { this.Config.DeviceProductID = productID; }

	getDeviceName() { return this.Config.DeviceName; }
	setDeviceName(deviceName) { this.Config.DeviceName = deviceName; }

	getDeviceEndpoint() { return this.Config.DeviceEndpoint; }
	setDeviceEndpoint(deviceEndpoint) { this.Config.DeviceEndpoint = deviceEndpoint; }

	getLeds() { return this.Config.Leds; }
	setLeds(leds) { this.Config.Leds = leds; }

	getLedNames() { return this.Config.LedNames; }
	setLedNames(ledNames) { this.Config.LedNames = ledNames; }

	getLedPositions() { return this.Config.LedPositions; }
	setLedPositions(ledPositions) { this.Config.LedPositions = ledPositions; }

	getDeviceImage(deviceName) { return ASUSdeviceLibrary.imageLibrary[deviceName]; }

	InitializeASUS() {
		//Initializing vars
		this.setDeviceProductId(device.productId());
		this.setDeviceName(ASUSdeviceLibrary.PIDLibrary[this.getDeviceProductId()]);

		const DeviceProperties = this.getDeviceProperties(this.getDeviceName());
		this.setDeviceEndpoint(DeviceProperties.endpoint);
		this.setLedNames(DeviceProperties.vLedNames);
		this.setLedPositions(DeviceProperties.vLedPositions);

		device.log(`Device model found: ` + this.getDeviceName());
		device.setName("ASUS " + this.getDeviceName());
		device.setSize(DeviceProperties.size);
		device.setControllableLeds(this.getLedNames(), this.getLedPositions());
		device.setImageFromUrl(this.getDeviceImage(this.getDeviceName()));
		device.set_endpoint(DeviceProperties.endpoint[`interface`], DeviceProperties.endpoint[`usage`], DeviceProperties.endpoint[`usage_page`], DeviceProperties.endpoint[`collection`]);
	}

	sendColors(overrideColor) {

		const deviceLeds = this.getLeds();
		const RGBData = new Array(600).fill(255);
		let TotalLedCount = 144;
		let packetCount = 0;

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

			RGBData[iIdx * 4 + 0] = deviceLeds[iIdx];
			RGBData[iIdx * 4 + 1] = color[0];
			RGBData[iIdx * 4 + 2] = color[1];
			RGBData[iIdx * 4 + 3] = color[2];
		}

		while(TotalLedCount > 0){
			const ledsToSend = TotalLedCount >= 15 ? 15 : TotalLedCount;

			let packet = [];
			packet[0] = 0x00;
			packet[1] = 0xC0;
			packet[2] = 0x81;
			packet[3] = 0x90 - (0x0F * packetCount++);
			packet[4] = 0x00;
			packet = packet.concat(RGBData.splice(0, ledsToSend*4));
			device.write(packet, 65);
			//device.read(packet,65)
			TotalLedCount -= ledsToSend;
		}
	}
}

export class deviceLibrary {
	constructor(){
		this.PIDLibrary	=	{
			0x18F8: "ROG Strix Scope",
			0x190C: "ROG Strix Scope TKL",
			0x1954: "ROG Strix Scope TKL", // Electro Punk
			0x19D0: "ROG Strix Scope TKL", // Moonlight White
			0x1951: "ROG Strix Scope RX",
			0x1A05: "ROG Strix Scope RX", // Deluxe
			0x1AAE: "ROG Strix Scope II 96" // Wired
		};

		this.LEDLibrary	=	{
			"ROG Strix Scope":
			{
				size: [21, 6],
				vLeds:[
					0,      24, 32, 40, 48,   64, 72, 80, 88,  96, 104, 112, 120,	128, 136, 144,
					1,  17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,    121,	129, 137, 145,	153, 161, 169, 177,
					2,  18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,    122,	130, 138, 146,	154, 162, 170, 178,
					3,    19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99,      123,						155, 163, 171,
					4,    20, 28, 36, 44, 52, 60, 68, 76, 84, 92,          124,			140,		156, 164, 172, 180,
					5,    21, 29,      53,            77, 93, 101,  125,   133, 	141, 149, 157,	173,
				],
				vLedNames: [
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",  //21
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",    //21
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                              "Num 4", "Num 5", "Num 6",             //16
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter", //17
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num ."                       //13
				],
				vLedPositions: [
					[0, 0],    [1, 0], [2, 0], [3, 0], [4, 0],    [6, 0], [7, 0], [8, 0], [9, 0],  [10, 0], [11, 0], [12, 0], [13, 0],      [14, 0], [15, 0], [16, 0],            //20
					[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],     [14, 1], [15, 1], [16, 1],   [17, 1], [18, 1], [19, 1], [20, 1], //21
					[0, 2],    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],   [17, 2], [18, 2], [19, 2], [20, 3], //20
					[0, 3],    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],         [13, 3],                             [17, 3], [18, 3], [19, 3], // 17
					[0, 4],      [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],               [13, 4],           [15, 4],           [17, 4], [18, 4], [19, 4], [20, 4], // 17
					[0, 5], [1, 5], [2, 5],                      [6, 5],                        [10, 5], [11, 5],  [12, 5], [13, 5],    [14, 5], [15, 5], [16, 5],   [17, 5],         [19, 5],               // 13
				],
				endpoint : { "interface": 1, "usage": 0x0001, "usage_page": 0xFF00, "collection": 0x0000 },
			},
			"ROG Strix Scope TKL":
			{
				size: [17, 7],
				vLeds:[
					0,      24, 32, 40, 48,   64, 72, 80, 88,  96, 104, 112, 120,  128,  144,
					1,  17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,    121,   129, 137, 145,
					2,  18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,    122,   130, 138, 146,
					3,    19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99,      123,
					4,    20, 28, 36, 44, 52, 60, 68, 76, 84, 92,          124,       140,
					5,    21, 29,      53,            77, 93, 101,  125,   133, 141, 149,

					6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94, 102, 110, 118, 126, 134, 142,  150, 158, 166, 174, 182, 190, 198, 206
				],
				vLedNames: [
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Logo 1", "Logo 2",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",
					"LightBar Led 1", "LightBar Led 2", "LightBar Led 3", "LightBar Led 4", "LightBar Led 5", "LightBar Led 6", "LightBar Led 7", "LightBar Led 8", "LightBar Led 9",
					"LightBar Led 10", "LightBar Led 11", "LightBar Led 12", "LightBar Led 13", "LightBar Led 14", "LightBar Led 15", "LightBar Led 16", "LightBar Led 17", "LightBar Led 18",
					"LightBar Led 19", "LightBar Led 20", "LightBar Led 21", "LightBar Led 22", "LightBar Led 23", "LightBar Led 24", "LightBar Led 25", "LightBar Led 26"
				],
				vLedPositions: [
					[0, 0],    [1, 0], [2, 0], [3, 0], [4, 0],    [6, 0], [7, 0], [8, 0], [9, 0],  [10, 0], [11, 0], [12, 0], [13, 0],       [14, 0],        [16, 0],
					[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1],  [12, 1], [13, 1],  [14, 1], [15, 1], [16, 1],
					[0, 2],    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],
					[0, 3],    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],         [13, 3],
					[0, 4],      [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],               [13, 4],           [15, 4],
					[0, 5], [1, 5], [2, 5],                      [6, 5],                        [10, 5], [11, 5],  [12, 5], [13, 5],    [14, 5], [15, 5], [16, 5],

					[0, 6], [0, 6], [1, 6], [1, 6], [2, 6], [3, 6], [4, 6], [4, 6], [5, 6],  [5, 6], [6, 6], [7, 6], [7, 6], [8, 6], [9, 6], [9, 6], [10, 6], [11, 6], [11, 6], [12, 6], [13, 6], [13, 6], [14, 6], [15, 6], [16, 6], [16, 6]
				],
				endpoint : { "interface": 1, "usage": 0x0001, "usage_page": 0xFF00, "collection": 0x0000 },
			},
			"ROG Strix Scope RX":
			{
				size: [21, 6],
				vLeds:[
					0,      24, 32, 40, 48,   64, 72, 80, 88,  96, 104, 112, 120,   128, 136, 144, 168, 176,
					1,  17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,    121,   129, 137, 145,   153, 161, 169, 177,
					2,  18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,    122,   130, 138, 146,   154, 162, 170, 178,
					3,    19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 107,  123,                  155, 163, 171,
					4,  12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92,          124,       140,       156, 164, 172, 180,
					5,    21, 29,      53,            77, 93, 101,  125,   133, 141, 149,   157,    173,
				],
				vLedNames: [
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break", "ROG1", "ROG2",
					"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Ö", "Ü", "Ó", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",  //21
					"Tab", "Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ő", "Ú", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",    //21
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", "É", "Á", "Ű", "Enter",                                                          "Num 4", "Num 5", "Num 6",             //17
					"Left Shift", "Í", "Y", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                             "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter", //18
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num ."                       //13
				],
				vLedPositions: [
					[0, 0],    [1, 0], [2, 0], [3, 0], [4, 0],    [6, 0], [7, 0], [8, 0], [9, 0],  [10, 0], [11, 0], [12, 0], [13, 0],      [14, 0], [15, 0], [16, 0], [20, 0], [21, 0],        //18
					[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],     [14, 1], [15, 1], [16, 1],   [17, 1], [18, 1], [19, 1], [20, 1], //21
					[0, 2],    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],   [17, 2], [18, 2], [19, 2], [20, 2], //21
					[0, 3],    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],                             [17, 3], [18, 3], [19, 3], //17
					[0, 4],  [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],       [13, 4],           [15, 4],           [17, 4], [18, 4], [19, 4], [20, 4], // 18
					[0, 5], [1, 5], [2, 5],                      [6, 5],                        [10, 5], [11, 5],  [12, 5], [13, 5],    [14, 5], [15, 5], [16, 5],   [17, 5],         [19, 5],               // 13
				],
				endpoint : { "interface": 1, "usage": 0x0001, "usage_page": 0xFF00, "collection": 0x0000 },
			},
			"ROG Strix Scope II 96":
			{
				size: [21, 6],
				vLeds:[
					0,      24, 32, 40, 48,   64, 72, 80, 88,  96, 104, 112, 120,	128, 136, 144,
					1,  17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,    121,	129, 137, 145,	153, 161, 169, 177,
					2,  18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,    122,	130, 138, 146,	154, 162, 170, 178,
					3,    19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99,      123,						155, 163, 171,
					4,    20, 28, 36, 44, 52, 60, 68, 76, 84, 92,          124,			140,		156, 164, 172, 180,
					5,    21, 29,      53,            77, 93, 101,  125,   133, 	141, 149, 157,	173,
				],
				vLedNames: [
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",  //21
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",    //21
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                              "Num 4", "Num 5", "Num 6",             //16
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter", //17
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num ."                       //13
				],
				vLedPositions: [
					[0, 0],    [1, 0], [2, 0], [3, 0], [4, 0],    [6, 0], [7, 0], [8, 0], [9, 0],  [10, 0], [11, 0], [12, 0], [13, 0],      [14, 0], [15, 0], [16, 0],            //20
					[0, 1],  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],     [14, 1], [15, 1], [16, 1],   [17, 1], [18, 1], [19, 1], [20, 1], //21
					[0, 2],    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],   [17, 2], [18, 2], [19, 2], [20, 3], //20
					[0, 3],    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],         [13, 3],                             [17, 3], [18, 3], [19, 3], // 17
					[0, 4],      [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],               [13, 4],           [15, 4],           [17, 4], [18, 4], [19, 4], [20, 4], // 17
					[0, 5], [1, 5], [2, 5],                      [6, 5],                        [10, 5], [11, 5],  [12, 5], [13, 5],    [14, 5], [15, 5], [16, 5],   [17, 5],         [19, 5],               // 13
				],
				endpoint : { "interface": 1, "usage": 0x0001, "usage_page": 0xFF00, "collection": 0x0000 },
			},
		};

		this.imageLibrary = {
			"ROG Strix Scope": 		"https://marketplace.signalrgb.com/devices/brands/asus/keyboards/strix-scope-standard.png",
			"ROG Strix Scope TKL": 	"https://marketplace.signalrgb.com/devices/brands/asus/keyboards/strix-scope-tkl.png",
			"ROG Strix Scope RX":	"https://marketplace.signalrgb.com/devices/brands/asus/keyboards/strix-scope-rx.png",
			"ROG Strix Scope II 96":"https://m.media-amazon.com/images/I/71zmZbiUeAL._AC_UF894,1000_QL80_.jpg"
		};
	}
}

const ASUSdeviceLibrary = new deviceLibrary();
const ASUS = new ASUS_Mouse_Protocol();

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint) {
	return endpoint.interface === 1;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/asus/keyboards/strix-scope-standard.png";
}
