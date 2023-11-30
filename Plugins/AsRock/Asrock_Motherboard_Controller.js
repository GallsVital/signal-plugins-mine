export function Name() { return "Asrock Motherboard"; }
export function VendorId() { return   0x26CE; }
export function ProductId() { return  0x01A2; }
export function Documentation(){ return "troubleshooting/asrock"; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [22, 14]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 1.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
Mainboardconfig:readonly
Headerconfig:readonly
RGBconfig:readonly
Zone1Color:readonly
Zone1Mode:readonly
Zone1Speed:readonly
Zone2Color:readonly
Zone2Mode:readonly
Zone2Speed:readonly
Zone3Color:readonly
Zone3Mode:readonly
Zone3Speed:readonly
Zone4Color:readonly
Zone4Mode:readonly
Zone4Speed:readonly
Zone5Color:readonly
Zone5Mode:readonly
Zone5Speed:readonly
Zone6Color:readonly
Zone6Mode:readonly
Zone6Speed:readonly
Zone7Color:readonly
Zone7Mode:readonly
Zone7Speed:readonly
Zone8Color:readonly
Zone8Mode:readonly
Zone8Speed:readonly
ARGBMode:readonly
overrideColor:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},

		{"property":"Mainboardconfig", "group":"lighting", "label":"MainBoard Configuration", "type":"combobox",   "values":["RGB", "RBG", "BGR", "BRG", "GBR", "GRB"], "default":"RGB"},
		{"property":"Headerconfig", "group":"lighting", "label":"12v Header Configuration", "type":"combobox",   "values":["RGB", "RBG", "BGR", "BRG", "GBR", "GRB"], "default":"RGB"},
		{"property":"RGBconfig", "group":"lighting", "label":"ARGB Channel Configuration", "type":"combobox",   "values":["RGB", "RBG", "BGR", "BRG", "GBR", "GRB"], "default":"RGB"},

		{"property":"Zone1Color", "group":"lighting", "label":"12v RGB Header 1 Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"Zone1Mode", "group":"lighting", "label":"12v RGB Header 1 Mode", "type":"combobox",
			"values":["Off", "Static", "Breathing", "Strobe", "Spectrum Cycle", "Wave", "Spring", "Stack", "Cram", "Scan", "Neon", "Water", "Rainbow"], "default":"Static"},
		{"property":"Zone1Speed", "group":"lighting", "label":"12v RGB Header 1 Speed", "type":"number", "min":"0", "max":"255", "default":"80"},

		{"property":"Zone2Color", "group":"lighting", "label":"12v RGB Header 2 Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"Zone2Mode", "group":"lighting", "label":"12v RGB Header 2 Mode", "type":"combobox",
			"values":["Off", "Static", "Breathing", "Strobe", "Spectrum Cycle", "Wave", "Spring", "Stack", "Cram", "Scan", "Neon", "Water", "Rainbow"], "default":"Static"},
		{"property":"Zone2Speed", "group":"lighting", "label":"12v RGB Header 2 Speed", "type":"number", "min":"0", "max":"255", "default":"80"},

		{"property":"Zone3Color", "group":"lighting", "label":"5v ARGB Header 1 Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"Zone3Mode", "group":"lighting", "label":"5v ARGB Header 1 Mode", "type":"combobox",
			"values":["Off", "Static", "Breathing", "Strobe", "Spectrum Cycle", "Wave", "Spring", "Stack", "Cram", "Scan", "Neon", "Water", "Rainbow"], "default":"Static"},
		{"property":"Zone3Speed", "group":"lighting", "label":"5v ARGB Header 2 Speed", "type":"number", "min":"0", "max":"255", "default":"80"},

		{"property":"Zone4Color", "group":"lighting", "label":"5v ARGB Header 2 Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"Zone4Mode", "group":"lighting", "label":"5v ARGB Header 2 Mode", "type":"combobox",
			"values":["Off", "Static", "Breathing", "Strobe", "Spectrum Cycle", "Wave", "Spring", "Stack", "Cram", "Scan", "Neon", "Water", "Rainbow"], "default":"Static"},
		{"property":"Zone4Speed", "group":"lighting", "label":"5v ARGB Header 2 Speed", "type":"number", "min":"0", "max":"255", "default":"80"},

		{"property":"Zone5Color", "group":"lighting", "label":"PCH Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"Zone5Mode", "group":"lighting", "label":"PCH Mode", "type":"combobox",
			"values":["Off", "Static", "Breathing", "Strobe", "Spectrum Cycle", "Wave", "Spring", "Stack", "Cram", "Scan", "Neon", "Water", "Rainbow"], "default":"Static"},
		{"property":"Zone5Speed", "group":"lighting", "label":"IO Speed", "type":"number", "min":"0", "max":"255", "default":"80"},

		{"property":"Zone6Color", "group":"lighting", "label":"IO Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"Zone6Mode", "group":"lighting", "label":"IO Mode", "type":"combobox",
			"values":["Off", "Static", "Breathing", "Strobe", "Spectrum Cycle", "Wave", "Spring", "Stack", "Cram", "Scan", "Neon", "Water", "Rainbow"], "default":"Static"},
		{"property":"Zone6Speed", "group":"lighting", "label":"IO Speed", "type":"number", "min":"0", "max":"255", "default":"80"},

		{"property":"Zone7Color", "group":"lighting", "label":"PCB Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"Zone7Mode", "group":"lighting", "label":"PCB Mode", "type":"combobox",
			"values":["Off", "Static", "Breathing", "Strobe", "Spectrum Cycle", "Wave", "Spring", "Stack", "Cram", "Scan", "Neon", "Water", "Rainbow"], "default":"Static"},
		{"property":"Zone7Speed", "group":"lighting", "label":"PCB Speed", "type":"number", "min":"0", "max":"255", "default":"80"},

		{"property":"Zone8Color", "group":"lighting", "label":"Audio Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"Zone8Mode", "group":"lighting", "label":"Audio Mode", "type":"combobox",
			"values":["Off", "Static", "Breathing", "Strobe", "Spectrum Cycle", "Wave", "Spring", "Stack", "Cram", "Scan", "Neon", "Water", "Rainbow"], "default":"Static"},
		{"property":"Zone8Speed", "group":"lighting", "label":"Audio Speed", "type":"number", "min":"0", "max":"255", "default":"80"},

		{"property":"ARGBMode", "group":"", "label":"SignalRGB Canvas Support", "type":"boolean", "default": "true"},
	];
}

const vARGBLedNames = [ ];
/** @type {LedPosition[]} */
const vARGBLedPositions = [ ];
const RGBConfigs = {
	"RGB" : [0, 1, 2],
	"RBG" : [0, 2, 1],
	"BGR" : [2, 1, 0],
	"BRG" : [2, 0, 1],
	"GBR" : [1, 2, 0],
	"GRB" : [1, 0, 2]
};

export function SubdeviceController(){ return true; }

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	ClearBuffer();
	device.setName(`Asrock ${device.getMotherboardName()}`);

	if(ARGBMode === true) {
		device.setControllableLeds(vARGBLedNames, vARGBLedPositions);
		LEDConfig();
		CreateARGBHeaders();
		CreateRGBHeaders();
		CreateIOShieldZone();
		CreatePCBZone();
		CreatePCHZone();
	} else {

		device.setControllableLeds(vLedNames, vLedPositions);
		ReadConfig(1);

		const LedCounts = ReadConfig(2).slice(5, 13);

		for(let zone = 0; zone < 8; zone++){
			Zoneconfig[zone].LedCount = LedCounts[zone];

			if(LedCounts[zone] === 0x1E){
				Zoneconfig[zone].Enabled = false;
			}
		}

		for(let ZoneId = 0; ZoneId < 8;ZoneId++){
			const config = ReadZone(ZoneId);
			Zoneconfig[ZoneId].Mode = config[0];
			Zoneconfig[ZoneId].Speed = 0xFF - config[4];
			Zoneconfig[ZoneId].Color = HexToRGB(config[1], config[2], config[3]);

		}
	}
}

export function Render() {
	if(modeSwitch === false) {
		if(ARGBMode === true) {
			SendRGB();
		} else {
			const SettingArray = [
				[Zone1Color, Zone1Mode, Zone1Speed],
				[Zone2Color, Zone2Mode, Zone2Speed],
				[Zone3Color, Zone3Mode, Zone3Speed],
				[Zone4Color, Zone4Mode, Zone4Speed],
				[Zone5Color, Zone5Mode, Zone5Speed],
				[Zone6Color, Zone6Mode, Zone6Speed],
				[Zone7Color, Zone7Mode, Zone7Speed],
				[Zone8Color, Zone8Mode, Zone8Speed],
			];

			for(let zone = 0; zone < SettingArray.length;zone++){
				let dirtyZone = false;
				const SelectedZone = Zoneconfig[zone];

				if(SelectedZone.Color != SettingArray[zone][0]){
					device.log(`Setting Zone ${zone} color from ${SelectedZone.Color} to ${SettingArray[zone][0]}`);
					SelectedZone.Color = SettingArray[zone][0];
					dirtyZone = true;
				}

				if(SelectedZone.Mode != ModeDict[SettingArray[zone][1]]){
					device.log(`Setting Zone ${zone} mode from ${SelectedZone.Mode} to ${SettingArray[zone][1]}`);
					SelectedZone.Mode = ModeDict[SettingArray[zone][1]];
					dirtyZone = true;
				}

				if(SelectedZone.Speed != SettingArray[zone][2]){
					device.log(`Setting Zone ${SelectedZone.Name}'s' speed from ${SelectedZone.Speed} to ${SettingArray[zone][2]}`);
					SelectedZone.Speed = SettingArray[zone][2];
					dirtyZone = true;
				}

				if(SelectedZone.Enabled && dirtyZone){
					SetZone(SelectedZone);
				}
			}

			device.pause(3000);
		}
	} else {
		modeSwitch = false;
	}
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		if(modeSwitch === false) {
			if(ARGBMode === true) {
				SendRGB("#000000");
			} else {
				for(let zone = 0; zone < 8;zone++){
					SetZone(zone, overrideColor);
				}

				device.pause(3000);
			}
		} else {
			modeSwitch = false;
		}

	}else{
		if(modeSwitch === false) {
			if(ARGBMode === true) {
				SendRGB(shutdownColor);
			} else {
				for(let zone = 0; zone < 8;zone++){
					SetZone(zone, overrideColor);
				}

				device.pause(3000);
			}
		} else {
			modeSwitch = false;
		}
	}

}

const ModeDict =
{
	"Static" : 1,
	"Breathing" : 2,
	"Strobe" : 3,
	"Spectrum Cycle" : 4,
	"Wave" : 7,
	"Spring" : 8,
	"Stack" : 9,
	"Cram" : 10,
	"Scan" : 11,
	"Neon" : 12,
	"Water" : 13,
	"Rainbow" : 14,
};

function Zone(name, enabled, ledCount, color, mode, index, speed){
	this.Name = name;
	this.Enabled = enabled;
	this.LedCount = ledCount;
	this.Color = color;
	this.Mode = mode;
	this.index = index;
	this.Speed = speed;
}

const Zoneconfig = [
	new Zone("12v RGB 1", true, 0, "#000000", 1, 0, 0xFF ),
	new Zone("12v RGB 2", true, 0, "#000000", 1, 1, 0xFF ),
	new Zone("5v ARGB 1", true, 0, "#000000", 1, 2, 0xFF ),
	new Zone("5v ARGB 2", true, 0, "#000000", 1, 3, 0xFF ),
	new Zone("PCH", true, 0, "#000000", 1, 4, 0xFF ),
	new Zone("IO", true, 0, "#000000", 1, 5, 0xFF ),
	new Zone("PCB", true, 0, "#000000", 1, 6, 0xFF ),
	new Zone("Audio", true, 0, "#000000", 1, 7, 0xFF ),
];

const vLedNames = [ "PCH", "IO cover", "PCB", "ARGB Header 1", "ARGB Header 2" ];
const vLedPositions = [ [2, 0], [3, 0], [4, 0], [0, 0], [1, 0] ];

function HexToRGB(r, g, b) {
	return "#" + HexToRGBHelper(r) + HexToRGBHelper(g) + HexToRGBHelper(b);
}

function HexToRGBHelper(hex) {
	const value = hex.toString(16);

	return value.length == 1 ? "0" + value : value;
}

function ReadConfig(ConfigId) {
	let packet = [0x00, 0x14, 0x00, ConfigId];
	device.write(packet, 65);
	packet = device.read(packet, 64);

	return packet;
}

function ReadZone(ZoneId) {
	let packet = [0x00, 0x11, 0x00, ZoneId];
	device.write(packet, 65);
	packet = device.read(packet, 64);

	return packet.slice(5, 10);
}

function SetZone(zone, overrideColor) {
	let packet = [];

	if (overrideColor){
		const colors = hexToRgb(overrideColor);
		packet = [0x00, 0x10, 0x00, zone.index, zone.Mode, colors[0], colors[1], colors[2], 0xFF - zone.Speed, 0xFF, 0x00];
	}else{
		const colors = hexToRgb(zone.Color);
		packet = [0x00, 0x10, 0x00, zone.index, zone.Mode, colors[0], colors[1], colors[2], 0xFF - zone.Speed, 0xFF, 0x00];
	}

	device.write(packet, 65);
	device.read(packet, 64);
}

//ARGB SECTION ----------------------------------------------------------------------

function ClearBuffer() {
	while(device.getLastReadSize() > 0) {
		device.read([0x00], 64);
	}
}

const vPCHLEDs =
[
	"Razer Chroma Logo LED 1",
	"Razer Chroma Logo LED 2",
	"Razer Chroma Logo LED 3",
	"Razer Chroma Logo LED 4",
	"Razer Chroma Logo LED 5",
	"Razer Chroma Logo LED 6",
	"Razer Chroma Logo LED 7",
	"Razer Chroma Logo LED 8",
	"Razer Chroma Logo LED 9",
	"Razer Chroma Logo LED 10",
	"Razer Chroma Logo LED 11",
	"Razer Chroma Logo LED 12",
	"Razer Chroma Logo LED 13",
	"Razer Chroma Logo LED 14",
	"Razer Chroma Logo LED 15",
	"Razer Chroma Logo LED 16",
	"Razer Chroma Logo LED 17",
	"Razer Chroma Logo LED 18",
	"Razer Chroma Logo LED 19",
	"Chroma Logo Strip Right LED 1",
	"Chroma Logo Strip Right LED 2",
	"Chroma Logo Strip Right LED 3",
	"Chroma Logo Strip Right LED 4",
	"Chroma Logo Strip Bottom LED 1",
	"Chroma Logo Strip Bottom LED 2",
	"Chroma Logo Strip Bottom LED 3",
	"Chroma Logo Strip Bottom LED 4",
	"Chroma Logo Strip Bottom LED 5",
	"Chroma Logo Strip Left LED 1",
	"Chroma Logo Strip Left LED 2",
	"Chroma Logo Strip Left LED 3",
	"Chroma Logo Strip Left LED 4",
	"Chroma Logo Strip Left LED 5",
	"Chroma Logo Strip Left LED 6",
	"Chroma Logo Strip Left LED 7",
	"Chroma Logo Strip Left LED 8",
	"Chroma Logo Strip Top Left LED 1",
	"Chroma Logo Strip Top Left LED 2",
	"Chroma Logo Strip Top Left LED 3",
	"Chroma Logo Strip Top Left LED 4",
	"Chroma Logo Strip Top Left LED 5",
	"Chroma Logo Strip Top LED 1",
	"Chroma Logo Strip Top LED 2",
	"Chroma Logo Strip Top LED 3",
	"Chroma Logo Strip Top LED 4",
	"Chroma Logo Strip Top LED 5",
	"Chroma Logo Strip Top LED 6",
];
const vIOShieldLEDs =
[
	"IOShield LED 1",
	"IOShield LED 2",
	"IOShield LED 3",
	"IOShield LED 4",
	"IOShield LED 5",
	"IOShield LED 6",
	"IOShield LED 7",
];

const vPCBLEDs =
[
	"Underglow LED 1",
	"Underglow LED 2",
	"Underglow LED 3",
	"Underglow LED 4",
	"Underglow LED 5",
	"Underglow LED 6",
	"Underglow LED 7",
	"Underglow LED 8",
	"Underglow LED 9",
	"Underglow LED 10",
	"UnderGlow LED 11",
	"UnderGlow LED 12",
	"UnderGlow LED 13",
	"UnderGlow LED 14",
	"UnderGlow LED 15",
];

const vPCHPositions =
[
	[3, 1],
	[3, 2],
	[3, 1],
	[3, 1],
	[4, 1],
	[4, 1],
	[4, 1],
	[3, 1],
	[3, 1],
	[3, 1],
	[2, 0],
	[2, 0],
	[2, 0],
	[2, 0],
	[2, 0],
	[2, 0],
	[2, 0],
	[2, 0],
	[2, 0],
	[4, 0],
	[4, 1],
	[4, 2],
	[3, 2],
	[3, 2],
	[2, 2],
	[2, 2],
	[1, 2],
	[1, 2],
	[1, 1],
	[1, 1],
	[1, 0],
	[1, 0],
	[1, 0],
	[0, 0],
	[0, 0],
	[0, 0],
	[0, 0],
	[1, 0],
	[1, 0],
	[1, 1],
	[1, 1],
	[2, 2],
	[2, 2],
	[2, 2],
	[3, 2],
	[3, 2],
	[3, 2],
];

const vIOShieldPositions =
[
	[0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [2, 5],
];

const vPCBPositions =
[
	[0, 1], [0, 2], [0, 3], [0, 3], [0, 4], [0, 5], [0, 6], [0, 6], [0, 7], [0, 8], [0, 9], [0, 9], [0, 10], [0, 11], [0, 11]
];

let modeSwitch = false;

export function onARGBModeChanged() {
	device.pause(1000);
	modeSwitch = true;
	Initialize();
}

const DeviceMaxLedLimit = 240;

//Channel Name, Led Limit
const ChannelArray =
[
	["Channel 1", 80],
	["Channel 2", 80],
	["Channel 3", 80]
];

const HeaderArray =
[
	"12v RGB Header 1",
	"12v RGB Header 2"
];

const ConfigurationOverrides = //Leave this here for now. Just in case
{
	"X570 Taichi Razer Edition":
    {
    	RGBHeader1  : 1,
    	RGBHeader2  : 1,
    	ARGBHeader1 : 80,
    	ARGBHeader2 : 80,
    	PCH         : 30,
    	IOShield    : 7,
    	PCB         : 12,
    	ARGBHeader3 : 0
    },
	"B650M Pro RS WiFi":
    {
    	RGBHeader1  : 1,
    	RGBHeader2  : 0,
    	ARGBHeader1 : 80,
    	ARGBHeader2 : 80,
    	PCH         : 0,
    	IOShield    : 0,
    	PCB         : 3,
    	ARGBHeader3 : 80
    },
};

const deviceZones =
{
	RGBHeader1  : 0,
	RGBHeader2  : 0,
	ARGBHeader1 : 0,
	ARGBHeader2 : 0,
	PCH			: 0,
	IOShield	: 0,
	PCB			: 0,
	ARGBHeader3 : 0
};

function LEDConfig() {
	const zoneLEDCounts = ReadConfig(2);
	device.log(`Device LED Counts: ${zoneLEDCounts}`, {toFile : true});

	device.write([0x00, 0x14, 0x00, 0x01], 65);

	const returnPacket = device.read([0x00], 65);
	const comparisonValue = returnPacket[5];

	if(device.getMotherboardName() in ConfigurationOverrides) {
		device.log(`Using magic of Tables for this mobo. MSI would be proud.`);

		const moboName = device.getMotherboardName();

		deviceZones[0] = ConfigurationOverrides[moboName]["RGBHeader1"];
		deviceZones[1] = ConfigurationOverrides[moboName]["RGBHeader2"];
		deviceZones[2] = ConfigurationOverrides[moboName]["ARGBHeader1"];
		deviceZones[3] = ConfigurationOverrides[moboName]["ARGBHeader2"];
		deviceZones[4] = ConfigurationOverrides[moboName]["PCH"];
		deviceZones[5] = ConfigurationOverrides[moboName]["IOShield"];
		deviceZones[6] = ConfigurationOverrides[moboName]["PCB"];
		deviceZones[7] = ConfigurationOverrides[moboName]["ARGBHeader3"];

		return;
	}

	for(let zone = 0; zone < 8; zone++) {
		const disabledZone = isZoneDisabled(comparisonValue, zone);

		if(!disabledZone) {
			if(zoneLEDCounts[5 + zone] !== 30) {
				deviceZones[zone] = zoneLEDCounts[5 + zone];
			}
		}
	}
}

function isZoneDisabled(value, bitIndex){
	return !((value >> bitIndex) & 1);
}

function SetupChannels(deviceChannels) {
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < device.getChannelNames().length; i++){
		device.removeChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}

	for(let i = 0; i < deviceChannels; i++){
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

let RGBHeaders = 0;
let ARGBHeaders = 0;

function CreateARGBHeaders() {
	ARGBHeaders = 0; //Let's not have 20 ARGB Headers lol.

	if(deviceZones[2] > 1) {
		ARGBHeaders++;
	}

	if(deviceZones[3] > 1) {
		ARGBHeaders++;
	}

	if(deviceZones[7] > 30) {
		ARGBHeaders++;
	}

	device.log("Device has " + ARGBHeaders + " ARGB headers.");
	SetupChannels(ARGBHeaders);
}

function CreateRGBHeaders() {
	RGBHeaders = 0;

	for(let header = 0; header < 2;header++) {
		device.removeSubdevice(HeaderArray[header]);
	}

	if(deviceZones[0] === 1) {
		device.createSubdevice(HeaderArray[0]);

		device.setSubdeviceName(HeaderArray[0], `${"Asrock RGB Controller"} - ${HeaderArray[0]}`);

		device.setSubdeviceSize(HeaderArray[0], 3, 3);
		RGBHeaders = 1;
	}

	if(deviceZones[1] === 1) {
		device.createSubdevice(HeaderArray[1]);

		device.setSubdeviceName(HeaderArray[1], `${"Asrock RGB Controller"} - ${HeaderArray[1]}`);

		device.setSubdeviceSize(HeaderArray[1], 3, 3);
		RGBHeaders = 2;
	}

}

function CreatePCHZone() {

	const PCHLEDs = vPCHLEDs.slice(0, deviceZones[4]);
	const PCHPositions = vPCHPositions.slice(0, deviceZones[4]);
	device.log("PCH Length New Scheme:" + PCHLEDs.length);

	if(deviceZones[4] > 0) {
		device.createSubdevice("PCH");

		device.setSubdeviceName("PCH", `${"Asrock RGB Controller"} - ${"PCH"}`);

		device.setSubdeviceSize("PCH", 5, 5);

		device.setSubdeviceLeds("PCH", PCHLEDs, PCHPositions);
	}
}

function CreateIOShieldZone() {
	const IOShieldLEDs = vIOShieldLEDs.slice(0, deviceZones[5]);
	const IOShieldPositions = vIOShieldPositions.slice(0, deviceZones[5]);
	device.log("IOShield Length New Scheme:" + IOShieldLEDs.length);

	if(deviceZones[5] > 0) {
		device.createSubdevice("IO Shield");

		device.setSubdeviceName("IO Shield", `${"Asrock RGB Controller"} - ${"IO Shield"}`);

		device.setSubdeviceSize("IO Shield", 6, 6);

		device.setSubdeviceLeds("IO Shield", IOShieldLEDs, IOShieldPositions);
	}
}

function CreatePCBZone() {
	const PCBLEDs = vPCBLEDs.slice(0, deviceZones[6]);
	const PCBPositions = vPCBPositions.slice(0, deviceZones[6]);
	device.log("PCB Length New Scheme:" + PCBLEDs.length);

	if(deviceZones[6] > 0) {
		device.createSubdevice("PCB");

		device.setSubdeviceName("PCB", `${"Asrock RGB Controller"} - ${"PCB"}`);

		device.setSubdeviceSize("PCB", 2, 13);

		device.setSubdeviceLeds("PCB", PCBLEDs, PCBPositions);
	}
}

function grabRGBHeaderData(overrideColor) {
	const RGBHeaderData = [];

	for(let iIdx = 0; iIdx < RGBHeaders; iIdx++) {
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.subdeviceColor(HeaderArray[iIdx], 1, 1);
		}
		const iLedIdx = (iIdx*3);
		RGBHeaderData[iLedIdx] = col[RGBConfigs[Headerconfig][0]];
		RGBHeaderData[iLedIdx+1] = col[RGBConfigs[Headerconfig][1]];
		RGBHeaderData[iLedIdx+2] = col[RGBConfigs[Headerconfig][2]];
	}

	return RGBHeaderData;
}

function grabMoboData(overrideColor) {
	const MoboRGBData = [];

	const PCHData = [];
	const IOShieldData = [];
	const PCBData = [];

	for(let iIdx = 0; iIdx < deviceZones[4]; iIdx++) {
		const iPxX = vPCHPositions[iIdx][0];
		const iPxY = vPCHPositions[iIdx][1];
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.subdeviceColor("PCH", iPxX, iPxY);
		}
		const iLedIdx = (iIdx*3);
		PCHData[iLedIdx] = col[RGBConfigs[Mainboardconfig][0]];;
		PCHData[iLedIdx+1] = col[RGBConfigs[Mainboardconfig][1]];;
		PCHData[iLedIdx+2] = col[RGBConfigs[Mainboardconfig][2]];;
	}

	for(let iIdx = 0; iIdx < deviceZones[5]; iIdx++) {
		const iPxX = vIOShieldPositions[iIdx][0];
		const iPxY = vIOShieldPositions[iIdx][1];
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.subdeviceColor("IO Shield", iPxX, iPxY);
		}
		const iLedIdx = (iIdx*3);
		IOShieldData[iLedIdx] = col[RGBConfigs[Mainboardconfig][0]];;
		IOShieldData[iLedIdx+1] = col[RGBConfigs[Mainboardconfig][1]];;
		IOShieldData[iLedIdx+2] = col[RGBConfigs[Mainboardconfig][2]];;
	}

	for(let iIdx = 0; iIdx < deviceZones[6]; iIdx++) {
		const iPxX = vPCBPositions[iIdx][0];
		const iPxY = vPCBPositions[iIdx][1];
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.subdeviceColor("PCB", iPxX, iPxY);
		}
		const iLedIdx = (iIdx*3);
		PCBData[iLedIdx] = col[RGBConfigs[Mainboardconfig][0]];;
		PCBData[iLedIdx+1] = col[RGBConfigs[Mainboardconfig][1]];;
		PCBData[iLedIdx+2] = col[RGBConfigs[Mainboardconfig][2]];;
	}

	MoboRGBData.push(...PCHData);
	MoboRGBData.push(...IOShieldData);
	MoboRGBData.push(...PCBData);

	return MoboRGBData;
}

function grabRGBData(Channel, overrideColor) {
	let ChannelLedCount = device.channel(ChannelArray[Channel][0]).LedCount();
	const componentChannel = device.channel(ChannelArray[Channel][0]);
	let RGBData = [];

	if (overrideColor) {
		RGBData = device.createColorArray(overrideColor, ChannelLedCount, "Inline", RGBconfig);

	} else if(LightingMode === "Forced") {
		RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline", RGBconfig);

	} else if(componentChannel.shouldPulseColors()) {
		ChannelLedCount = 80;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0]);
		RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline", RGBconfig);

	} else {
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline", RGBconfig);
	}

	return RGBData.concat(new Array(240 - RGBData.length).fill(0));
}

function concatRGBData(overrideColor) {
	const RGBData = [];
	const MoboRGBData = grabMoboData(overrideColor);
	const RGBHeaderData = grabRGBHeaderData(overrideColor);
	const Header1RGBData = grabRGBData(0, overrideColor);


	//Properly Order Everything. RGBHeaders, Headers 1 and 2, Mobo, Header 3.

	RGBData.push(...RGBHeaderData);
	RGBData.push(...Header1RGBData);

	if(ARGBHeaders > 1) {
		const Header2RGBData = grabRGBData(1, overrideColor);
		RGBData.push(...Header2RGBData);
	} else {
		const Header2RGBData = new Array(240);
		RGBData.push(...Header2RGBData);
	}

	RGBData.push(...MoboRGBData);

	if(ARGBHeaders > 2) {
		const header3RGBData = grabRGBData(2, overrideColor);
		RGBData.push(...header3RGBData);
	}

	return RGBData;
}

function SendRGB(overrideColor) {
	// packet[64] = 0xf0; //this is seemingly arbitrary. No idea what it does, did not change depending on the data in the packet. Every packet had it. B550 had 0x64 or 0x65, and the Z690 was 0xf0.
	const RGBData = concatRGBData(overrideColor);

	//const initpacket = [0x00, 0x10, 0x00, 0xff, 0xE3, 0x00, 0x00, (TotalDeviceLEDs & 0xff), (TotalDeviceLEDs >> 8 & 0xff)];
	const initpacket = [0x00, 0x10, 0x00, 0xff, 0xE3, 0x00, 0x00, 0x2f, 0x01];
	initpacket.push(...RGBData.splice(0, 54));
	device.write(initpacket, 65);

	for(let packetsSent = 0; packetsSent < 15; packetsSent++) //I'm still not a fan of hardcoding things, but this works on all of the boards.
	{
		const packet = [0x00, 0x10, 0x00, 0xff, 0xE4];
		packet.push(...RGBData.splice(0, 57));
		device.write(packet, 65);
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

export function Validate(endpoint) {
	return endpoint.interface === -1 || endpoint.interface === 0;

}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/asrock/motherboards/motherboard.png";
}
