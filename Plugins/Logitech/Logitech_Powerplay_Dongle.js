export function Name() { return "Logitech Powerplay Dongle"; }
export function VendorId() { return 0x046d; }
export function Documentation(){ return "troubleshooting/logitech"; }
export function ProductId() { return 0xC53A; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition(){return [240,120]}
export function DefaultScale(){return 8.0}
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
var DPIStage = 1;
var DeviceConnected = false;
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

const Powerplay_Mat = 
{
    mapping : [0],  
	positioning : [ [0,0] ],
    displayName: "PowerPlay MousePad",
    ledCount : 1,
    width: 3,
    height: 3,
    image: Image()
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
	Logitech.SetConnectionMode(Logitech.WIRELESS);
	Powerplayinit();
	DeviceConnected = connectionCheck();
	if(DeviceConnected !== true)
	{
		return;
	}
	deviceInitialization();
}

export function Render()
{
	sendMousePad();
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
	DetectInputs();
	grabColors();
	PollBattery();
}

export function Shutdown()
{    
	sendMousePad(true);
	grabColors(true);
}

export function onDpiLightChanged()
{
	Logitech.SetDpiLightAlwaysOn(DpiLight);
}

export function onDpiControlChanged()
{
	DpiHandler.setEnableControl(DpiControl);
}

export function ondpi1Changed()
{
	DpiHandler.DPIStageUpdated(1);
}

export function ondpi2Changed()
{
	DpiHandler.DPIStageUpdated(2);
}

export function ondpi3Changed()
{
	DpiHandler.DPIStageUpdated(3);
}
export function ondpi4Changed()
{
	DpiHandler.DPIStageUpdated(4);
}

export function ondpi5Changed()
{
	DpiHandler.DPIStageUpdated(5);
}

export function ondpi6Changed()
{
	DpiHandler.DPIStageUpdated(6);
}

export function ondpistagesChanged()
{
	DpiHandler.maxDPIStage = dpistages;
}

export function onDPIRolloverChanged()
{
	DpiHandler.dpiRollover = DPIRollover;
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

    Logitech.SetOnBoardState(OnboardState);
	Logitech.ButtonSpySet(OnboardState);
	Logitech.SetDirectMode(OnboardState);

	Logitech.SetDpiLightAlwaysOn(DpiLight);

	if(DpiControl)
	{
		DpiHandler.setEnableControl(true);
		DpiHandler.maxDPIStage = dpistages;
		DpiHandler.dpiRollover = DPIRollover;
		DpiHandler.setDpi();
	}
	else
	{
		Logitech.SetDPILights(3); //Fallback to set DPILights to full
	}
	device.setSize(Logitech.Config.DeviceSize);
	device.setControllableLeds(Logitech.Config.LedNames, Logitech.Config.LedPositions);

	if(Logitech.Config.HasBattery)
	{
		device.addFeature("battery");
		device.log("BATTREE")
		device.pause(1000);
    	battery.setBatteryLevel(Logitech.GetBatteryCharge());
	}
	device.addFeature("mouse");
	device.log("MAUSE")
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

function Powerplayinit()
{
	device.set_endpoint(2, 0x0001, 0xff00);
	var packet = [0x10,0x07,0x0b,0x10];//RGB Info iirc
	device.write(packet,7);

	device.set_endpoint(2, 0x0002, 0xff00);
	packet = [0x11,0x07,0x0b,0x20];//RGB
	device.write(packet,20);
	packet = [0x11,0x07,0x0b,0x20,0x00,0x01];//RGB Registers?
	device.write(packet,20);
	packet = [0x11,0x07,0x0b,0x20,0x00,0x02];//RGB
	device.write(packet,20);
	packet = [0x11,0x07,0x0b,0x20,0x00,0x03];//RGB

	device.set_endpoint(2, 0x0001, 0xff00);
	packet = [0x10,0x07,0x0b,0xCE];//RGB Also woah 0xC is super far out of normal bounds
	device.write(packet,7);
	packet = [0x10,0x07,0x0b,0x70];//RGB Power junk
	device.write(packet,7);
	packet = [0x10,0x07,0x0b,0x80,0x01,0x01];//RGB Enable!
	device.write(packet,7);
	packet = [0x10,0x07,0x0b,0xCE];//RGB Also woah 0xC is super far out of normal bounds
	device.write(packet,7);
	packet = [0x10,0x07,0x0b,0x40,0x00,0x01];//RGB Also woah 0xC is super far out of normal bounds
	device.write(packet,7);

	device.set_endpoint(2, 0x0002, 0xff00);
	packet = [0x11,0x07,0x0b,0x30,0x00,0x01,0x00,0x00,0x00,0x02];//RGB Also woah 0xC is super far out of normal bounds
	device.write(packet,20);

	device.createSubdevice("PowerPlayMat"); 
	device.setSubdeviceName("PowerPlayMat",`${Powerplay_Mat.displayName}`);
	device.setSubdeviceImage("PowerPlayMat", Powerplay_Mat.image);
	device.setSubdeviceSize("PowerPlayMat",Powerplay_Mat.width,Powerplay_Mat.height)

	device.pause(1000); //wait a second for device to reinit in software mode
}

function DetectInputs()
{
	do
    {
    	let packet = [];
    	packet = device.read([0x00],9, 10);
		macroInputArray.update(ProcessInputs(packet));
    }
    while(device.getLastReadSize() > 0)
}

function ProcessInputs(packet)
{
	if(packet[0] == Logitech.LongMessage && packet[1] == Logitech.ConnectionMode && packet[2] == Logitech.FeatureIDs.ButtonSpyID)
	{
		return packet.slice(4,7);
	}

	if(packet[0] == Logitech.LongMessage && packet[1] == Logitech.ConnectionMode && packet[2] == Logitech.FeatureIDs.WirelessStatusID && packet[3] == 0x00 && packet[5] == 0x01)
	{
		device.log("Waking From Sleep");
		device.pause(5000); //Wait five seconds before Handoff. Allows device boot time.
		Initialize();
		return;
	}
	return[];
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

function sendMousePad(shutdown = false)
{
    device.set_endpoint(2, 0x0002, 0xff00); // Lighting IF    

    let iX = Powerplay_Mat.positioning[0][0];
    let iY = Powerplay_Mat.positioning[0][1];
    var color;
    if(shutdown)
	{
        color = hexToRgb(shutdownColor)
    }
	else if (LightingMode == "Forced") 
	{
        color = hexToRgb(forcedColor)
    }
	else
	{
        color = device.subdeviceColor("PowerPlayMat",iX, iY);
    }

	let packet = [Logitech.LongMessage, 0x07, 0x0B, 0x30, 0x00, 0x01, color[0], color[1], color[2], 0x02];
	
    device.write(packet, 20);
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
			MouseBodyStyle : "G500Body",
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
			"SingleZoneMouse":	["Primary Zone",],
			"TwoZoneMouse":		["Primary Zone", "Logo Zone"],
			"ThreeZoneMouse":	["Left Zone", "Logo Zone", "Right Zone"],
			"G502XPlus":		["LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8"],
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
				"button6" : "Right_Back",
				"button7" : "DPI_UP",
				"button8" : "DPI_Down",
				"button9" : "Right_Forward",
				"button10" : "Scroll_Left",
				"button11" : "Scroll_Right",	
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

		this.buttonMapDict =
		{
			"Left_Click"    : 0x00,
			"Right_Click"   : 0x00,
			"Middle_Click"  : 0x00,
			"DPI_Down"		: 10,
			"DPI_UP"		: 12,
			"Scroll_Left"   : 14,
			"Scroll_Right"  : 16,
			"Backward"      : 18,
			"Forward"       : 20,
			"Right_Forward" : 22,
			"Right_Back"    : 24,
			"Top"           : 26,
			"Sniper"        : 0x00,
			"Null"          : 0x00,
		};

		this.macroArray = 
		{
			0 : this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button7"]], //DPI Up
			1 : this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button11"]], //Left Scroll
			2 : this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button10"]], //Right Scroll
			8 : 0,//this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button1"]],//Left Click
			9 : 0,//this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button2"]], //Right Click
			10 : 0,//this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button3"]],//Middle Click
			11 : this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button4"]],//Back Hit
			12 : this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button5"]], //Forward Hit
			13 : this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button6"]],//Right Back
			14 : this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button9"]],//Right Forward
			15 : this.buttonMapDict[this.ButtonMaps[this.Config.MouseBodyStyle]["button8"]],//DPI Down
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
		let returnData = device.read(packet,20);
		
		return returnData.slice(4,20);
	}
 
	SendLongPowerPlayMessage(data)
	{
		this.clearLongReadBuffer();
		let packet = [this.LongMessage,0x07];
		data = data || [0x00, 0x00, 0x00];
		packet.push(...data);
		device.write(packet, 20);
		let returnData = device.read(packet,20);
		
		return returnData.slice(4,7);
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
			device.pause(100);
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
		if(this.Config.HasDPILights !== true)
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
	 	let InfoPacket = [this.FeatureIDs.GKeyID, 0x00]; //Info
	 	this.SendShortMessage(InfoPacket);
 
	 	let SoftwareEnablePacket = [this.FeatureIDs.GKeyID, 0x20, 0x01]; //Software Enable Flag for GKeys and Mkeys
	 	this.SendShortMessage(SoftwareEnablePacket)
	}
 
	MKeySetup()
	{
		let InfoPacket = [this.FeatureIDs.MKeyID, 0x00];
	 	this.SendShortMessage(InfoPacket);
 
	 	let SoftwareEnablePacket = [this.FeatureIDs.MKeyID, 0x10]; //Led Number Flag in binary
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
		if(this.FeatureIDs.PerKeyLightingV2ID !== 0) //I should probably improve this so that it can be reused for keyboards
		{
			this.SendPerKeyLightingPacket(RGBData.splice(0, 4 * 4))
			this.SendPerKeyLightingPacket(RGBData.splice(0, 4 * 4))
		}
		else
		{
			this.SendZone(RGBData);
		}
	}
 
	SendZone(rgbdata) //This should be renamed to sendSingleZoneLighting or something similar
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

class DPIManager
{
    constructor(DPIConfig)
	{
        this.currentStage = 1;
		this.sniperStage = 6;
		this.DPISetCallback = function(){ device.log("No Set DPI Callback given. DPI Handler cannot function!")}
		if(DPIConfig.hasOwnProperty("callback"))
		{
			this.DPISetCallback = DPIConfig.callback;
		}

		this.sniperMode = false;
		this.enableDpiControl = false;
		this.maxDPIStage = 5; //Default to 5 as it's most common if not defined
		this.dpiRollover = false;
		this.dpiStageValues = {}
		if(DPIConfig.hasOwnProperty("callback"))
		{
			this.dpiStageValues = DPIConfig.stages;
		}
		else
		{
			device.log("No Set DPI Callback given. DPI Handler cannot function!")
		}
    }
	/** Enables or Disables the DPIHandler*/
	setEnableControl(EnableDpiControl)
	{
		this.enableDpiControl = EnableDpiControl;
	}
	/** GetDpi Value for a given stage.*/
	getDpiValue(stage)
	{
		// TODO - Bounds check
		// This is a dict of functions, make sure to call them
		device.log(stage);
		device.log(this.dpiStageValues[stage]())
		return this.dpiStageValues[stage]();
	}
	/** SetDpi Using Callback. Bypasses setStage.*/
	setDpi()
	{
		if(!this.enableDpiControl)
		{
			return;
		}
		if(this.sniperMode)
		{
			//Set Sniper Value
		}
		else
		{
			this.DPISetCallback(this.getDpiValue(this.currentStage), this.currentStage);
		}
	}
	/** Increment DPIStage */
    increment()
	{
		this.setStage(this.currentStage + 1)
    }
	/** Decrement DPIStage */
    decrement()
	{
		this.setStage(this.currentStage - 1)
    }
	/** Set DPIStage and then set DPI to that stage.*/
    setStage(stage)
	{	
		if(stage > this.maxDPIStage)
		{
			this.currentStage = this.dpiRollover ? 1 : this.maxDPIStage;
		}

		else if(stage < 1)
		{
			this.currentStage = this.dpiRollover ? this.maxDPIStage : 1;
		}

		else
		{
			this.currentStage = stage;
		}
		
		this.setDpi();
    }
	/** Stage update check to update DPI if current stage values are changed.*/
	DPIStageUpdated(stage)
	{
		// if the current stage's value was changed by the user
		// reapply the current stage with the new value
		if(stage == this.currentStage)
		{
			this.setDpi();
		}
	}
	/** Set Sniper Mode on or off. */
    SetSniperMode(sniperMode)
	{
		this.sniperMode = sniperMode;
		this.setDpi();
    }

}

let DPIConfig = 
{
	stages: 
	{
		1:  function(){ return dpi1; },
		2:  function(){ return dpi2; },
		3:  function(){ return dpi3; },
		4:  function(){ return dpi4; },
		5:  function(){ return dpi5; },
		6:  function(){ return dpi6; }
	},
	callback: function(dpi, stage) { return Logitech.setDpi(dpi, stage) }
}

let DpiHandler = new DPIManager(DPIConfig);

class BitArray
{
	constructor(length)
	{
		// Create Backing Array
		this.buffer = new ArrayBuffer(length);
		// Byte View
		this.bitArray = new Uint8Array(this.buffer);
		// Constant for width of each index
		this.byteWidth = 8;
	}
 
	toArray()
	{
		return [...this.bitArray];
	}
 
	get(bitIdx)
	{
		return this.bitArray[bitIdx / this.byteWidth | 0] === 1 << (bitIdx % this.byteWidth);
	}
 
	set(bitIdx)
	{
		this.bitArray[bitIdx / this.byteWidth | 0] |= 1 << (bitIdx % this.byteWidth);
	}
 
	clear(bitIdx)
	{
		this.bitArray[bitIdx / this.byteWidth | 0] &= ~(1 << (bitIdx % this.byteWidth));
	}
 
	toggle(bitIdx)
	{
		this.bitArray[bitIdx / this.byteWidth | 0] ^= 1 << (bitIdx % this.byteWidth);
	}
 
	compareByte(index, value)
	{
		return this.bitArray[index] === value;
	}
 
	setState(bitIdx, state)
	{
		if(state)
		{
			this.set(bitIdx);
		}else
		{
			this.clear(bitIdx);
		}
	}
 
	update(newArray)
	{
		for(let byteIdx = 0; byteIdx < newArray.length; byteIdx++)
		{
			if(!this.compareByte(byteIdx, newArray[byteIdx]))
			{// TODO - swap to guard clause
				for (let bit = 0; bit < this.byteWidth; bit++)
				{
					let isPressed = (1 << (bit % this.byteWidth) === (newArray[byteIdx] & (1 << (bit % this.byteWidth)))); 
 
					let bitIdx = byteIdx * 8 + bit;
					if(isPressed != this.get(byteIdx * 8 + bit))
					{
						// KEY CHANGED
						// TODO - clean this up
						this.setState(bitIdx, isPressed);
						if(isPressed)
						{
							device.log(Logitech.macroArray[bitIdx]);
							if(Logitech.macroArray[bitIdx] === 10)
							{
								DpiHandler.increment();
								//DPIStage++;
								//DPIStageControl();
								break;
							}

							else if(Logitech.macroArray[bitIdx] === 12)
							{
								DpiHandler.decrement();
								//DPIStage--;
								//DPIStageControl();
								break;
							}

							else if(Logitech.macroArray[bitIdx] === 28)
							{
								Sniper = true;
								Logitech.setDpi(dpi6, 1);
								Logitech.SetDPILights(1);
							}
							else
							{
								mouse.sendEvent({"buttonCode":(Logitech.macroArray[bitIdx])}, "Button Press");
							}
						}
						else
						{		
							if(Logitech.macroArray[bitIdx] === 10)
							{
								return //Return as we don't need a depress event as this is internal to the plugin
							}

							else if(Logitech.macroArray[bitIdx] === 12)
							{
								return //Return as we don't need a depress event as this is internal to the plugin
							}

							else if(Logitech.macroArray[bitIdx] === 28)
							{
								Sniper = false;
								DPIStageControl(); //The Sniper stuff needs wrapped into the DPIStageControl function. DPIStageControl should be wrapped into the class or more likely deprecated with the DPIHandler class.
							}

							else
							{
								mouse.sendEvent({"buttonCode":(Logitech.macroArray[bitIdx] + 1)}, "Button Press");
							}
						}
					}
				}
			}
		}
	}
}
 
let macroInputArray = new BitArray(3);

export function Validate(endpoint)
{
    return endpoint.interface === Logitech.Config.CommunicationType && endpoint.usage === Logitech.LongMessageEndpointByte && endpoint.usage_page === Logitech.EndpointByte3
     || endpoint.interface === Logitech.Config.CommunicationType && endpoint.usage === Logitech.ShortMessageEndpointByte && endpoint.usage_page === Logitech.EndpointByte3;
}

export function Image()
 {
 return "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Z2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNC40LjAtRXhpdjIiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgIHhtcE1NOkRvY3VtZW50SUQ9ImdpbXA6ZG9jaWQ6Z2ltcDpkNTM2NGVkNi05M2QzLTRkODctOGUwMC0xYWM3ZGJiZjk1NDYiCiAgIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTlmZGZlNGYtN2MzYS00NDA0LWI2MjctOTRlNDk2YmU0ZTU5IgogICB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6YjVlNDcxYTctYzAzNS00MGJiLWI1ZDktYmFkOWI1OTZiZDcxIgogICBkYzpGb3JtYXQ9ImltYWdlL3BuZyIKICAgR0lNUDpBUEk9IjIuMCIKICAgR0lNUDpQbGF0Zm9ybT0iV2luZG93cyIKICAgR0lNUDpUaW1lU3RhbXA9IjE2MjM0NDAwMzI0MjQ5MjYiCiAgIEdJTVA6VmVyc2lvbj0iMi4xMC4yNCIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIKICAgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDplZDU5MDE4ZC0yMGFmLTQ2ZmEtOTQ0NS1lZGVmMzk5Y2ZmNWEiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDYtMTFUMTI6MzM6NTIiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+gFueeAAACjppQ0NQUGhvdG9zaG9wIElDQyBwcm9maWxlAABIiZ2Wd1RU1xaHz713eqHNMBQpQ++9DSC9N6nSRGGYGWAoAw4zNLEhogIRRUQEFUGCIgaMhiKxIoqFgGDBHpAgoMRgFFFReTOyVnTl5b2Xl98fZ31rn733PWfvfda6AJC8/bm8dFgKgDSegB/i5UqPjIqmY/sBDPAAA8wAYLIyMwJCPcOASD4ebvRMkRP4IgiAN3fEKwA3jbyD6HTw/0malcEXiNIEidiCzclkibhQxKnZggyxfUbE1PgUMcMoMfNFBxSxvJgTF9nws88iO4uZncZji1h85gx2GlvMPSLemiXkiBjxF3FRFpeTLeJbItZMFaZxRfxW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sAAAAAAAALBqBFgAAAAAAABYNQIsAAAAAAAArBoBFgAAAAAAAFaNAAsAAAAAAACrRoAFAAAAAACAVSPAAgAAAAAAwKoRYAEAAAAAAGDVCLAAAAAAAACwagRYAAAAAAAAWDUCLAAAAAAAAKwaARYAAAAAAABWjQALAAAAAAAAq0aABQAAAAAAgFUjwAIAAAAAAMCqEWABAAAAAABg1QiwAAAAAAAAsGoEWAAAAAAAAFg1AiwAAAAAAACsGgEWAAAAAAAAVo0ACwAAAAAAAKtGgAUAAAAAAIBVI8ACAAAAAADAqhFgAQAAAAAAYNUIsAAAAAAAALBqBFgAAAAAAABYNQIsAAAAAAAArBoBFgAAAAAAAFaNAAsAAAAAAACrRoAFAAAAAACAVSPAAgAAAAAAwKoRYAEAAAAAAGDVCLAAAAAAAACwagRYAAAAAAAAWDUCLAAAAAAAAKwaARYAAAAAAABWjQALAAAAAAAAq0aABQAAAAAAgFUjwAIAAAAAAMCqEWABAAAAAABg1QiwAAAAAAAAsGoEWAAAAAAAAFg1AiwAAAAAAACsGgEWAAAAAAAAVo0ACwAAAAAAAKtGgAUAAAAAAIBVI8ACAAAAAADAqhFgAQAAAAAAYNUIsAAAAAAAALBqBFgAAAAAAABYNQIsAAAAAAAArBoBFgAAAAAAAFaNAAsAAAAAAACrRoAFAAAAAACAVSPAAgAAAAAAwKoRYAEAAAAAAGDVCLAAAAAAAACwagRYAAAAAAAAWDUCLAAAAAAAAKwaARYAAAAAAABWjQALAAAAAAAAq0aABQAAAAAAgFUjwAIAAAAAAMCqEWABAAAAAABg1QiwAAAAAAAAsGoEWAAAAAAAAFg1AiwAAAAAAACsGgEWAAAAAAAAVo0ACwAAAAAAAKtGgAUAAAAAAIBVI8ACAAAAAADAqhFgAQAAAAAAYNUIsAAAAAAAALBqBFgAAAAAAABYNQIsAAAAAAAArBoBFgAAAAAAAFaNAAsAAAAAAACrRoAFAAAAAACAVSPAAgAAAAAAwKoRYAEAAAAAAGDVCLAAAAAAAACwagRYAAAAAAAAWDUCLAAAAAAAAKwaARYAAAAAAABWjQALAAAAAAAAq0aABQAAAAAAgFUjwAIAAAAAAMCqEWABAAAAAABg1QiwAAAAAAAAsGoEWAAAAAAAAFg1AiwAAAAAAACsGgEWAAAAAAAAVo0ACwAAAAAAAKtGgAUAAAAAAIBVI8ACAAAAAADAqhFgAQAAAAAAYNUIsAAAAAAAALBqBFgAAAAAAABYNQIsAAAAAAAArBoBFgAAAAAAAFaNAAsAAAAAAACrRoAFAAAAAACAVSPAAgAAAAAAwKoRYAEAAAAAAGDVCLAAAAAAAACwagRYAAAAAAAAWDUCLAAAAAAAAKwaARYAAAAAAABWjQALAAAAAAAAq0aABQAAAAAAgFUjwAIAAAAAAMCqEWABAAAAAABg1QiwAAAAAAAAsGoEWAAAAAAAAFg1AiwAAAAAAACsGgEWAAAAAAAAVo0ACwAAAAAAAKtGgAUAAAAAAIBVI8ACAAAAAADAqhFgAQAAAAAAYNUIsAAAAAAAALBqBFgAAAAAAABYNQIsAAAAAAAArBoBFgAAAAAAAFaNAAsAAAAAAACrRoAFAAAAAACAVSPAAgAAAAAAwKoRYAEAAAAAAGDVCLAAAAAAAACwagRYAAAAAAAAWDUCLAAAAAAAAKwaARYAAAAAAABWjQALAAAAAAAAq0aABQAAAAAAgFUjwAIAAAAAAMCqEWABAAAAAABg1QiwAAAAAAAAsGoEWAAAAAAAAFg1AiwAAAAAAACsGgEWAAAAAAAAVo0ACwAAAAAAAKtGgAUAAAAAAIBVI8ACAAAAAADAqhFgAQAAAAAAYNUIsAAAAAAAALBqBFgAAAAAAABYNQIsAAAAAAAArBoBFgAAAAAAAFaNAAsAAAAAAACrRoAFAAAAAACAVSPAAgAAAAAAwKoRYAEAAAAAAGDVCLAAAAAAAACwagRYAAAAAAAAWDUCLAAAAAAAAKwaARYAAAAAAABWjQALAAAAAAAAq0aABQAAAAAAgFUjwAIAAAAAAMCqEWABAAAAAABg1QiwAAAAAAAAsGoEWAAAAAAAAFg1AiwAAAAAAACsGgEWAAAAAAAAVo0ACwAAAAAAAKtGgAUAAAAAAIBVI8ACAAAAAADAqhFgAQAAAAAAYNUIsAAAAAAAALBqBFgAAAAAAABYNQIsAAAAAAAArBoBFgAAAAAAAFaNAAsAAAAAAACrRoAFAAAAAACAVSPAAgAAAAAAwKoRYAEAAAAAAGDVCLAAAAAAAACwagRYAAAAAAAAWDUCLAAAAAAAAKwaARYAAAAAAABWjQALAAAAAAAAq0aABQAAAAAAgFUjwAIA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rAksAAAAANYEFgAAAABrAgsAAACANYEFAAAAwJrAAgAAAGBNYAEAAACwJrAAAAAAWBNYAAAAAKwJLAAAAADWBBYAAAAAawILAAAAgDWBBQAAAMCawAIAAABgTWABAAAAsCawAAAAAFgTWAAAAACsCSwAAAAA1gQWAAAAAGsCCwAAAIA1gQUAAADAmsACAAAAYE1gAQAAALAmsAAAAABYE1gAAAAArAksAAAAANYEFgAAAABrAgsAAACANYEFAAAAwJrAAgAAAGBNYAEAAACwJrAAAAAAWBNYAAAAAKwJLAAAAADWBBYAAAAAawILAAAAgDWBBQAAAMCawAIAAABgTWABAAAAsCawAAAAAFgTWAAAAACsCSwAAAAA1gQWAAAAAGsCCwAAAIA1gQUAAADAmsACAAAAYE1gAQAAALAmsAAAAABYE1gAAAAArAksAAAAANYEFgAAAABrAgsAAACANYEFAAAAwJrAAgAAAGBNYAEAAACwJrAAAAAAWBNYAAAAAKwJLAAAAADWBBYAAAAAawILAAAAgDWBBQAAAMCawAIAAABgTWABAAAAsCawAAAAAFgTWAAAAACsCSwAAAAA1gIdTRs1U/Wt3QAAAABJRU5ErkJggg=="}