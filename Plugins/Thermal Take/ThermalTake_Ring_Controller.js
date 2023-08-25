export function Name() { return "ThermalTake Riing Controller"; }
export function VendorId() { return 0x264A; }
export function ProductId() { return [0x2135, 0x2136, 0x2137]; } //will need to be changed based on PID shown in USB/PCI Info
export function Publisher() { return "ButtonBright"; }
export function Size() { return [1, 1]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

const vLedNames = [];
const vLedPositions = [];
const ConnectedFans = [];

export function SubdeviceController(){ return true; }
const DeviceMaxLedLimit = 270;

//Channel Name, Led Limit
/** @type {ChannelConfigArray} */
const ChannelArray =
[
	["Channel 1", 54, 54],
	["Channel 2", 54, 54],
	["Channel 3", 54, 54],
	["Channel 4", 54, 54],
	["Channel 5", 54, 54],
];

function SetupChannels() {
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++) {
		const channelInfo = ChannelArray[i];

		if(channelInfo){
			device.addChannel(...channelInfo);
		}
	}
}

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	SetupChannels();

	device.write([0x00, 0xFE, 0x33], 193);
	device.read([0x00, 0xFE, 0x33], 193);

	BurstFans();
}

export function Render() {
	for (let channel = 0; channel < 5; channel++) {
		Sendchannel(channel);
	}

	PollFans();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		for (let channel = 0; channel < 5; channel++) {
			Sendchannel(channel, "#000000"); // Go Dark on System Sleep/Shutdown
		}
	}else{
		device.pause(2000);
	}

}

let n = 0;

function Sendchannel(Channel, overrideColor) {
	let ChannelLedCount = device.channel(ChannelArray[Channel][0]).ledCount;
	const componentChannel = device.channel(ChannelArray[Channel][0]);

	let RGBData = [];

	if(overrideColor){
		RGBData = device.createColorArray(overrideColor, ChannelLedCount, "Inline", "GRB");
	}else if(LightingMode === "Forced") {
		RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline", "GRB");

	} else if(componentChannel.shouldPulseColors()) {
		ChannelLedCount = 40;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0]);
		RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline", "GRB");

	} else {
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline", "GRB");
	}

	if(n <=1){
					   sendDirectPacket(Channel, RGBData);
					   n = n + 1;
				   }else{
					   sendDirectPacket2(Channel, RGBData);
					   n = n -1;
				   }
}

function sendDirectPacket(channel, data){

	let packet = [0x00, 0x32, 0x52, channel + 1, 0x24, 0x03, 0x01, 0x00];
	packet = packet.concat(data);
	device.write(packet, 128);
	device.read(packet, 64, 10);
}

function sendDirectPacket2(channel, data){

	let packet = [];
	packet[0x00] = 0x00;
	packet[0x01] = 0x32;
	packet[0x02] = 0x52;
	packet[0x03] = channel + 1;
	packet[0x04] = 0x24;
	packet[0x05] = 0x03;
	packet[0x06] = 0x02;
	packet[0x07] = 0x00;
	packet = packet.concat(data);
	device.write(packet, 128);
	device.read(packet, 64);
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

	device.clearReadBuffer();

	for(let fan = 0; fan < 5; fan++) {
		const rpm = readFanRPM(fan);
		device.log(`Fan ${fan}: ${rpm}rpm`);

		if(rpm > 0  && !ConnectedFans.includes(`Fan ${fan}`)) {
			ConnectedFans.push(`Fan ${fan}`);
			device.createFanControl(`Fan ${fan}`);
		}

		if(ConnectedFans.includes(`Fan ${fan}`)) {
			device.setRPM(`Fan ${fan}`, rpm);

			const newSpeed = device.getNormalizedFanlevel(`Fan ${fan}`) * 100;
			SetFanPercent(fan, newSpeed);
		}
	}
}


function BurstFans() {
	if(device.fanControlDisabled()) {
		return;
	}

	device.log("Bursting Fans for RPM based Detection");

	for(let Channel = 0; Channel < 5; Channel++) {
		SetFanPercent(Channel, 75);
	}
}


function SetFanPercent(channel, FanSpeedPercent) {
	const packet = [0x00, 0x32, 0x51, channel + 1, 0x01, FanSpeedPercent];
	device.write(packet, 65);
	device.read(packet, 64, 10);
}

function readFanRPM(channel) {
	const FanData = [];

	let packet = [0x00, 0x33, 0x51, channel + 1];
	device.write(packet, 65);
	packet = device.read(packet, 64, 10);

	const RPM = (packet[7] << 8) + packet[6];
	FanData.push(`Fan ${channel} ${RPM}`);

	return RPM;
}

export function Validate(endpoint) {
	return endpoint.interface === -1 || endpoint.interface === 0;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/razer/misc/basestation-chroma.png";
}
