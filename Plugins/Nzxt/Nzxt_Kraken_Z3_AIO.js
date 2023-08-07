export function Name() { return "NZXT Kraken Z3"; }
export function VendorId() { return 0x1E71; }
export function Documentation(){ return "troubleshooting/nzxt"; }
export function ProductId() { return 0x3008; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [4, 4]; }
export function DefaultPosition(){return [165, 60];}
export function DefaultScale(){return 7.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

export function DefaultComponentBrand() { return "NZXT";}

const DeviceMaxLedLimit = 40;
const MinimumSpeed = 25;

//Channel Name, Led Limit
const ChannelArray = [ ["Channel 1", 40] ];
const ConnectedFans = [];

let Pump_RPM;
let Pump_Speed;
let Fan_RPM;
let Fan_Speed;
let Liquid_Temp;

function SetupChannels(){
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++) {
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

export function Initialize() {
	SetupChannels();
	BurstFans();
}

export function Render() {
	PollFans();
	sendchannel1Colors(0);
}

export function Shutdown() {
	sendchannel1Colors(0, true);
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

	getStatus();//Grab all of our RPM's and make sure stuff is connected.

	const pump = 1;
	const pumprpm = Pump_RPM;
	device.log(`Pump RPM: ${pumprpm}`);

	if(pumprpm > 0) {
		device.createFanControl(`Pump ${pump}`);
	}

	device.setRPM(`Pump ${pump}`, pumprpm);

	const newSpeed = device.getNormalizedFanlevel(`Pump ${pump}`) * 100;
	setPumpSpeed(newSpeed);

	//We're leaving this here in case a user for some reason doesn't use the fan hub built into the Z series coolers.
	const fan = 1;
	const fanrpm = Fan_RPM;
	device.log(`Fan ${fan}: ${fanrpm}rpm`);

	if(fanrpm > 0 && !ConnectedFans.includes(`Fan ${fan}`)) {
		ConnectedFans.push(`Fan ${fan}`);
		device.createFanControl(`Fan ${fan}`);
	}

	if(ConnectedFans.includes(`Fan ${fan}`)) {
		device.setRPM(`Fan ${fan}`, fanrpm);

		const newSpeed = device.getNormalizedFanlevel(`Fan ${fan}`) * 100;
		SetFanSpeed(newSpeed);
	}
}

function BurstFans() {
	const BurstSpeed = 50;

	if(device.fanControlDisabled()) {
		return;
	}

	device.log("Bursting Fans for RPM based Detection");

	setPumpSpeed(BurstSpeed);
	SetFanSpeed(BurstSpeed);
}

function getStatus()//This gets temp, pump, and fan status.
{
	device.write([0x74, 0x01], 64);

	do {
		const packet = device.read([0x0], 64, 10);

		if(packet[0] == 0x75 && packet[1] == 0x01) {
			Liquid_Temp = packet[15] + packet[16]/10;
			Pump_RPM = packet[18] << 8 | packet[17];
			Pump_Speed = packet[19];
			Fan_RPM = packet[24] << 8 | packet[23];
			Fan_Speed = packet[25];
			device.log("Reported Pump Speed: " + Pump_Speed + " %");
			device.log("Reported Fan Speed: " + Fan_Speed + " %");
			device.log("Liquid Temperature: " + Liquid_Temp + " °C");
		}
	}
	while(device.getLastReadSize() > 0);
}

function SetFanSpeed(speed)//I'm leaving this as a separate function because the fans can do zero rpm
{

	const packet = [0x72, 0x02, 0x00, 0x00];

	for(let RPMBytes = 0; RPMBytes < 40; RPMBytes++) {
		const Offset = RPMBytes + 4;
		packet[Offset] = speed;
	}

	device.log(`Setting Kraken Fans to ${Math.round(speed)}% `);
	device.write(packet, 64);
}

function setPumpSpeed(speed) {

	const packet = [0x72, 0x01, 0x00, 0x00];

	for(let RPMBytes = 0; RPMBytes < 40; RPMBytes++) {
		const Offset = RPMBytes + 4;
		packet[Offset] = Math.max(speed, MinimumSpeed);
	}

	device.log(`Setting Kraken Pump to ${Math.round(speed)}% `);
	device.write(packet, 64);
}

function StreamLightingPacketChanneled(count, data, channel) {

	let packetNumber = 0;
	let totalLedCount = count;

	for(packetNumber = 0; packetNumber < 2; packetNumber++ ) {
		const ledsToSend = totalLedCount >= 60 ? 60 : totalLedCount;
		totalLedCount -= ledsToSend;

		const packet = [0x22, 0x10 | packetNumber, 0x01 << channel, 0x00];
		packet.push(...data.splice(0, ledsToSend));

		device.write(packet, 64);
	}
}

function sendchannel1Colors(Channel, shutdown = false) {
	let ChannelLedCount = device.channel(ChannelArray[Channel][0]).LedCount();
	const componentChannel = device.channel(ChannelArray[Channel][0]);

	if(!ChannelLedCount) {
		return;
	}
	let RGBData = [];

	if(LightingMode == "Forced") {
		RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline", "GRB");
	} else if(componentChannel.shouldPulseColors()) {

		ChannelLedCount = 40;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0], ChannelLedCount);
		RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline", "GRB");
	} else {
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline", "GRB");
	}

	StreamLightingPacketChanneled(ChannelLedCount*3, RGBData, Channel);
	SubmitLightingColors(Channel);
}

function SubmitLightingColors(channel) {
	const packet = [0x22, 0xA0, 1 << channel, 0x00, 0x01, 0x00, 0x00, 0x28, 0x00, 0x00, 0x80, 0x00, 0x32, 0x00, 0x00, 0x01];
	device.write(packet, 64);
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/nzxt/aio/kraken-z3-aio.png";
}