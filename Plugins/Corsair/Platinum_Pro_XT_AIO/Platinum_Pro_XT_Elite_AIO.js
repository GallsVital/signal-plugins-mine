export function Name() { return "Corsair Platinum/Pro XT/Elite Cooler"; }
export function VendorId() { return  0x1b1c; }
export function ProductId() { return Object.keys(PlatCooler.PIDLibrary); }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [5, 5]; }
export function DefaultPosition(){return [165, 60];}
export function DefaultScale(){return 6.0;}
/* global
LightingMode:readonly
shutdownColor:readonly
forcedColor:readonly
fanProfile:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"fanProfile",  "group":"", "label":"Pump Mode", "type":"combobox", "values":["Quiet", "Balanced", "Extreme"], "default":"Balanced"},
	];
}
export function DefaultComponentBrand() { return "Corsair";}
export function Documentation(){ return "troubleshooting/corsair"; }

const ConnectedFans = [];
const ConnectedProbes = [];
const DeviceMaxLedLimit = 32;

//Channel Name, Led Limit
const ChannelArray = [
	["Channel 1", 32],
];

function SetupChannels(){
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++){
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

export function LedNames() {
	return PlatCooler.getvLedNames();
}

export function LedPositions() {
	return PlatCooler.getvLedPositions();
}

export function Initialize() {
	SetupChannels();

	device.clearReadBuffer();
	PlatCooler.findSequence();
	PlatCooler.fetchLibrarySetup();
	PlatCooler.EnableSoftwareControl();
	burstFanTimer = Date.now(); //reset the Burst Fan Timer.
	burstFans(true); //send burst packet.
}

export function Render() {

	if(!PlatCooler.getFansInitialized()) {
		burstFans();

		return;
	}

	sendColor();
	device.pause(6);
	PollFans();

}

export function Shutdown() {
	sendColor(true);
}

export function onfanProfileChanged() {
	if(device.fanControlDisabled()){
		PlatCooler.sendCoolingProfile(PlatCooler.coolingProfiles[fanProfile]);
	} // This catches the fanMode prop not being present.
}

let savedPollFanTimer = Date.now();
let burstFanTimer = Date.now();
const PollModeInternal = 3000;

function burstFans(firstRun = false) {
	if(device.fanControlDisabled()){
		PlatCooler.setFansInitialized(true); //Makes it so that non-pro users can y'know use the aio with Signal.

		return;
	}

	if(firstRun) { //Only send this command once. No need to abuse the device.
		device.log("Bursting Fans!");
		PlatCooler.sendCoolingPacket(PlatCooler.deviceFanModes.fixedPWMWithFallback, 0xff, PlatCooler.deviceFanModes.fixedPWMWithFallback, 0xff, PlatCooler.coolingModes.balanced, true);
		PlatCooler.sendCoolingPacket(PlatCooler.deviceFanModes.fixedPWMWithFallback, 0xff, PlatCooler.deviceFanModes.fixedPWMWithFallback, 0xff, PlatCooler.coolingModes.balanced);
	}

	if(Date.now() - burstFanTimer > 15000) {
		PlatCooler.setFansInitialized(true);
	}
}

function PollFans() {
	//Break if were not ready to poll
	if (Date.now() - savedPollFanTimer < PollModeInternal) {
		return;
	}

	savedPollFanTimer = Date.now();

	const fanData = PlatCooler.getCoolingInfo(); //Why are we doing this you may ask? Because if I don't send a packet every like 10 seconds the cooler just nopes out.
	const liquidTemp = fanData[8];

	if(device.fanControlDisabled()){
		return;
	} // This catches the fanMode prop not being present.

	if(!ConnectedProbes.includes(0)){
		ConnectedProbes.push(0);
		device.createTemperatureSensor(`Liquid Temperature`);
	}

	if(liquidTemp !== 0) {
		device.SetTemperature(`Liquid Temperature`, liquidTemp);
	}

	const fanOutputData = [];


	for(let fan = 0; fan < PlatCooler.getNumberOfFans(); fan++) {
		const offset = 2* fan + 1;
		const rpm = fanData[offset];
		device.log(`Fan ${fan}: ${rpm}rpm`);

		if(rpm > 0 && !ConnectedFans.includes(`Fan ${fan}`)) {
			ConnectedFans.push(`Fan ${fan}`);
			device.createFanControl(`Fan ${fan}`);
		}

		if(ConnectedFans.includes(`Fan ${fan}`)) {
			device.setRPM(`Fan ${fan}`, rpm);

			const newSpeed = device.getNormalizedFanlevel(`Fan ${fan}`) * 100;
			fanOutputData.push(newSpeed);
		}
	}

	if(PlatCooler.getNumberOfFans() === 3) {
		PlatCooler.sendCoolingPacket(PlatCooler.deviceFanModes.fixedPWMWithFallback, Math.round(fanOutputData[2] /100 * 255), 0x00, 0x00, PlatCooler.coolingModes[fanProfile], true);
	}

	PlatCooler.sendCoolingPacket(PlatCooler.deviceFanModes.fixedPWMWithFallback, Math.round(fanOutputData[0] /100 * 255), PlatCooler.deviceFanModes.fixedPWMWithFallback, Math.round(fanOutputData[1] * 255 / 100), PlatCooler.coolingModes[fanProfile]);
}

let lastLoopRGBData = [];

function CompareArrays(array1, array2) {
	return array1.length === array2.length &&
    array1.every(function(value, index) { return value === array2[index];});
}

function sendColor(shutdown = false){

	let RGBdata = [];
	let TotalLedCount = 0;
	const vLedPositions = PlatCooler.getvLedPositions();
	const vLedIndexes = PlatCooler.getvLedIndexes();

	//Pump

	for(let iIdx = 0; iIdx < vLedIndexes.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		let col;

		if (shutdown) {
			col = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else{
			col = device.color(iPxX, iPxY);
		}

		RGBdata[vLedIndexes[iIdx]*3] = col[2];
		RGBdata[vLedIndexes[iIdx]*3+1] = col[1];
		RGBdata[vLedIndexes[iIdx]*3+2] = col[0];
		TotalLedCount += 1;
	}

	//Fans
	let ChannelLedCount = device.channel(ChannelArray[0][0]).LedCount();
	const componentChannel = device.channel(ChannelArray[0][0]);

	let ColorData = [];

	if(shutdown) {
		ColorData = device.createColorArray(shutdownColor, ChannelLedCount, "Inline", "BGR");
	} else if(LightingMode === "Forced"){
		ColorData = device.createColorArray(forcedColor, ChannelLedCount, "Inline", "BGR");

	}else if(componentChannel.shouldPulseColors()){
		ChannelLedCount = 32;

		const pulseColor = device.getChannelPulseColor(ChannelArray[0][0]);
		ColorData = device.createColorArray(pulseColor, ChannelLedCount, "Inline", "BGR");

	}else{
		ColorData = device.channel(ChannelArray[0][0]).getColors("Inline", "BGR");
	}

	RGBdata = RGBdata.concat(ColorData);
	TotalLedCount += ChannelLedCount;

	if(!CompareArrays(lastLoopRGBData, RGBdata)) {
		lastLoopRGBData = RGBdata;

		PlatCooler.SendColorPacket(0b100, RGBdata.slice(0, 60));
		device.pause(5);

		if(TotalLedCount > 20) {
			PlatCooler.SendColorPacket(0b101, RGBdata.slice(60, 120));
			device.pause(5);
		}

		if(TotalLedCount > 40) {
			PlatCooler.SendColorPacket(0b110, RGBdata.slice(120, 180));
			device.pause(5);
		}
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

class PlatinumProtocol {
	constructor() {

		this.PIDLibrary = {
			0x0C29 : "H60I",
			0x0C15 : "H100/H115I",
			0x0C17 : "H100/H115I",
			0x0C18 : "H100/H115I",
			0x0C19 : "H100/H115I",
			0x0C20 : "H100/H115I",
			0x0C21 : "H100/H115I",
			0x0C2E : "H100/H115I",
			0x0C35 : "H100/H115I",
			0x0C2F : "H150I",
			0x0C22 : "H150I",
			0x0C37 : "H150I"
		};
		this.nameLibrary = {
			0x0C29 : "H60I Pro XT",
			0x0C15 : "H100I Platinum",
			0x0C17 : "H115I Platinum",
			0x0C18 : "H100I Platinum",
			0x0C19 : "H100I Platinum SE",
			0x0C35 : "H100I Elite",
			0x0C20 : "H100I Pro XT",
			0x0C21 : "H115I Pro XT",
			0x0C2E : "H115I Pro XT",
			0x0C2F : "H150I Pro XT",
			0x0C22 : "H150I Pro XT",
			0x0C37 : "H150I Elite"
		};
		this.deviceLibrary = {
			"H60I" : {
				numberOfFans : 1,
				vLedNames : [
					"Ring 1", "Ring 2", "Ring 3",
					"Ring 4",           "Logo 1",           "Ring 5",
					"Ring 6",  "Logo 2",       "Logo 3",    "Ring 7",
					"Ring 8",  			"Logo 4",			"Ring 9",
					  "Ring 10", "Ring 11", "Ring 12"
				],
				vLedPositions : [
					[1, 0], [2, 0], [3, 0],
					[0, 1],         [2, 1],          [4, 1],
					[0, 2], [1, 2],         [3, 2],  [4, 2],
					[0, 3],         [2, 3],          [4, 3],
					[1, 4], [2, 4], [3, 4]
				],
				vLedIndexes : [
					10,  11,  12,
					9,      0,       13,
					8,    3,   1,    14,
					7,      2,       15,
					6,  5,  4,
				],
				size: [5, 5]
			},
			"H100/H115I" : {
				numberOfFans : 2,
				vLedNames : [
					"Ring 1", "Ring 2", "Ring 3",
					"Ring 4",           "Logo 1",           "Ring 5",
					"Ring 6",  "Logo 2",       "Logo 3",    "Ring 7",
					"Ring 8",  			"Logo 4",			"Ring 9",
					  "Ring 10", "Ring 11", "Ring 12"
				],
				vLedPositions : [
					[1, 0], [2, 0], [3, 0],
					[0, 1],         [2, 1],          [4, 1],
					[0, 2], [1, 2],         [3, 2],  [4, 2],
					[0, 3],         [2, 3],          [4, 3],
					[1, 4], [2, 4], [3, 4]
				],
				vLedIndexes : [
					10,  11,  12,
					9,      0,       13,
					8,    3,   1,    14,
					7,      2,       15,
					6,  5,  4,
				],
				size: [5, 5]
			},
			"H150I" : {
				numberOfFans : 3,
				vLedNames : [
					"Ring 1", "Ring 2", "Ring 3",
					"Ring 4",           "Logo 1",           "Ring 5",
					"Ring 6",  "Logo 2",       "Logo 3",    "Ring 7",
					"Ring 8",  			"Logo 4",			"Ring 9",
					      	"Ring 10", "Ring 11", "Ring 12"
				],
				vLedPositions : [
					[1, 0], [2, 0], [3, 0],
					[0, 1],         [2, 1],          [4, 1],
					[0, 2], [1, 2],         [3, 2],  [4, 2],
					[0, 3],         [2, 3],          [4, 3],
					[1, 4], [2, 4], [3, 4]
				],
				vLedIndexes : [
					10,  11,  12,
					9,      0,       13,
					8,    3,   1,    14,
					7,      2,       15,
					6,  5,  4,
				],
				size: [5, 5]
			}
		};

		this.deviceFanModes = {
			defaultLiquidTemp : 0x00,
			defaultExternalProbe : 0x01,
			fixedPWM : 0x02,
			fixedPWMWithFallback : 0x03,
			fixedRPM : 0x04,
			fixedRPMWithFallback : 0x05,
			defaultCPUTempLiquid : 0x06,
			defaultCPUTempExternalProbe : 0x07,
			null : 0xff,
			0x00 : "Default Liquid Temp Probe",
			0x01 : "Default External Probe",
			0x02 : "Fixed PWM",
			0x03 : "Fixed PWM With Safety Fallback",
			0x04 : "Fixed RPM",
			0x05 : "Fixed RPM With Safety Fallback",
			0x06 : "Default CPU/GPU + Liquid Temp Probe",
			0x07 : "Default CPU/GPU + External Temp Probe"
		};

		this.settingsType = {
			undefined : 0x00,
			watchdog : 0x01,
			pump : 0x02,
			fan : 0x03,
			fanSafetyProfile : 0x08,
			saveToFlash : 0x10
		};

		this.packetStatusCodes = {
			success : 0x00,
			tempFail : 0x01,
			tumpFail : 0x02,
			savingSettings : 0x08,
			sequenceError : 0x10,
			crcError : 0x20,
			cipherError : 0x40,
			0x00 : "Success",
			0x01 : "Temperature Failure",
			0x02 : "Pump Failure",
			0x08 : "Saving Settings",
			0x10 : "Sequence Error", //Ergo you screwed up the sequence system
			0x20 : "CRC Error",
			0x40 : "Cipher Error"
		};

		this.coolingModes = {
			"Quiet" : 0x00,
			"Balanced" : 0x01,
			"Extreme" : 0x02,
			0x00 : "Quiet",
			0x01 : "Balanced",
			0x02 : "Extreme/Performance"
		};

		this.responseTypes = {
			deviceName : 0x00,
			firmwareVersion : 0x01,
			failsafeState : 0x02,
			temp : 0x03,
			pumpMode : 0x04,
			pumpPower : 0x05,
			pumpSpeed : 0x06,
			fanMode : 0x07,
			fanPower : 0x08,
			fanSpeed : 0x09,
			firmwarePercent : 0x0A,
			firmwareError : 0x0B,
			led : 0x0C,
			cujoGPUStatus : 0x0D,
			model : 0x0E,
			notifyLongRunningTask : 0x0F,
			switchToHardwareModeComplete : 0x10
		};

		this.coolingProfiles = {
			"Balanced" : [0x01, 0xFF, 0xFF, 0x00, 0x00, 0xFF, 0x07, 0x1D, 0x33, 0x1E, 0x40, 0x1F, 0x4D, 0x20, 0x73, 0x21, 0xAD, 0x22, 0xD9, 0x23, 0xFF, 0x1D, 0x33, 0x1E, 0x40, 0x1F, 0x4D, 0x20, 0x73, 0x21, 0xAD, 0x22, 0xD9, 0x23, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x5F],
			"Extreme"  : [0x02, 0xFF, 0xFF, 0x00, 0x00, 0xFF, 0x07, 0x1C, 0x4D, 0x1D, 0x59, 0x1E, 0x80, 0x1F, 0xB3, 0x20, 0xCC, 0x21, 0xE6, 0x22, 0xFF, 0x1C, 0x4D, 0x1D, 0x59, 0x1E, 0x80, 0x1F, 0xB3, 0x20, 0xCC, 0x21, 0xE6, 0x22, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
			"Quiet"    : [0x00, 0xFF, 0xFF, 0x00, 0x00, 0xFF, 0x07, 0x1E, 0x33, 0x20, 0x40, 0x23, 0x73, 0x25, 0xA1, 0x27, 0xB8, 0x29, 0xCF, 0x2A, 0xFF, 0x1E, 0x33, 0x20, 0x40, 0x23, 0x73, 0x25, 0xA1, 0x27, 0xB8, 0x29, 0xCF, 0x2A, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x03] //These are all of the profile points for temp.
		};

		this.config = {
			numberOfFans : 0,
			vLedNames : [],
			vLedPositions : [],
			vLedIndexes : [],
			deviceSize : [0, 0],
			seq : 8,
			fansInitialized : false,
		};

		this.crcTable = [ 0, 7, 14, 9, 28, 27, 18, 21, 56, 63, 54, 49, 36, 35, 42, 45, 112, 119, 126, 121, 108, 107, 98, 101, 72, 79, 70, 65, 84, 83, 90, 93, 224, 231, 238, 233, 252, 251, 242, 245, 216, 223, 214, 209, 196, 195, 202, 205, 144, 151, 158, 153, 140, 139, 130, 133, 168, 175, 166, 161, 180, 179, 186, 189, 199, 192, 201, 206, 219, 220, 213, 210, 255, 248, 241, 246, 227, 228, 237, 234, 183, 176, 185, 190, 171, 172, 165, 162, 143, 136, 129, 134, 147, 148, 157, 154, 39, 32, 41, 46, 59, 60, 53, 50, 31, 24, 17, 22, 3, 4, 13, 10, 87, 80, 89, 94, 75, 76, 69, 66, 111, 104, 97, 102, 115, 116, 125, 122, 137, 142, 135, 128, 149, 146, 155, 156, 177, 182, 191, 184, 173, 170, 163, 164, 249, 254, 247, 240, 229, 226, 235, 236, 193, 198, 207, 200, 221, 218, 211, 212, 105, 110, 103, 96, 117, 114, 123, 124, 81, 86, 95, 88, 77, 74, 67, 68, 25, 30, 23, 16, 5, 2, 11, 12, 33, 38, 47, 40, 61, 58, 51, 52, 78, 73, 64, 71, 82, 85, 92, 91, 118, 113, 120, 127, 106, 109, 100, 99, 62, 57, 48, 55, 34, 37, 44, 43, 6, 1, 8, 15, 26, 29, 20, 19, 174, 169, 160, 167, 178, 181, 188, 187, 150, 145, 152, 159, 138, 141, 132, 131, 222, 217, 208, 215, 194, 197, 204, 203, 230, 225, 232, 239, 250, 253, 244, 243 ];
		//we love CRC's
	}

	getNumberOfFans() { return this.config.numberOfFans; }
	setNumberOfFans(numberOfFans) { this.config.numberOfFans = numberOfFans; }

	getvLedNames() { return this.config.vLedNames; }
	setvLedNames(vLedNames) { this.config.vLedNames = vLedNames; }

	getvLedPositions() { return this.config.vLedPositions; }
	setvLedPositions(vLedPositions) { this.config.vLedPositions = vLedPositions; }

	getvLedIndexes() { return this.config.vLedIndexes; }
	setvLedIndexes(vLedIndexes) { this.config.vLedIndexes = vLedIndexes; }

	getSize() { return this.config.deviceSize; }
	setSize(deviceSize) { this.config.deviceSize = deviceSize; }

	getFansInitialized() { return this.config.fansInitialized; }
	setFansInitialized(fansInitialized) { this.config.fansInitialized = fansInitialized; }

	fetchLibrarySetup() {
		const library = this.deviceLibrary[this.PIDLibrary[device.productId()]];
		this.setvLedNames(library.vLedNames);
		this.setvLedPositions(library.vLedPositions);
		this.setvLedIndexes(library.vLedIndexes);
		this.setNumberOfFans(library.numberOfFans);
		this.setSize(library.size);

		device.setControllableLeds(this.config.vLedNames, this.config.vLedPositions);
		device.setSize(this.getSize());
		device.setName(this.nameLibrary[device.productId()]);
	}

	calculateCRC(data, start, end) {
		let crcResult = 0;

		for(let index = start; index <= end; index++) {
			crcResult = this.crcTable[crcResult ^ data[index]];
		}

		return crcResult;
	}

	getPacketSequence() {
		this.config.seq += 8;

		if(this.config.seq === 256) {
			this.config.seq = 8;
		}

		return this.config.seq;
	}

	sendPacketWithResponse(packet, callingFunction) {
		packet[64] = this.calculateCRC(packet, 2, 63);
		device.write(packet, 65);

		const returnPacket = device.read(packet, 65);

		if(returnPacket[5] !== 0){
			device.log(`Device Status: ${this.packetStatusCodes[returnPacket[5]]} from ${callingFunction}`);
			device.clearReadBuffer();
			device.pause(50);
		}
	}

	findSequence() {
		let attempts = 0;
		let errorCode = this.fetchDeviceInfo();

		while(errorCode !== 0 && attempts < 10) {
			errorCode = this.fetchDeviceInfo();
			attempts++;
		}

		if(attempts < 32) {
			device.log("Successfully Found Device Sequence!", {toFile : true});
		} else { device.log("Failed to find Device Sequence.", {toFile : true}); }
	}

	fetchDeviceInfo() {
		const packet = [0x00, 0x3f, this.getPacketSequence(), 0xff, 0x00];
		packet[64] = this.calculateCRC(packet, 2, 63);

		device.write(packet, 65);

		const returnPacket = device.read(packet, 65);

		device.log(`Device Firmware Version: ${returnPacket[3] >> 4}.0${returnPacket[3] & 0xf}.${returnPacket[4] & 15}`);
		device.log(`Device Status: ${this.packetStatusCodes[returnPacket[5]]}`);
		device.log(`Packet Count: ${returnPacket[6]}`);
		device.log(`Packet Countdown Timeout: ${returnPacket[7]}`);
		device.log(`Liquid Temp: ${((BinaryUtils.ReadInt16LittleEndian([returnPacket[8], returnPacket[9]]) / 25.6 + 0.5) / 10).toFixed(2)} C`);
		device.log(`Fan 1 Index: ${returnPacket[10]}`);
		device.log(`Fan 1 Mode: ${this.deviceFanModes[returnPacket[11]]}`);
		device.log(`Fan 1 Set Duty: ${(returnPacket[12] / 255 * 100).toFixed(2)}%`);
		device.log(`Fan 1 Set RPM: ${returnPacket[13] + (returnPacket[14] << 8)}`);
		device.log(`Fan 1 Duty: ${(returnPacket[15] / 255 * 100).toFixed(2)}%`);
		device.log(`Fan 1 RPM: ${returnPacket[16] + (returnPacket[17] << 8)}`);
		device.log(`Fan 2 Index: ${returnPacket[17]}`);
		device.log(`Fan 2 Mode: ${this.deviceFanModes[returnPacket[18]]}`);
		device.log(`Fan 2 Set Duty: ${(returnPacket[19] / 255 * 100).toFixed(2)}%`);
		device.log(`Fan 2 Set RPM: ${returnPacket[20] + (returnPacket[21] << 8)}`);
		device.log(`Fan 2 Duty: ${(returnPacket[22] / 255 * 100).toFixed(2)}%`);
		device.log(`Fan 2 RPM: ${returnPacket[23] + (returnPacket[24] << 8)}`);
		device.log(`Pump Mode: ${this.coolingModes[returnPacket[25]]}`);
		device.log(`Pump Set Duty: ${(returnPacket[26] / 255 * 100).toFixed(2)}%`);
		device.log(`Pump Set RPM: ${returnPacket[27] + (returnPacket[28] << 8)}`);
		device.log(`Pump Duty: ${(returnPacket[29] / 255 * 100).toFixed(2)}%`);
		device.log(`Pump RPM: ${returnPacket[30] + (returnPacket[31] << 8)}`);
		device.log(`Fan 3 Index: ${returnPacket[38]}`);
		device.log(`Fan 3 Mode: ${this.deviceFanModes[returnPacket[39]]}`);
		device.log(`Fan 3 Set Duty: ${(returnPacket[40] / 255 * 100).toFixed(2)}%`);
		device.log(`Fan 3 Set RPM: ${returnPacket[41] + (returnPacket[42] << 8)}`);
		device.log(`Fan 3 Duty: ${(returnPacket[43] / 255 * 100).toFixed(2)}%`);
		device.log(`Fan 3 RPM: ${returnPacket[44] + (returnPacket[45] << 8)}`);
		device.log(`Device go Boom State: ${returnPacket[63]}`);

		return returnPacket[5];
	}

	getCoolingInfo() {
		const packet = [0x00, 0x3f, this.getPacketSequence(), 0xff, 0x00];
		packet[64] = this.calculateCRC(packet, 2, 63);

		device.write(packet, 65);

		const returnPacket = device.read(packet, 65);
		const fan1Duty = (returnPacket[15] / 255 * 100).toFixed(2);
		const fan1RPM = returnPacket[16] + (returnPacket[17] << 8);
		const fan2Duty = (returnPacket[22] / 255 * 100).toFixed(2);
		const fan2RPM = returnPacket[23] + (returnPacket[24] << 8);
		const fan3Duty = (returnPacket[43] / 255 * 100).toFixed(2);
		const fan3RPM = returnPacket[44] + (returnPacket[45] << 8);
		const pumpMode = this.coolingModes[returnPacket[25]];
		const pumpRPM = returnPacket[30] + (returnPacket[31] << 8);
		const liquidTemp = ((BinaryUtils.ReadInt16LittleEndian([returnPacket[8], returnPacket[9]]) / 25.6 + 0.5) / 10).toFixed(2);
		device.log(`Device Status: ${this.packetStatusCodes[returnPacket[5]]}`);
		device.log(`Liquid Temp: ${liquidTemp} C`);

		device.log(`Fan 1 Duty: ${fan1Duty}%`);
		device.log(`Fan 1 RPM: ${fan1RPM}`);

		if(PlatCooler.getNumberOfFans() > 1) {

			device.log(`Fan 2 Duty: ${fan2Duty}%`);
			device.log(`Fan 2 RPM: ${fan2RPM}`);

			if(PlatCooler.getNumberOfFans() > 2) {

				device.log(`Fan 3 Duty: ${fan3Duty}%`);
				device.log(`Fan 3 RPM: ${fan3RPM}`);

			}
		}

		device.log(`Pump Mode: ${pumpMode}`);
		device.log(`Pump RPM: ${pumpRPM}`);

		return [fan1Duty, fan1RPM, fan2Duty, fan2RPM, fan3Duty, fan3RPM, pumpMode, pumpRPM, liquidTemp];
	}

	sendCoolingProfile(profileData){

		const packet = [0x00, 0x3F, this.getPacketSequence(), 0x14, 0x00, 0xFF, 0x05, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].concat(profileData);

		this.sendPacketWithResponse(packet, "Cooling Profile Set");
	}

	SendColorPacket(command, data){
		const packet = [0x00, 0x3F, this.getPacketSequence() | command].concat(data);
		this.sendPacketWithResponse(packet, "Color Packet");
	}

	sendCoolingPacket(fan1Mode, fan1Duty, fan2Mode, fan2Duty, pumpMode, fan3 = false) {
		if(fan3) {
			const packetFill = new Array(65).fill(0xff);
			const packet = [0x00, 0x3F, this.getPacketSequence() | 0b011, 0x14, 0x00, 0xFF, 0x05, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, fan1Mode, 0x00, 0x00, 0x00, 0x00, fan1Duty].concat(packetFill);
			this.sendPacketWithResponse(packet, "3rd Fan Cooling Packet");
		} else {
			const packetFill = new Array(65).fill(0xff);

			const packet = [0x00, 0x3F, this.getPacketSequence() | 0b000, 0x14, 0x00, 0xFF, 0x05, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, fan1Mode, 0x00, 0x00, 0x00, 0x00, fan1Duty, fan2Mode, 0x00, 0x00, 0x00, 0x00, fan2Duty, pumpMode, 0xff, 0xff, 0x00, 0x00].concat(packetFill);
			packet[30] = 0x07;
			this.sendPacketWithResponse(packet, "Cooling Packet");
		}

	}

	EnableSoftwareControl() {
		this.SendColorPacket(0b001,
			[ 0x01, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F, 0x7F, 0x7F, 0x7F, 0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0xFF,
				0xFF, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
				0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
		this.SendColorPacket(0b010,
			[ 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A,
				0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
				0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
		this.SendColorPacket(0b011,
			[ 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42,
				0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E, 0x4F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
				0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
	}
}

const PlatCooler = new PlatinumProtocol();

class BinaryUtils {
	static WriteInt16LittleEndian(value) {
		return [value & 0xFF, (value >> 8) & 0xFF];
	}
	static WriteInt16BigEndian(value) {
		return this.WriteInt16LittleEndian(value).reverse();
	}
	static ReadInt16LittleEndian(array) {
		return (array[0] & 0xFF) | (array[1] & 0xFF) << 8;
	}
	static ReadInt16BigEndian(array) {
		return this.ReadInt16LittleEndian(array.slice(0, 2).reverse());
	}
	static ReadInt32LittleEndian(array) {
		return (array[0] & 0xFF) | ((array[1] << 8) & 0xFF00) | ((array[2] << 16) & 0xFF0000) | ((array[3] << 24) & 0xFF000000);
	}
	static ReadInt32BigEndian(array) {
		if (array.length < 4) {
			array.push(...new Array(4 - array.length).fill(0));
		}

		return this.ReadInt32LittleEndian(array.slice(0, 4).reverse());
	}
	static WriteInt32LittleEndian(value) {
		return [value & 0xFF, ((value >> 8) & 0xFF), ((value >> 16) & 0xFF), ((value >> 24) & 0xFF)];
	}
	static WriteInt32BigEndian(value) {
		return this.WriteInt32LittleEndian(value).reverse();
	}
}

export function Image() {
	return "iVBORw0KGgoAAAANSUhEUgAAA+gAAAH0CAYAAAHZLze7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAJBmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAyLTExVDE2OjAyOjMxLTA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTAyLTExVDE2OjM5OjU2LTA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMi0xMVQxNjozOTo1Ni0wODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2ZjQzYjZjMi1hNzdhLTM1NDMtOTRiMy1mZjI1MTVjOTMwODciIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpkYTlkNDNkYy0xM2Y5LTYyNGItYmZmYS0xODQzMTFkNGVmNmEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplM2NhM2U0YS1mY2I2LTU3NGUtYjkzMy1mM2U3ZjUxNjgwYzUiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmUzY2EzZTRhLWZjYjYtNTc0ZS1iOTMzLWYzZTdmNTE2ODBjNSIgc3RFdnQ6d2hlbj0iMjAyMS0wMi0xMVQxNjowMjozMS0wODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoxOTY1ZWM1NS03Yzk0LTI4NGItOTQwMi1mM2Y2ZDcyZDU0NWIiIHN0RXZ0OndoZW49IjIwMjEtMDItMTFUMTY6MDI6MzEtMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmY0M2I2YzItYTc3YS0zNTQzLTk0YjMtZmYyNTE1YzkzMDg3IiBzdEV2dDp3aGVuPSIyMDIxLTAyLTExVDE2OjM5OjU2LTA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPjE1MkQzMDkyQUMzMDRFQjY1RjQ1QTc3QUMy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";
}