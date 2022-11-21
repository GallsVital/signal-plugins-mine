export function Name() { return "Logitech G203 Lightsync"; }
export function VendorId() { return 0x046d; }
export function Documentation(){ return "troubleshooting/logitech"; }
export function ProductId() { return 0xc092;}//0xc092; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
ARGBMode:readonly
send_delay1:readonly
DpiControl:readonly
dpistages:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
dpi5:readonly
OnboardState:readonly
DPIRollover:readonly
pollingrate:readonly
*/
export function ControllableParameters(){
    return [
        {"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "group":"lighting", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"},
		{"property":"ARGBMode", "group":"lighting", "label":"PERLED Mode (Experimental)","type":"boolean","default":"false"},
		{"property":"send_delay1", "group":"lighting", "label":"RGB Packet Delay", "step":"1", "type":"number", "min":"0", "max":"200", "default":"60", "tooltip":"Time in milliseconds in between rgb updates. Lower delay increases smoothness, but also increases chance of mouse locking up."},
        {"property":"DpiControl", "group":"mouse", "label":"Enable Dpi Control","type":"boolean","default":"false"},
		{"property":"dpistages", "group":"mouse", "label":"Number of DPI Stages","step":"1", "type":"number","min":"1", "max":"5","default":"5"},
        {"property":"dpi1", "group":"mouse", "label":"DPI 1","step":"50", "type":"number","min":"200", "max":"8000","default":"400"},
		{"property":"dpi2", "group":"mouse", "label":"DPI 2","step":"50", "type":"number","min":"200", "max":"8000","default":"800"},
		{"property":"dpi3", "group":"mouse", "label":"DPI 3","step":"50", "type":"number","min":"200", "max":"8000","default":"1200"},
		{"property":"dpi4", "group":"mouse", "label":"DPI 4","step":"50", "type":"number","min":"200", "max":"8000","default":"1600"},
		{"property":"dpi5", "group":"mouse", "label":"DPI 5","step":"50", "type":"number","min":"200", "max":"8000","default":"2000"},
		{"property":"OnboardState", "group":"", "label":"Onboard Button Mode","type":"boolean","default": "false"},
		{"property":"DPIRollover", "group":"mouse", "label":"DPI Stage Rollover","type":"boolean","default": "false"},
		{"property":"pollingrate", "group":"mouse", "label":"Polling Rate","type":"combobox", "values":[ "1000","500", "250", "100" ], "default":"1000"},
    ];
}

var Hero = false;
var DeviceId;
var TransactionId;
var deviceName;
var InfoID;
var NameID;
var RGBFeatureID;
var PowerRGBFeatureID;
var PollingRateID;
var ButtonSpyID;
var DisableKeysID;
var GKeyID;
var MKeyID;
var MRID;
var ChargingControlID;
var PersistentRemappableActionID;
var LEDCtrlID;
var DpiID;
var BattID = 0;
var UnifiedBattID;
var Sleep = false;
var OnboardID;
var OnBoardState;
var DPIStage = 1;

const vLedNames = ["Primary Zone"];
const vLedPositions = [ [0,1] ];

let vPERLedNames = ["Left Zone", "Logo Zone", "Right Zone"];
let vPERLedPositions = [ [0, 1], [1, 2], [2, 1] ];

const WIRED = 0xFF;
const WIRELESS = 0x01;
const ShortMessage = 0x10;
const LongMessage = 0x11;
const SoftwareMode = 0x02;
const HardwareMode = 0x01;
const ConnectionMode = WIRED;
//Change these for lightspeed vs standard mice.
const EndpointByte1 = 1;
const ShortMessageEndpointByte = 0x0001;
const LongMessageEndpointByte = 0x0002;
const EndpointByte3 = 0xff00;

const DPIStageDict =
{
	1:  function(){ return dpi1; },
	2:  function(){ return dpi2; },
	3:  function(){ return dpi3; },
	4:  function(){ return dpi4; },
	5:  function(){ return dpi5; }
}

const deviceIdMap = 
{
"01"   : "Logitech G203 Lightsync", //I'm going to force the layouts for now, as we're relying on PID
"405d" : "Logitech G403L",
"407f" : "Logitech G502L",          
"4070" : "Logitech G703L",
"4086" : "Logitech G703 Hero",   
"4053" : "Logitech G900L",       
"4067" : "Logitech G903L",   
"4087" : "Logitech G903 Hero",    
"4079" : "Logitech GPro Wireless",     
"4093" : "Logitech GPro X Superlight"
}

export function LedNames()
{
	if(ARGBMode === true)
	{
	return vPERLedNames;
	}
	else
	{
    return vLedNames;
	}
}

export function LedPositions()
{
	if(ARGBMode === true)
	{
	return vPERLedPositions;
	}
	else
	{
    return vLedPositions;
	}
}

export function Initialize()
{	
	GrabIds();//Grab all of our ID's of value

	let data = [0x80, 0x00, 0x00, 0x01]//Enable Hid++ Notifications
    Logitech_Short_Set(data, WIRED)

    getDeviceName();

    data = [0x80, 0x02, 0x02, 0x00]//Fake reconnect to grab data.
    let value = Logitech_Short_Set(data, WIRED)

    DeviceId = value[3].toString(16) + value[2].toString(16)
    TransactionId = value[0];

    deviceName = deviceIdMap[DeviceId] || "UNKNOWN"
    device.log(`Device Id Found: ${DeviceId}`);
    device.log(`Device Name: ${deviceName}`);

    SetOnBoardState(OnboardState);

	ButtonSpySet();
	if(Hero == true)
    {
		SetHeroDirectMode();
    }
	else
	{
		SetDirectMode();
	}
	if(DpiControl)
	{
		DPIStageControl();
	}
}

export function Render()
{
	DetectInputs();

		if(Sleep == false)
		{	
			if(ARGBMode === true)
			{
			sendColor();
			}
			else
			{
			sendZone(0);
			}
		}

}

export function Shutdown()
{    
	sendZone(0, true);
}

export function onARGBModeChanged()
{
	device.repollLeds();
}

export function onDpiControlChanged()
{
	if(DpiControl)
	{
		DPIStageControl();
	}
}

export function ondpi1Changed()
{
	if(DpiControl)
	{
		DPIStageControl(1,1);
	}
}

export function ondpi2Changed()
{
	if(DpiControl)
	{
		DPIStageControl(1,2);
	}
}

export function ondpi3Changed()
{
	if(DpiControl)
	{
		DPIStageControl(1,3);
	}
}
export function ondpi4Changed()
{
	if(DpiControl)
	{
		DPIStageControl(1,4);
	}
}

export function ondpi5Changed()
{
	if(DpiControl)
	{
		DPIStageControl(1,5);
	}
}

export function onOnboardStateChanged()
{
	SetOnBoardState(OnboardState);
	ButtonSpySet();
	if(OnboardState == true)
	{
		if(Hero == false)
		{
		SetDirectMode(); //Resets LEDs
		}
	}
}

export function onpollingrateChanged()
{
	setPollingRate();
}

const devicetypedict = 
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
}

function getDeviceName()
{
	clearLongReadBuffer();
	clearShortReadBuffer();
	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3);

	let namepacket = [ShortMessage, ConnectionMode, NameID, 0x10];
	device.write(namepacket,7);
	
	device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3);
	let namereturnpacket = device.read([0x00],20);
	let namepart1 = namereturnpacket.slice(4,20);
	

	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3);

	let namepacket2 = [ShortMessage, ConnectionMode, NameID, 0x10, 0x10];
	device.write(namepacket2,7);
	
	device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3);
	let namereturnpacket2 = device.read([0x00],20);
	let namepart2 = namereturnpacket2.slice(4,20);

	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3);

	let namepacket3 = [ShortMessage, ConnectionMode, NameID, 0x10, 0x20];
	device.write(namepacket3,7);
	
	device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3);
	let namereturnpacket3 = device.read([0x00],20);
	let namepart3 = namereturnpacket3.slice(4,20);

	let deviceName = namepart1.concat(namepart2.concat(namepart3));
	deviceName = String.fromCharCode(...deviceName);
	device.log("Device Name: " + deviceName);

	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3);

	let typepacket = [ShortMessage, ConnectionMode, NameID, 0x20];
	device.write(typepacket,7);
	
	device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3);
	let typereturnpacket = device.read([0x00],20);
	let deviceType = typereturnpacket[4];
	device.log("Device Type: " + devicetypedict[deviceType]);
}

function ButtonSpySet()
{
	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3);
	let packet = [ShortMessage, ConnectionMode, ButtonSpyID, 0x00, 0x00, 0x00, 0x00];
	device.write(packet,7);
	packet = [ShortMessage, ConnectionMode, ButtonSpyID, 0x10, 0x00, 0x00, 0x00]; //0x30?
	device.write(packet,7);
	device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3);

	if(OnboardState == false)
	{
	packet = [LongMessage, ConnectionMode, ButtonSpyID, 0x40, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x08, 0x0a, 0x0b, 0x0c];//0x40 on its own remaps everything BIG PROBLEM because you can't click anything then
	device.write(packet,20);
	}
	else
	{
	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3);
	packet = [ShortMessage, ConnectionMode, ButtonSpyID, 0x20,]; //Relinquishes control from button spy
	device.write(packet,7);
	}
	
}

const mouseButtonDict = 
{

"4087" : 
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "Sniper",
	"button7" : "DPI_Down",
	"button8" : "DPI_UP",
	"button9" : "Top"	
},

"4067" :
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "Sniper",
	"button7" : "DPI_Down",
	"button8" : "DPI_UP",
	"button9" : "Top"
},

"4053" :
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "Sniper",
	"button7" : "DPI_Down",
	"button8" : "DPI_UP",
	"button9" : "Top"
},

"407f" :
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "Sniper",
	"button7" : "Top",
	"button8" : "DPI_UP",
	"button9" : "DPI_Down"	
},

"405d" :
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "DPI_UP",
	"button7" : "DPI_Down",
	"button8" : "Null",
	"button9" : "Null"
},

"4070" :
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "DPI_UP",
	"button7" : "DPI_Down",
	"button8" : "Null",
	"button9" : "Null"
},

"4086" :
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "DPI_UP",
	"button7" : "DPI_Down",
	"button8" : "Null",
	"button9" : "Null"
},

"4093" :
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "DPI_UP",
	"button7" : "DPI_Down",
	"button8" : "Null",
	"button9" : "Null"
},

"01" :
{
	"button1" : "Left_Click",
	"button2" : "Right_Click",
	"button3" : "Middle_Click",
	"button4" : "Backward",
	"button5" : "Forward",
	"button6" : "DPI_UP",
	"button7" : "Null",
	"button8" : "Null",
	"button9" : "Null"
},

}

function DetectInputs()
{
	device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3);
		do
    	{
    	let packet = [];
    	packet = device.read([0x00],9, 2);
    	let input = ProcessInputs(packet);
		
		if(input == "DPI_UP")
		{
			if(DpiControl)
			{
			DPIStage++;
			DPIStageControl();
			}
		}
		if(input == "DPI_Down")
		{
			if(DpiControl)
			{
			DPIStage--;
			DPIStageControl();	
			}
		}

    	}
    	while(device.getLastReadSize() > 0)

	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3);
	do
	{
	let packet = device.read([0x00],7, 10);

		if(packet[0] == ShortMessage && packet[1] == ConnectionMode && packet[2] == 0x41 && packet[3] == 0x0C && packet[6] == 0x40)
		{
		device.log("Mouse Going to Sleep");
		return Sleep = true;
		}
	}
	while(device.getLastReadSize() > 0)
}

function ProcessInputs(packet)
{
	if(packet[0] == LongMessage && packet[1] == ConnectionMode && packet[2] == ButtonSpyID)
	{
    	if(packet[4] == 0x01)
		{
		device.log("Button 7");
		return mouseButtonDict[DeviceId]["button7"];
		}
		if(packet[4] == 0x02)
		{
		device.log("Left Scroll Wheel Pressed");
		return;
		}
    	if(packet[4] == 0x04)
		{
		device.log("Right Scroll Wheel Pressed");
		return;
		}
		if(packet[5] == 0x01)
		{
		device.log("Button 1");
		return mouseButtonDict[DeviceId]["button1"];
		}
    	if(packet[5] == 0x02)
		{
		device.log("Button 2");
		return mouseButtonDict[DeviceId]["button2"];
		}
		if(packet[5] == 0x04)
		{
		device.log("Button 3");
		return mouseButtonDict[DeviceId]["button3"];
		}
		if(packet[5] == 0x08)
		{
		device.log("Button 4");
		return mouseButtonDict[DeviceId]["button4"];
		}
		if(packet[5] == 0x10)
		{
		device.log("Button 5");
		return mouseButtonDict[DeviceId]["button5"];
		}
		if(packet[5] == 0x20)
		{
		device.log("Button 6");
		return mouseButtonDict[DeviceId]["button6"];
		}
		if(packet[5] == 0x40)
		{
		device.log("Button 9");
		return mouseButtonDict[DeviceId]["button9"];
		}
		if(packet[5] == 0x80)
		{
		device.log("Button 8");
	 
		return mouseButtonDict[DeviceId]["button8"];

		}

	}

	if(packet[0] == LongMessage && packet[1] == ConnectionMode && packet[2] == 0x06 && packet[3] == 0x00 && packet[6] == 0x00)
	{
	device.log("Waking From Sleep");
	device.pause(5000); //Wait five seconds before Handoff. Allows device boot time.
	Initialize();
	return Sleep = false;
	}
}

function SetOnBoardState(OnboardState)
{
    device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3); // Short Message Endpoint

    let packet = [ShortMessage, ConnectionMode, OnboardID, 0x10, (OnboardState ? HardwareMode : SoftwareMode)];
    device.write(packet, 7);

	device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3);
	packet = device.read(packet,20);
	device.log("Onboard State Set to : " + OnboardState);
    device.pause(1); 
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
    setDpi(DPIStageDict[DPIStage]());
	}
	device.log(DPIStage);
}

function clearShortReadBuffer()
{
    device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3); // Short Message Endpoint 
    device.read([ShortMessage,0x01],7);
    while(device.getLastReadSize() > 0)
	{
        device.read([ShortMessage,0xFF],7);
    }
}

function clearLongReadBuffer()
{
    device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3); // Long Message Endpoint
    device.read([LongMessage,0x01],20);
    while(device.getLastReadSize() > 0)
	{
        device.read([ShortMessage,0x01],20);
    }
}

function Logitech_Short_Set(data, Mode)
{
    device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3); // Short Message Endpoint 
    clearShortReadBuffer();
    var packet = [ShortMessage,Mode];
    data  = data || [0x00, 0x00, 0x00];
    packet = packet.concat(data);
    device.write(packet, 7);
    packet = device.read(packet,7);

    return packet.slice(3,7);
}

function Logitech_Long_Set(Mode, data)
{
    device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3); // Lighting IF 
	clearLongReadBuffer();
    var packet = [LongMessage,Mode];
    data = data || [0x00, 0x00, 0x00];
    packet = packet.concat(data);
    device.write(packet, 20);
    packet = device.read(packet,20);
	
    return packet.slice(4,7);
}

function Logitech_FeatureID_Get(page)
{
  return Logitech_Long_Set(ConnectionMode, [0x00,0x00].concat(page))[0];
}

function setDpi(dpi)
{
    device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3); // Short Message Endpoint 

    let packet = [ShortMessage, ConnectionMode, DpiID, 0x30, 0x00, Math.floor(dpi/256), dpi%256];	
    device.write(packet, 7);
    device.pause(1);
}

function setPollingRate()
{
    device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3); // Short Message Endpoint

    let packet = [ShortMessage, ConnectionMode, PollingRateID, 0x20, 1000/pollingrate];
    device.write(packet, 7);
    device.pause(1); 
}

function SetDirectMode()
{
 	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3); 
 	let packet = [ShortMessage, ConnectionMode, RGBFeatureID, 0x80, 0x01, 0x01];
 	device.write(packet, 7);

	if(OnBoardState == true)
	{
	 packet = [ShortMessage, ConnectionMode, LEDCtrlID, 0x30, 0x00];//Software Mode for LED number
	 device.write(packet, 7);
	}
	else
	{
	packet = [ShortMessage, ConnectionMode, LEDCtrlID, 0x30, 0x01];//Software Mode for DPI LED Count
 	device.write(packet, 7);
	}
}

function SetHeroDirectMode()
{
 	device.set_endpoint(EndpointByte1, ShortMessageEndpointByte, EndpointByte3); 
 	let packet = [ShortMessage, ConnectionMode, RGBFeatureID, 0x50, 0x01, 0x03, 0x05];
 	device.write(packet, 7);
}

function sendZone(zone, shutdown = false)
{
    device.set_endpoint(EndpointByte1, LongMessageEndpointByte, EndpointByte3);  
    let packet = [LongMessage, ConnectionMode, RGBFeatureID, (Hero ? 0x10 : 0x30 ), zone, 0x01];

    let iX = vLedPositions[zone][0];
    let iY = vLedPositions[zone][1];
    var color;

    if(shutdown)
	{
        color = hexToRgb(shutdownColor);
    }
	else if (LightingMode == "Forced")
	{
        color = hexToRgb(forcedColor);
    }
	else
	{
        color = device.color(iX, iY);
    }
    packet[6] = color[0];
    packet[7] = color[1];
    packet[8] = color[2];
    packet[9] = (Hero ? 0x02 : 0x00);

    packet[16] = 0x01;


    device.write(packet, 20);
	device.pause(send_delay1/2);
	device.read(packet,20);
	device.pause(send_delay1/2);

}

function sendColor(shutdown = false)
{
	device.set_endpoint(1, 0x0002, 0xff00); // Lighting IF

	let packet = [];

	packet[0x00] = 0x11;
	packet[0x01] = 0xFF;
	packet[0x02] = 0x12;
	packet[0x03] = 0x1A;

	let offset = 4;

	for (let iIdx = 0; iIdx < vPERLedPositions.length; iIdx++) 
	{
		let iLedIdx = offset + (iIdx * 4);
		let iX = vPERLedPositions[iIdx][0];
		let iY = vPERLedPositions[iIdx][1];
		var color;

		if(shutdown){
			color = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iX, iY);
		}

		packet[iLedIdx] = iIdx + 1;
		packet[iLedIdx+1] = color[0];
		packet[iLedIdx+2] = color[1];
		packet[iLedIdx+3] = color[2];
	}

	packet[0x10] = 0xFF;

    device.write(packet, 20);
	device.pause(send_delay1/2);
	device.read(packet,20);
	device.pause(send_delay1/2);
	Apply();
}

function Apply() 
{
	let packet = [];
	packet[0x00] = 0x11;
	packet[0x01] = 0xFF;
	packet[0x02] = 0x12;
	packet[0x03] = 0x7A;

	device.write(packet, 20);
	device.pause(1);
	device.read(packet, 20);
	device.pause(1);
}

function GrabIds()
{
	const InfoPage = [0x00,0x03];
	InfoID = Logitech_FeatureID_Get(InfoPage);
		if(InfoID !== 0)
		{
		device.log("Device Info ID: " + InfoID);
		}
	
	const NamePage = [0x00,0x05];
	NameID = Logitech_FeatureID_Get(NamePage);
		if(NameID !== 0)
		{
		device.log("Device Name ID: " + NameID);
		}
	
	const ResetPage = [0x00,0x20];
	var ResetID = Logitech_FeatureID_Get(ResetPage);
		if(ResetID !== 0)
		{
		device.log("Device Reset ID: " + ResetID);
		}

	const FriendlyNamePage = [0x00,0x07];
	var FriendlyNameID = Logitech_FeatureID_Get(FriendlyNamePage);
		if(FriendlyNameID !== 0)
		{
		device.log("Device Friendly Name ID: " + FriendlyNameID);
		}
	
	const BatteryPage = [0x10,0x01];
	BattID = Logitech_FeatureID_Get(BatteryPage);
		if(BattID !== 0)
		{
		device.log("Battery ID: " + BattID);	
		}
	
	const UnifiedBatteryPage = [0x10,0x04];
	 UnifiedBattID = Logitech_FeatureID_Get(UnifiedBatteryPage);
		if(UnifiedBattID !== 0)
		{
		device.log("Unified Battery ID: " + UnifiedBattID);	
		}
	
	const LEDCtrlPage = [0x13,0x00];
	LEDCtrlID = Logitech_FeatureID_Get(LEDCtrlPage);
		if(LEDCtrlID !== 0)
		{
		device.log("Led Control ID: " + LEDCtrlID);
		}
	
	const WirelessStatusPage = [0x1D,0x4B];
	var WirelessStatusID = Logitech_FeatureID_Get(WirelessStatusPage);
		if(WirelessStatusID !== 0)
		{
		device.log("Wireless Status ID: " + WirelessStatusID);
		}
	
	const DPIPage = [0x22,0x01];
	DpiID = Logitech_FeatureID_Get(DPIPage);
		if(DpiID !== 0)
		{
		device.log("DPI ID: " + DpiID);	
		}

	const ChargingControlPage = [0x10,0x10];
	ChargingControlID = Logitech_FeatureID_Get(ChargingControlPage);
		if(ChargingControlID !== 0)
		{
		device.log("Charging Control ID: " + ChargingControlID);	
		}
	
	const PollingRatePage = [0x80,0x60];
	var PollingRateID = Logitech_FeatureID_Get(PollingRatePage);
		if(PollingRateID !== 0)
		{
		device.log("Polling Rate ID: " + PollingRateID);	
		}
	
	const OnboardProfilePage = [0x81,0x00];
	OnboardID = Logitech_FeatureID_Get(OnboardProfilePage);
		if(OnboardID !== 0)
		{
		device.log("Onboard Profiles ID: " + OnboardID);
		}
	
	const ButtonSpyPage = [0x81,0x10];
	ButtonSpyID = Logitech_FeatureID_Get(ButtonSpyPage);
		if(ButtonSpyID !== 0)
		{
		device.log("Button Spy ID: " + ButtonSpyID);
		}
		
	const EncryptionPage = [0x41,0x00]; 
	var EncryptionID = Logitech_FeatureID_Get(EncryptionPage);
		if(EncryptionID !== 0)
		{
		device.log("Encryption ID: " + EncryptionID);
		}

	const KeyboardLayout2Page = [0x45,0x40]; 
	var KeyboardLayout2ID = Logitech_FeatureID_Get(KeyboardLayout2Page);
		if(KeyboardLayout2ID !== 0)
		{
		device.log("Keyboard Layout 2 ID: " + KeyboardLayout2ID);
		}

	const PersistentRemappableActionPage = [0x1b,0xc0]; 
	PersistentRemappableActionID = Logitech_FeatureID_Get(PersistentRemappableActionPage);
		if(PersistentRemappableActionID !== 0)
		{
		device.log("Persistent Remappable Action ID: " + PersistentRemappableActionID);
		}

	const ReprogControlsV4Page = [0x1b,0x04]; 
	var ReprogControlsV4ID = Logitech_FeatureID_Get(ReprogControlsV4Page);
		if(ReprogControlsV4ID !== 0)
		{
		device.log("Reprogram Controls V4 ID: " + ReprogControlsV4ID);
		}

	const DisableKeysPage = [0x45,0x22]; 
	DisableKeysID = Logitech_FeatureID_Get(DisableKeysPage);
		if(DisableKeysID !== 0)
		{
		device.log("Disable Keys ID: " + DisableKeysID);
		}

	const GKeyPage = [0x80,0x10]; 
	GKeyID = Logitech_FeatureID_Get(GKeyPage);
		if(GKeyID !== 0)
		{
		device.log("GKey ID: " + GKeyID);
		}

	const MKeyPage = [0x80,0x20]; 
	MKeyID = Logitech_FeatureID_Get(MKeyPage);
		if(MKeyID !== 0)
		{
		device.log("MKey ID: " + MKeyID);
		}

	const MRPage = [0x80,0x30];
	MRID = Logitech_FeatureID_Get(MRPage);
		if(MRID !== 0)
		{
		device.log("MR ID: " + MRID);
		}

	const BrightnessControlPage = [0x80,0x40]; 
	var BrightnessControlID = Logitech_FeatureID_Get(BrightnessControlPage);
		if(BrightnessControlID !== 0)
		{
		device.log("Brightness Control ID: " + BrightnessControlID);
		}

	const HostsInfoPage = [0x18,0x15]; 
	var HostsInfoID = Logitech_FeatureID_Get(HostsInfoPage);
		if(HostsInfoID !== 0)
		{
		device.log("Hosts Info ID: " + HostsInfoID);
		}

	const ChangeHostsPage = [0x18,0x14]; 
	var ChangeHostsID = Logitech_FeatureID_Get(ChangeHostsPage);
		if(ChangeHostsID !== 0)
		{
		device.log("Change Host ID: " + ChangeHostsID);
		}

	const PerKeyLightingPage = [0x80,0x80];
	var PerKeyLightingID = Logitech_FeatureID_Get(PerKeyLightingPage);
		if(PerKeyLightingID !== 0)
		{
		device.log("PerKeyLightingID: " + PerKeyLightingID);
		}
	
	const PerKeyLightingV2Page = [0x80,0x81];
	var PerKeyLightingV2ID = Logitech_FeatureID_Get(PerKeyLightingV2Page);
	if(PerKeyLightingV2ID !== 0)
	{
	device.log("PerKeyLightingV2ID: " + PerKeyLightingID);
	}
	
	const RGB8070Page = [0x80,0x70];
	RGBFeatureID = Logitech_FeatureID_Get(RGB8070Page);
		if(RGBFeatureID === 0)
		{
		const RGB8071Page = [0x80,0x71];
		RGBFeatureID = Logitech_FeatureID_Get(RGB8071Page);
			if(RGBFeatureID != 0)
			{
			Hero = true;
			device.log("Hero Mouse Found");
			}
		}
		if(RGBFeatureID != 0)
		{
		device.log("RGB Control ID : " + RGBFeatureID);
		}
}

export function Validate(endpoint)
{
    return endpoint.interface === EndpointByte1 && endpoint.usage === LongMessageEndpointByte && endpoint.usage_page === EndpointByte3
     || endpoint.interface === EndpointByte1 && endpoint.usage === ShortMessageEndpointByte && endpoint.usage_page === EndpointByte3;
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

export function Image() {
	return "iVBORw0KGgoAAAANSUhEUgAAA+gAAAH0CAYAAAHZLze7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKN2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDYgNzkuMTY0NjQ4LCAyMDIxLzAxLzEyLTE1OjUyOjI5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMiAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAzLTE5VDE3OjMyOjIxLTA3OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTAzLTE5VDE3OjMyOjIxLTA3OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMy0xOVQxNzozMjoyMS0wNzowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyZGQzNWYxNi1mZjlmLTQ4NDUtYmExNy00MTdjNzc5NjIwNWIiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo4OTg0MmNkYS1lYzEzLTNhNGYtYmY2Yy1hYmQ1MDg2NmYyNjUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpkNzVmMmM2Yy1kNGJhLTcyNGMtYWJkNy1mN2E4OTg0YzRjODQiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmQ3NWYyYzZjLWQ0YmEtNzI0Yy1hYmQ3LWY3YTg5ODRjNGM4NCIgc3RFdnQ6d2hlbj0iMjAyMS0wMy0xOVQxNzozMjoyMS0wNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjIgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoyZGQzNWYxNi1mZjlmLTQ4NDUtYmExNy00MTdjNzc5NjIwNWIiIHN0RXZ0OndoZW49IjIwMjEtMDMtMTlUMTc6MzI6MjEtMDc6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4yIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+MDUwMkMwQUU4NTg1OUYzNTgxREZFQUMzMTYwRkVFNTg8L3JkZjpsaT4gPHJkZjpsaT4zNzZDODVBOEQ2OURCNTIzNUUzMDdFNUVDNzM5MDQ1MjwvcmRmOmxpPiA8cmRmOmxpPjNCQkU1NEIxOUVDRDBDQTZDRTAxQjQ4QUY2M0FEOUNCPC9yZGY6bGk+IDxyZGY6bGk+M0JGMEUzOTMzNjc4QTE1NEExQTQxM0U0NjYwMzAyRDQ8L3JkZjpsaT4gPHJkZjpsaT41ODk3NjlGQTU0RUEzRTk1MEYxOTM3NTE2NEY2MzhENjwvcmRmOmxpPiA8cmRmOmxpPjZDNTA3QjcwM0YzMDQ3REFGMDgyRTZFRjQwNTRBMzk0PC9yZGY6bGk+IDxyZGY6bGk+ODIyQUI1MjA0RTZCRENDNjQxQTk1NUZENjYzOTFBNjY8L3JkZjpsaT4gPHJkZjpsaT5CRjRCQkVEM0I4MTY3Qzc1NDg4ODJCODIyMDdBRTEyQjwvcmRmOmxpPiA8cmRmOmxpPkM3QzdBRjk4NjcyODNBMzIyNEFERUIzQjYxOEEwQUQzPC9yZGY6bGk+IDxyZGY6bGk+REIxRkM0RDREMEI2RjY1OTFFNEEzRjFGQTA0MzYyQzY8L3JkZjpsaT4gPHJkZjpsaT5EREEyMkUxOTdDQTUzMzkyRkNCNEI0MUU2NkY1NUU0RjwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDo3YjlmMmUwYy02YWQwLTYyNGEtYjliNi1hMTFiNzhjZTMwZTU8L3JkZjpsaT4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6ZTUxNDk3ZWItODVhMi1lZTRkLTgxMTQtNjgzODVmZDA4ZDk5PC9yZGY6bGk+IDxyZGY6bGk+eG1wLmRpZDoxZjU2ZGU4My1jM2Y2LTRlZmQtOGNhYy1hMTk3N2RhNTIxMDA8L3JkZjpsaT4gPHJkZjpsaT54bXAuZGlkOjk0OGY3YTliLWExMjQtNDNlZS1hZjNmLTQxNWUzZjFmYzI0NzwvcmRmOmxpPiA8cmRmOmxpPnhtcC5kaWQ6OWM1N2NjYTQtYjgyNC00OGViLTkwMmMtNTQ0OTg2MDJmNGJkPC9yZGY6bGk+IDxyZGY6bGk+eG1wLmRpZDo5ZmZlMGZmYi01NWI1LTQyMTEtYTg2OS01MjExM2JjYTJjOTY8L3JkZjpsaT4gPHJkZjpsaT54bXAuZGlkOmIzNWNlYjM1LWFkODItNDQxYy04ZjQ4LTBjY2MzYmY2OTkwZTwvcmRmOmxpPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PtPDwIYAAcYLSURBVHic7P13kORbdt8H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";
}