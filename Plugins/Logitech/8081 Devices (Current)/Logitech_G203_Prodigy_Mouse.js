export function Name() { return "Logitech G203 Prodigy"; }
export function VendorId() { return 0x046d; }
export function Documentation(){ return "troubleshooting/logitech"; }
export function ProductId() { return 0xC084; }
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
        {"property":"dpi1", "group":"mouse", "label":"DPI 1","step":"50", "type":"number","min":"200", "max":"8000","default":"400"},
		{"property":"dpi2", "group":"mouse", "label":"DPI 2","step":"50", "type":"number","min":"200", "max":"8000","default":"800"},
		{"property":"dpi3", "group":"mouse", "label":"DPI 3","step":"50", "type":"number","min":"200", "max":"8000","default":"1200"},
		{"property":"dpi4", "group":"mouse", "label":"DPI 4","step":"50", "type":"number","min":"200", "max":"8000","default":"1600"},
		{"property":"dpi5", "group":"mouse", "label":"DPI 5","step":"50", "type":"number","min":"200", "max":"8000","default":"2000"},
		{"property":"dpi6", "group":"mouse", "label":"Sniper Button DPI","step":"50", "type":"number","min":"200", "max":"8000","default":"400"},
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
	 let packet = [this.FeatureIDs.DpiID, 0x30, 0x00, Math.floor(dpi/256), dpi%256];
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
	return "iVBORw0KGgoAAAANSUhEUgAAA+gAAAH0CAYAAAHZLze7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKdWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDYgNzkuMTY0NjQ4LCAyMDIxLzAxLzEyLTE1OjUyOjI5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMiAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAzLTE5VDE3OjM2OjEzLTA3OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTAzLTE5VDE3OjM2OjEzLTA3OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMy0xOVQxNzozNjoxMy0wNzowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0YjI3ZWYzNy1hYjc5LWRhNGItYmIxMS01MGY5NTk1NmNhNWEiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo3YzgwNmIxMi1lMDY4LWRkNGYtYTdiNi00MDEzNmZhNjVkY2QiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ZGRhZGQ5Ni03ZGYwLTBhNDItODUxYS00ZGQ4NjdjODNiNmYiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjRkZGFkZDk2LTdkZjAtMGE0Mi04NTFhLTRkZDg2N2M4M2I2ZiIgc3RFdnQ6d2hlbj0iMjAyMS0wMy0xOVQxNzozNjoxMy0wNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjIgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo0YjI3ZWYzNy1hYjc5LWRhNGItYmIxMS01MGY5NTk1NmNhNWEiIHN0RXZ0OndoZW49IjIwMjEtMDMtMTlUMTc6MzY6MTMtMDc6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4yIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+MDUwMkMwQUU4NTg1OUYzNTgxREZFQUMzMTYwRkVFNTg8L3JkZjpsaT4gPHJkZjpsaT4zNzZDODVBOEQ2OURCNTIzNUUzMDdFNUVDNzM5MDQ1MjwvcmRmOmxpPiA8cmRmOmxpPjNCQkU1NEIxOUVDRDBDQTZDRTAxQjQ4QUY2M0FEOUNCPC9yZGY6bGk+IDxyZGY6bGk+M0JGMEUzOTMzNjc4QTE1NEExQTQxM0U0NjYwMzAyRDQ8L3JkZjpsaT4gPHJkZjpsaT41ODk3NjlGQTU0RUEzRTk1MEYxOTM3NTE2NEY2MzhENjwvcmRmOmxpPiA8cmRmOmxpPjZDNTA3QjcwM0YzMDQ3REFGMDgyRTZFRjQwNTRBMzk0PC9yZGY6bGk+IDxyZGY6bGk+ODIyQUI1MjA0RTZCRENDNjQxQTk1NUZENjYzOTFBNjY8L3JkZjpsaT4gPHJkZjpsaT5CRjRCQkVEM0I4MTY3Qzc1NDg4ODJCODIyMDdBRTEyQjwvcmRmOmxpPiA8cmRmOmxpPkM3QzdBRjk4NjcyODNBMzIyNEFERUIzQjYxOEEwQUQzPC9yZGY6bGk+IDxyZGY6bGk+REIxRkM0RDREMEI2RjY1OTFFNEEzRjFGQTA0MzYyQzY8L3JkZjpsaT4gPHJkZjpsaT5EREEyMkUxOTdDQTUzMzkyRkNCNEI0MUU2NkY1NUU0RjwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDo3YjlmMmUwYy02YWQwLTYyNGEtYjliNi1hMTFiNzhjZTMwZTU8L3JkZjpsaT4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6ZTUxNDk3ZWItODVhMi1lZTRkLTgxMTQtNjgzODVmZDA4ZDk5PC9yZGY6bGk+IDxyZGY6bGk+eG1wLmRpZDoxZjU2ZGU4My1jM2Y2LTRlZmQtOGNhYy1hMTk3N2RhNTIxMDA8L3JkZjpsaT4gPHJkZjpsaT54bXAuZGlkOjk0OGY3YTliLWExMjQtNDNlZS1hZjNmLTQxNWUzZjFmYzI0NzwvcmRmOmxpPiA8cmRmOmxpPnhtcC5kaWQ6OWM1N2NjYTQtYjgyNC00OGViLTkwMmMtNTQ0OTg2MDJmNGJkPC9yZGY6bGk+IDxyZGY6bGk+eG1wLmRpZDo5ZmZlMGZmYi01NWI1LTQyMTEtYTg2OS01MjExM2JjYTJjOTY8L3JkZjpsaT4gPHJkZjpsaT54bXAuZGlkOmIzNWNlYjM1LWFkODItNDQxYy04ZjQ4LTBjY2MzYmY2OTkwZTwvcmRmOmxpPiA8cmRmOmxpPnhtcC5kaWQ6ZWZmYWQwYTMtNTY1OC00OTYxLTllOTUtZmEyY2UzZmY1YTE2PC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3Jk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";
}