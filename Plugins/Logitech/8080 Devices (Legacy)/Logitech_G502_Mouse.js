export function Name() { return "Logitech G502 Hero"; }
export function VendorId() { return 0x046d; }
export function Documentation(){ return "troubleshooting/logitech"; }
export function ProductId() { return 0xC332; }
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
        {"property":"dpi1", "group":"mouse", "label":"DPI 1","step":"50", "type":"number","min":"200", "max":"12000","default":"400"},
		{"property":"dpi2", "group":"mouse", "label":"DPI 2","step":"50", "type":"number","min":"200", "max":"12000","default":"800"},
		{"property":"dpi3", "group":"mouse", "label":"DPI 3","step":"50", "type":"number","min":"200", "max":"12000","default":"1200"},
		{"property":"dpi4", "group":"mouse", "label":"DPI 4","step":"50", "type":"number","min":"200", "max":"12000","default":"1600"},
		{"property":"dpi5", "group":"mouse", "label":"DPI 5","step":"50", "type":"number","min":"200", "max":"12000","default":"2000"},
		{"property":"dpi6", "group":"mouse", "label":"Sniper Button DPI","step":"50", "type":"number","min":"200", "max":"12000","default":"400"},
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
<<<<<<< HEAD
    	packet = device.read([0x00],9, 5);
=======
    	packet = device.read([0x00],9, 2);
>>>>>>> 42f57d082cf67330f8c3b3e3d66eb646aad4e508
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
<<<<<<< HEAD
	let packet = device.read([0x00],7, 3);
=======
	let packet = device.read([0x00],7, 10);
>>>>>>> 42f57d082cf67330f8c3b3e3d66eb646aad4e508

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
	return "iVBORw0KGgoAAAANSUhEUgAAA+gAAAH0CAYAAAHZLze7AAAACXBIWXMAAAsTAAALEwEAmpwYAAALsWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMS0wMi0xOFQxMTo1MToyOC0wODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMi0xOFQxNDowMzo0OC0wODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjEtMDItMThUMTQ6MDM6NDgtMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjBkNmZkMzY4LTBiYzUtNTE0Ny1hMmJmLTg1NDk1N2IwNmY3MCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjcwMTU4NDM1LWNkZjktMTM0YS1iYzE4LTQ0NzFhZWQ5YTQzNSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjcwNmJkNWRlLTJjNWEtZjA0Ni1hNjlmLWRkMTFjMDQyZjVhZCIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NzA2YmQ1ZGUtMmM1YS1mMDQ2LWE2OWYtZGQxMWMwNDJmNWFkIiBzdEV2dDp3aGVuPSIyMDIxLTAyLTE4VDExOjUxOjI4LTA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmExOTk4ODM5LTYzNGUtZTY0MC1iMzk2LTQzZDAwMjU1ZWEzOSIgc3RFdnQ6d2hlbj0iMjAyMS0wMi0xOFQxNDowMzo0OC0wODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjb252ZXJ0ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImRlcml2ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowZDZmZDM2OC0wYmM1LTUxNDctYTJiZi04NTQ5NTdiMDZmNzAiIHN0RXZ0OndoZW49IjIwMjEtMDItMThUMTQ6MDM6NDgtMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6YTE5OTg4MzktNjM0ZS1lNjQwLWIzOTYtNDNkMDAyNTVlYTM5IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjcwNmJkNWRlLTJjNWEtZjA0Ni1hNjlmLWRkMTFjMDQyZjVhZCIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjcwNmJkNWRlLTJjNWEtZjA0Ni1hNjlmLWRkMTFjMDQyZjVhZCIvPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT4zQkJFNTRCMTlFQ0QwQ0E2Q0UwMUI0OEFGNjNBRDlDQjwvcmRmOmxpPiA8cmRmOmxpPjUzRkRBMTYxQTA4NTQ0RTEzRkQxNzdCMjQzMzE0RTlDPC9yZGY6bGk+IDxyZGY6bGk+ODAyREVCNUEzNzQ5MTNEQkYzRkQ3RjdFQjIyNDhFNjY8L3JkZjpsaT4gPHJkZjpsaT5BQTZDMDAwOEQ1RjlCOTEzOEFEOEI4OUVGMzJGNEQxMzwvcmRmOmxpPiA8cmRmOmxpPkM3QzdBRjk4NjcyODNBMzIyNEFERUIzQjYxOEEwQUQzPC9yZGY6bGk+IDxyZGY6bGk+REIxRkM0RDREMEI2RjY1OTFFNEEzRjFGQTA0MzYyQzY8L3JkZjpsaT4gPHJkZjpsaT5EQzdCN0QxRkIxQUVFMkYxRDRDM0FFOTIwRDAwRTBFRjwvcmRmOmxpPiA8cmRmOmxpPkREQTIyRTE5N0NBNTMzOTJGQ0I0QjQxRTY2RjU1RTRGPC9yZGY6bGk+IDxyZGY6bGk+RjMxMkZDNTlGNkZCNUQ2RDRDNDNFOEEwQzc3RUI5NTc8L3JkZjpsaT4gPHJkZjpsaT5GREM5NUQzMzFFNUUzNUY5QkNF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";
}