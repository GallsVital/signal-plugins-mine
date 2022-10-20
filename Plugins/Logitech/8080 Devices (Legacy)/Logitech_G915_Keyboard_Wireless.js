export function Name() { return "Logitech G915 Wireless Mode"; }
export function VendorId() { return 0x046d; }
export function Documentation(){ return "troubleshooting/logitech"; }
export function ProductId() { return 0xC541; }//0xC541
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [24, 9]; }
export function DefaultPosition(){return [10, 100];}
const DESIRED_HEIGHT = 85;
export function DefaultScale(){return Math.floor(DESIRED_HEIGHT/Size()[1]);}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
DpiControl:readonly
dpistages:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
dpi5:readonly
dpi6:readonly
DpiLight:readonly
OnboardState:readonly
DPIRollover:readonly
pollingrate:readonly
*/
export function ControllableParameters()
{
    return [
        {"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "group":"lighting", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"DpiControl", "group":"mouse", "label":"Enable Dpi Control","type":"boolean","default":"false"},
		{"property":"dpistages", "group":"mouse", "label":"Number of DPI Stages","step":"1", "type":"number","min":"1", "max":"5","default":"5"},
        {"property":"dpi1", "group":"mouse", "label":"DPI 1","step":"50", "type":"number","min":"200", "max":"25600","default":"400"},
		{"property":"dpi2", "group":"mouse", "label":"DPI 2","step":"50", "type":"number","min":"200", "max":"25600","default":"800"},
		{"property":"dpi3", "group":"mouse", "label":"DPI 3","step":"50", "type":"number","min":"200", "max":"25600","default":"1200"},
		{"property":"dpi4", "group":"mouse", "label":"DPI 4","step":"50", "type":"number","min":"200", "max":"25600","default":"1600"},
		{"property":"dpi5", "group":"mouse", "label":"DPI 5","step":"50", "type":"number","min":"200", "max":"25600","default":"2000"},
		{"property":"dpi6", "group":"mouse", "label":"Sniper Button DPI","step":"50", "type":"number","min":"200", "max":"25600","default":"400"},
		{"property":"DpiLight", "group":"lighting", "label":"DPI Light Always On","type":"boolean","default": "true"},
		{"property":"OnboardState", "group":"", "label":"Onboard Button Mode","type":"boolean","default": "false"},
		{"property":"DPIRollover", "group":"mouse", "label":"DPI Stage Rollover","type":"boolean","default": "false"},
		{"property":"pollingrate", "group":"mouse", "label":"Polling Rate","type":"combobox", "values":[ "1000","500", "250", "100" ], "default":"1000"},
    ];
}



var deviceName;
var Sniper;
var Sleep = false;
var DeviceConnected = false;
var DPIStage = 1;
var savedPollTimer = Date.now();
var PollModeInternal = 15000;


const options = 
{
	Lightspeed : true
}

const DPIStageDict =
{
	1:  function(){ return dpi1; },
	2:  function(){ return dpi2; },
	3:  function(){ return dpi3; },
	4:  function(){ return dpi4; },
	5:  function(){ return dpi5; }
}

const vG915LedNames = 
[
	"logo",                         "brightness",
	"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Print Screen", "Scroll Lock", "Pause Break",     "MediaRewind", "MediaPlayPause", "MediaFastForward", "MediaStop",
	"G1", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",
	"G2", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",
	"G3", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                               "Num 4", "Num 5", "Num 6",
	"G4", "Left Shift","Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",                "Num 1", "Num 2", "Num 3", "Num Enter",
	"G5", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",        "Num 0", "Num .",
	"ISO_<", "ISO_#",
];

const vKeymap = 
[
	38, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,          67, 68, 69,
	50, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 42, 43, 39,      70, 71, 72,
	40, 17, 23, 5,  18, 20, 25, 21, 9,  15, 16, 44, 45, 46,      73, 74, 75,
	54, 1,  19, 4,  6,  7,  8,  10, 11, 12, 48, 49, 37,
	81, 26, 24, 3,  22, 2,  14, 13, 51, 52, 53, 85,                  79,
	80, 83, 82,          41,            86, 87, 88, 84,          77, 78, 76,
	104,47,
];

const vG915LedPositions = 
[

	[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],          [11, 1], [12, 1], [13, 1], [14, 1],   [15, 1], [16, 1], [17, 1],
	[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],
	[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],   [15, 3], [16, 3], [17, 3],
	[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],          [14, 4],
	[1, 5],         [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12,5 ],          [14, 5],            [16, 5],
	[1, 6], [2, 6], [3, 6],                         [7, 6],                          [11, 6], [12, 6], [13, 6], [14, 6],   [15, 6], [16, 6], [17, 6],

	[2, 5], [13, 4],
];
/** @type {LedPosition[]} */
const vFAKELedPositions = 
[
	[0,0],                                    [6,0],
		   [1,1], [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], 		  [11,1], [12,1], [13,1], [14,1],   [15,1], [16,1], [17,1], [19,1], [20,1], [21,1], [22,1],
	[0,2], [1,2], [2,2], [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2], [13,2], [14,2],   [15,2], [16,2], [17,2], [19,2], [20,2], [21,2], [22,2],
	[0,3], [1,3], [2,3], [3,3], [4,3], [5,3], [6,3], [7,3], [8,3], [9,3], [10,3], [11,3], [12,3], [13,3], [14,3],   [15,3], [16,3], [17,3], [19,3], [20,3], [21,3], [22,3],
	[0,4], [1,4], [2,4], [3,4], [4,4], [5,4], [6,4], [7,4], [8,4], [9,4], [10,4], [11,4], [12,4],         [14,4],                           [19,4], [20,4], [21,4],
	[0,5], [1,5],        [3,5], [4,5], [5,5], [6,5], [7,5], [8,5], [9,5], [10,5], [11,5], [12,5],         [14,5],           [16,5],         [19,5], [20,5], [21,5], [22,5],
	[0,6], [1,6], [2,6], [3,6],                      [7,6],                       [11,6], [12,6], [13,6], [14,6],   [15,6], [16,6], [17,6], [19,6], [20,6],
	[2,5], [13,4],
];

export function LedNames()
{
    return Logitech.Config.LedNames;
}

export function LedPositions()
{
    return Logitech.Config.LedPositions;
}

export function Initialize()
{
	Logitech.SetConnectionMode(Logitech.WIRELESS);

	DeviceConnected = connectionCheck();
	if(DeviceConnected !== true)
	{
		return;
	}
	deviceInitialization();
}

export function Render()
{
	if(DeviceConnected !== true)
	{
		DeviceConnected = connectionCheck();
		if(DeviceConnected)
		{
			deviceInitialization();
			return;
		}
		device.pause(1000);
		return;
	}
	if(Logitech.Config.DeviceType === "Keyboard")
	{
	SendPacket();
	SendLogoZone();
	SendMediaZones();
	SendGkeys();
	SendNumpad();
	KeebApply();
	}
	else
	{
		grabColors();
		PollBattery();
	}
	DetectInputs();
}

export function Shutdown()
{   
	if(Logitech.Config.DeviceType === "Keyboard")
	{
		SendPacket(true);
		SendLogoZone(true);
		SendMediaZones(true);
		SendGkeys(true);
		SendNumpad(true);
		KeebApply();
	}
	else
	{
		grabColors(true);
	} 
}

export function onDpiLightChanged()
{
	Logitech.SetDpiLightAlwaysOn(DpiLight);
}

export function onDpiControlChanged()
{
	DPIStageControl();
}

export function ondpi1Changed()
{
	DPIStageControl(1,1);
}

export function ondpi2Changed()
{
	DPIStageControl(1,2);
}

export function ondpi3Changed()
{
	DPIStageControl(1,3);
}
export function ondpi4Changed()
{
	DPIStageControl(1,4);
}

export function ondpi5Changed()
{
	DPIStageControl(1,5);
}

export function ondpi6Changed()
{
	DPIStageControl(1,6);
}

export function onOnboardStateChanged()
{
	Logitech.SetOnBoardState(OnboardState);
	Logitech.ButtonSpySet(OnboardState);
	if(OnboardState)
	{
		if(Logitech.Config.IsHeroProtocol)
		{
			Logitech.SetDPILights(3);
		}
		else
		{
			Logitech.SetDirectMode();
		}
	}
}

export function onpollingrateChanged()
{
	Logitech.setPollingRate();
}

function deviceInitialization()
{
	Logitech.FetchIDs();
	Logitech.SetHasBattery();

	let CommunicationID = Logitech.FetchDeviceInfo();

	let DeviceID = "0000";
	if(Logitech.DeviceIDs.hasOwnProperty(CommunicationID))
	{
		device.log("Matching Device ID Found");
		Logitech.SetDeviceID(CommunicationID);
		Logitech.SetWirelessMouseType(Logitech.DeviceID);
		DeviceID = Logitech.DeviceID;
		deviceName = Logitech.DeviceIDs[Logitech.DeviceID] || "UNKNOWN";
	}
	else if(Logitech.ProductIDs.hasOwnProperty(CommunicationID))
	{
		device.log("Matching Product ID Found");
		Logitech.SetProductID(CommunicationID);
		Logitech.SetWiredMouseType(Logitech.ProductID);
		DeviceID = Logitech.ProductID;
		deviceName = Logitech.ProductIDs[Logitech.ProductID] || "UNKNOWN";
	}

    device.log(`Device Id Found: ${DeviceID}`);
    device.log(`Device Name: ${deviceName}`);

	if(Logitech.Config.DeviceType == "Keyboard")
	{
		Logitech.GKeySetup(); //Macro Hook-ins
		Logitech.MKeySetup();
	}
	else
	{
	Logitech.SetOnBoardState(OnboardState);
	Logitech.ButtonSpySet(OnboardState);
	Logitech.SetDirectMode(OnboardState);

	Logitech.SetDpiLightAlwaysOn(DpiLight);

	if(DpiControl)
		{
		Logitech.setDpi(DPIStageDict[DPIStage](), DPIStage);
		Logitech.SetDPILights(DPIStage);	
		}
	else
		{
		Logitech.SetDPILights(3); //Fallback to set DPILights to full
		}
	}

	if(Logitech.Config.DeviceType == "Keyboard")
	{
		device.setControllableLeds(vG915LedNames, vFAKELedPositions);
	}
	device.setSize(Logitech.Config.DeviceSize);
	device.setControllableLeds(Logitech.Config.LedNames, Logitech.Config.LedPositions);

	if(Logitech.Config.HasBattery)
	{
		device.addFeature("battery");
		device.pause(1000);
    	battery.setBatteryLevel(Logitech.GetBatteryCharge());
	}
}

function connectionCheck()
{
	let data = [0x80, 0x00, 0x00, 0x01];//Enable Hid++ Notifications
    Logitech.SendShortWiredMessage(data);

    data = [0x80, 0x02, 0x02, 0x00]; //Fake Reconnect
	let returndata = Logitech.SendShortWiredMessage(data);

	if(returndata[1] === 34)
	{
		device.log("Attached Device Found");
		let DeviceId = returndata[3].toString(16) + returndata[2].toString(16);
		device.log("Attached DeviceID: " + DeviceId);
		device.pause(100);
		return true;
	}
	return false;
}

function disablekeysbyusage()//Don't touch
{
	clearShortReadBuffer();
	clearLongReadBuffer();
	device.set_endpoint(2, 0x0001, 0xff00);
	var packet = [ShortMessage, ConnectionMode, DisableKeysID, 0x00]; //Device type
	device.write(packet,7);
	device.set_endpoint(2, 0x0002, 0xff00);
	let keydisablecapability = device.read([0x00],20);
	device.log("Total number of keys to disable" + keydisablecapability);

	packet = [LongMessage, ConnectionMode, DisableKeysID, 0x10, 0x00]; //This disables keys in game mode. NO HID OUTPUT
	device.write(packet,20);
}

function PollBattery()
{  
    	if (Date.now() - savedPollTimer < PollModeInternal) 
    	{
        return
    	}
    	savedPollTimer = Date.now();
		if(Logitech.Config.HasBattery)
		{
		var bc = Logitech.GetBatteryCharge();
		battery.setBatteryLevel(bc);
		}
}

function DetectInputs()
{
	
		do
    	{
    	let packet = [];
    	packet = device.read([0x00],9, 10);
    	let input = ProcessInputs(packet);
		
		if(input == "DPI_UP")
		{
			DPIStage++;
			DPIStageControl();
		}
		if(input == "DPI_Down")
		{
			DPIStage--;
			DPIStageControl();	
		}
		if(input == "Sniper")
		{		
			if(DpiControl)
			{
			Sniper = true;
			Logitech.setDpi(dpi6, 1);
			Logitech.SetDPILights(1);
			}
		}

    	}
    	while(device.getLastReadSize() > 0)
}

function PrintBitmask16(byte)
{
	var sOut = ""
	for(var idx = 15; idx >= 0; idx--){
		var msk = byte >> idx;
		if (msk & 0x01) sOut += "1";
		else sOut += "0";
	}
	device.log(sOut);
}

function ProcessInputs(packet)
{
	if(packet[0] == Logitech.LongMessage && packet[1] == Logitech.ConnectionMode && packet[2] == Logitech.FeatureIDs.ButtonSpyID)
	{
		var value = packet[4];
	value <<= 8;
	value |= packet[5]
	PrintBitmask16(value);
    	if(packet[4] == 0x01)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button7"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button7"];
		}

		if(packet[4] == 0x02)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button10"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button10"];
		}

    	if(packet[4] == 0x04)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button11"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button11"];
		}

		if(packet[5] == 0x01)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button1"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button1"];
		}

    	if(packet[5] == 0x02)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button2"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button2"];
		}

		if(packet[5] == 0x04)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button3"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button3"];
		}

		if(packet[5] == 0x08)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button4"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button4"];
		}

		if(packet[5] == 0x10)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button5"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button5"];
		}

		if(packet[5] == 0x20)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button6"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button6"];
		}

		if(packet[5] == 0x40)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button9"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button9"];
		}

		if(packet[5] == 0x80)
		{
			device.log(Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button8"]);
			return Logitech.ButtonMaps[Logitech.Config.MouseBodyStyle]["button8"];
		}

		if(packet[5] == 0x00 && Sniper == true)
		{
			device.log("Sniper Button Depressed");
			Sniper = false;
		
			if(DpiControl)
			{
				Logitech.setDpi(DPIStageDict[DPIStage](), DPIStage);
				Logitech.SetDPILights(DPIStage);
			}
		}
	}
	if(packet[0] == Logitech.LongMessage && packet[1] == Logitech.ConnectionMode && packet[2] == 0x06 && packet[3] == 0x00 && packet[6] == 0x00)
	{
		device.log("Waking From Sleep");
		device.pause(5000); //Wait five seconds before Handoff. Allows device boot time.
		Initialize();
	}
}

function DPIStageControl(override,stage)
{
	if(override === 1)
	{
		DPIStage = stage;
	}

	if(DPIStage > dpistages)
    {
        DPIStage = (DPIRollover ? 1 : dpistages);
    }
	if(DPIStage < 1)
	{
		DPIStage = (DPIRollover ? dpistages : 1);
	}
	
	if(DpiControl)
	{
		
    Logitech.setDpi(DPIStageDict[DPIStage](), DPIStage);
	Logitech.SetDPILights(DPIStage);
	}
	device.log(DPIStage);
}

function grabColors(shutdown = false)
{
	let RGBData = [];
		for (let iIdx = 0; iIdx < Logitech.Config.LedPositions.length; iIdx++) 
		{
			var iX = Logitech.Config.LedPositions[iIdx][0];
			var iY = Logitech.Config.LedPositions[iIdx][1];
			var color;
	
			if(shutdown)
			{
				color = hexToRgb(shutdownColor);
			}
			else if (LightingMode === "Forced") 
			{
				color = hexToRgb(forcedColor);
			}
			else
			{
				color = device.color(iX, iY);
			}

			if(Logitech.DeviceID === "4099") //PerkeylightingV2 uses a different packet structure than the 8070 and 8071 standards.
			{
				let iLedIdx = (iIdx * 4);
				RGBData[iLedIdx] = iIdx+1;
				RGBData[iLedIdx+1] = color[0];
				RGBData[iLedIdx+2] = color[1];
				RGBData[iLedIdx+3] = color[2];
			}
			else
			{
				let iLedIdx = (iIdx * 3);
				RGBData[iLedIdx] =   color[0];
				RGBData[iLedIdx+1] = color[1];
				RGBData[iLedIdx+2] = color[2];
			}
			
		}
		Logitech.SendLighting(RGBData);
}

function KeebApply() 
{
	let packet = [0x0B,0x70];
	Logitech.SendLongMessage(packet);
}

function SendNumpad(shutdown = false) 
{
	let vNumPadPostions = 
	[
		[19, 2], [20, 2], [21, 2], [22, 2],
		[19, 3], [20, 3], [21, 3], [22, 3],
		[19, 4], [20, 4], [21, 4],
		[19, 5], [20, 5], [21, 5], [22, 5],
		[19, 6], [20, 6],
	];
	let vNumpadMap = 
	[
		80, 81, 82, 83,
		92, 93, 94, 84,
		89, 90, 91,
		86, 87, 88, 85,
		95, 96
	];

	for(let iIdx = 0; iIdx < vNumpadMap.length; iIdx = iIdx + 4)
	{
		let packet = [0x0B,0x1C];

		for (let index = 0; index < 4 && index+iIdx < vNumpadMap.length ;index++) 
		{
			let keyNumber = index+iIdx;
			let iKeyPosX = vNumPadPostions[keyNumber][0];
			let iKeyPosY = vNumPadPostions[keyNumber][1];
			var color;

			if(shutdown){
				color = hexToRgb(shutdownColor);
			}else if (LightingMode === "Forced") {
				color = hexToRgb(forcedColor);
			}else{
				color = device.color(iKeyPosX, iKeyPosY);
			}
			let keyValue = vNumpadMap[keyNumber];


			packet[4 + index*4] = keyValue;
			packet[5 + index*4] = color[0];
			packet[6 + index*4] = color[1];
			packet[7 + index*4] = color[2];

		}
		Logitech.SendLongMessage(packet);
	}
}

function SendGkeys(shutdown = false) 
{
	let vGkeyPostions = [ [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],];

	for(let iIdx = 0; iIdx < vGkeyPostions.length; iIdx = iIdx + 4)
	{
		let packet = [0x0B, 0x1F];

		for (let index = 0; index < 4 && index+iIdx < vGkeyPostions.length ;index++) 
		{
			let keyNumber = index+iIdx;
			let iKeyPosX = vGkeyPostions[keyNumber][0];
			let iKeyPosY = vGkeyPostions[keyNumber][1];
			var color;

			if(shutdown)
			{
				color = hexToRgb(shutdownColor);
			}
			else if (LightingMode === "Forced") 
			{
				color = hexToRgb(forcedColor);
			}
			else
			{
				color = device.color(iKeyPosX, iKeyPosY);
			}

			packet[4 + index*4] = 0xB4 + keyNumber;
			packet[5 + index*4] = color[0];
			packet[6 + index*4] = color[1];
			packet[7 + index*4] = color[2];

		}
		Logitech.SendLongMessage(packet);
	}
}

function SendLogoZone(shutdown = false)
{
	for(let iIdx = 0; iIdx < 2; iIdx++)
	{
		var color;

		if(shutdown)
		{
			color = hexToRgb(shutdownColor);
		}
		else if (LightingMode === "Forced") 
		{
			color = hexToRgb(forcedColor);
		}
		else
		{
			if(iIdx === 0) 
			{
				color = device.color(0, 0);
			} 
			else 
			{
				color = device.color(4, 0);
			}
		}
		let packet = [ 0x0B, 0x00, 0x00, color[0], color[1], color[2], 0xFF ];

		if(iIdx === 0) 
		{
			packet[3] = 0x1B;
			packet[4] = 0xD2;
		} 
		else 
		{
			packet[3] = 0x19;
			packet[4] = 0x99;
		}
		Logitech.SendLongMessage(packet);
	}
}

function SendMediaZones(shutdown = false)
{
	let zones = [ [12, 0], [14, 0], [13, 0], [11, 0] ];

	for(let iIdx = 0; iIdx < zones.length; iIdx++)
	{
		let iKeyPosX = zones[iIdx][0];
		let iKeyPosY = zones[iIdx][1];
		var color;

		if(shutdown)
		{
			color = hexToRgb(shutdownColor);
		}
		else if (LightingMode === "Forced") 
		{
			color = hexToRgb(forcedColor);
		}
		else
		{
			color = device.color(iKeyPosX, iKeyPosY);
		}

		let packet = [ 0x0B, 0x10, 155+iIdx, color[0], color[1], color[2], 0xFF ];
		Logitech.SendLongMessage(packet);
	}
}

function SendPacket(shutdown = false) 
{
	let count = 0;
	let RGBData = [];
	let TotalKeys = 0;

	for (let iIdx = 0; iIdx < vKeymap.length; iIdx++)
	{
		let iKeyPosX = vG915LedPositions[iIdx][0];
		let iKeyPosY = vG915LedPositions[iIdx][1];
		var color;

		if(shutdown)
		{
			color = hexToRgb(shutdownColor);
		}
		else if (LightingMode === "Forced") 
		{
			color = hexToRgb(forcedColor);
		}
		else
		{
			color = device.color(iKeyPosX, iKeyPosY);
		}

		if(OldValue[iIdx] != -1)
		{
			if(arrayEquals(OldValue[iIdx], color))
			{
				count++;
				continue;
			}
		}

		OldValue[iIdx] = color;

		let keyValue = vKeymap[iIdx];

		if(keyValue >= 80){keyValue += 24;}

		if(vKeymap[iIdx] >= 88){keyValue -= 14;}

		RGBData[TotalKeys*4] = keyValue;
		RGBData[TotalKeys*4+1] = color[0];
		RGBData[TotalKeys*4+2] = color[1];
		RGBData[TotalKeys*4+3] = color[2];
		TotalKeys++;
	}

	while(TotalKeys > 0)
	{
		let packet = [0x0B,0x18];
		packet = packet.concat(RGBData.splice(0, 16));
		TotalKeys -= 4;

		Logitech.SendLongMessage(packet);
	}
}

const OldValue = new Array(250).fill(-1);

function arrayEquals(a, b) 
{
	return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
}

/**
 * Protocol Library for Logitech's Peripherals. (HIDPP V2)
 * @class LogitechProtocol
 *
 */

 class LogitechProtocol
 {
	 constructor(options = {})
	 {
		 this.WIRED = 0xFF;
		 this.WIRELESS = 0x01;
		 this.ShortMessage = 0x10;
		 this.LongMessage = 0x11;
		 this.VeryLongMessage = 0x12;
		 this.ShortMessageEndpointByte = 0x0001;
		 this.LongMessageEndpointByte = 0x0002;
		 this.EndpointByte3 = 0xff00;
		 this.HardwareMode = 0x01;
		 this.SoftwareMode = 0x02;
		 this.DeviceID = "0";
		 this.ProductID = "0";
 
		 this.CommunicationType =
		 {
			 "SingleConnection" : 0x01,
			 "MultiConnection" : 0x02,
		 };
 
		 this.FeatureIDs =
		 {
			 DeviceInfoID : 0,
			 DeviceNameID : 0,
			 FriendlyNameID : 0,
			 ResetID : 0,
			 BatteryVoltageID : 0,
			 UnifiedBatteryID : 0,
			 LEDControlID : 0,
			 WirelessStatusID : 0,
			 ChargingControlID : 0,
			 DPIID : 0,
			 PollingRateID : 0,
			 OnboardProfilesID : 0,
			 ButtonSpyID : 0,
			 EncryptionID : 0,
			 KeyboardLayout2ID : 0,
			 PersistentRemappableActionID : 0,
			 ReprogrammableControlsV4ID : 0,
			 DisableKeysByUsageID : 0,
			 GKeyID : 0,
			 MKeyID : 0,
			 MRID : 0,
			 BrightnessControlID : 0,
			 HostsInfoID : 0,
			 ChangeHostsID : 0,
			 PerKeyLightingID : 0,
			 PerKeyLightingV2ID : 0,
			 RGB8070ID : 0,
			 RGB8071ID : 0,
		 };
		  
		 this.Config =
		 {
			 /** Variable for which body style a mouse has to properly register buttons to actions. */
			 MouseBodyStyle : "G500 Body",
			 /** Stored Array for LEDPositions */
			 /** @type {LedPosition[]} */
			 LedPositions : [[0, 1], [0, 2]],
			 /** Stored Array for LEDNames */
			 /** @type {string[]} */
			 LedNames : ["Primary Zone", "Logo Zone"],
			 /**Variable for stored size of a device */
			 DeviceSize : [3,3],
			 /** Variable that represents if a device has multiple connection methods and which method it is connected by.  */
			 CommunicationType : this.CommunicationType["SingleConnection"],
			 /** Variable that represents which method a device is connected by. */
			 ConnectionMode : 0,
			 /** Variable for defining if a mouse supports the 8071 RGB Protocol. */
			 IsHeroProtocol : false,
			 /** Variable for defining if a mouse has lights to indicate DPI levels. */
			 HasDPILights : false,
			 /** Variable for defining if a mouse supports battery status and level. */
			 HasBattery : false,
 
			 DeviceName: "UNKNOWN",
			 DeviceType: "-1"
		 };
 
		 let isLightSpeed = options.hasOwnProperty("Lightspeed") ? options.Lightspeed : false;
 
		 if(isLightSpeed)
		 {
			 this.Config.CommunicationType = this.CommunicationType["MultiConnection"];
		 }
	 
		 this.BatteryVoltageStatusDict =
		 {
		 0 : "Discharging",
		 128 : "Charging", 
		 144 : "Wireless Charging" 
		 };
	 
		 this.DeviceIDs =
		 {
		 "405d" : "Logitech G403L",
		 "407f" : "Logitech G502L",          
		 "4070" : "Logitech G703L",
		 "4086" : "Logitech G703 Hero",   
		 "4053" : "Logitech G900L",       
		 "4067" : "Logitech G903L",   
		 "4087" : "Logitech G903 Hero",    
		 "4079" : "Logitech GPro Wireless",     
		 "4093" : "Logitech GPro X Superlight",
		 "407c" : "Logitech G915 Keyboard",
		 "4099" : "Logitech G502 X Plus"
		 };
 		
		 this.LEDPositionDict =
		 {
			 "Null": 				[],
			 /** @type {LedPosition[]} */
			 "SingleZoneMouse":		[ [0, 1] ],
			 /** @type {LedPosition[]} */
			 "TwoZoneMouse":		[ [0, 1], [0, 2] ],
			 /** @type {LedPosition[]} */
			 "ThreeZoneMouse":		[ [0, 1], [1, 2], [2, 1] ],
			 /** @type {LedPosition[]} */
			 "G502XPlus":			[ [6, 2], [6, 0], [0, 1], [1, 1], [5, 1], [4, 1], [3, 1], [2, 1] ],
		 };
 
		 this.LEDNameDict =
		 {
			 "Null":				[],
			 "SingleZoneMouse":		["Primary Zone",],
			 "TwoZoneMouse":		["Primary Zone", "Logo Zone"],
			 "ThreeZoneMouse":		["Left Zone", "Logo Zone", "Right Zone"],
			 "G502XPlus":			["LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8"],
		 };
 
		 this.ButtonMaps =
		 {
			 G200Body :
			 {
				 "button1" : "Left_Click",
				 "button2" : "Right_Click",
				 "button3" : "Middle_Click",
				 "button4" : "Backward",
				 "button5" : "Forward",
				 "button6" : "DPI_UP",
				 "button7" : "Null",
				 "button8" : "Null",
				 "button9" : "Null",
				 "button10" : "Null",
				 "button11" : "Null"
			 },
			 G500Body :
			 {
				 "button1" : "Left_Click",
				 "button2" : "Right_Click",
				 "button3" : "Middle_Click",
				 "button4" : "Backward",
				 "button5" : "Forward",
				 "button6" : "Sniper",
				 "button7" : "Top",
				 "button8" : "DPI_UP",
				 "button9" : "DPI_Down"	,
				 "button10" : "Scroll_Right",
				 "button11" : "Scroll_Left",
			 },
			 G502XPlusBody :
			 {
				 "button1" : "Left_Click",
				 "button2" : "Right_Click",
				 "button3" : "Middle_Click",
				 "button4" : "Backward",
				 "button5" : "Sniper",
				 "button6" : "Forward",
				 "button7" : "Top",
				 "button8" : "Scroll_Right",
				 "button9" : "Scroll_Left",
				 "button10" : "DPI_UP",
				 "button11" : "DPI_Down"
			 },
			 G900Body :
			 {
				 "button1" : "Left_Click",
				 "button2" : "Right_Click",
				 "button3" : "Middle_Click",
				 "button4" : "Backward",
				 "button5" : "Forward",
				 "button6" : "Sniper",
				 "button7" : "DPI_UP",
				 "button8" : "DPI_Down",
				 "button9" : "Top",
				 "button10" : "Scroll_Right",
				 "button11" : "Scroll_Left",	
			 },
		 };
		 
		 this.FeaturePages = 
		 {
			 "DeviceInfo" : [0x00,0x03],
			 "DeviceName" : [0x00,0x05],
			 "FriendlyName" : [0x00,0x07],
			 "Reset" : [0x00,0x20],
			 "BatteryVoltage" : [0x10,0x01],
			 "UnifiedBattery" : [0x10,0x04],
			 "LEDControl" : [0x13,0x00],
			 "WirelessStatus" : [0x1D,0x4B],
			 "ChargingControl" : [0x10,0x10],
			 "DPI" : [0x22,0x01],
			 "PollingRate" : [0x80,0x60],
			 "OnboardProfiles" : [0x81,0x00],
			 "ButtonSpy" : [0x81,0x10],
			 "Encryption" : [0x41,0x00],
			 "KeyboardLayout2" : [0x45,0x40],
			 "PersistentRemappableAction" : [0x1b,0xc0],
			 "ReprogrammableControlsV4" : [0x1b,0x04],
			 "DisableKeysByUsage" : [0x45,0x22],
			 "GKey" : [0x80,0x10],
			 "MKey" : [0x80,0x20],
			 "MR" : [0x80,0x30],
			 "BrightnessControl" : [0x80,0x40],
			 "HostsInfo" : [0x18,0x15],
			 "ChangeHosts" : [0x18,0x14],
			 "PerKeyLighting" : [0x80,0x80],
			 "PerKeyLightingV2" : [0x80,0x81],
			 "RGB8070" : [0x80,0x70],
			 "RGB8071" : [0x80,0x71],
		 };
	 
		 this.deviceTypes =
		 {
			 0 : "Keyboard",
			 1 : "Remote Control",
			 2 : "Numpad",
			 3 : "Mouse",
			 4 : "Trackpad",
			 5 : "Trackball",
			 6 : "Presenter",
			 7 : "Reciever",
			 8 : "Headset",
			 9 : "Webcam",
			 10 : "Steering Wheel",
			 11 : "Joystick",
			 12 : "Gamepad",
			 13 : "Dock",
			 14 : "Speaker",
			 15 : "Microphone",
			 16 : "Illumination Light",
			 17 : "Programmable Controller",
			 18 : "Car Sim Pedals",
			 19 : "Adapter"
		 };

		 this.FirmwareType =
		 {
			0 : "Main Application",
			1 : "Bootloader(DFU)",
			2 : "Hardware",
			3 : "Touchpad",
			4 : "Optical Sensor",
			5 : "SoftDevice",
			6 : "RF Companion MCU",
			7 : "Factor Application", //Main Application, but it's a factory version and handles DFU process.
			8 : "Custom RGB Effect",
			9 : "Motor Drive", //10 and above are reserved.
		 };

		 this.ProductIDs =
		 {
			"c081" : "G900",
			"c082" : "G403 Prodigy",
			"c083" : "G403",
			"c084" : "G203 Prodigy",
			"c085" : "GPro Wired",
			"c088" : "GPro Wireless",
			"c08b" : "G502 Hero",
			"c08c" : "GPro Wired", //AltPid (╯°□°）╯︵ ┻━┻
			"c08d" : "G502 Lightspeed",
			"c08f" : "G403 Hero",
			"c090" : "G703",
			"c091" : "G903",
			"c092" : "G203 Lightsync",
			"c094" : "GPro X Superlight",
			"c095" : "G502 X Plus",
			"c332" : "G502",
		 };

		 this.ErrorCodes =
		 {
			0 : "NoError",
			1 : "Unknown",
			2 : "InvalidArgument",
			3 : "OutOfRange",
			4 : "HardwareError",
			5 : "Internal",
			6 : "InvalidFeatureIndex",
			7 : "InvalidFunctionID",
			8 : "Busy",
			9 : "Unsupported"
		 };
	 
		 this.VoltageArray = 
		 [ 
			 4186,4156,4143,4133,4122,4113,4103,4094,4086,4076,4067,4060,4051,4043,4036,4027,4019,4012,4004,3997,3989,3983,3976,3969,3961,3955,3949,3942,3935,3929,3922,3916,3909,3902,3896,3890,3883,3877,3870,3865,3859,3853,3848,3842,3837,3833,3828,3824,3819,3815,3811,3808,3804,3800,3797,3793,3790,3787,3784,3781,3778,3775,3772,3770,3767,3764,3762,3759,3757,3754,3751,3748,3744,3741,3737,3734,3730,3726,3724,3720,3717,3714,3710,3706,3702,3697,3693,3688,3683,3677,3671,3666,3662,3658,3654,3646,3633,3612,3579,3537,3500 
		 ];
	 
		 this.PercentageLookupTable =
		 {
		 4186:	100,					
		 4156:	99,					
		 4143:	98,					
		 4133:	97,					
		 4122:	96,					
		 4113:	95,					
		 4103:	94,					
		 4094:	93,					
		 4086:	92,					
		 4076:	91,					
		 4067:	90,					
		 4060:	89,					
		 4051:	88,					
		 4043:	87,					
		 4036:	86,					
		 4027:	85,					
		 4019:	84,					
		 4012:	83,					
		 4004:	82,					
		 3997:	81,					
		 3989:	80,					
		 3983:	79,					
		 3976:	78,					
		 3969:	77,					
		 3961:	76,					
		 3955:	75,					
		 3949:	74,					
		 3942:	73,					
		 3935:	72,					
		 3929:	71,					
		 3922:	70,					
		 3916:	69,					
		 3909:	68,					
		 3902:	67,					
		 3896:	66,					
		 3890:	65,					
		 3883:	64,					
		 3877:	63,					
		 3870:	62,					
		 3865:	61,					
		 3859:	60,					
		 3853:	59,					
		 3848:	58,					
		 3842:	57,					
		 3837:	56,					
		 3833:	55,					
		 3828:	54,					
		 3824:	53,					
		 3819:	52,					
		 3815:	51,					
		 3811:	50,					
		 3808:	49,					
		 3804:	48,					
		 3800:	47,					
		 3797:	46,					
		 3793:	45,					
		 3790:	44,					
		 3787:	43,					
		 3784:	42,					
		 3781:	41,					
		 3778:	40,					
		 3775:	39,					
		 3772:	38,					
		 3770:	37,					
		 3767:	36,					
		 3764:	35,					
		 3762:	34,					
		 3759:	33,					
		 3757:	32,					
		 3754:	31,					
		 3751:	30,					
		 3748:	29,					
		 3744:	28,					
		 3741:	27,					
		 3737:	26,					
		 3734:	25,					
		 3730:	24,					
		 3726:	23,					
		 3724:	22,					
		 3720:	21,					
		 3717:	20,					
		 3714:	19,					
		 3710:	18,					
		 3706:	17,					
		 3702:	16,					
		 3697:	15,					
		 3693:	14,					
		 3688:	13,					
		 3683:	12,					
		 3677:	11,					
		 3671:	10,					
		 3666:	9,					
		 3662:	8,					
		 3658:	7,					
		 3654:	6,					
		 3646:	5,					
		 3633:	4,					
		 3612:	3,					
		 3579:	2,					
		 3537:	1,					
		 3500:	0
	 }
	 
	 }
 
	 SetConnectionMode(ConnectionMode)
	 {
		 this.ConnectionMode = ConnectionMode;
	 }
 
	 SetDeviceID(DeviceID)
	 {
		 this.DeviceID = DeviceID;
	 }

	 SetProductID(ProductID)
	 {
		 this.ProductID = ProductID;
	 }
 
	 SetWirelessMouseType(DeviceID)
	 {
		 switch (DeviceID)
		 {
		 case "405d":
		 case "4070":
		 case "4086":
		 case "4079":
		 case "4093":
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G200Body";
			 this.SetHasDPILights(false);
			 this.SetDeviceSize([3,3]);
			 break;
 
		 case "407c":
			this.SetDeviceSize([24,9]);
			break;

		 case "407f":
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G500Body";
			 this.SetHasDPILights(true);
			 this.SetDeviceSize([3,3]);
			 break;
 
		 case "4053":
		 case "4067":
		 case "4087":
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G900Body";
			 this.SetHasDPILights(true);
			 this.SetDeviceSize([3,3]);
			 break;
 
		 case "4099":
			this.Config.LedNames = this.LEDNameDict["G502XPlus"];
			this.Config.LedPositions = this.LEDPositionDict["G502XPlus"];
			 this.Config.MouseBodyStyle = "G502XPlusBody";
			 this.SetHasDPILights(false);
			 this.SetDeviceSize([7,3]);
			 break;
 
		 default:
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G500Body";
			 this.SetHasDPILights(true);
			 this.SetDeviceSize([3,3]);
			 break;
		 }
 
	 }

	 SetWiredMouseType(ProductID)
	 {
		 switch (ProductID)
		 {
		 case "c092" :
			this.Config.LedNames = this.LEDNameDict["ThreeZoneMouse"];
			this.Config.LedPositions = this.LEDPositionDict["ThreeZoneMouse"];
			this.Config.MouseBodyStyle = "G200Body";
			this.SetDeviceSize([3,3]);
			this.SetHasDPILights(false);
			break;

		case "c084" :
		case "c085" :
		case "c08c" :
			this.Config.LedNames = this.LEDNameDict["SingleZoneMouse"];
			this.Config.LedPositions = this.LEDPositionDict["SingleZoneMouse"];
			this.Config.MouseBodyStyle = "G200Body";
			this.SetHasDPILights(false);
			this.SetDeviceSize([3,3]);
			break;

		case "c082" :
		case "c083" :
		case "c08f" :
		case "c088" :
		case "c090" :
			this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			this.Config.MouseBodyStyle = "G200Body";
			this.SetHasDPILights(false);
			this.SetDeviceSize([3,3]);
			break;
 
		case "c08b":
		case "c08d":
		case "c332":
			this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			this.Config.MouseBodyStyle = "G500Body";
			this.SetHasDPILights(true);
			this.SetDeviceSize([3,3]);
			break;
 
		case "c081" :
		case "c091":
			this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			this.Config.MouseBodyStyle = "G900Body";
			this.SetHasDPILights(true);
			this.SetDeviceSize([3,3]);
			break;
 
		case "c095":
			this.Config.LedNames = this.LEDNameDict["G502XPlus"];
			this.Config.LedPositions = this.LEDPositionDict["G502XPlus"];
			this.Config.MouseBodyStyle = "G502XPlusBody";
			this.SetHasDPILights(false);
			this.SetDeviceSize([7,3]);
			break;

		case "c094":
			this.Config.LedNames = this.LEDNameDict["Null"];
			this.Config.LedPositions = this.LEDPositionDict["Null"];
			this.Config.MouseBodyStyle = "G200Body";
			this.SetHasDPILights(false);
			this.SetDeviceSize([1,1]);
 
		default:
			this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			this.Config.MouseBodyStyle = "G200Body";
			this.SetHasDPILights(true);
			this.SetDeviceSize([3,3]);
			break;
		}
 
	 }
 
	 SetIsHeroProtocol()
	 {
		 if(this.FeatureIDs.RGB8071ID !== 0)
		 {
			 this.Config.IsHeroProtocol = true;
		 }
	 }

	 SetHasDPILights(HasDPILights)
	 {
		this.Config.HasDPILights = HasDPILights;
	 }

	 SetHasBattery()
	 {
		if(this.FeatureIDs.UnifiedBatteryID !== 0 || this.FeatureIDs.BatteryVoltageID !== 0)
		{
			this.Config.HasBattery = true;
		}
	}

	SetDeviceSize(DeviceSize)
	{
		this.Config.DeviceSize = DeviceSize;
	}
 
	 clearShortReadBuffer()
	 {
	 	device.set_endpoint(this.Config.CommunicationType, this.ShortMessageEndpointByte, this.EndpointByte3); // Short Message Endpoint 
	 	device.read([this.ShortMessage,this.ConnectionMode],7, 10);
	 	while(device.getLastReadSize() > 0)
	 	{
		 	device.read([this.ShortMessage,this.ConnectionMode],7, 10); //THIS WAS HARDCODED AS 0xFF
	 	}
	 }
 
	 clearLongReadBuffer()
	 {
	 	device.set_endpoint(this.Config.CommunicationType, this.LongMessageEndpointByte, this.EndpointByte3); // Long Message Endpoint
	 	device.read([this.LongMessage,this.ConnectionMode],20, 10);
	 	while(device.getLastReadSize() > 0)
	 	{
		 	device.read([this.ShortMessage,this.ConnectionMode],20, 10);
	 	}
	 }
 
	 SendShortWiredMessage(data)
	 {
	 this.clearShortReadBuffer();
	 let packet = [this.ShortMessage,this.WIRED];
	 data  = data || [0x00, 0x00, 0x00];
	 packet.push(...data);
	 device.write(packet, 7);
	 device.pause(5);
	 packet = device.read(packet,7);
 
	 return packet.slice(3,7);
	 }
 
	 SendShortMessage(data)
	 {
	 this.clearShortReadBuffer();
	 let packet = [this.ShortMessage,this.ConnectionMode];
	 data  = data || [0x00, 0x00, 0x00];
	 packet.push(...data);
	 device.write(packet, 7);

	 packet = device.read(packet,7);
 
	 return packet.slice(3,7);
	 }
 
	 SendLongMessageNoResponse(data)
	 {
		 device.set_endpoint(this.Config.CommunicationType, this.LongMessageEndpointByte, this.EndpointByte3);
		 let packet = [this.LongMessage,this.ConnectionMode];
		 data = data || [0x00, 0x00, 0x00];
		 packet.push(...data);
		 device.write(packet, 20);
	 }
 
	 SendLongMessage(data)
	 {
	 this.clearLongReadBuffer();
	 device.set_endpoint(this.Config.CommunicationType, this.LongMessageEndpointByte, this.EndpointByte3);
	 let packet = [this.LongMessage,this.ConnectionMode];
	 data = data || [0x00, 0x00, 0x00];
	 packet.push(...data);
	 device.write(packet, 20);

	 packet = device.read(packet,20);
	 
	 return packet.slice(4,20);
	 }
 
	 SendLongPowerPlayMessage(data)
	 {
	 this.clearLongReadBuffer();
	 let packet = [this.LongMessage,0x07];
	 data = data || [0x00, 0x00, 0x00];
	 packet.push(...data);
	 device.write(packet, 20);
	 packet = device.read(packet,20);
	 
	 return packet.slice(4,7);
	 }
 
	 Short_Get()
	 {
	 device.set_endpoint(this.Config.CommunicationType, this.ShortMessageEndpointByte, this.EndpointByte3);
	 let packet = device.read([0x00],7);
 
	 return packet.slice(4,7);
	 }
 
	 Long_Get()
	 {
	 device.set_endpoint(this.Config.CommunicationType, this.LongMessageEndpointByte, this.EndpointByte3);
	 let packet = device.read([0x00],20);
	 return packet.slice(4,20);
	 }
 
	 FetchIDs()
	 {
		 this.clearLongReadBuffer();
		 for (const property in this.FeaturePages) 
		 {
			 let packet = [0x00, 0x00, this.FeaturePages[property][0], this.FeaturePages[property][1]];
			 let FeatureID = this.SendLongMessage(packet)[0]; //Grab first byte as that contains the FeatureID
			 this.FeatureIDs[property+'ID'] = FeatureID;
			 if(FeatureID !== 0 && FeatureID < 100)
			 {
			 	device.log(property + " FeatureID: " + this.FeatureIDs[property+'ID'])
			 }
			 else
			 {
				FeatureID = 0; //I'm not dealing with No Connect Edge Cases.
			 }
		 }
		 this.SetIsHeroProtocol();
	 }
	 
	 FetchDeviceInfo()
	 {
		Logitech.clearLongReadBuffer();
		let DeviceInfoPacket = [this.FeatureIDs.DeviceInfoID, 0x00];
		this.SendShortMessage(DeviceInfoPacket);
		device.pause(10);
		let DeviceInfoResponsePacket = this.Long_Get();
		let TotalEntities = DeviceInfoResponsePacket[0];
		let UniqueIdentifier = DeviceInfoResponsePacket.slice(1,5);
		let Transport1 = DeviceInfoResponsePacket[7].toString(16) + DeviceInfoResponsePacket[8].toString(16);
		let Transport2 = DeviceInfoResponsePacket[9].toString(16) + DeviceInfoResponsePacket[10].toString(16);
		let Transport3 = DeviceInfoResponsePacket[11].toString(16) + DeviceInfoResponsePacket[12].toString(16);
		let SerialNumberSupport = DeviceInfoResponsePacket[14];
		device.log("Total Entities: " + TotalEntities);
		device.log("Unique Device Identifier: " + UniqueIdentifier);
		device.log("Transport 1 Model ID: " + Transport1);
		device.log("Transport 2 Model ID: " + Transport2);
		device.log("Transport 3 Model ID: " + Transport3);
		device.log("Serial Number Support:" + SerialNumberSupport);
		
		for(let entityIDX = 0; entityIDX < Math.max(TotalEntities,3); entityIDX++)
		{
			let FirmwareInfoPacket = [this.FeatureIDs.DeviceInfoID, 0x10, entityIDX];
	 		this.SendShortMessage(FirmwareInfoPacket);
			device.pause(10);
	 		let FirmwareResponsePacket = this.Long_Get();
			let FirmwareType = FirmwareResponsePacket[0];
			let FirmwarePrefix = String.fromCharCode(...FirmwareResponsePacket.slice(1,4));
			let FirmwareName = FirmwareResponsePacket[4];
			let FirmwareRevision = FirmwareResponsePacket[5];
			let FirmwareBuild = FirmwareResponsePacket.slice(6,8);
			let ActiveFirmwareFlag = FirmwareResponsePacket[8];
			let TransportPID = FirmwareResponsePacket[9].toString(16) + FirmwareResponsePacket[10].toString(16);
		if(FirmwareType == 0)
			{
				device.log("Firmware Type: " + this.FirmwareType[FirmwareType]);
				device.log("Firmware Prefix: " + FirmwarePrefix + + FirmwareName);
				device.log("Firmware Revision: " + FirmwareRevision);
				device.log("Firmware Build: " + FirmwareBuild);
				device.log("Active Firmware Flag: " + ActiveFirmwareFlag);
				device.log("Transport ID: " + TransportPID);
				return TransportPID;
			}
		}
	 }

	 getDeviceName()
	 {
	 Logitech.clearLongReadBuffer();
	 let nameLengthPacket = [this.FeatureIDs.DeviceNameID, 0x00];
	 this.SendShortMessage(nameLengthPacket);
	 let nameLength = this.Long_Get()[0];
 
	 let DeviceNameBytes = [];
	 let ByteOffset = 0
 
	 while(nameLength > 0)
	 {
		 let namePacket = [this.FeatureIDs.DeviceNameID, 0x10, ByteOffset];
		 this.SendShortMessage(namePacket);
 
		 let nameReturnPacket = this.Long_Get();
 
		 nameLength -= 16;
		 ByteOffset += 16;
		 DeviceNameBytes.push(...nameReturnPacket);
	 }
	 
	 this.Config.DeviceName = String.fromCharCode(...DeviceNameBytes);
	 device.log("Device Name: " + this.Config.DeviceName);
 
	 let deviceTypePacket = [this.FeatureIDs.DeviceNameID, 0x20];
	 this.SendShortMessage(deviceTypePacket);
	 let deviceTypeId = this.Long_Get()[0];
	 this.Config.deviceType = this.deviceTypes[deviceTypeId];
	 
	 device.log("Device Type: " + this.Config.deviceType);
	 return(this.Config.DeviceName, this.Config.deviceType);
	 }
 
	 GetBatteryCharge()
	 {
	 if(this.FeatureIDs.UnifiedBatteryID !== 0)
		 {
		 let [BatteryPercentage,state, wirelessCharging] = this.GetUnifiedBatteryPercentage()
		 if (state === 0) { battery.setBatteryState(1); }
		 else if (state === 1 && wirelessCharging === 2) { battery.setBatteryState(5); }
		 else if (state === 1 ) { battery.setBatteryState(2); }
		 return BatteryPercentage;
		 }
	 else if(this.FeatureIDs.BatteryVoltageID != 0)
		 {
		 let [voltage,state] = this.GetBatteryVoltage();
	   
		 if (state === 0) { battery.setBatteryState(1); }
		 else if (state === 128) { battery.setBatteryState(2); }
		 else if (state === 144) { battery.setBatteryState(5); }
 
		 return this.GetApproximateBatteryPercentage(voltage);
		 }
	 }
 
	 GetUnifiedBatteryPercentage()
	 {
	this.clearLongReadBuffer();
	 let packet = [this.FeatureIDs.UnifiedBatteryID, 0x10];
	 this.SendShortMessage(packet);
	 device.pause(10);
	 let BatteryArray = this.Long_Get();
	 let BatteryPercentage = (BatteryArray[0])
	 let BatteryStatus = BatteryArray[2];
	 let wirelessCharging = BatteryArray[3];
 
	 device.log("Battery Percentage: " + BatteryPercentage);
	 return [BatteryPercentage,BatteryStatus,wirelessCharging];
	 }
 
	 GetBatteryVoltage()
	 {
	 let packet = [this.FeatureIDs.BatteryVoltageID, 0x00, 0x10];
	 let BatteryArray = this.SendLongMessage(packet);
	 let BatteryVoltage = (BatteryArray[0] << 8) + BatteryArray[1];
	 let BatteryStatus = BatteryArray[2];
	
	 device.log("Battery Voltage: " + BatteryVoltage);
	 return [BatteryVoltage, BatteryStatus];
	 }
 
	 GetApproximateBatteryPercentage(BatteryVoltage)//This needs hit with a hammer.
	 { 
		 const nearestVoltageBand = this.VoltageArray.reduce((prev, curr) => 
		 {
		 return (Math.abs(curr - BatteryVoltage) < Math.abs(prev - BatteryVoltage) ? curr : prev);
		 });
	 device.log("Battery Percentage Remaining: " + this.PercentageLookupTable[nearestVoltageBand]);
	 return this.PercentageLookupTable[nearestVoltageBand]
	 }
 
	 setDpi(dpi, stage)
	 {
	 let packet = [this.FeatureIDs.DPIID, 0x30, 0x00, Math.floor(dpi/256), dpi%256, stage]; //Oh there's actually a stage flag?
	 this.SendLongMessageNoResponse(packet);
	 }
 
	 SetDPILights(stage)
	 {
		if(!Logitech.Config.HasDPILights)
		{
			return;
		}
		 if(this.Config.IsHeroProtocol)
	 	{
			let packet = [this.FeatureIDs.RGB8071ID, 0x20, 0x00, stage];
			this.SendShortMessage(packet);
		}
	 	else
	 	{
			let packet = [this.FeatureIDs.LEDControlID, 0x50, 0x01, 0x00, 0x02, 0x00, stage ];
			this.SendLongMessage(packet);
	 	}
	 }
 
	 setPollingRate(pollingrate)
	 {
		 let packet = [this.FeatureIDs.PollingRateID, 0x20, 1000/pollingrate];
		 this.SendShortMessage(packet);
	 }
 
	 SetOnBoardState(OnboardState)
	 {
		 let packet = [this.FeatureIDs.OnboardProfilesID, 0x10, (OnboardState ? this.HardwareMode : this.SoftwareMode)];
		 this.SendShortMessage(packet);
	 }
 
	 ButtonSpySet(OnboardState)
	 {
		 let EnablePacket = [this.FeatureIDs.ButtonSpyID, 0x10, 0x00, 0x00, 0x00];
		 this.SendShortMessage(EnablePacket);
 
	 if(OnboardState)
		 {
		 let Releasepacket = [this.FeatureIDs.ButtonSpyID, 0x20,];
		 this.SendShortMessage(Releasepacket);
		 }
	 else
		 {
		 let ButtonPacket = [this.FeatureIDs.ButtonSpyID, 0x40, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x08, 0x0a, 0x0b, 0x0c];
		 this.SendLongMessage(ButtonPacket);
		 }
	 }
 
	 GKeySetup()
	 {
	 let InfoPacket = [GKeyID, 0x00]; //Info
	 this.SendShortMessage(InfoPacket);
 
	 let SoftwareEnablePacket = [GKeyID, 0x20, 0x01]; //Software Enable Flag for GKeys and Mkeys
	 this.SendShortMessage(SoftwareEnablePacket)
	 }
 
	 MKeySetup()
	 {
	 let InfoPacket = [MKeyID, 0x00];
	 this.SendShortMessage(InfoPacket);
 
	 let SoftwareEnablePacket = [MKeyID, 0x10]; //Led Number Flag in binary
	 this.SendShortMessage(SoftwareEnablePacket);
	 }
 
	 SetDirectMode(OnboardState)
	 {
	 if(this.Config.IsHeroProtocol)
		 {
		 let HeroLEDPacket = [this.FeatureIDs.RGB8071ID, 0x50, 0x01, 0x03, 0x05];
		 this.SendShortMessage(HeroLEDPacket);
		 }
	 else
		 {
		  let StandardLEDPacket= [this.FeatureIDs.RGB8070ID, 0x80, 0x01, 0x01];
		  this.SendShortMessage(StandardLEDPacket);
 
		 let DPILEDPacket = [this.FeatureIDs.LEDCtrlID, 0x30, OnboardState ? 0x01 : 0x00];
		 this.SendShortMessage(DPILEDPacket);
		 }
	 }
 
	 SetDpiLightAlwaysOn(DPILight)
	 {
		if(!Logitech.Config.HasDPILights)
		{
			return;
		}
		 if(this.Config.IsHeroProtocol)
		 {
		 let ManageNVConfigPacket = [this.FeatureIDs.RGB8071ID, 0x30, 0x01, 0x00 ,0x08, (DPILight ? 0x04 : 0x02), 0x07];
		 this.SendLongMessage(ManageNVConfigPacket);
  
		 let SetClusterPatternPacket = [this.FeatureIDs.RGB8071ID, 0x20, 0x00, 0x03];
			this.SendShortMessage(SetClusterPatternPacket);
 
		 let ManageNVConfigPacket2 = [this.FeatureIDs.RGB8071ID, 0x30, 0x00, 0x00, 0x08];
		 this.SendShortMessage(ManageNVConfigPacket2);
		 }
		 else
		 {
		 let DPILightTogglepacket = [this.FeatureIDs.LEDControlID, 0x70, 0x01, (DPILight ? 0x02 : 0x04)];
		 this.SendShortMessage(DPILightTogglepacket);
 
		 let UnknownPacket1 = [this.FeatureIDs.LEDControlID, 0x50, 0x01, 0x00, 0x02, 0x00, 0x02];
		 this.SendLongMessage(UnknownPacket1);
 
		 let UnknownPacket2 = [this.FeatureIDs.LEDControlID, 0x60, 0x01];
		 this.SendShortMessage(UnknownPacket2);
		 }
	 }
 
	 SendLighting(RGBData)
	 {
		 if(this.FeatureIDs.PerKeyLightingV2ID !== 0)
		 {
			 this.SendPerKeyLightingPacket(RGBData.splice(0, 4 * 4))
			 this.SendPerKeyLightingPacket(RGBData.splice(0, 4 * 4))
		 }
		 else
		 {
			 this.SendZone(RGBData);
		 }
	 }
 
	 SendZone(rgbdata)
	 {
		 for(let Zones = 0; Zones < this.Config.LedPositions.length; Zones++)
		 {
			 let zoneData = rgbdata.splice(0,3);
			 let packet = [ (this.Config.IsHeroProtocol ? this.FeatureIDs.RGB8071ID : this.FeatureIDs.RGB8070ID), (this.Config.IsHeroProtocol ? 0x10 : 0x30), Zones, 0x01, zoneData[0], zoneData[1], zoneData[2], (this.Config.IsHeroProtocol ? 0x02 :0x00)];
 
			 if(this.DeviceID == "4067" || this.DeviceID == "4070" || this.Config.IsHeroProtocol) 
			 {
				  packet[14] = 0x01;
			 }
			 this.SendLongMessageNoResponse(packet);
		 }
		 
		 if(this.DeviceID == "4079" || this.DeviceID == "405d")
		 {
			   this.Apply();
		 }
	 }
 
	 SendPerKeyLightingPacket(RGBData)
	 {
		while(RGBData.length > 0)
		{
			let packet = [this.FeatureIDs.PerKeyLightingV2ID,0x10];
			packet.push(...RGBData.splice(0,16));
			this.SendLongMessageNoResponse(packet);
		}
		this.PerKeyLightingApply();
	 }
 
	 PerKeyLightingApply()
	 {
		 let packet = [this.FeatureIDs.PerKeyLightingV2ID,0x70];
		 this.SendLongMessageNoResponse(packet);
	 }
 
	 Apply()
	 {
		 let packet = [0x00, 0x20, 0x01];
		 this.SendShortMessage(packet);
	 }
	 
 }

 const Logitech = new LogitechProtocol(options);

 function hexToRgb(hex) 
 {
	 let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	 let colors = [];
	 colors[0] = parseInt(result[1], 16);
	 colors[1] = parseInt(result[2], 16);
	 colors[2] = parseInt(result[3], 16);
 
	 return colors;
 }

export function Validate(endpoint)
{
    return endpoint.interface === Logitech.Config.CommunicationType && endpoint.usage === Logitech.LongMessageEndpointByte && endpoint.usage_page === Logitech.EndpointByte3
     || endpoint.interface === Logitech.Config.CommunicationType && endpoint.usage === Logitech.ShortMessageEndpointByte && endpoint.usage_page === Logitech.EndpointByte3;
}

export function Image() 
{
	return "iVBORw0KGgoAAAANSUhEUgAAA+gAAAH0CAYAAAHZLze7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAG82lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDYgNzkuMTY0NjQ4LCAyMDIxLzAxLzEyLTE1OjUyOjI5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMiAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAzLTMwVDE4OjE4OjM2LTA3OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTAzLTMwVDE4OjE4OjM2LTA3OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMy0zMFQxODoxODozNi0wNzowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1MTlkYzJkOS1hOGNmLTlmNDQtYjQwYy0xYWQ1NTNhZTdkYjMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxZTZiZDVmZS0yYjEzLWFjNGYtOWNmYi02OGRiY2VkNDFmZDYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpmMzE3MTQ5Ni1lZDEyLTk5NGItOTUxOC0xZWY1NWJhNTU2NjQiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmYzMTcxNDk2LWVkMTItOTk0Yi05NTE4LTFlZjU1YmE1NTY2NCIgc3RFdnQ6d2hlbj0iMjAyMS0wMy0zMFQxODoxODozNi0wNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjIgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1MTlkYzJkOS1hOGNmLTlmNDQtYjQwYy0xYWQ1NTNhZTdkYjMiIHN0RXZ0OndoZW49IjIwMjEtMDMtMzBUMTg6MTg6MzYtMDc6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4yIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+NkJBMjUzMkQzODRENzE3RDZBQUI5MjBDQzU0MDI0MTg8L3JkZjpsaT4gPHJkZjpsaT43MkM5QzgwNUNBRDQ4REI3QTNGMzc4NkZDRDg4RDYxMDwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDpmOTQxMzA5Yi1iMmExLTc5NGYtODJiMC03MGYzNGE3MGFiMzQ8L3JkZjpsaT4gPC9yZGY6QmFnPiA8L3Bob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPC9yZGY6RGVzY3JpcHRpb24+IDwv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";
}