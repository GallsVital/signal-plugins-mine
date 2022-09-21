export function Name() { return "Logitech G502 Hero"; }
export function VendorId() { return 0x046d; }
export function Documentation(){ return "troubleshooting/logitech"; }
export function ProductId() { return 0xC08B; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
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
dpistages:readonly
DpiLight:readonly
OnboardState:readonly
DPIRollover:readonly
pollingrate:readonly
*/
export function ControllableParameters(){
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
		{"property":"dpistages", "group":"mouse", "label":"Number of DPI Stages","step":"1", "type":"number","min":"1", "max":"5","default":"5"},
		{"property":"DpiLight", "group":"lighting", "label":"DPI Light Always On","type":"boolean","default": "true"},
		{"property":"OnboardState", "group":"", "label":"Onboard Button Mode","type":"boolean","default": "false"},
		{"property":"DPIRollover", "group":"mouse", "label":"DPI Stage Rollover","type":"boolean","default": "false"},
		{"property":"pollingrate", "group":"mouse", "label":"Polling Rate","type":"combobox", "values":[ "1000","500", "250", "100" ], "default":"1000"},
    ];
}

var deviceName;
var Sniper;
var Sleep = false;
var DPIStage = 1;
var savedPollTimer = Date.now();
var PollModeInternal = 15000;

const options = 
{
	Lightspeed : false
}

const DPIStageDict =
{
	1:  function(){ return dpi1; },
	2:  function(){ return dpi2; },
	3:  function(){ return dpi3; },
	4:  function(){ return dpi4; },
	5:  function(){ return dpi5; }
}

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
	Logitech.SetConnectionMode(Logitech.WIRED);
	Logitech.FetchIDs();
	Logitech.SetHasBattery();

	let data = [0x80, 0x00, 0x00, 0x01]//Enable Hid++ Notifications
    Logitech.SendShortWiredMessage(data);

    data = [0x80, 0x02, 0x02, 0x00]
    Logitech.SendShortWiredMessage(data);

	let CommunicationID = Logitech.FetchDeviceInfo();

	if(CommunicationID === "00") //In case of poor detection, rerun.
	{
	CommunicationID = Logitech.FetchDeviceInfo();
	}

	if(Logitech.DeviceIDs.hasOwnProperty(CommunicationID))
	{
		device.log("Matching Device ID Found");
		Logitech.SetDeviceID(CommunicationID);
	}
	else if(Logitech.ProductIDs.hasOwnProperty(CommunicationID))
	{
		device.log("Matching Product ID Found");
		Logitech.SetProductID(CommunicationID);
	}

	Logitech.getDeviceName();
	if(Logitech.DeviceID !== "0")
	{
	Logitech.SetWirelessMouseType(Logitech.DeviceID);
	}
	else
	{
	Logitech.SetWiredMouseType(Logitech.ProductID)
	}
	let DeviceID = Logitech.DeviceID || Logitech.ProductID
    deviceName = Logitech.DeviceIDs[Logitech.DeviceID] || Logitech.ProductIDs[Logitech.ProductID] || "UNKNOWN"
    device.log(`Device Id Found: ${DeviceID}`);
    device.log(`Device Name: ${deviceName}`);


    Logitech.SetOnBoardState(OnboardState);
	Logitech.ButtonSpySet(OnboardState);
	Logitech.SetDirectMode(OnboardState);

	Logitech.SetDpiLightAlwaysOn(DpiLight);

	if(DpiControl)
	{
		Logitech.setDpi(DPIStageDict[DPIStage]());
		Logitech.SetDPILights(DPIStage);	
	}
	else
	{
		Logitech.SetDPILights(3); //Fallback to set DPILights to full
	}

	if(Logitech.Config.HasBattery)
	{
		device.addFeature("battery");
		device.pause(1000);
    	battery.setBatteryLevel(Logitech.GetBatteryCharge());
	}
}


export function Render()
{
	DetectInputs();

	if(Sleep == false)
	{	
		grabColors();
		PollBattery();
	}
}

export function Shutdown()
{    
	grabColors(true);
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
    	packet = device.read([0x00],9, 5);
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
			Logitech.setDpi(dpi6);
			Logitech.SetDPILights(1);
			}
		}

    	}
    	while(device.getLastReadSize() > 0)

	do
	{
	let packet = device.read([0x00],7, 3);

		if(packet[0] == Logitech.ShortMessage && packet[1] == Logitech.ConnectionMode && packet[2] == 0x41 && packet[3] == 0x0C && packet[6] == 0x40)
		{
		device.log("Mouse Going to Sleep");
		return Sleep = true;
		}
	}
	while(device.getLastReadSize() > 0)
}

function ProcessInputs(packet)
{
	if(packet[0] == Logitech.LongMessage && packet[1] == Logitech.ConnectionMode && packet[2] == Logitech.FeatureIDs.ButtonSpyID)
	{
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
		Logitech.setDpi(DPIStageDict[DPIStage]());
		Logitech.SetDPILights(DPIStage);
		}
	}

	if(packet[0] == Logitech.LongMessage && packet[1] == Logitech.ConnectionMode && packet[2] == 0x06 && packet[3] == 0x00 && packet[6] == 0x00)
	{
	device.log("Waking From Sleep");
	device.pause(5000); //Wait five seconds before Handoff. Allows device boot time.
	Initialize();
	return Sleep = false;
	}
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
    Logitech.setDpi(DPIStageDict[DPIStage]());
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

			if(Logitech.FeatureIDs.PerKeyLightingV2ID !== 0) //PerkeylightingV2 uses a different packet structure than the 8070 and 8071 standards.
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

function hexToRgb(hex) 
{
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    var colors = [];
    colors[0] = parseInt(result[1], 16);
    colors[1] = parseInt(result[2], 16);
    colors[2] = parseInt(result[3], 16);

    return colors;
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
			 /** @type {number[][]} */
			 LedPositions : [[0, 1], [0, 2]],
			 /** Stored Array for LEDNames */
			 /** @type {string[]} */
			 LedNames : ["Primary Zone", "Logo Zone"],
			 /** Variable that represents if a device has multiple connection methods and which method it is connected by.  */
			 CommunicationType : 0,
			 /** Variable that represents which method a device is connected by. */
			 ConnectionMode : 0,
			 /** Variable for defining if a mouse supports the 8071 RGB Protocol. */
			 IsHeroProtocol : false,
			 /** Variable for defining if a mouse has lights to indicate DPI levels. */
			 HasDPILights : false,
			 /** Variable for defining if a mouse supports battery status and level. */
			 HasBattery : false,
 
			 CommunicationType : this.CommunicationType["SingleConnection"],
 
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
			 "SingleZoneMouse":		[ [0, 1] ],
			 "TwoZoneMouse":		[ [0, 1], [0, 2] ],
			 "ThreeZoneMouse":		[ [0, 1], [1, 2], [2, 1] ],
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
			"c082" : "G403 Prodigy",
			"c083" : "G403",
			"c084" : "G203 Prodigy",
			"c085" : "GPro Wired",
			"c088" : "GPro Wireless",
			"c08b" : "G502 Hero",
			"c08d" : "G502 Lightspeed",
			"c08f" : "G403 Hero",
			"c090" : "G703",
			"c091" : "G903",
			"c092" : "G203 Lightsync",
			"c094" : "GPro X Superlight",
			"c095" : "G502 X Plus",
			"c332" : "G502",
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
			 break;
 
		 case "407f":
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G500Body";
			 this.SetHasDPILights(true);
			 break;
 
		 case "4053":
		 case "4067":
		 case "4087":
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G900Body";
			 this.SetHasDPILights(true);
			 break;
 
		 case "4099":
			this.Config.LedNames = this.LEDNameDict["G502XPlus"];
			this.Config.LedPositions = this.LEDPositionDict["G502XPlus"];
			 this.Config.MouseBodyStyle = "G502XPlusBody";
			 this.SetHasDPILights(false);
			 break;
 
		 default:
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G500Body";
			 this.SetHasDPILights(true);
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
			this.SetHasDPILights(false);
			break;

		case "c084" :
			this.Config.LedNames = this.LEDNameDict["SingleZoneMouse"];
			this.Config.LedPositions = this.LEDPositionDict["SingleZoneMouse"];
			this.Config.MouseBodyStyle = "G200Body";
			this.SetHasDPILights(false);
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
			 break;
 
		 case "c08b":
		 case "c08d":
		 case "c332":
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G500Body";
			 this.SetHasDPILights(true);
			 break;

		case "c085" :
			this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			this.Config.MouseBodyStyle = "G200Body";
			this.SetHasDPILights(true);
			break;
 
		 case "c091":
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G900Body";
			 this.SetHasDPILights(true);
			 break;
 
		 case "c095":
			this.Config.LedNames = this.LEDNameDict["G502XPlus"];
			this.Config.LedPositions = this.LEDPositionDict["G502XPlus"];
			 this.Config.MouseBodyStyle = "G502XPlusBody";
			 this.SetHasDPILights(false);
			 break;

		 case "c094":
			this.Config.LedNames = this.LEDNameDict["Null"];
			this.Config.LedPositions = this.LEDPositionDict["Null"];
			 this.Config.MouseBodyStyle = "G200Body";
			 this.SetHasDPILights(false);
 
		 default:
			 this.Config.LedNames = this.LEDNameDict["TwoZoneMouse"];
			 this.Config.LedPositions = this.LEDPositionDict["TwoZoneMouse"];
			 this.Config.MouseBodyStyle = "G200Body";
			 this.SetHasDPILights(true);
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
 
	 clearShortReadBuffer()
	 {
	 device.set_endpoint(this.Config.CommunicationType, this.ShortMessageEndpointByte, this.EndpointByte3); // Short Message Endpoint 
	 device.read([this.ShortMessage,this.ConnectionMode],7);
	 while(device.getLastReadSize() > 0)
	 {
		 device.read([this.ShortMessage,this.ConnectionMode],7); //THIS WAS HARDCODED AS 0xFF
	 }
	 }
 
	 clearLongReadBuffer()
	 {
	 device.set_endpoint(this.Config.CommunicationType, this.LongMessageEndpointByte, this.EndpointByte3); // Long Message Endpoint
	 device.read([this.LongMessage,this.ConnectionMode],10);
	 while(device.getLastReadSize() > 0)
	 {
		 device.read([this.ShortMessage,this.ConnectionMode],20);
	 }
	 }
 
	 SendShortWiredMessage(data)
	 {
	 this.clearShortReadBuffer();
	 let packet = [this.ShortMessage,this.WIRED];
	 data  = data || [0x00, 0x00, 0x00];
	 packet.push(...data);
	 device.write(packet, 7);
	 device.pause(1);
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
	 device.pause(1);
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
 
	 setDpi(dpi)
	 {
	 let packet = [this.FeatureIDs.DPIID, 0x30, 0x00, Math.floor(dpi/256), dpi%256];
	 this.SendShortMessage(packet);
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

export function Validate(endpoint)
{
    return endpoint.interface === Logitech.Config.CommunicationType && endpoint.usage === Logitech.LongMessageEndpointByte && endpoint.usage_page === Logitech.EndpointByte3
     || endpoint.interface === Logitech.Config.CommunicationType && endpoint.usage === Logitech.ShortMessageEndpointByte && endpoint.usage_page === Logitech.EndpointByte3;
}

export function Image() {
	return "iVBORw0KGgoAAAANSUhEUgAAA+gAAAH0CAYAAAHZLze7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKbmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTI3VDE3OjE5OjIyLTA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTAxLTI3VDE3OjE5OjIyLTA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yN1QxNzoxOToyMi0wODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4YjczNzY4My1lYjYzLTljNDEtYmFmMS04YWYyOTBiZDYyYjgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1Y2QyZWMxZi02M2ZhLWJiNGMtODVlZC1kNThlOGZkYzBhOGMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowZjFiODRmZS1iNmRkLTliNDUtOWM0MS1hZjI1ZGQ2ZTBiYzQiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowZjFiODRmZS1iNmRkLTliNDUtOWM0MS1hZjI1ZGQ2ZTBiYzQiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjdUMTc6MTk6MjItMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6OGI3Mzc2ODMtZWI2My05YzQxLWJhZjEtOGFmMjkwYmQ2MmI4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTI3VDE3OjE5OjIyLTA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPjBBQ0MxODE1ODJGMDI0QTE5NUVCMUZGNkY2QUZERUQxPC9yZGY6bGk+IDxyZGY6bGk+MTFGOEVDMjQ1NzY5QjdFMkFCMTRBQkFENDAxODQwNDU8L3JkZjpsaT4gPHJkZjpsaT4zMjlDRTE2QThFQUVCMjVBNzVGRTMxQjA0MUI3OEQ0MTwvcmRmOmxpPiA8cmRmOmxpPjQ5M0IyMURGQjU1RjIwMjE1N0I1NTZDQTE3NUIxNDQ1PC9yZGY6bGk+IDxyZGY6bGk+NDk2NjQzQjEyMTdCOTI3ODgxMUMyMjg4QkU5RjA2NEU8L3JkZjpsaT4gPHJkZjpsaT40RjhGNUIwRDBBMDQ1NDA3MEQ4NTJFN0MyQjU0NkU1ODwvcmRmOmxpPiA8cmRmOmxpPjVFOTk4NDM3RTIyNjAwRDI1NTYyNzBCNkFEQTA4MTI4PC9yZGY6bGk+IDxyZGY6bGk+QjMxNDE0NTBFMEQyMTIzOTVBNjBCNjhFRkE5QUU4MkY8L3JkZjpsaT4gPHJkZjpsaT5DNjY4QTkwREU0QkEzMTY1NDcyOEQzRjgxQTkwMUJCOTwvcmRmOmxpPiA8cmRmOmxpPkUyNkRBNDM5N0YwNEVFRTI3RUY5ODgyMjUwQ0U3NzdDPC9yZGY6bGk+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjJiNjc4ZWU1LTRiYzAtMjA0ZS1iNzQ5LWU1ODc1OGQ5ZDYwNjwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDo3MjdkOWI4MC1iMGQ4LWZkNGUtYWMwOS0zYTA5ZWM5MjQzOTM8L3JkZjpsaT4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6OGUzNDUzMTgtNTYwYy01MDRjLTk1YTUtYTJmNWIzYWY5MWNkPC9yZGY6bGk+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjhmY2VhMDU3LWZlZjYtNTU0MC1iMGI5LTY4Y2IzM2RhZGVkZjwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDphNjRlMzYzYi1jYmQzLTAyNGUtYWIwYi05MzhkYjk1ZDNiNmM8L3JkZjpsaT4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6YWY1NmQwYTktYmUwOS02ZDQ5LTk3NjktZDBiYjg3ZGUyNTBiPC9yZGY6bGk+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmUyNjY2YzcxLTg4ODEtOTc0YS05MjJhLTdjMDNjZDdjNGZmZDwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDplNDY3OTczNi04NWIxLWQ3NGUtOTUxZi1hNWI1NjhlYjIzYmQ8L3JkZjpsaT4gPC9yZGY6QmFnPiA8L3Bob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4g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8L2Xvv9wdWX13vaNq9tvvfWXG+//8x+3trdv3L9z69OdGGNsfT7NP4AD/6icc/rKqz/c/MYz31p+4TsvbpXV4tmLH1yqPr5yuSq9qqpD1NT7vA411Cu0KFDML8S5uerz3d0H1/72x9//OezVux9f+fDO7u5ud2h5N0znKt/jKuLjhq33BfKjDmH/SoP54/y+1sbvcUREs4UBnYhOHAZ0mkZPUG+2+5a+wJ4L67lK+6QQn3tee7t9jdwvDQ68Xue9mtkoShp6wvehwNnZPvTR9XxmAADvC3VFofXubhQV1Ht7zaRquRZ33cnX2rPo9wX1bujOhfBchXyae8pzwbzvM/pKK+YM6EREXw8M6ER04nxZP8jSidX9gplUVZ+mup4L7bkAf6g6PmFpn3dsOM+8j0YuiE8b0seNPuhu587dDcPdoN4O0t2QXfds51qgHaVK3jd8ve+zOFE/OPHnQCKi2cJ70ImI6OuunVC6s72370tvHm+WiKMF9lxwHxfgc8/tbnevmwvmudDc3T9qAB03+iB3ntxw8Vwv8b6Kenc/F8AnVcgjDv+SYNpQntsnIiJ67BjQiYiI9n2RsN7e7gblbmgfNzx+mmPdP9+93hcN6OO2u/oCeW6/r4o+rpKeC+vjtnPLpGHrDOVERDSTGNCJiIjypgnrzWPtMBw7+90APS6091Xgc8/J/UKg+3qA/tCc2z9KIB13jdz5cyF5mrA+zfFcEG/2u9fuvk+GciIimhkM6ERERJP1hfXmsb6qdRPYm+2++9hz4X3csdw+MDmc597PNPvjzjfNpA+5inXfcPO+Cvi4ivg0YTwXznP7RERETwwDOhER0dF0A123ut4cQ2c7Nxy+u3+cJXeto76XvmNd0wb1XKV6mor6UZe+8/e9H4ZyIiKaSQzoRERExzMusLcfnxTam/U0QT733O41utfqe72TjveZ9pcAufOPq6hP2u/++b5z912biIhoZjGgExERPV65MDhNaG/vTxvmu8/JnXMaxwmwRxnintsfF7InBXCGcSIiOlEY0ImIiL5804bG7r3uXZNmTe87Ns31jmva+90nPXaUe8QZxomI6ERhQCciInpypgmf49qkTTLt8PZZ9f/2eomIiI5FzPh/HxEREREREdGTpk/6BRARERERERERAzoRERERERHRTGBAJyIiIiIiIpoBDOhEREREREREM4ABnYiIiIiIiGgGMKATERERERERzQAGdCIiIiIiIqIZwIBORERERERENAMY0ImIiIiIiIhmAAM6ERERERER0QxgQCciIiIiIiKaAQzoRERERERERDOAAZ2IiIiIiIhoBjCgExEREREREc0ABnQiIiIiIiKiGcCATkRERERERDQDGNCJiIiIiIiIZsD/AP0HPCaqWEzqAAAAAElFTkSuQmCC";
}