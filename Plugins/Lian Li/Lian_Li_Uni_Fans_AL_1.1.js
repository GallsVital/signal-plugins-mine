export function Name() { return "Lian Li Uni Fan Controller AL 1.1"; }
export function VendorId() { return  0x0CF2; }
export function ProductId() { return 0xA101;}//0xA100; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [1, 1]; }
export function Type(){return "hybrid";}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
moboSync:readonly
FanMode:readonly
newProtocol:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"moboSync", "group":"", "label":"Enable Passthrough Control", "type":"boolean", "default":"false"},
		{"property":"FanMode", "group":"", "label":"Fan Speed Mode", "type":"combobox", "values":["SignalRGB", "Motherboard PWM"], "default":"SignalRGB"},
		{"property":"newProtocol", "group":"", "label":"Enable Firmware V1.7 Protocol", "type":"boolean", "default":"false"},
	];
}
export function DeviceMessages() {
	return [
		{property: "Limited Frame Rate", message:"Limited Frame Rate", tooltip: "This device's firmware is limited to a slower refresh rate than other device's when using more then 2 channels"},
	];
}


export function SubdeviceController(){ return true; }
export function DefaultComponentBrand() { return "LianLi";}

const DeviceMaxLedLimit = 240;

//Channel Name, Led Limit
const ChannelArray = [
	["Channel 1", 80],
	["Channel 2", 80],
	["Channel 3", 80],
	["Channel 4", 80],
];

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
	fan_objects: ["Channel 1 Fan 1", "Channel 1 Fan 2", "Channel 1 Fan 3", "Channel 1 Fan 4"],
	fanAction: 0xD8a0,
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
	fan_objects: ["Channel 2 Fan 1", "Channel 2 Fan 2", "Channel 2 Fan 3", "Channel 2 Fan 4"],
	fanAction: 0xD8a2,
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
	fan_objects: ["Channel 3 Fan 1", "Channel 3 Fan 2", "Channel 3 Fan 3", "Channel 3 Fan 4"],
	fanAction: 0xD8a4,
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
	fan_objects: ["Channel 4 Fan 1", "Channel 4 Fan 2", "Channel 4 Fan 3", "Channel 4 Fan 4"],
	fanAction: 0xD8a6,
	innerAction: [0xE7D0, 0xE80C, 0xE848, 0xE884],
	outerAction: [0xE7E8, 0xE824, 0xE860, 0xE89C],
	commitInner: 0xe080,
	commitOuter: 0xe090,

	fanCommit:0xD893,
	fanRead: 0xd806,
	fanPMWCommit: 0xe81E
};

const innerChannelRGBDict = [0x30, 0x32, 0x34, 0x36];
const outerChannelRGBDict = [0x31, 0x33, 0x35, 0x37];
const innerChannelRGBCommitDict = [0x10, 0x12, 0x14, 0x16];
const outerChannelRGBCommitDict = [0x11, 0x13, 0x15, 0x17];

const vLedNames = [];
const vLedPos = [];
const ConnectedFans = [];

let ChannelRGBData;
let innerRGBData;
let outerRGBData;
let fanledcount;
let fancount;

const channelArray =  [Channel_1_Controller, Channel_2_Controller, Channel_3_Controller, Channel_4_Controller];
const PACKET_START =  [0x00, 0x43, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];
const PACKET_COMMIT = [0x00, 0x01, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPos;
}

export function Initialize() {
	sendControlPacket(COMMAND_ADDRESS, PACKET_START, 16);

	SetupChannels();

	setFans(); //set number of fans in signal and controller

	setMoboPassthrough();
}

export function onmoboSyncChanged() {
	setMoboPassthrough();
}

export function onFanModeChanged() {
	setFanMode();
}

export function Render() //I don't care how jank it is, it works.
{
	if(FanMode === "SignalRGB") {
		PollFans();
	}

	if(moboSync === false) {
		if(newProtocol) {
			sendV17Channels();
		} else {
			sendChannels();
		}
	}
}

export function Shutdown() {

}

function setFans() {
	let packet = [0x00, 0x40, 0x01, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];//Set channel counts
	sendControlPacket(COMMAND_ADDRESS, packet, 16);
	packet = [0x00, 0x40, 0x02, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];//etc etc all the way down
	sendControlPacket(COMMAND_ADDRESS, packet, 16);
	packet = [0x00, 0x40, 0x03, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];
	sendControlPacket(COMMAND_ADDRESS, packet, 16);
	packet = [0x00, 0x40, 0x04, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];
	sendControlPacket(COMMAND_ADDRESS, packet, 16);
}

function sendV17Channels() {
	for(let Channel = 0; Channel < 4; Channel++) {
		const innerRGBData = [];
		const outerRGBData = [];

		if (device.channel(ChannelArray[Channel][0]).LedCount() > 0) {

			const ChannelLedCount = device.channel(ChannelArray[Channel][0]).LedCount();
			ChannelRGBData = getChannelColors(Channel, ChannelLedCount);

			for (let fan = 0; fan < 4; fan++) {
				innerRGBData.push(...ChannelRGBData.splice(0, 8 * 3));
				outerRGBData.push(...ChannelRGBData.splice(0, 12 * 3));
			}
			const innerChannelPacket = [0xe0, innerChannelRGBDict[Channel]];
			const outerChannelPacket = [0xe0, outerChannelRGBDict[Channel]];
			innerChannelPacket.push(...innerRGBData);
			outerChannelPacket.push(...outerRGBData);
			device.write(innerChannelPacket, 353);
			device.write(outerChannelPacket, 353);
			device.send_report([0xe0, innerChannelRGBCommitDict[Channel], 0x01, 0x02], 353);
			device.send_report([0xe0, outerChannelRGBCommitDict[Channel], 0x01, 0x02], 353);
		}
	}
}

function sendChannels() {

	for(let Channel = 0; Channel < 4;Channel++) {
		if (device.channel(ChannelArray[Channel][0]).LedCount() > 0) {
			fanledcount = 0;
			fancount = 0;

			const ChannelLedCount = device.channel(ChannelArray[Channel][0]).LedCount();
			ChannelRGBData = getChannelColors(Channel, ChannelLedCount);

			do {
				fancount ++;
				fanledcount = (fancount * 20);
			}
			while(device.channel(ChannelArray[Channel][0]).LedCount() >= fanledcount);

			fanledcount = fanledcount-20;
			fancount = fancount-1;

			for (let fan = 0; fan < (fancount); fan++) {

				innerRGBData = ChannelRGBData.splice(0, 8 * 3);
				sendControlPacket(channelArray[Channel].innerAction[fan], innerRGBData, 24);

				outerRGBData = ChannelRGBData.splice(0, 12 * 3);
				sendControlPacket(channelArray[Channel].outerAction[fan], outerRGBData, 36);
			}


			sendControlPacket(channelArray[Channel].commitInner, PACKET_COMMIT, 16);
			sendControlPacket(channelArray[Channel].commitOuter, PACKET_COMMIT, 16);
		}
	}

}

function  getChannelColors(Channel, ledcount, shutdown = false) {
	let RGBData = [];

	if(LightingMode === "Forced") {
		RGBData = device.createColorArray(forcedColor, ledcount, "Inline", "RBG");

	} else if(device.getLedCount() === 0) {
		ledcount = 80;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0], ledcount);
		RGBData = device.createColorArray(pulseColor, ledcount, "Inline", "RBG");

	} else {
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline", "RBG");
	}

	return RGBData;
}

let savedMoboPassthrough;

function setMoboPassthrough() {
	if(savedMoboPassthrough !== moboSync) {
		savedMoboPassthrough = moboSync;

		const packet = [0x00, 0x41, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];
		packet[2] = moboSync;

		sendControlPacket(COMMAND_ADDRESS, packet, 16);
	}
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
	let rpm = Math.round(1900 * percent/100);
	rpm = Math.max(800, rpm);
	device.log(`Setting Channel ${channel} to ${Math.round(percent)}% Fan Speed, UniFan rpm equivalent: ${rpm}`);
	setFanRPM(channel, rpm);
}

function setFanRPM(channel, rpm) {

	const packet = [];
	packet[0] = rpm % 256;
	packet[1] = Math.floor(rpm / 256);
	sendControlPacket(channelArray[channel].fanAction, packet, 2);

	packet[0] = 1;
	sendControlPacket(channelArray[channel].fanCommit, packet, 1);

}

let savedFanMode;

function setFanMode() {
	if(savedFanMode != FanMode) {
		savedFanMode = FanMode;

		if(savedFanMode == "Manual") {
			setFanRPM(true);
		} else if(savedFanMode == "PWM") {
			for(let channel = 0; channel < 4;channel++) {
				const packet = [0x00, 0x31, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];
				packet[2] = (0x10 << channel) + 0x0F;
				sendControlPacket(COMMAND_ADDRESS, packet, 16);
				device.log(packet);
			}
		}
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

export function Validate(endpoint) {
	return endpoint.interface === 1;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/lian-li/lighting-controllers/uni-hub-controller.png";
}