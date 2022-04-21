
export function Name() { return DeviceName; }
export function VendorId() { return  0x048D; }
export function ProductId() { return 0x5702;}//0x5702
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [10, 10]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 8.0;}
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas", "tooltip":"This toggles the device between displaying its canvas position, or being locked to its Forced Color"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"Mainboardconfig", "label":"MainBoard Configuration", "type":"combobox",   "values":["RGB", "RBG", "BGR", "BRG", "GBR", "GRB"], "default":"BGR"},
		{"property":"Headerconfig", "label":"12v Header Configuration", "type":"combobox",   "values":["RGB", "RBG", "BGR", "BRG", "GBR", "GRB"], "default":"RGB"},		{"property":"RGBconfig", "label":"ARGB Channel Configuration", "type":"combobox",   "values":["RGB", "RBG", "BGR", "BRG", "GBR", "GRB"], "default":"GRB"},
		{"property":"ForceAllZonesActive", "label":"Force Enable All Zones", "type":"boolean",  "default":"0"},
	];
}

export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
export function SupportsSubdevices(){ return true; }
export function Validate(endpoint) {
	return endpoint.interface === -1 && endpoint.usage === 0x00CC;
}
let DeviceName = "GIGABYTE Motherboard LED Controller";

const ParentDeviceName = "Gigabyte Motherboard";
let D_LED1_Count = 0;
let D_LED2_Count = 0;
let CurrentLedCount;
let vLedNames = [];
let vLedPositions = [];
let ActiveZones = [];

const DeviceMaxLedLimit = 240;
const DevicePerChannelLedLimit = 120;

//Channel Name, Led Limit
let ChannelArray = [];

function SetupChannels(){
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++){
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

function MainboardConfiguration(){
	return Mainboardconfig;
}

function HeaderConfiguration(){
	return Headerconfig;
}

// let TotalZones = [
// 	0x20,
// 	0x21,
// 	0x22,
// 	0x23,
// 	0x24,
// 	0x25,
// 	0x26,
// 	0x27,
// 	0x28, //Dled1
// 	0x29, //Dled2
// ];

// let RGBHeaders = [
// 	0x21, //RGB Header Bottom "LED_C1"
// 	0x24, // RGB Header Top "LED_C2"
// ];

let vDLED_Zones = [];

const MotherboardConfigs = {
	'Auto': {
		ARGB:{
			"5v ARGB Header 1": 0x58,
			"5v ARGB Header 2": 0x59,
		},
		Mainboard:{
			0x20: ["Led 1", MainboardConfiguration],
			0x21: ["12v Header 1", HeaderConfiguration],
			0x22: ["Led 2", MainboardConfiguration],
			0x23: ["Led 3", MainboardConfiguration],
			0x24: ["12v Header 2", HeaderConfiguration],
			0x25: ["Led 4", MainboardConfiguration],
			0x26: ["Led 5", MainboardConfiguration],
			0x27: ["Led 6", MainboardConfiguration],
		}
	},

	"B550 AORUS ELITE": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
			"5v ARGB Header 2": 0x59,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["12v Header Bottom", HeaderConfiguration],
			0x23: ["PCIe", MainboardConfiguration],
			0x24: ["12V Header Top", HeaderConfiguration]
		}
	},
	"B550 AORUS PRO": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
			"5v ARGB Header 2": 0x59,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["12v Header Bottom", HeaderConfiguration],
			0x23: ["PCIe", MainboardConfiguration],
			0x24: ["12V Header Top", HeaderConfiguration]
		}
	},
	"X570 AORUS ELITE": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
			"5v ARGB Header 2": 0x59,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["12v Header Bottom", HeaderConfiguration],
			0x23: ["PCIe", MainboardConfiguration],
			0x24: ["12V Header Top", HeaderConfiguration]
		}
	},
	"X570 AORUS ELITE WIFI": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
			"5v ARGB Header 2": 0x59,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["12v Header Bottom", HeaderConfiguration],
			0x23: ["PCIe", MainboardConfiguration],
			0x24: ["12V Header Top", HeaderConfiguration]
		}
	},
	"X570 AORUS PRO WIFI": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
			"5v ARGB Header 2": 0x59,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["12v Header Bottom", HeaderConfiguration],
			0x23: ["PCIe", MainboardConfiguration],
			0x24: ["12V Header Top", HeaderConfiguration]
		}
	},
	"X570 AORUS ULTRA": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
			"5v ARGB Header 2": 0x59,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["12v Header Bottom", HeaderConfiguration],
			0x23: ["PCIe", MainboardConfiguration],
			0x24: ["12V Header Top", HeaderConfiguration]
		}
	},
	"Z390 AORUS PRO-CF": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["Ram Slots/XPM Logo", MainboardConfiguration],
			0x22: ["South Bridge", MainboardConfiguration],
			0x23: ["PCIe", MainboardConfiguration],
			0x24: ["12V Header C1/C2", HeaderConfiguration]
		}
	},
	"Z390 AORUS MASTER-CF": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["Ram Slots/XPM Logo", MainboardConfiguration],
			0x22: ["South Bridge", MainboardConfiguration],
			0x23: ["PCIe", MainboardConfiguration],
			0x24: ["12V Header C1/C2", HeaderConfiguration]
		}
	},
	"Z690 AORUS MASTER": {
		ARGB:{
			"5v ARGB Header 1": 0x58,
			"5v ARGB Header 2": 0x59,
		},
		Mainboard:{
			0x20: ["Back IO", MainboardConfiguration],
			0x21: ["12 Header 1", HeaderConfiguration],
			0x22: ["Back IO 2", MainboardConfiguration],
			0x23: ["South Bridge", MainboardConfiguration],
			0x24: ["12V Header 2", HeaderConfiguration]
		}
	},
};

function CreateZone(ZoneId, ZoneName, ZoneConfig){
	//"Ch1 | Port 1"
	device.createSubdevice(ZoneName);
	// Parent Device + Sub device Name + Ports
	device.setSubdeviceName(ZoneName, `${ParentDeviceName} - ${ZoneName}`);
	device.setSubdeviceImage(ZoneName, "");
	device.setSubdeviceSize(ZoneName, 3, 3);
	device.setSubdeviceLeds(ZoneName, ["Led 1"], [[1, 1]]);
	ActiveZones.push({id:ZoneId, name:ZoneName, config: ZoneConfig});
}

function InitializeZones(){
	let MotherboardName = device.getMotherboardName();
	let configuration = MotherboardConfigs['Auto'];

	// Blow away current zones
	for(let i = 0; i < ActiveZones.length;i++){
		device.removeSubdevice(ActiveZones[i].name);
	}

	ActiveZones = [];

	if(!ForceAllZonesActive && MotherboardName in MotherboardConfigs ){
		configuration = MotherboardConfigs[MotherboardName];
	}

	for(const zone in configuration.Mainboard){
		device.log(`Adding zone [${configuration.Mainboard[zone][0]}], Id: ${zone}`);
		CreateZone(zone, ...configuration.Mainboard[zone]);
	}

	for(const header in configuration.ARGB){
		device.log(`Adding ARGB Header [${header}], Id: ${configuration.ARGB[header]}`);
		ChannelArray.push([header, DevicePerChannelLedLimit]);
		vDLED_Zones.push(configuration.ARGB[header]);
	}
}


export function Initialize() {
	SetMotherboardName();

	RequestConfig();

	SetDirectHeaderMode();

	InitializeZones();

	SetupChannels();

	device.pause(30);
}

export function onForceAllZonesActiveChanged(){
	InitializeZones();
}

export function Render() {
	UpdateActiveZones();

	for(let channel = 0; channel < vDLED_Zones.length; channel++){
		UpdateARGBChannels(channel);
	}
}


export function Shutdown() {

}

function UpdateActiveZones(){

	for(let iIdx = 0 ; iIdx < ActiveZones.length; iIdx++){
		let zone = ActiveZones[iIdx];
		let col;

		if (LightingMode  === "Forced") {
			col = hexToRgb(forcedColor);
		}else{
			col = device.subdeviceColor(zone.name, 1, 1);
		}

		//Data for my B550 Aorus Elite V1 is BGR?
		sendColorPacket(zone.id, [
			col[RGBConfigs[zone.config()][0]],
			col[RGBConfigs[zone.config()][1]],
			col[RGBConfigs[zone.config()][2]]]);
		sendCommit();

	}
}

const GIGABYTE_COMMAND = 0xCC;

const GIGABYTE_COMMAND_COMMIT = 0x28;
const GIGABYTE_COMMAND_SOFTWAREMODE = 0x32;
const GIGABYTE_COMMAND_ARGBLEDCOUNTS = 0x34;
const GIGABYTE_COMMAND_CONFIGTABLE = 0x60;

const GIGABYTE_COMMIT_VALUE = 0xFF;

const RGBConfigs = {
	"RGB" : [0, 1, 2],
	"RBG" : [0, 2, 1],
	"BGR" : [2, 1, 0],
	"BRG" : [2, 0, 1],
	"GBR" : [1, 2, 0],
	"GRB" : [1, 0, 2]
};
const Led_Count_32 = 0;
const Led_Count_64 = 1;
const Led_Count_256 = 2;
const Led_Count_512 = 3;
const Led_Count_1024 = 4;

function Get_Led_Def(count){

	if(count <= 32){
		return Led_Count_32;
	} else if(count <= 64){
		return Led_Count_64;
	} else if(count <= 256){
		return Led_Count_256;
	} else if(count <= 512){
		return Led_Count_512;
	} else if(count <= 1024){
		return Led_Count_1024;
	}
}


function SetDirectHeaderMode(){

	let packet = [GIGABYTE_COMMAND, GIGABYTE_COMMAND_SOFTWAREMODE, 1 | 2]; // ARGB Header idx
	device.send_report(packet, 64);

}

function SetMotherboardName(){
	let MotherboardName = device.getMotherboardName();

	if(MotherboardName !== "Unknown"){
		DeviceName = `Gigabyte ${MotherboardName} Controller`;
		device.repollName();
	}
}


function UpdateARGBChannels(Channel, shutdown = false) {
	let ChannelLedCount = device.channel(ChannelArray[Channel][0]).LedCount();

	if(device.getLedCount() !== CurrentLedCount){
		CurrentLedCount = device.getLedCount();
		SetLedCounts();
	}
	let RGBData = [];

	if(LightingMode  === "Forced"){
		RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline", RGBconfig);

	}else if(device.getLedCount() === 0){
		ChannelLedCount = 40;

		let pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0], ChannelLedCount);
		RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline", RGBconfig);

	}else{
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline", RGBconfig);
	}

	StreamDirectColors(RGBData, ChannelLedCount, vDLED_Zones[Channel]);

}

function StreamDirectColors(RGBData, LedCount, ChannelIdx){
	let ledsSent = 0;
	const Packet_Max_LED_Count = 19;

	while(LedCount > 0){
		let ledsToSend = Math.min(Packet_Max_LED_Count, LedCount);
		LedCount -= ledsToSend;
		sendDirectPacket(ChannelIdx, ledsSent*3, ledsToSend*3, RGBData.splice(0, ledsToSend*3));
		ledsSent += ledsToSend;
	}
}

function SetLedCounts(){

	//Set Led Counts for ARGB headers
	let Channel1Leds = device.channel(ChannelArray[0][0]).LedCount();
	let Channel2Leds = device.channel(ChannelArray[1][0]).LedCount();

	let LedMask = (Get_Led_Def(Channel1Leds) | Get_Led_Def(Channel2Leds) << 4);
	let packet = [GIGABYTE_COMMAND, GIGABYTE_COMMAND_ARGBLEDCOUNTS, LedMask];

	device.send_report(packet, 64);
}


function sendDirectPacket(channel, start, count, data){
	let packet = [];
	packet[0] = GIGABYTE_COMMAND;
	packet[1] = channel;
	packet[2] = start & 0xFF;
	packet[3] = (start >> 8);
	packet[4] = count;
	packet = packet.concat(data);

	device.send_report(packet, 64);
}

function sendColorPacket(zone, data){
	let Mode = 1; //Static mode

	let packet = [];

	packet[0x00] = GIGABYTE_COMMAND;
	packet[0x01] = zone;
	packet[0x02] = 2 ** Math.abs((0x20 - zone));
	packet[0x03] = 0;
	packet[0x04] = 0;
	packet[0x0B] = Mode;
	packet[0x0C] = 0x5A; //We Always hardcode brightness to Max in plugins, its handled in the backend
	packet[0x0D] = 0x00; //Min Brightness for effect - Not needed for us
	packet = packet.concat(data);

	//We ignore everything else involing timers and color shift effect info.
	device.send_report(packet, 64);
}


function sendCommit(){

	let packet = [GIGABYTE_COMMAND, GIGABYTE_COMMAND_COMMIT, GIGABYTE_COMMIT_VALUE];
	device.send_report(packet, 64);

}

let config = [GIGABYTE_COMMAND];

function RequestConfig(){
	let packet = [GIGABYTE_COMMAND, GIGABYTE_COMMAND_CONFIGTABLE];
	device.send_report(packet, 64);

	config = device.get_report(config, 64);

	let product = config[1];
	device.log(`Product Id: ${product}`);

	let device_number = config[2];
	device.log(`Device Id: ${device_number}`);

	let ledCount = config[8];
	D_LED1_Count = Get_Led_Def( ledCount & 0x0F);
	D_LED2_Count = Get_Led_Def( ledCount & 0xF0);
	device.log(`D_Led1 Led Count: ${ledCount & 0x0F}, ENUM: ${D_LED1_Count}`);
	device.log(`D_Led1 Led Count: ${ledCount & 0xF0}, ENUM: ${D_LED2_Count}`);

	let Firmware = `${config[4]}.${config[5]}.${config[6]}.${config[7]}`;
	device.log(`Firmware Version ${Firmware}`);
	device.log(`Developed on Firmware ${"2.0.10.0"}`);

	let description = "";

	for(let i = 0; i < 28; i++){
		description += String.fromCharCode(config[i + 12]);
	}

	device.log(`Device Description: ${description}`);

	// for(let i = 0; i < config.length; i = i + 8){
	// 	device.log(config.slice(i, i+8));
	// }
}


function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	let colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}
export function Image() {
	return "";
}

