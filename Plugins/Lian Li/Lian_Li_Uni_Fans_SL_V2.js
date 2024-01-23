export function Name() { return "Lian Li Uni Fan Controller SL V2"; }
export function VendorId() { return  0x0CF2; }
export function ProductId() { return [0xA103, 0xA105];}//0xA100; }
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
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"moboSync", "group":"", "label":"Enable Passthrough Control", "type":"boolean", "default":"false"},
		{"property":"FanMode", "group":"", "label":"Fan Speed Mode", "type":"combobox", "values":["SignalRGB", "Motherboard PWM"], "default":"SignalRGB"},
	];
}
export function DeviceMessages() {
	return [
		{property: "Limited Frame Rate", message:"Limited Frame Rate", tooltip: "This device's firmware is limited to a slower refresh rate than other device's when using more then 1 channel"},
	];
}


export function SubdeviceController(){ return true; }
export function DefaultComponentBrand() { return "LianLi";}

const DeviceMaxLedLimit = 384;

//Channel Name, Led Limit
const ChannelArray = [
	["Channel 1", 96],
	["Channel 2", 96],
	["Channel 3", 96],
	["Channel 4", 96],
];

function SetupChannels() {
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++) {
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

const ChannelRGBDict = [0x30, 0x31, 0x32, 0x33];
const ChannelRGBCommitDict = [0x10, 0x11, 0x12, 0x13];


const vLedNames = [];
const vLedPos = [];
const ConnectedFans = [];

let ChannelRGBData;

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPos;
}

export function Initialize() {
	device.send_report([0xE0, 0x10, 0x63, 0x00, 0x01, 0x02, 0x03, 0x08], 32);
	device.get_report([0xE0, 0x10, 0x63, 0x00, 0x01, 0x02, 0x03, 0x08], 32);
	device.send_report([0xE0, 0x10, 0x60, 0x01, 0x06], 32);
	device.get_report([0xE0, 0x10, 0x60, 0x01, 0x06], 32);
	device.send_report([0xE0, 0x30], 32);
	device.get_report([0xE0, 0x30], 32);
	device.send_report([0xE0, 0x10, 0x60, 0x02, 0x06], 32);
	device.get_report([0xE0, 0x10, 0x60, 0x02, 0x06], 32);
	device.send_report([0xE0, 0x32], 32);
	device.get_report([0xE0, 0x32], 32);
	device.send_report([0xE0, 0x10, 0x60, 0x03, 0x06], 32);
	device.get_report([0xE0, 0x10, 0x60, 0x03, 0x06], 32);
	device.send_report([0xE0, 0x34], 32);
	device.get_report([0xE0, 0x34], 32);
	device.send_report([0xE0, 0x10, 0x60, 0x04, 0x06], 32);
	device.get_report([0xE0, 0x10, 0x60, 0x04, 0x06], 32);
	device.send_report([0xE0, 0x36], 32);
	device.get_report([0xE0, 0x36], 32);

	setFanMode();
	burstFans();

	SetupChannels();

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

	sendChannels();
}

export function Shutdown() {
	sendChannels(true);
}

function sendChannels(shutdown = false) {
	for(let Channel = 0; Channel < 4; Channel++) {

		const ChannelLedCount = device.channel(ChannelArray[Channel][0]).LedCount();
		const componentChannel = device.channel(ChannelArray[Channel][0]);

		if (ChannelLedCount > 0 || componentChannel.shouldPulseColors()) {

			ChannelRGBData = getChannelColors(Channel, ChannelLedCount, shutdown, componentChannel);

			device.write([0xe0, ChannelRGBDict[Channel]].concat(ChannelRGBData), 353);
			device.pause(5);
			device.send_report([0xe0, ChannelRGBCommitDict[Channel], 0x01, 0x02], 353);
			device.pause(5);
		}
	}
}

function  getChannelColors(Channel, ledcount, shutdown, componentChannel) {
	let RGBData = [];

	if(LightingMode === "Forced") {
		RGBData = device.createColorArray(forcedColor, ledcount, "Inline", "RBG");

	} else if(shutdown) {
		RGBData = device.createColorArray(shutdownColor, ledcount, "Inline", "RBG");
	} else if(componentChannel.shouldPulseColors()) {
		ledcount = 96;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0]);
		RGBData = device.createColorArray(pulseColor, ledcount, "Inline", "RBG");

	} else {
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline", "RBG");
	}

	return RGBData;
}

function setMoboPassthrough() {
	device.write([0xE0, 0x10, 0x61, moboSync], 353);
	device.pause(10);
	device.write([0xE0, 0x50], 353);
}

let savedPollFanTimer = Date.now();
const PollModeInternal = 3000;

function burstFans() {
	for(let fan = 0; fan < 4; fan++) {
		setFanPercent(fan, 50);
	}
}

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

const rpmDict = [0xd800, 0xd802, 0xd804, 0xd806];

function readFanRPM(channel) {
	const packet = readControlPacket(rpmDict[channel], [], 65);

	return packet[0] | (packet[1] << 8);
}

function setFanMode() {

	for(let Channel = 0; Channel < 4; Channel++) {
		if(FanMode === "SignalRGB") {
			device.write([0xE0, 0x10, 0x62, softwareDict[Channel]], 353);
			device.pause(10);
		} else {
			device.write([0xE0, 0x10, 0x62, moboDict[Channel]], 353);
			device.pause(10);
		}
	}

	device.write([0xE0, 0x50], 32);
	device.pause(10);
}

const softwareDict = [0x10, 0x20, 0x40, 0x80];
const moboDict = [0x11, 0x22, 0x44, 0x88];


function setFanPercent(channel, percent) {
	const rpm = Math.round(2000 * percent/100);
	device.log(`Setting Channel ${channel} to ${Math.round(percent)}% Fan Speed, UniFan rpm equivalent: ${rpm}`);
	device.write([0xE0, 0x20+channel, 0x00, percent === 0 ? 1 : percent], 32); //for some reason 0 is not a valid option
}

function readControlPacket(index, data, length) {
	//                  iType, iRequest, iValue, iReqIdx, pBuf, iLen, iTimeout
	return device.control_transfer(0xC0, 0x81, 0, index, data, length, 1000);
}

export function Validate(endpoint) {
	return endpoint.interface === 1;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/lian-li/fan-controllers/uni-hub-controller.png";
}