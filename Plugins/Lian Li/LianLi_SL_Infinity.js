export function Name() { return "Lian Li Uni Fan Controller SL Infinity"; }
export function VendorId() { return  0x0CF2; }
export function ProductId() { return 0xA102;}//0xA100; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [1, 1]; }
export function Type(){return "hybrid";}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
moboSync:readonly
FanMode:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"moboSync", "label":"Enable Passthrough Control", "type":"boolean", "default":"false"},
		{"property":"FanMode", "label":"Fan Speed Mode", "type":"combobox", "values":["SignalRGB", "Motherboard PWM"], "default":"SignalRGB"},
		//{"property":"targetRPM", "label":"Fan RPM", "step":"50","type":"number","min":"800", "max":"1900","default":"1300"},
		//{"property":"FanMode", "label":"Fan Speed Mode","type":"combobox","values":["Manual","PWM"],"default":"PWM"},
	];
}
export function DeviceMessages() {
	return [
		{property: "Limited Frame Rate", message:"Limited Frame Rate", tooltip: "This device's firmware is limited to a slower refresh rate than other device's when using more then 2 channels"},
	];
}


export function SubdeviceController(){ return true; }
export function DefaultComponentBrand() { return "LianLi";}

const DeviceMaxLedLimit = 80 * 4;

//Channel Name, Led Limit
const ChannelArray = [
	["Channel 1", 80],
	["Channel 2", 80],
	["Channel 3", 80],
	["Channel 4", 80],
];

const InnerDict =//This is a dictionary that goes with the Inner Rings for each channel. These are used to address which channel I'm sending color data for.
{
	0 : 0x30,
	1 : 0x32,
	2 : 0x34,
	3 : 0x36,
};

const OuterDict = //This is a dictionary that goes with the Outer Rings for each channel. These are used to address which channel I'm sending color data for.
{
	0 : 0x31,
	1 : 0x33,
	2 : 0x35,
	3 : 0x37,
};

const InnerApplyDict = //This is a dictionary that goes with the Inner Rings for each channel. These are used to address which channel I'm applying color data to.
{
	0 : 0x10,
	1 : 0x12,
	2 : 0x14,
	3 : 0x16,
};

const OuterApplyDict =//This is a dictionary that goes with the Outer Rings for each channel. These are used to address which channel I'm applying color data to.
{
	0 : 0x11,
	1 : 0x13,
	2 : 0x15,
	3 : 0x17,
};


function SetupChannels() {
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++) {
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

const COMMAND_ADDRESS = 0xE020;

const Channel_1_Controller =
{
	action: 0xe300,
	count: 0,
	fan_objects: ["Channel 1 Fan 1", "Channel 1 Fan 2", "Channel 1 Fan 3", "Channel 1 Fan 4"],
	fanAction: 0x20,
	innerAction: [0xE500, 0xE53C, 0xE578, 0xE5B4],
	outerAction: [0xE518, 0xE554, 0xE590, 0xE5CC],
	commitInner: 0xe020,
	commitOuter: 0xe030,

	fanCommit:0xD890,
	fanRead: 0xd800,
	fanPMWCommit: 0xe818
};

const Channel_2_Controller =
{
	action: 0xe3c0,
	count: 0,
	fan_objects: ["Channel 2 Fan 1", "Channel 2 Fan 2", "Channel 2 Fan 3", "Channel 2 Fan 4"],
	fanAction: 0x21,
	innerAction: [0xE5F0, 0xE62C, 0xE668, 0xE6A4],
	outerAction: [0xE608, 0xE644, 0xE680, 0xE6BC],
	commitInner: 0xe040,
	commitOuter: 0xe050,

	fanCommit:0xD891,
	fanRead: 0xd802,
	fanPMWCommit: 0xe81A
};

const Channel_3_Controller =
{
	action: 0xe480,
	count: 0,
	fan_objects: ["Channel 3 Fan 1", "Channel 3 Fan 2", "Channel 3 Fan 3", "Channel 3 Fan 4"],
	fanAction: 0x22,
	innerAction: [0xE6E0, 0xE71C, 0xE758, 0xE794],
	outerAction: [0xE6F8, 0xE734, 0xE770, 0xE7AC],
	commitInner: 0xe060,
	commitOuter: 0xe070,

	fanCommit:0xD892,
	fanRead: 0xd804,
	fanPMWCommit: 0x81C
};

const Channel_4_Controller =
{
	action: 0xe540,
	count: 0,
	fan_objects: ["Channel 4 Fan 1", "Channel 4 Fan 2", "Channel 4 Fan 3", "Channel 4 Fan 4"],
	fanAction: 0x23,
	innerAction: [0xE7D0, 0xE80C, 0xE848, 0xE884],
	outerAction: [0xE7E8, 0xE824, 0xE860, 0xE89C],
	commitInner: 0xe080,
	commitOuter: 0xe090,

	fanCommit:0xD893,
	fanRead: 0xd806,
	fanPMWCommit: 0xe81E
};

const vLedNames = [];
const vLedPos = [];
const ConnectedFans = [];

const channelArray =  [Channel_1_Controller, Channel_2_Controller, Channel_3_Controller, Channel_4_Controller];
const PACKET_START =  [0x00, 0x43, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPos;
}

export function Initialize() {
	sendControlPacket(COMMAND_ADDRESS, PACKET_START, 16);

	SetupChannels();

	setMoboPassthrough();
	setMoboPassthrough();
	setFanMode();
}

export function onmoboSyncChanged() {
	setMoboPassthrough();
}

export function onFanModeChanged() {
	setFanMode();
}

export function Render() {
	if(FanMode === "SignalRGB") {
		PollFans();
	}

	if(!moboSync) {
		sendColors();
	}

}

export function Shutdown() {

}

export function Validate(endpoint) {
	return endpoint.interface === 1;
}

function  getChannelColors(Channel, ledcount, shutdown = false) { //Grab our color data from the backend for a specific channel

	let RGBData = [];

	if(LightingMode === "Forced") {
		RGBData = device.createColorArray(forcedColor, ledcount, "Inline", "RBG");

	} else if(device.getLedCount() == 0) {
		ledcount = 80;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0], ledcount);
		RGBData = device.createColorArray(pulseColor, ledcount, "Inline", "RBG");

	} else {
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline", "RBG");
	}

	return RGBData;
}

function sendColors() {
	for(let Channel = 0; Channel < 4; Channel++) //Create our 4 channels
	{

		const ChannelLedCount = device.channel(ChannelArray[Channel][0]).LedCount(); //Set LED count equal to how many leds are on each channel

		if(ChannelLedCount > 0) //Check if we have more than zero leds on a channel. If we don't there's no reason to waste a precious packet write.
		{
			const ChannelRGBData = getChannelColors(Channel, ChannelLedCount); //Grab channel colors using above function
			let innerRGBData = [];
			let outerRGBData = [];

			for(let fan = 0; fan < 4; fan++) // I honestly don't remember why I need to do this
			{
				innerRGBData = innerRGBData.concat( ChannelRGBData.splice(0, 8 * 3));//This is grabbing bytes 0,8 3 times for R,G, and B values. This is how LianLi arranges packets.
				outerRGBData  = outerRGBData.concat(ChannelRGBData.splice(0, 12 * 3));
			}

			let packet = [ 0xE0, InnerDict[Channel] ]; //Choosing which channel to send RGB Data to.

			packet = packet.concat(innerRGBData);
			device.write(packet, 353);//Send Inner rings data


			packet = [ 0xE0, OuterDict[Channel] ];//Choosing which channel to send RGB Data to.
			packet = packet.concat(outerRGBData);//This combines the above two bytes with our RGB data to make a single packet.
			device.write(packet, 353);//Send Outer Rings data

			packet = [0xE0, InnerApplyDict[Channel], 0x01, 0x02];
			device.write(packet, 353);//Apply colors to device for inner rings


			packet = [0xE0, OuterApplyDict[Channel], 0x01, 0x02];
			device.write(packet, 353);  //Apply colors to device's outer rings.
			device.pause(12);
		}
	}

	device.pause(7);//Users will be able to tweak these because I swear the values that look good to me never look good to users.
}


function setMoboPassthrough() {
	device.write([0xE0, 0x10, 0x61, moboSync], 353);
}

let savedPollFanTimer = Date.now();
const PollModeInternal = 3000;

function PollFans() {
	//Break if were not ready to poll
	if (Date.now() - savedPollFanTimer < PollModeInternal) {
		return;
	}

	savedPollFanTimer = Date.now();

	if(device.fanControlDisabled()) {
		return;
	}

	for(let fan = 0; fan < 4; fan++) {
		const rpm = readFanRPM(fan);
		device.log(`Fan ${fan}: ${rpm}rpm`);

		if(rpm > 0 && !ConnectedFans.includes(`Fan ${fan}`)) {
			ConnectedFans.push(`Fan ${fan}`);
			device.createFanControl(`Fan ${fan}`);
		}

		if(ConnectedFans.includes(`Fan ${fan}`)) {
			device.setRPM(`Fan ${fan}`, rpm);

			const newSpeed = device.getNormalizedFanlevel(`Fan ${fan}`) * 100;
			setFanPercent(fan, newSpeed);
		}
	}
}

function readFanRPM(channel) {
	const packet = readControlPacket(channelArray[channel].fanRead, [], 2);

	return packet[0] | (packet[1] << 8);
}


function setFanPercent(channel, percent) {
	const packet = [];
	packet[0] = 0xe0;
	packet[1] = channelArray[channel].fanAction;
	packet[2] = 0x00;
	packet[3] = percent;

	device.write(packet, 353);


}

function setFanMode() {
		 if(FanMode != "SignalRGB") {

		var packet = [0xE0, 0x10, 0x00, 0x0A ];
		packet[1] = 0x20;
		device.write(packet, 353);
		packet[1] = 0x21;
		device.write(packet, 353);
		packet[1] = 0x22;
		device.write(packet, 353);
		packet[1] = 0x23;
		device.write(packet, 353);
		packet = [0xE0, 0x10, 0x62, 0x00 ];
		packet[3] = 0x11;
		device.write(packet, 353);
		packet[3] = 0x22;
		device.write(packet, 353);
		packet[3] = 0x44;
		device.write(packet, 353);
		packet[3] = 0x88;
		device.write(packet, 353);
		device.log("PWM");

	} else {
		var packet = [0xE0, 0x10, 0x00, 0x0A ];
		packet[1] = 0x20;
		device.write(packet, 353);
		packet[1] = 0x21;
		device.write(packet, 353);
		packet[1] = 0x22;
		device.write(packet, 353);
		packet[1] = 0x23;
		device.write(packet, 353);
		packet = [0xE0, 0x10, 0x62, 0x00 ];
		packet[3] = 0x10;
		device.write(packet, 353);
		packet[3] = 0x20;
		device.write(packet, 353);
		packet[3] = 0x40;
		device.write(packet, 353);
		packet[3] = 0x80;
		device.write(packet, 353);
	}
}

function readControlPacket(index, data, length) {
	//                  iType, iRequest, iValue, iReqIdx, pBuf, iLen, iTimeout
	return device.control_transfer(0xC0, 0x81, 0, index, data, length, 1000);
}

function sendControlPacket(index, data, length) {
	//                  iType, iRequest, iValue, iReqIdx, pBuf, iLen, iTimeout
	device.control_transfer(0x40, 0x80, 0, index, data, length, 1000);
	device.pause(1);
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/lian-li/fan-controllers/uni-hub-controller.png";
}