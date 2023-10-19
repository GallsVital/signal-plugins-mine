export function Name() { return "Logitech G633 Headset"; }
export function VendorId() { return 0x046d; }
export function Documentation(){ return "troubleshooting/logitech"; }
export function ProductId() { return 0x0A5C;}
export function Publisher() { return "turulix"; }
export function Size() { return [3, 3]; }
export function DefaultPosition(){return [145, 85];}
export function DefaultScale(){return 10.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
sideTone:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"sideTone", "group":"", "label":"Sidetone", "step":"1", "type":"number", "min":"0", "max":"100", "default":"0"},
	];
}


let DeviceId;
let TransactionId;
let deviceName;
let InfoID;
let RGBFeatureID;
let GKeyID;
let ADCMeasurementID;
let SidetoneID;
let EqualizerID;

const WIRED = 0xFF;
const WIRELESS = 0x01;
const ShortMessage = 0x10;
const LongMessage = 0x11;
const ConnectionMode = WIRED;

const vLedNames = ["Logo", "Light Strip"];
const vLedPositions = [ [0, 2], [0, 1] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	GrabIds();
	SetDirectMode();
	//GKeySetup();
	sidetoneSetup();
	setSideTone();
	//setOnboardEQ();
}

export function Render() {
	sendZone(0);
	sendZone(1);
	DetectInputs();
}


export function Shutdown() {
	sendZone(0, true);
	sendZone(1, true);
}

export function onsideToneChanged() {
	setSideTone();
}

//function GKeySetup()//Controls software modes for the G and M keys
//{
//	var packet = [LongMessage, ConnectionMode, GKeyID, 0x00]; //Info
//	device.write(packet,20);

//	packet = [LongMessage, ConnectionMode, GKeyID, 0x20, 0x01]; //Software Enable Flag for GKeys and Mkeys
//	device.write(packet,20);
//}

function SetDirectMode() {
 	const packet = [LongMessage, ConnectionMode, RGBFeatureID, 0x80, 0x01, 0x01];
 	device.write(packet, 20);
}

function setSideTone() {
	const packet = [LongMessage, ConnectionMode, SidetoneID, 0x10, sideTone];
	device.write(packet, 20);
}

//function setIdleTimeout()
//{
//	let packet = [LongMessage, ConnectionMode, ADCMeasurementID, 0x20, timeout];//timeout in minutes
//	device.write(packet, 20);
//}

function sidetoneSetup() {
	let packet = [LongMessage, ConnectionMode, SidetoneID, 0x00];//Get Sidetone level
	device.write(packet, 20);

	const returnpacket = device.read(packet, 20);
	const returnedsidetonelevel = returnpacket[4];
	device.log("Initial Sidetone Level: " + returnedsidetonelevel);

	packet = [LongMessage, ConnectionMode, SidetoneID, 0x01];
	device.write(packet, 20);
}

function OnboardEQInfo() {
	const packet = [LongMessage, ConnectionMode, EqualizerID, 0x00];
	device.write(packet, 20);

	const returnpacket = device.read(packet, 20);
	const numberofBands = returnpacket[4];
	const rangeofDb = returnpacket[5];
	const gaintypes = returnpacket[6];
	const minDb = returnpacket[7];
	const maxDb = returnpacket[8];

}

function OnboardEQFrequencies() {
	let packet = [LongMessage, ConnectionMode, EqualizerID, 0x10, 0x00];
	device.write(packet, 20);

	let returnpacket = device.read(packet, 20);
	const startingBandIndex = returnpacket[4]; //offset for which band we're starting at
	const band1 = returnpacket[6]; //band in HZ
	const band1LSB = returnpacket[7]; //Gain for band
	const band2 = returnpacket[8];
	const band2LSB = returnpacket[9];
	const band3 = returnpacket[10];
	const band3LSB = returnpacket[11];
	const band4 = returnpacket[12];
	const band4LSB = returnpacket[13];
	const band5 = returnpacket[14];
	const band5LSB = returnpacket[15];
	const band6 = returnpacket[16];
	const band6LSB = returnpacket[17];
	const band7 = returnpacket[18];
	const band7LSB = returnpacket[19];

	packet = [LongMessage, ConnectionMode, EqualizerID, 0x20, 0x00]; //0x00 for eeprom, 0x01 for ram
	device.write(packet, 20);
	returnpacket = device.read(packet, 20);

	const startingBandIndex2 = returnpacket[4]; //offset for which band we're starting at
	const band8 = returnpacket[6]; //band in HZ
	const band8LSB = returnpacket[7]; //Gain for band
	const band9 = returnpacket[8];
	const band9LSB = returnpacket[9];
	const band10 = returnpacket[10];
	const band10LSB = returnpacket[11];

}

function onboardEQGains() {
	const packet = [LongMessage, ConnectionMode, EqualizerID, 0x10, 0x00];
	device.write(packet, 20);

	const returnpacket = device.read(packet, 20);
	const band1gain = returnpacket[4];
	const band2Gain = returnpacket[5];
	const band3Gain = returnpacket[6];
	const band4Gain = returnpacket[7];
	const band5Gain = returnpacket[8];
	const band6Gain = returnpacket[9];
	const band7Gain = returnpacket[10];
	const band8Gain = returnpacket[11];
	const band9Gain = returnpacket[12];
	const band10Gain = returnpacket[13];

}

function setOnboardEQ() {
	//let packet = [LongMessage, ConnectionMode, EqualizerID, 0x30, 0x02, band1,band2,band3,band4,band5,band6,band7,band8,band9,band10]; //0x02 is eeprom only, 0x00 is ram only, 0x01 is ram and eeprom
	const packet = [LongMessage, ConnectionMode, EqualizerID, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	device.write(packet, 20);
}

function getNoiseReduction() {
	const packet = [LongMessage, ConnectionMode, EqualizerID, 0x40, 0x00];
	device.write(packet, 20);

	const returnpacket = device.read(packet, 20);
}

function setNoiseReduction() {
	const packet = [LongMessage, ConnectionMode, EqualizerID, 0x50, 0x00]; //0x00 is disabled, 0x01 is enabled
	device.write(packet, 20);
}

function DetectInputs() {
	do {
    	let packet = [];
    	packet = device.read([0x00], 9, 2);
    	ProcessInputs(packet);
	}
	while(device.getLastReadSize() > 0);
}

function ProcessInputs(packet) {
	if(packet[0] == LongMessage && packet[1] == ConnectionMode && packet[2] == GKeyID)//G-Key Packet
	{
		if(packet[4] == 0x01) {
			device.log("G1 Pressed");

			return "G1";
		}

		if(packet[4] == 0x02) {
			device.log("G2 Pressed");

			return "G2";
		}

		if(packet[4] == 0x04) {
			device.log("G3 Pressed");

			return "G3";
		}

		if(packet[4] == 0x08) {
			device.log("G4 Pressed");

			return "G4";
		}

		if(packet[4] == 0x10) {
			device.log("G5 Pressed");

			return "G5";
		}
	}

	if(packet[0] == LongMessage && packet[1] == ConnectionMode && packet[2] == ADCMeasurementID && packet[3] == 0x00 &&  packet[4] == 0x0f && packet[6] == 0x01) {
		device.log("Waking From Sleep");
		device.pause(5000); //Wait five seconds before Handoff. Allows device boot time.
		Initialize();
	}
}

function sendZone(zone, shutdown = false) {
	const packet = [];
	packet[0] = LongMessage;
	packet[1] = ConnectionMode;
	packet[2] = RGBFeatureID;
	packet[3] = 0x30;
	packet[4] = zone;
	packet[5] = 0x01;

	const iX = vLedPositions[zone][0];
	const iY = vLedPositions[zone][1];
	let color;

	if(shutdown) {
		color = hexToRgb(shutdownColor);
	} else if (LightingMode == "Forced") {
		color = hexToRgb(forcedColor);
	} else {
		color = device.color(iX, iY);
	}

	packet[6] = color[0];
	packet[7] = color[1];
	packet[8] = color[2];
	packet[9] = 0x02;


	device.write(packet, 20);
}


function clearLongReadBuffer() {
	device.read([LongMessage, 0x01], 20);

    	while(device.getLastReadSize() > 0) {
		device.read([ShortMessage, 0x01], 20);
    	}
}

function Logitech_Long_Set(Mode, data) {
	clearLongReadBuffer();

	let packet = [LongMessage, Mode];
	data = data || [0x00, 0x00, 0x00];
	packet = packet.concat(data);
	device.write(packet, 20);
	packet = device.read(packet, 20);

	return packet.slice(4, 7);
}

function Logitech_FeatureID_Get(page) {
	return Logitech_Long_Set(ConnectionMode, [0x00, 0x00].concat(page))[0];
}

function GrabIds() {
	const InfoPage = [0x00, 0x03];
	const InfoID = Logitech_FeatureID_Get(InfoPage);

	if(InfoID !== 0) {
		device.log("Device Info ID: " + InfoID);
	}

	const EqualizerPage = [0x83, 0x10];
	EqualizerID = Logitech_FeatureID_Get(EqualizerPage);

	if(EqualizerID !== 0) {
		device.log("Device Equalizer ID: " + EqualizerID);
	}

	const SidetonePage = [0x83, 0x00];
	SidetoneID = Logitech_FeatureID_Get(SidetonePage);

	if(SidetoneID !== 0) {
		device.log("Device Sidetone ID: " + SidetoneID);
	}

	const ADCMeasurementPage = [0x1f, 0x20]; //ADC deals with battery but what does this actually mean?
	ADCMeasurementID = Logitech_FeatureID_Get(ADCMeasurementPage);

	if(ADCMeasurementID !== 0) {
		device.log("Device Battery Measurement ID: " + ADCMeasurementID);
	}

	const NamePage = [0x00, 0x05];
	const NameID = Logitech_FeatureID_Get(NamePage);

	if(NameID !== 0) {
		device.log("Device Name ID: " + NameID);
	}

	const GKeyPage = [0x80, 0x10]; //0x00 //2a 01 short
	GKeyID = Logitech_FeatureID_Get(GKeyPage);

	if(GKeyID !== 0) {
		device.log("GKey ID: " + GKeyID);
	}

	const RGB8070Page = [0x80, 0x70];
	RGBFeatureID = Logitech_FeatureID_Get(RGB8070Page);

	if(RGBFeatureID === 0) {
		const RGB8071Page = [0x80, 0x71];
		RGBFeatureID = Logitech_FeatureID_Get(RGB8071Page);

		if(RGBFeatureID != 0) {
			device.log("Hero Mouse Found");
		}
	}

	if(RGBFeatureID != 0) {
		device.log("RGB Control ID : " + RGBFeatureID);
	}
}

export function Validate(endpoint) {
	return endpoint.interface === 3 && endpoint.usage === 0x0202 && endpoint.usage_page === 0xff43;
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/default/audio/headset-render.png";
}