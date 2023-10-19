
export function Name() { return "Lian Li Uni Fan Controller"; }
export function VendorId() { return  0x0CF2; }
export function ProductId() { return 0x7750; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [5, 5]; }
export function Type(){return "rawusb";}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
moboSync:readonly
FanMode:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"moboSync", "group":"", "label":"Enable Passthrough Control", "type":"boolean", "default":"false"},
		{"property":"FanMode", "group":"", "label":"Fan Speed Mode", "type":"combobox", "values":["SignalRGB", "Motherboard PWM"], "default":"SignalRGB"},
	];
}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPos; }

export function DeviceMessages() {
	return [
		{property: "Limited Frame Rate", message:"Limited Frame Rate", tooltip: "This device's firmware is limited to a slower refresh rate than other device's when using more then 2 channels"},
	];
}
export function SubdeviceController(){ return true; }
export function DefaultComponentBrand() { return "LianLi";}

const ConnectedFans = [];
const vLedNames = [];
const vLedPos = [];
let ChannelIndex = 0;
let savedPollFanTimer = Date.now();
const PollModeInternal = 3000;

//Channel Name, Led Limit
const ChannelArray = [
	["Channel 1", 64],
	["Channel 2", 64],
	["Channel 3", 64],
	["Channel 4", 64],
];

function SetupChannels(){
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++){
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

/*eslint-disable no-unused-vars*/
//Device Constants
const DeviceMaxLedLimit = 64 * 3;
const DevicePulseLedCount = 32;
const RGBPacketLength = 192;

// Protocol Constants
const LIAN_LI_COMMAND_FAN = 0x31;

const LIAN_LI_FAN_MANUAL_MODE = 0xF0;
const LIAN_LI_FAN_PWM_MODE = 0xFF;

const COMMAND_ADDRESS = 0xE021;
const COMMIT_ADDRESS = 0xE02f;

const Channel_1_Controller = {
	action: 0xe300,
	commit: 0xe02f,
	mode: 0xe021,
	speed: 0xe022,
	direction: 0xe023,
	brightness: 0xe029,
	count: 0,
	fan_objects: ["Channel 1 Fan 1", "Channel 1 Fan 2", "Channel 1 Fan 3", "Channel 1 Fan 4"],
	fanAction: 0xe8a0,
	fanCommit:0xe890,
	fanRead: 0xe800,
	fanPMWCommit: 0xe818
};

const Channel_2_Controller = {
	action: 0xe3c0,
	commit: 0xe03f,
	mode: 0xe031,
	speed: 0xe032,
	direction: 0xe033,
	brightness: 0xe039,
	count: 0,
	fan_objects: ["Channel 2 Fan 1", "Channel 2 Fan 2", "Channel 2 Fan 3", "Channel 2 Fan 4"],
	fanAction: 0xe8a2,
	fanCommit:0xe891,
	fanRead: 0xe802,
	fanPMWCommit: 0xe81A
};

const Channel_3_Controller = {
	action: 0xe480,
	commit: 0xe04f,
	mode: 0xe041,
	speed: 0xe042,
	direction: 0xe043,
	brightness: 0xe049,
	count: 0,
	fan_objects: ["Channel 3 Fan 1", "Channel 3 Fan 2", "Channel 3 Fan 3", "Channel 3 Fan 4"],
	fanAction: 0xe8a4,
	fanCommit:0xe892,
	fanRead: 0xe804,
	fanPMWCommit: 0xe81C
};

const Channel_4_Controller = {
	action: 0xe540,
	commit: 0xe05f,
	mode: 0xe051,
	speed: 0xe052,
	direction: 0xe053,
	brightness: 0xe059,
	count: 0,
	fan_objects: ["Channel 4 Fan 1", "Channel 4 Fan 2", "Channel 4 Fan 3", "Channel 4 Fan 4"],
	fanAction: 0xe8a6,
	fanCommit:0xe893,
	fanRead: 0xe806,
	fanPMWCommit: 0xe81E
};
const ChannelObjectArray = [Channel_1_Controller, Channel_2_Controller, Channel_3_Controller, Channel_4_Controller];
/*eslint-enable no-unused-vars*/

export function Initialize() {

	SetupChannels();

	// init mode, spd, dir, brightness.
	for(let channel = 0; channel < 4; channel++){

		let packet = [1];
		sendControlPacket(ChannelObjectArray[channel].mode, packet, 1);

		packet = [1];
		sendControlPacket(ChannelObjectArray[channel].speed, packet, 1);

		packet = [0];
		sendControlPacket(ChannelObjectArray[channel].direction, packet, 1);

		packet = [0];
		sendControlPacket(ChannelObjectArray[channel].brightness, packet, 1);

		packet = [1];
		sendControlPacket(ChannelObjectArray[channel].commit, packet, 1);
	}

	SetMoboPassthrough();
	SetFanMode();

	BurstFans();
}


export function Shutdown() {

}


export function Render() {
	PollFans();


	if(!moboSync){
		SendChannels();
	}

}


function SendChannels(){
	//start configuation
	let packet = [];
	packet[0] = 0x34;
	sendControlPacket(COMMAND_ADDRESS, packet, 1);
	sendCommit();

	//set fan counts
	for(let channel = 0;channel < 4;channel++){
		packet = [0x32, 16*channel + 3]; // fan Count on channel (0 == 1)
		sendControlPacket(COMMAND_ADDRESS, packet, 2);
		sendCommit();
	}

	//If no Active Channels Use Default Pulse on each Channel
	if(device.getLedCount() === 0){
	   SendSingleChannel(ChannelIndex);
	   ChannelIndex = (ChannelIndex + 1) % 4;
	}else{
		//set fan RGB one channel at a time
		// Find Channel with Leds on it
		do{
			ChannelIndex = (ChannelIndex + 1) % 4;
		}while(!isChannelActive(ChannelIndex));

		device.log(ChannelIndex);
		SendSingleChannel(ChannelIndex);
	}
}

function SendSingleChannel(Channel){
	let packet = getChannelColors(Channel);
	sendControlPacket(ChannelObjectArray[Channel].action, packet, RGBPacketLength);

	// This needs a slight delay to not step over itself
	device.pause(1);

	packet = [1];
	sendControlPacket(ChannelObjectArray[Channel].commit, packet, 1);
}

function  getChannelColors(Channel) {
	const ChannelName = ChannelArray[Channel][0];
	let ChannelLedCount = device.channel(ChannelName).LedCount();
	let RGBData = [];


	if(LightingMode  === "Forced"){
		RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline", "RBG");

	}else if(device.getLedCount() === 0){
		ChannelLedCount = DevicePulseLedCount;

		const pulseColor = device.getChannelPulseColor(ChannelName);
		RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline", "RBG");

	}else{
		RGBData = device.channel(ChannelName).getColors("Inline", "RBG");
	}

	return RGBData;
}

function isChannelActive(channelIdx) {
	const channelName = ChannelArray[channelIdx][0];

	return device.channel(channelName).LedCount();
}

export function onmoboSyncChanged(){
	SetMoboPassthrough(moboSync);
}

function SetMoboPassthrough(Enable){
	const packet = [0x30, Enable];
	sendControlPacket(COMMAND_ADDRESS, packet, 2);
	sendCommit();
}


function PollFans(){
	//Break if were not ready to poll
	if (Date.now() - savedPollFanTimer < PollModeInternal) {
		return;
	}

	savedPollFanTimer = Date.now();

	if(device.fanControlDisabled()){
		return;
	}

	for(let fan = 0; fan < 4; fan++){
		const rpm = readFanRPM(fan);
		device.log(`Fan ${fan}: ${rpm}rpm`);

		if(rpm > 0  && !ConnectedFans.includes(`Fan ${fan}`)){
			ConnectedFans.push(`Fan ${fan}`);
			device.createFanControl(`Fan ${fan}`);
		}

		if(FanMode === "SignalRGB" && ConnectedFans.includes(`Fan ${fan}`)){
			device.setRPM(`Fan ${fan}`, rpm);

			const newSpeed = device.getNormalizedFanlevel(`Fan ${fan}`) * 100;
			SetFanPercent(fan, newSpeed);
		}
	}
}


function readFanRPM(channel){
	const packet = readControlPacket(ChannelObjectArray[channel].fanRead, [], 2);

	return packet[0] | (packet[1] << 8);
}

function BurstFans(){
	if(device.fanControlDisabled()){
		return;
	}

	device.log("Bursting Fans for RPM based Detection");

	for(let Channel = 0; Channel < 4; Channel++){
		SetFanPercent(Channel, 75);
	}
}


function SetFanPercent(channel, percent){
	const rpm = Math.round(1900 * percent/100);
	device.log(`Setting Channel ${channel} to ${Math.round(percent)}% Fan Speed, UniFan rpm equivalent: ${rpm}`);
	SetFanRPM(channel, rpm);
}

function SetFanRPM(channel, rpm){
	const packet = [];
	packet[0] = rpm % 256;
	packet[1] = Math.floor(rpm / 256);
	//device.log(`Setting Channel ${channel} to ${rpm}rpm, [${packet[0]}, ${packet[1]}]`)
	sendControlPacket(ChannelObjectArray[channel].fanAction, packet, 2);

	packet[0] = 1;
	sendControlPacket(ChannelObjectArray[channel].fanCommit, packet, 1);
}


export function onFanModeChanged(){
	SetFanMode();
}

function SetFanMode(){

	if(FanMode === "SignalRGB"){
		//Set manual fan RPM control
		SendFanControlModePacket(LIAN_LI_FAN_MANUAL_MODE);

	}else{

		for(let channel = 0; channel < 4;channel++){
			const packet = [0];
			//Action address for PWM is the same as the commit for Manual RPM control
			sendControlPacket(ChannelObjectArray[channel].fanCommit, packet, 2);
			packet[0] = 1;
			sendControlPacket(ChannelObjectArray[channel].fanPMWCommit, packet, 1);
		}

		//Set PWM fan RPM control
		SendFanControlModePacket(LIAN_LI_FAN_PWM_MODE);
	}
}

function SendFanControlModePacket(mode){
	const packet = [LIAN_LI_COMMAND_FAN, mode];
	sendControlPacket(COMMAND_ADDRESS, packet, 2);
	sendCommit();
}

// Protocol Functions
function readControlPacket(index, data, length){
	//                  iType, iRequest, iValue, iReqIdx, pBuf, iLen, iTimeout
	return device.control_transfer(0xC0, 0x81, 0, index, data, length, 1000);
}

function sendControlPacket(index, data, length){
	//                  iType, iRequest, iValue, iReqIdx, pBuf, iLen, iTimeout
	device.control_transfer(0x40, 0x80, 0, index, data, length, 1000);
	//device.pause(1)

}

function sendCommit(){
	const packet = [0x01];
	//                  iType, iRequest, iValue, iReqIdx, pBuf, iLen, iTimeout
	device.control_transfer(0x40, 0x80, 0, COMMIT_ADDRESS, packet, 1, 1000);
	//device.pause(1)
}

// Helper Functions


export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/lian-li/fan-controllers/uni-hub-controller.png";
}
