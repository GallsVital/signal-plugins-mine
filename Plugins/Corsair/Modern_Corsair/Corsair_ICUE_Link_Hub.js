export function Name() { return "Corsair ICUE Link Device"; }
export function VendorId() { return 0x1b1c; }
export function ProductId() { return Object.keys(CorsairLibrary.ProductIDList()); }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/corsair"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [225, 120];}
export function DefaultScale(){return 7.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
ConnectedFans:readonly
FanControllerArray:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

export function SubdeviceController() { return true; }
export function SupportsFanControl(){ return true; }
// Use the CorsairLink mutex any time this device is rendering.
// if we don't our reads may be ruined by other programs
export function UsesCorsairMutex(){ return true; }

/** @type {CorsairBragiController | undefined} */
let BragiController;

/** @type {Options} */
const options = {
	developmentFirmwareVersion: "0.1.3",
};

/** @param {HidEndpoint} endpoint */
export function Validate(endpoint) {
	return (endpoint.interface === 0 && endpoint.usage === 0x0001 && endpoint.usage_page === 0xFF42) ||
	(endpoint.interface === 1 && endpoint.usage === 0x0002 && endpoint.usage_page === 0xFF42);
}

let ConnectedFans = []; //The fact that I only use these for an initial check is kind of dumb. They just float around here as we use the object arrays to more quickly access and store the values we need.
const ConnectedProbes = [];

let deviceFanArray = [];
let deviceTempSensorArray = [];

export function Initialize() {
	if(StateMgr.states.length === 0){
		StateMgr.Push(new StateSetFanSpeeds(StateMgr));
		StateMgr.Push(new StatePollTempProbes(StateMgr));
		StateMgr.Push(new StatePollFanSpeeds(StateMgr));
	}

	device.set_endpoint(0x00, 0x01, 0xFF42);
	Corsair.SetMode("Software", 0x01);

	Corsair.FetchDeviceInformation(0x01);
	burstFansAndFindSensors();
	fetchChildDeviceSupport();

	//Corsair.WriteToEndpoint("Background", Corsair.endpoints.FanSpeeds, [0x07, 0x00, 0x03, 0x08, 0x00, 0x55, 0x00, 0x09, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00], 0x01)
	//Corsair.WriteToEndpoint(1, 0x37, [0x35, 0x00, 0x02, 0x09], 0x01); //Something something time warp
	//device.write([0x00, 0x00, 0x01, 0x15, 0x01], 513);
	//device.read([0x00, 0x00, 0x01, 0x15, 0x01], 513); confirm for above command.
	//device.write([0x00, 0x00, 0x01, 0x0d, 0x01, 0x6c, 0x6d], 513);
	//device.read([0x00, 0x00, 0x01, 0x0d, 0x01, 0x6c, 0x6d], 513);
	//device.write([0x00, 0x00, 0x01, 0x06, 0x01, 0x0b, 0x00, 0x00, 0x00, 0x31, 0x00, 0x08, 0x04, 0x04, 0x00, 0x00, 0x03, 0x08, 0x09, 0x0a], 513); //this direct seems to set time warp with the other command above
	//device.write([0x00, 0x00, 0x01, 0x06, 0x01, 0x0b, 0x00, 0x00, 0x00, 0x31, 0x00, 0x08, 0x04, 0x04, 0x00, 0x00, 0x03, 0x08, 0x09, 0x0a], 513);
}

export function Render() {
	if(BragiController) {
		UpdateRGB();
		device.pause(3);
		StateMgr.process();
		device.pause(3);
	}
}

export function Shutdown() {
	Corsair.SetMode("Hardware", 1);
}

function burstFansAndFindSensors() {

	fetchTempSensors(true); //These are a decently reliable thing to use as they should never return 0.00 realistically on init.

	if(device.fanControlDisabled()) {
		// Reset if the system was disbled during runtime.
		device.log("System Monitoring disabled, Clearing Connected Fans", {toFile: true});
		ConnectedFans = [];

		return;
	}

	const fanIdArray = [];

	for(let fans = 0; fans < ConnectedProbes.length; fans++) { //We can use the number of connected probes to figure out the maximum number of possible fans connected.
		fanIdArray.push(fans+8); //8 seems to be the first possible device ID, so we'll offset by 8.
	}

	Corsair.SetInitialFanSpeeds(fanIdArray, 0x01);
	device.pause(1000);
	device.pause(1000);

	parseFanRPMs(true);
}

function createSensors() {
	for(const [key, value] of BragiController.children) {
		const childDevice = value;

		if(childDevice.rpmId !== -1) {
			deviceFanArray.push({
				name : `${childDevice.name} - ${childDevice.childDeviceIDString}`,
				rpmId : childDevice.rpmId,
				deviceType: childDevice.deviceType
			});
			device.createFanControl(`${childDevice.name} - ${childDevice.childDeviceIDString}`);

			device.log(`Found RPM ${childDevice.name} - ${childDevice.childDeviceIDString}`);
		}

		if(childDevice.sensorId !== -1) {
			deviceTempSensorArray.push({
				name : `${childDevice.name} - ${childDevice.childDeviceIDString}`,
				sensorId : childDevice.sensorId
			});
			device.createTemperatureSensor(`${childDevice.name} - ${childDevice.childDeviceIDString}`);

			device.log(`Found Sensor ${childDevice.name} - ${childDevice.childDeviceIDString}`);
		}
	}

	if(deviceFanArray.length > 0) { return true; }

	return false;
}

function fetchTempSensors(firstRun = false) {
	const tempSensorArray = Corsair.FetchTemperatures(0x01);
	const validSensorArray = [];
	const validSensorPositions = [];

	for(let sensors = 0; sensors < tempSensorArray.length; sensors++) {
		if(tempSensorArray[sensors] !== 0) {
			validSensorArray.push(tempSensorArray[sensors]);
			validSensorPositions.push(sensors);

			if(firstRun) {
				ConnectedProbes.push(sensors);
			}
		}
	}

	return [validSensorArray, validSensorPositions];
}

function parseFanRPMs(firstRun = false) {
	const fanRPMArray = Corsair.FetchFanRPM(0x01);

	const validRPMArray = [];
	const validRPMPositions = [];

	for(let sensors = 0; sensors < fanRPMArray.length; sensors++) {
		if(fanRPMArray[sensors] !== 0 || (!firstRun && ConnectedFans.includes(sensors))) {
			validRPMArray.push(fanRPMArray[sensors]);
			validRPMPositions.push(sensors);

			if(firstRun) {
				ConnectedFans.push(sensors);
				ConnectedProbes.push(sensors);
			}
		}
	}

	return [validRPMArray, validRPMPositions];
}

function fetchChildDeviceSupport() {
	if(Corsair.IsPropertySupported(Corsair.properties.subdeviceBitmask)){
		device.log(`Controller detected!`, {toFile : true});

		if(!BragiController){
			BragiController = new CorsairBragiController();
			fetchLinkDevices();
		}
	}
}

function fetchLinkDevices() {
	const childDevicePacket = Corsair.ReadFromEndpoint(0, 0x36, 0x01);
	const childDeviceArray = [];

	device.log(`Child Device Packet ${childDevicePacket}`, {toFile : true});

	for(let bytes = 8; bytes < childDevicePacket.length; bytes++) {
		if(childDevicePacket[bytes] === 0x00 && childDevicePacket[bytes + 1] === 0x00 && childDevicePacket[bytes + 2] !== 0x00) {
			if(childDevicePacket[bytes + 4] === 0x00 && childDevicePacket[bytes + 5] === 0x00) {
				device.log(`Possible Child Device Found with Device Type ${childDevicePacket[bytes + 2]}`, {toFile : true});

				const childDeviceID = childDevicePacket.slice(bytes, bytes + 34);
				childDeviceArray.push({
					deviceType : childDevicePacket[bytes + 2],
					deviceID: childDeviceID,
					coolerType: childDevicePacket[bytes + 3]
				});
				bytes = bytes + 33;
			}
		}
	}

	convertChildIdsToNames(childDeviceArray);
}

function convertChildIdsToNames(childDeviceArray) {
	const uniqueIdArray = [];
	const convertedChildDeviceArray = [];

	for(let childDevices = 0; childDevices < childDeviceArray.length; childDevices++) {
		const idArray = childDeviceArray[childDevices].deviceID;
		const idCharacterArray = [];
		const uniqueCharacterArray = [];

		for(let bytes = 8; bytes < idArray.length; bytes++) {
			if(bytes >= idArray.length - 8) {
				uniqueCharacterArray.push(idArray[bytes]);
			} else {
				idCharacterArray.push(idArray[bytes]);
			}
		}

		const childDeviceIDString = String.fromCharCode(...idCharacterArray);
		const childDeviceUniqueIDString = String.fromCharCode(...uniqueCharacterArray);
		device.log(`Converted Device ID for Child Device ${childDevices+1}: ${childDeviceIDString}`, {toFile : true});
		device.log(`Converted Unique ID for Child Device ${childDevices+1}: ${childDeviceUniqueIDString}`, {toFile : true});

		convertedChildDeviceArray.push({
			deviceType: childDeviceArray[childDevices].deviceType,
			IDString: childDeviceIDString,
			coolerType: childDeviceArray[childDevices].coolerType
		});
		uniqueIdArray.push(childDeviceUniqueIDString);
	}

	for(let childDevices = 0; childDevices < convertedChildDeviceArray.length; childDevices++) {
		addChildDevice(convertedChildDeviceArray[childDevices], uniqueIdArray[childDevices], childDevices);
	}
}

function addChildDevice(childDevice, uniqueId, deviceNumber) {
	let deviceConfig;

	if(childDevice.deviceType === 7) {//if it starts with 02 and ends with 6103 then it's a cooler.
		device.log(`Child Cooler ID: ${childDevice.IDString}`, {toFile : true});

		if(childDevice.IDString.includes("02") && childDevice.IDString.includes("03")) {
			device.log(`Adding Child Cooler ${childDevice.IDString}`, {toFile : true});
			deviceConfig = CorsairLibrary.GetDeviceByCorsairLinkCoolerId(childDevice.coolerType);
		}
	} else if(childDevice.deviceType === 6) {//4EOC6479CD6AD24319 is the only id I have thus far.
		device.log(`Child LCD Cooler ID: ${childDevice.IDString}`, {toFile : true});

		if(childDevice.IDString.includes("4EOC")) {
			device.log(`Adding Child LCD Cooler ${childDevice.IDString}`, {toFile : true});
			deviceConfig = CorsairLibrary.GetDeviceByCorsairLinkId("LCD");
		}
	} else if(childDevice.deviceType === 1) { //If it starts with 0100 and then has 2035 in it, presume QX fan.
		if(childDevice.IDString.includes("0100") && childDevice.IDString.includes("2035")) {
			device.log(`Adding Child QX Fan ${childDevice.IDString}`, {toFile : true});
			deviceConfig = CorsairLibrary.GetDeviceByCorsairLinkId("01000EAA520353FF2A"); //I find it fitting to use my model as the master
		}
	}

	deviceConfig.childDeviceId = uniqueId;
	deviceConfig.sensorId = ConnectedProbes[deviceNumber];
	deviceConfig.rpmId = ConnectedFans[deviceNumber];
	deviceConfig.deviceType = childDevice.deviceType;

	const connectedDevice = new CorsairBragiDevice(deviceConfig);

	if(BragiController) {
		BragiController.addChildDevice(connectedDevice.childDeviceIDString, connectedDevice);
	} else {
		device.log(`Bragi Controller is not defined! Throwing error`, {toFile : true});
	}

}

function createSubdevice(subdevice) {
	device.createSubdevice(subdevice.childDeviceIDString);
	device.setSubdeviceName(subdevice.childDeviceIDString, `${subdevice.name}`);
	//TODO: Attach image url to device library
	//device.setSubdeviceImage(subdevice.name, Image()); //can't wait to have a dict for these
	device.setSubdeviceSize(subdevice.childDeviceIDString, subdevice.size[0], subdevice.size[1]);
	device.setSubdeviceLeds(subdevice.childDeviceIDString, subdevice.ledNames, subdevice.ledPositions);
}

function PollDeviceState(deviceID = 0){
	// Corsair Pings every 52 Seconds. This will keep the device in software mode.
	const PollInterval = 50000;

	if(Date.now() - PollDeviceState.lastPollTime < PollInterval) {
		return;
	}

	if(Corsair.PingDevice(deviceID)){
		device.log(`Device Ping Successful!`);
	}else{
		device.log(`Device Ping Failed!`);
	}

	PollDeviceState.lastPollTime = Date.now();
}

function UpdateRGB(shutdown = false){
	const RGBData = getColors(shutdown);

	if(RGBData){
		Corsair.SendRGBData(RGBData, 1);
	}
}

function getColors(shutdown) {

	const RGBData = [];

	for(const [key, value] of BragiController.children){
		const deviceConfig = value;

		const subdeviceRGBData = [];

		for(let iIdx = 0; iIdx < deviceConfig.ledPositions.length; iIdx++) {
			const ledPosition = deviceConfig.ledPositions[iIdx];

			if(ledPosition === undefined){
				throw new Error(`Device Led Position [${iIdx}] is undefined!`);
			}

			let col;

			if(shutdown){
				col = hexToRgb(shutdownColor);
			}else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			}else{
				col = device.subdeviceColor(deviceConfig.childDeviceIDString, ledPosition[0], ledPosition[1]);
			}

			const ledIdx = deviceConfig.ledMap[iIdx];

			subdeviceRGBData[ledIdx * 3] = col[0];
			subdeviceRGBData[ledIdx * 3 + 1] = col[1];
			subdeviceRGBData[ledIdx * 3 + 2] = col[2];
		}

		RGBData.push(...subdeviceRGBData);
	}

	return RGBData;
}

/**
 * @typedef {{
 * name: string,
 * size: [number, number],
 * ledNames: string[],
 * ledPositions: LedPosition[],
 * ledMap: number[],
 * devFirmware: string
 * ledSpacing: number,
 * keyCount : number,
 * isLightingController : boolean
 * }} CorsairDeviceInfo
 *  */

class CorsairLibrary{
	static HasDeviceName(productId){
		return CorsairLibrary.DeviceList().hasOwnProperty(productId);
	}

	static HasDeviceProductId(productId){
		return CorsairLibrary.GetDeviceNameFromProductId(productId) !== undefined;
	}

	static GetDeviceNameFromProductId(productId){
		const deviceName = CorsairLibrary.ProductIDList()[productId];
		device.log(`Device Name: ${deviceName}`);

		return deviceName;
	}

	static GetDeviceImageFromName(name) {
		const deviceImage = CorsairLibrary.DeviceImageLibrary()[name];
		device.log(`Device Image: ${deviceImage}`);

		return deviceImage;
	}

	static GetDeviceByName(name){
		return CorsairLibrary.DeviceList()[name];
	}

	static GetDeviceByProductId(productId){
		const deviceName = CorsairLibrary.GetDeviceNameFromProductId(productId);

		return CorsairLibrary.GetDeviceByName(deviceName);
	}

	static GetDeviceByCorsairLinkId(corsairLinkId) { //We chop 8 bytes off the end before passing a device into here, though we should use the serials somewhere to keep track of them if a user flips them around.
		const deviceName = CorsairLibrary.CorsairLinkIdentifierList()[corsairLinkId];

		return CorsairLibrary.ChildList()[deviceName];
	}

	static CorsairLinkIdentifierList() { //Keeping this here for reference for now.
		return Object.freeze({
			"01000EAA520353FF2A" : "QX Fan", //0000EF0A These are the ones I have. Both fans return the same exact id no matter
			"01003830920351A7A0" : "QX Fan", //Oh oh no.
			"010003A7220351891D" : "QX Fan", //I already don't like this. Why are there two entirely different styles of Model ID's for QX's?
			"010032F2620359A1A3" : "QX Fan",
			"01000F101203517F7E" : "QX Fan", //Corsair you need to be stopped.
			"01003B429203564AD8" : "QX Fan",
			"0100136032035898E9" : "QX Fan",
			"010027FC42035675FA" : "QX Fan",
			"010022170203537813" : "QX Fan",
			"010003854203542B3E" : "QX Fan", //If it starts with 0100 and then has 2035 in it, presume QX fan.
			"010023C7120355FE27" : "QX Fan",
			"0100282F8203582BFB" : "QX Fan",
			"0252B51E003EA86103" : "H100I Link", //489F0000 it'd be funny if Corsair just forgot to serialize these
			"029250120000BS6103" : "H100I Link", //I'm thinking these specialized ID's may more have to do with where they go in the chain of devices / port.
			"0292D70F00AEA46103" : "H150I Link",
			"0232EA0100E5915D03" : "H150I Link",
			"LCD"				 : "LCD Cooler"
		});
	}

	static GetDeviceByCorsairLinkCoolerId(corsairLinkCoolerId) {
		const deviceName = CorsairLibrary.CorsairLinkCoolerIdentifierList()[corsairLinkCoolerId];

		return CorsairLibrary.ChildList()[deviceName];
	}

	static CorsairLinkCoolerIdentifierList() {
		return Object.freeze({
			"0" : "H100I Link",
			"1" : "H115I Link", //This one is assumed btw. Considering mine was 0, and then we had 2 and 3.
			"2" : "H150I Link",
			"3" : "H170I Link",
			"5" : "H150I Link" //mmmm, why is this like this
		});
	}

	static ProductIDList(){
		return Object.freeze({
			0x0C3F : "ICUE Link Hub",
		});
	}

	static DeviceImageLibrary() {
		return Object.freeze({
			"K70 Pro Mini" : "https://assets.signalrgb.com/devices/default/keyboards/keyboard-60.png",
		});
	}

	static ChildList(){
		return Object.freeze({
			"QX Fan" : {
				name : "QX Fan",
				size: [7, 7],
				ledNames: [
					"LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10",
					"LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20",
					"LED 21", "LED 22", "LED 23", "LED 24", "LED 25", "LED 26", "LED 27", "LED 28", "LED 29", "LED 30",
					"LED 31", "LED 32", "LED 33", "LED 34"
				],
				ledPositions: [
					[2, 1], [3, 0], [4, 1], [5, 2], [6, 3], [5, 4], [4, 5], [3, 6], [2, 5], [1, 4], [0, 3], [1, 2],
					[4, 1], [3, 0], [2, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 6], [4, 5], [5, 4], [6, 3], [5, 2],
					[4, 2], [5, 3], [4, 4], [2, 4], [1, 3], [2, 2], [3, 2], [2, 3], [3, 4], [4, 3],

				],
				ledMap: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
			},
			"H100I Link" : {
				name : "H100I Link",
				size: [7, 7],
				ledNames: [
					"LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10",
					"LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20",
				],
				ledPositions: [
					[6, 4], [5, 5], [4, 6], [3, 6], [2, 6], [1, 5], [0, 4], [0, 3], [0, 2], [1, 1],
					[2, 0], [3, 0], [4, 0], [5, 1], [6, 2], [6, 3], [3, 2], [4, 3], [3, 4], [2, 3],
				],
				ledMap: [
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
				],
			},
			"H115I Link" : {
				name : "H115I Link",
				size: [7, 7],
				ledNames: [
					"LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10",
					"LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20",
				],
				ledPositions: [
					[6, 4], [5, 5], [4, 6], [3, 6], [2, 6], [1, 5], [0, 4], [0, 3], [0, 2], [1, 1],
					[2, 0], [3, 0], [4, 0], [5, 1], [6, 2], [6, 3], [3, 2], [4, 3], [3, 4], [2, 3],
				],
				ledMap: [
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
				],
			},
			"H150I Link" : {
				name : "H150I Link",
				size: [7, 7],
				ledNames: [
					"LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10",
					"LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20",
				],
				ledPositions: [
					[6, 4], [5, 5], [4, 6], [3, 6], [2, 6], [1, 5], [0, 4], [0, 3], [0, 2], [1, 1],
					[2, 0], [3, 0], [4, 0], [5, 1], [6, 2], [6, 3], [3, 2], [4, 3], [3, 4], [2, 3],
				],
				ledMap: [
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
				],
			},
			"H170I Link" : {
				name : "H170I Link",
				size: [7, 7],
				ledNames: [
					"LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10",
					"LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20",
				],
				ledPositions: [
					[6, 4], [5, 5], [4, 6], [3, 6], [2, 6], [1, 5], [0, 4], [0, 3], [0, 2], [1, 1],
					[2, 0], [3, 0], [4, 0], [5, 1], [6, 2], [6, 3], [3, 2], [4, 3], [3, 4], [2, 3],
				],
				ledMap: [
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
				],
			},
			"LCD Cooler" : {
				name : "ICUE Link Cooler With LCD Cap",
				ledPositions: [
					[6, 0], [5, 1], [7, 1], [4, 2], [8, 2], [3, 3], [9, 3], [2, 4], [10, 4], [1, 5], [11, 5], [0, 6], 
					[12, 6], [1, 7], [11, 7], [2, 8], [10, 8], [4, 10], [8, 10], [3, 9], [9, 9], [5, 11], [7, 11], [6, 12]
				],
				ledMap: [
					6, 5, 7, 4, 8, 3, 9, 2, 10, 1, 11, 0, 12, 23, 13, 22, 14, 21, 15, 20, 16, 19, 17, 18
				],
				LedNames: [
					"Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10", "Led 11", "Led 12", "Led 13", "Led 14", "Led 15", "Led 16",
					"Led 17", "Led 18", "Led 19", "Led 20", "Led 21", "Led 22", "Led 23", "Led 24"
				],
				size: [13, 13]
			}
		});
	}

	// Qt needs to add support for static properties...
	/** @return {Object<string, CorsairDeviceInfo>} */
	static DeviceList(){
		return Object.freeze({
			"ICUE Link Hub": {
				name: "ICUE Link Hub",
				size: [1, 1],
				ledNames: [],
				ledPositions: [],
				ledMap: [],
				devFirmware: "1.3.46",
			},
		});
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

function getKeyByValue(object, value) {
	const Key = Object.keys(object).find(key => object[key] === value);

	return parseInt(Key || "");
}

class HexFormatter{
	/**
	 * @param {number} number
	 * @param {number} padding
	 */
	static toHex(number, padding){
		let hex = Number(number).toString(16);

		while (hex.length < padding) {
			hex = "0" + hex;
		}

		return "0x" + hex;
	}
	/**
	 * @param {number} number
	 */
	static toHex2(number){
		return this.toHex(number, 2);
	}
	/**
	 * @param {number} number
	 */
	static toHex4(number){
		return this.toHex(number, 4);
	}
}

class BinaryUtils{
	static WriteInt16LittleEndian(value){
		return [value & 0xFF, (value >> 8) & 0xFF];
	}
	static WriteInt16BigEndian(value){
		return this.WriteInt16LittleEndian(value).reverse();
	}
	static ReadInt16LittleEndian(array){
		return (array[0] & 0xFF) | (array[1] & 0xFF) << 8;
	}
	static ReadInt16BigEndian(array){
		return this.ReadInt16LittleEndian(array.slice(0, 2).reverse());
	}
	static ReadInt32LittleEndian(array){
		return (array[0] & 0xFF) | ((array[1] << 8) & 0xFF00) | ((array[2] << 16) & 0xFF0000) | ((array[3] << 24) & 0xFF000000);
	}
	static ReadInt32BigEndian(array){
		if(array.length < 4){
			array.push(...new Array(4 - array.length).fill(0));
		}

		return this.ReadInt32LittleEndian(array.slice(0, 4).reverse());
	}
	static WriteInt32LittleEndian(value){
		return [value & 0xFF, ((value >> 8) & 0xFF), ((value >> 16) & 0xFF), ((value >> 24) & 0xFF)];
	}
	static WriteInt32BigEndian(value){
		return this.WriteInt32LittleEndian(value).reverse();
	}
}

/**
 * @typedef Options
 * @type {Object}
 * @property {string=} developmentFirmwareVersion
 * @property {number=} LedChannelSpacing
 * @memberof ModernCorsairProtocol
 */
/**
 * @typedef {0 | 1 | 2 | "Lighting" | "Background" | "Auxiliary"} Handle
 * @memberof ModernCorsairProtocol
 */
/**
 * @class Corsair Bragi Protocol Class
 *
 * Major concepts are {@link ModernCorsairProtocol#properties|Properties} and {@link ModernCorsairProtocol#handles|Handles}/{@link ModernCorsairProtocol#endpoints|Endpoints}.
 *
 */

export class ModernCorsairProtocol{

	/** @constructs
	 * @param {Options} options - Options object containing device specific configuration values
	 */
	constructor(options = {}) {
		this.ConfiguredDeviceBuffer = false;

		/**
		 * @property {string} developmentFirmwareVersion - Used to track the firmware version the plugin was developed with to the one on a users device
		 * @property {number} LedChannelSpacing - Used to seperate color channels on non-lighting controller devices.
		 */
		this.config = {
			productId: 0,
			vendorId: 0,
			developmentFirmwareVersion: typeof options.developmentFirmwareVersion === "string" ? options.developmentFirmwareVersion : "Unknown",
			LedChannelSpacing: typeof options.LedChannelSpacing === "number" ? options.LedChannelSpacing : 0,
			WriteLength: 0,
			ReadLength: 0,

			/** @type {CorsairDeviceInfo | undefined} device */
			device: undefined
		};

		this.KeyCodes = [];
		this.KeyCount = 0;

		/**
		 * @readonly
		 * @static
		 * @enum {number}
		 * @property {0x01} setProperty - Used to set a {@link ModernCorsairProtocol#properties|Property} value on the device
		 * @property {0x02} getProperty - Used to fetch a {@link ModernCorsairProtocol#properties|Property} value from the device
		 * @property {0x05} closeHandle - Used to close a device {@link ModernCorsairProtocol#handles|Handle}
		 * @property {0x06} writeEndpoint - Used to write data to an opened device {@link ModernCorsairProtocol#endpoints|Endpoint}.
		 * @property {0x07} streamEndpoint - Used to stream data to an opened device {@link ModernCorsairProtocol#endpoints|Endpoint} if the data cannot fit within one packet
		 * @property {0x08} readEndpoint - Used to read data (i.e Fan Speeds) from a device {@link ModernCorsairProtocol#endpoints|Endpoint}
		 * @property {0x09} checkHandle - Used to check the status of a device {@link ModernCorsairProtocol#endpoints|Endpoint}. Returned data is currently unknown
		 * @property {0x0D} openEndpoint - Used to open an Endpoint on a device {@link ModernCorsairProtocol#handles|Handle}
		 * @property {0x12} pingDevice - Used to ping the device for it's current connection status
		 * @property {0x15} confirmChange - Used to apply led count changes to Commander Core [XT]
		 */
		this.command = Object.freeze({
			setProperty: 0x01,
			getProperty: 0x02,
			closeHandle: 0x05,
			writeEndpoint: 0x06,
			streamEndpoint: 0x07,
			readEndpoint: 0x08,
			checkHandle: 0x09,
			openEndpoint: 0x0D,
			pingDevice: 0x12,
			confirmChange: 0x15
		});
		/**
		 * @enum {number} Modes
		 * @property {0x01} Hardware Mode
		 * @property {0x02} Software Mode
		 */
		this.modes = Object.freeze({
			Hardware: 0x01,
			0x01: "Hardware",
			Software: 0x02,
			0x02: "Software",
		});

		/**
		 * Contains the PropertyId's of all known Properties.
		 * The device values these represent can be read and set using the following commands:
		 * <ul style="list-style: none;">
		 * <li>{@link ModernCorsairProtocol#FetchProperty|FetchProperty(PropertyId)}
		 * <li>{@link ModernCorsairProtocol#ReadProperty|ReadProperty(PropertyId)}
		 * <li>{@link ModernCorsairProtocol#SetProperty|SetProperty(PropertyId, Value)}
		 * <li>{@link ModernCorsairProtocol#CheckAndSetProperty|CheckAndSetProperty(PropertyId, Value)}
		 * </ul>
		 *
		 * Not all Properties are available on all devices and the above functions will throw various errors if they are unsupported, or given invalid values.
		 * Any properties with [READONLY] are constant can only be read from the device and not set by the user.
		 * Properties with [FLASH] are saved to the devices eeprom memory and will persist between power cycles.
		 *
		 * @readonly
		 * @enum {number} Properties
		 * @property {0x01} pollingRate Device's Hardware Polling rate
		 * @property {0x02} brightness Device's Hardware Brightness level in the range 0-1000 [FLASH]
		 * @property {0x03} mode Device Mode [Software/Hardware] PropertyId
		 * @property {0x07} angleSnap Angle Snapping PropertyId. Only used for mice. [FLASH]
		 * @property {0x0D} idleMode Device Idle Mode Toggle PropertyId. Only effects wireless devices.
		 * @property {0x0F} batteryLevel Device Battery Level PropertyID. Uses a 0-1000 Range. [READONLY]
		 * @property {0x10} batteryStatus Device Charging State PropertyID. [READONLY]
		 * @property {0x11} vid Device VendorID PropertyID. [READONLY]
		 * @property {0x12} pid Device ProductID PropertyID. [READONLY]
		 * @property {0x13} firmware Device Firmware PropertyID. [READONLY]
		 * @property {0x14} BootLoaderFirmware Device BootLoader Firmware PropertyID. [READONLY]
		 * @property {0x15} WirelessChipFirmware Device Wireless Chip Firmware PropertyID. [READONLY]
		 * @property {0x1E} dpiProfile Device Current DPI Profile Index PropertyID. Dark Core Pro SE uses a 0-3 Range.
		 * @property {0x1F} dpiMask
		 * @property {0x20} dpi Device's Current DPI Value PropertyID
		 * @property {0x21} dpiX Device's Current X DPI PropertyID
		 * @property {0x22} dpiY Device's Current Y DPI PropertyID.
		 * @property {0x37} idleModeTimeout Device's Idle Timeout PropertyId. Value is in Milliseconds and has a max of 99 Minutes.
		 * @property {0x41} layout Device's Physical Layout PropertyId. Only applies to Keyboards.
		 * @property {0x44} BrightnessLevel Coarse (0-3) Brightness. Effectively sets brightness in 33.33% increments.
		 * @property {0x45} WinLockState Device's WinKey Lock Status. Only applies to Keyboards.
		 * @property {0x4A} LockedShortcuts Device's WinKey Lock Bit flag. Governs what key combinations are disabled by the devices Lock mode. Only Applies to Keyboards.
		 * @property {0x96} maxPollingRate Device's Max Polling Rate PropertyId. Not supported on all devices.
		 * @property {0xB0} ButtonResponseOptimization
		 */

		this.properties =  Object.freeze({
			pollingRate: 0x01,
			brightness: 0x02,
			mode: 0x03,
			angleSnap: 0x07,
			idleMode: 0x0d,
			batteryLevel: 0x0F,
			batteryStatus: 0x10,
			vid: 0x11,
			pid: 0x12,
			firmware:0x13,
			BootLoaderFirmware: 0x14,
			WirelessChipFirmware: 0x15,
			dpiProfile: 0x1E,
			dpiMask: 0x1F,
			dpi : 0x20,
			dpiX: 0x21,
			dpiY: 0x22,
			subdeviceBitmask: 0x36,
			idleModeTimeout: 0x37,
			layout: 0x41,
			BrightnessLevel: 0x44,
			WinLockState: 0x45,
			LockedShortcuts: 0x4A,
			maxPollingRate: 0x96,
			ButtonResponseOptimization: 0xB0,
		});

		this.propertyNames = Object.freeze({
			0x01: "Polling Rate",
			0x02: "HW Brightness",
			0x03: "Mode",
			0x07: "Angle Snapping",
			0x0d: "Idle Mode",
			0x0F: "Battery Level",
			0x10: "Battery Status",
			0x11: "Vendor Id",
			0x12: "Product Id",
			0x13: "Firmware Version",
			0x14: "Bootloader Firmware Version",
			0x15: "Wireless Firmware Version",
			0x16: "Wireless Bootloader Version",
			0x1E: "DPI Profile",
			0x1F: "DPI Mask",
			0x20: "DPI",
			0x21: "DPI X",
			0x22: "DPI Y",
			0x2F: "DPI 0 Color",
			0x30: "DPI 1 Color",
			0x31: "DPI 2 Color",
			0x36: "Wireless Subdevices",
			0x37: "Idle Mode Timeout",
			0x41: "HW Layout",
			0x44: "Brightness Level",
			0x45: "WinLock Enabled",
			0x4a: "WinLock Disabled Shortcuts",
			0x5f: "MultipointConnectionSupport",
			0x96: "Max Polling Rate",
		});

		/**
		 * Contains the EndpointId's of all known Endpoints. These handle advanced device functions like Lighting and Fan Control.
		 * To manually interact with these you must open a Handle to the Endpoint first using {@link ModernCorsairProtocol#OpenHandle|OpenHandle(HandleId, EndpointId)}.
		 *
		 * Helper Functions to interact with these exist as the following:
		 * <ul style="list-style: none;">
		 * <li> {@link ModernCorsairProtocol#WriteToEndpoint|WriteEndpoint(HandleId, EndpointId, CommandId)}
		 * <li> {@link ModernCorsairProtocol#ReadFromEndpoint|ReadEndpoint(HandleId, EndpointId, CommandId)}
		 * <li> {@link ModernCorsairProtocol#CloseHandle|CloseHandle(HandleId)}
		 * <li> {@link ModernCorsairProtocol#CheckHandle|CheckHandle(HandleId)}
		 * </ul>
		 *
		 * @enum {number} Endpoints
		 * @property {0x01} Lighting
		 * @property {0x02} Buttons
		 * @property {0x05} PairingID
		 * @property {0x17} FanRPM
		 * @property {0x18} FanSpeeds
		 * @property {0x1A} FanStates
		 * @property {0x1D} LedCount_3Pin
		 * @property {0x1E} LedCount_4Pin
		 * @property {0x21} TemperatureData
		 * @property {0x22} LightingController
		 * @property {0x27} ErrorLog
		 */
		this.endpoints = Object.freeze({
			Lighting: 0x01,
			Buttons: 0x02,
			PairingID: 0x05,
			FanRPM: 0x17,
			FanSpeeds: 0x18,
			FanStates: 0x1A,
			LedCount_3Pin: 0x1D,
			LedCount_4Pin: 0x1E,
			TemperatureData: 0x21,
			LightingController: 0x22,
			ErrorLog: 0x27,
			ChildDevices: 0x36 //This gets checked every render loop
		});

		this.endpointNames = Object.freeze({
			0x01: "Lighting",
			0x02: "Buttons",
			0x10: "Lighting Monochrome",
			0x17: "Fan RPM",
			0x18: "Fan Speeds",
			0x1A: "Fan States",
			0x1D: "3Pin Led Count",
			0x1E: "4Pin Led Count",
			0x21: "Temperature Probes",
			0x22: "Lighting Controller",
			0x27: "Error Log",
			0x36: "Child Devices"
		});

		this.chargingStates = Object.freeze({
			1: "Charging",
			2: "Discharging",
			3: "Fully Charged",
		});

		this.chargingStateDictionary = Object.freeze({
			1 : 2,
			2 : 1,
			3 : 4
		});

		this.dataTypes = Object.freeze({
			FanRPM: 0x06,
			FanDuty: 0x07,
			FanStates: 0x09,
			TemperatureProbes: 0x10,
			LedCount3Pin: 0x0C,
			FanTypes: 0x0D,
			LedConfig: 0x0F,
			LightingController: 0x12
		});

		/**
		 * Contains the HandleId's of usable device Handles. These are used to open internal device {@link ModernCorsairProtocol#endpoints|Endpoint} foradvanced functions like Lighting and Fan Control.
		 * Each Handle can only be open for one {@link ModernCorsairProtocol#endpoints|Endpoint} at a time, and must be closed before the {@link ModernCorsairProtocol#endpoints|Endpoint} can be changed.
		 * For best practice all non-lighting Handles should be closed immediately after you are done interacting with it.
		 *
		 * Auxiliary (0x02) Should only be needed in very specific cases.
		 *
		 * Helper Functions to interact with these exist as the following:
		 * <ul style="list-style: none;">
		 * <li> {@link ModernCorsairProtocol#WriteToEndpoint|WriteEndpoint(HandleId, EndpointId, CommandId)}
		 * <li> {@link ModernCorsairProtocol#ReadFromEndpoint|ReadEndpoint(HandleId, EndpointId, CommandId)}
		 * <li> {@link ModernCorsairProtocol#CloseHandle|CloseHandle(HandleId)}
		 * <li> {@link ModernCorsairProtocol#CheckHandle|CheckHandle(HandleId)}
		 * </ul>
		 */
		this.handles = Object.freeze({
			Lighting: 0x00,
			Background: 0x01,
			Auxiliary: 0x02,
		});

		this.handleNames = Object.freeze({
			0x00: "Lighting",
			0x01: "Background",
			0x02: "Auxiliary"
		});
		/**
		 * Contains the values of all known Fan States. These are returned by {@link ModernCorsairProtocol#FetchFanStates|FetchFanStates}
		 * @enum {number} Endpoints
		 * @property {0x01} Disconnected - This fan Fan Port is empty and has no connected fan.
		 * @property {0x04} Initializing - The state of this Fan Port is still being determined by the device. You should rescan in a few seconds.
		 * @property {0x07} Connected - A Fan a connected to this Port
		 */
		this.fanStates = Object.freeze({
			Disconnected: 0x01,
			Initializing: 0x04,
			Connected: 0x07,
		});

		this.fanTypes = Object.freeze({
			QL: 0x06,
			SpPro: 0x05
		});

		this.pollingRates = Object.freeze({
			1: "125hz",
			2: "250hz",
			3: "500hz",
			4: "1000hz",
			5: "2000hz",
		});

		this.pollingRateNames = Object.freeze({
			"125hz": 1,
			"250hz": 2,
			"500hz": 3,
			"1000hz": 4,
			"2000hz": 5,
		});

		this.layouts = Object.freeze({
			0x01: "ANSI",
			"ANSI" : 0x01,
			0x02: "ISO",
			"ISO": 0x02
		});

		this.keyStates = Object.freeze({
			Disabled: 0,
			0: "Disabled",
			Enabled: 1,
			1: "Enabled",
		});
	}

	GetNameOfHandle(Handle){
		if(this.handleNames.hasOwnProperty(Handle)){
			return this.handleNames[Handle];
		}

		return "Unknown Handle";
	}
	GetNameOfProperty(Property){
		if(this.propertyNames.hasOwnProperty(Property)){
			return this.propertyNames[Property];
		}

		return "Unknown Property";
	}
	GetNameOfEndpoint(Endpoint){
		if(this.endpointNames.hasOwnProperty(Endpoint)){
			return this.endpointNames[Endpoint];
		}

		return "Unknown Endpoint";
	}
	SetDeviceImage(PID) {
		device.setImageFromUrl(CorsairLibrary.GetDeviceImageFromName(CorsairLibrary.GetDeviceNameFromProductId(PID)));
	}
	/** Logging wrapper to prepend the proper context to anything logged within this class. */
	log(Message){
		//device.log(`CorsairProtocol:` + Message);
		device.log(Message);
	}
	/**
	 * This Function sends a device Ping request and returns if the ping was successful.
	 *
	 * This function doesn't seem to affect the devices functionality, but iCUE pings all BRAGI devices every 52 seconds.
	 * @returns {boolean} - Boolean representing Ping Success
	 */
	PingDevice(deviceID = 0){
		const packet = [0x00, 0x00, deviceID, this.command.pingDevice];
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());

		if(returnPacket[5] !== 0x12){
			return false;
		}

		return true;
	}

	SetKeyStates(Enabled, keyCount, deviceID = 0){
		this.KeyCodes = [];

		// Assuming a continuous list of key id's
		for(let iIdx = 0; iIdx < keyCount; iIdx++){
			this.KeyCodes.push(Enabled);
		}

		this.WriteToEndpoint("Background", this.endpoints.Buttons, this.KeyCodes, deviceID);
	}

	SetSingleKey(KeyID, Enabled, deviceID = 0){
		this.KeyCodes[KeyID - 1] = Enabled;

		this.WriteToEndpoint("Background", this.endpoints.Buttons, this.KeyCodes, deviceID);
	}

	GetWriteLength(){
		if(!this.ConfiguredDeviceBuffer){
			this.FindBufferLengths();
		}

		return this.config.WriteLength;
	}

	GetReadLength(){
		if(!this.ConfiguredDeviceBuffer){
			this.FindBufferLengths();
		}

		return this.config.ReadLength;
	}

	/**
	 * Finds and sets the device's buffer lengths for internal use within the class. This should be the first function called when using this Protocol class as all other interactions with the device rely on the buffer size being set properly.
	 *
	 * This is automatically called on the first write/read operation.
	 */
	FindBufferLengths(){

		if(this.ConfiguredDeviceBuffer){
			return;
		}

		const HidInfo = device.getHidInfo();


		this.log(`Setting up device Buffer Lengths...`);

		if(HidInfo.writeLength !== 0){
			this.config.WriteLength = HidInfo.writeLength;
			this.log(`Write length set to ${this.config.WriteLength}`);
		}


		if(HidInfo.readLength !== 0){
			this.config.ReadLength = HidInfo.readLength;
			this.log(`Read length set to ${this.config.ReadLength}`);
		}

		this.ConfiguredDeviceBuffer = true;

	}

	FetchDeviceInformation(deviceID = 0){
		const vendorId = this.FetchProperty(this.properties.vid, deviceID);
		device.log(`Vid: [${HexFormatter.toHex4(vendorId)}]`);
		this.config.vendorId = vendorId;

		const productId = this.FetchProperty(this.properties.pid, deviceID);
		device.log(`Pid: [${HexFormatter.toHex4(productId)}]`);
		this.config.productId = productId;

		// device.log(`Poll Rate is [${this.pollingRates[Corsair.FetchProperty("Polling Rate")]}]`);
		// device.log(`Max Poll Rate is [${this.pollingRates[Corsair.FetchProperty("Max Polling Rate")]}]`);
		 //device.log(`Angle Snap is [${this.FetchProperty("Angle Snapping") ? "Enabled" : "Disabled"}]`);

		// device.log(`DPI X is [${this.FetchProperty("DPI X")}]`);
		// device.log(`DPI Y is [${this.FetchProperty("DPI Y")}]`);

		// device.log(`Brightness is [${this.FetchProperty("HW Brightness")/10}%]`);

		// device.log(`DPI Profile is [${this.FetchProperty("DPI Profile")}]`);
		// //device.log(`DPI Mask is ${Corsair.FetchProperty(Corsair.property.dpiMask)}`);
		//device.log(`HW Layout: ${this.layouts[this.FetchProperty("HW Layout")]}`);
		// device.log(`Idle Mode is [${this.FetchProperty("Idle Mode") ? "Enabled" : "Disabled"}]`);
		// device.log(`Idle Timeout is [${this.FetchProperty("Idle Mode Timeout") / 60 / 1000} Minutes]`);

		this.FetchFirmware(deviceID);

		//DumpAllSupportedProperties();
		//DumpAllSupportedEndpoints();
	}
	FindLightingEndpoint(deviceID = 0){
		let SupportedLightingEndpoint = -1;

		if(this.IsEndpointSupported(this.endpoints.Lighting, deviceID)){
			SupportedLightingEndpoint = this.endpoints.Lighting;
		}else if(this.IsEndpointSupported(this.endpoints.LightingController, deviceID)){
			SupportedLightingEndpoint = this.endpoints.LightingController;
		}

		device.log(`Supported Lighting Style: [${this.GetNameOfEndpoint(SupportedLightingEndpoint)}]`, {toFile: true});

		return SupportedLightingEndpoint;
	}

	IsPropertySupported(PropertyId, deviceID = 0){
		return this.FetchProperty(PropertyId, deviceID) !== -1;
	}

	DumpAllSupportedProperties(deviceID = 0){
		const SupportedProperties = [];
		const MAX_PROPERTY_ID = 0x64;
		device.log(`Checking for properties supported by this device...`);

		for(let i = 0; i < MAX_PROPERTY_ID; i++){
			if(this.IsPropertySupported(i, deviceID)){
				SupportedProperties.push(i);
			}
		}

		for(const property of SupportedProperties){
			device.log(`Supports Property: [${HexFormatter.toHex2(property)}], ${this.GetNameOfProperty(property)}`, {toFile: true});
		}

		return SupportedProperties;

	}

	IsEndpointSupported(Endpoint, deviceID = 0){

		this.CloseHandleIfOpen("Background", deviceID);

		const isHandleSupported = this.OpenHandle("Background", Endpoint, deviceID) === 0;

		// Clean up after if the handle is now open.
		if(isHandleSupported){
			this.CloseHandle("Background", deviceID);
		}

		return isHandleSupported;
	}

	DumpAllSupportedEndpoints(deviceID = 0){
		const SupportedEndpoints = [];
		const MAX_HANDLE_ID = 0x80;
		device.log(`Checking for Endpoints supported by this device...`);

		for(let i = 0; i < MAX_HANDLE_ID; i++){
			if(this.IsEndpointSupported(i, deviceID)){
				SupportedEndpoints.push(i);
			}
		}

		for(const endpoint of SupportedEndpoints){
			device.log(`Supports Endpoint: [${HexFormatter.toHex2(endpoint)}], ${this.GetNameOfEndpoint(endpoint)}`, {toFile: true});
		}

		return SupportedEndpoints;
	}
	/** Fetch if a device supports Battery Reporting. */
	FetchBatterySupport(deviceID = 0) {
		return this.IsPropertySupported(this.properties.batteryLevel, deviceID);
	}
	/** Fetch if a device supports the Lighting Controller RGB Style. */
	FetchLightingControllerSupport(deviceID = 0) {
		return this.IsEndpointSupported(this.endpoints.LightingController, deviceID);
	}
	/** Fetch if a device supports DPI Control. */
	FetchDPISupport(deviceID = 0) {
		device.log("Checking DPI Support");

		return this.IsPropertySupported(this.properties.dpiProfile, deviceID);
	}
	/** Fixes the K100 Air/respective Dongle not responding. */
	ResetDongle() {
		Corsair.SetProperty(23, 0); //Literally magic. Do not question this flag. It comes right after App,BLD,Radio_App, and Radio_BLD version. I'm guessing it's a reset flag.
		device.pause(1000);
		Corsair.SetMode("Hardware");
		Corsair.SetMode("Software");
		device.pause(1000);
	}
	/**
	 * Helper function to read and properly format the device's firmware version.
	 */
	FetchFirmware(deviceID){
		const data = this.ReadProperty(this.properties.firmware, deviceID);

		if(this.CheckError(data, "FetchFirmware")){
			return "Unknown";
		}

		const firmwareString = `${data[5]}.${data[6]}.${data[7]}`; // This is still somewhat wrong. needs fixed.
		device.log(`Firmware Version: [${firmwareString}]`, {toFile: true});

		if(this.config.developmentFirmwareVersion !== "Unknown"){
			device.log(`Developed on Firmware [${this.config.developmentFirmwareVersion}]`, {toFile: true});
		}

		return firmwareString;
	}

	/**
	 * Helper function to set the devices current DPI. This will set the X and Y DPI values to the provided value.
	 * @param {number} DPI Desired DPI value to be set.
	 */
	SetDPI(DPI, deviceID = 0){
		const hasIndependentAxes = this.FetchProperty("DPI X", deviceID) !== -1; //TODO Should this be stored somewhere? It's an extra variable to add and is a single extra op. Though it does throw an error in console every time dpi is changed if it isn't independent axes.
		//The only place to realistically shove that var is in Corsair Config. This can only be called by a single mouse, and only gets called if we have a mouse.

		if(hasIndependentAxes) {
			this.SetIndependentXYDPI(DPI, deviceID);
		} else {
			this.SetLinkedXYDPI(DPI, deviceID);
		}
	}

	SetIndependentXYDPI(DPI, deviceID) {
		const CurrentDPI = this.FetchProperty("DPI X", deviceID);

		if(CurrentDPI === DPI){
			return;
		}

		device.log(`Current device DPI is [${CurrentDPI}], Desired value is [${DPI}]. Setting DPI!`);
		this.SetProperty(this.properties.dpiX, DPI, deviceID);
		this.SetProperty(this.properties.dpiY, DPI, deviceID);

		device.log(`DPI X is now [${this.FetchProperty(this.properties.dpiX, deviceID)}]`);
		device.log(`DPI Y is now [${this.FetchProperty(this.properties.dpiX, deviceID)}]`);
	}

	SetLinkedXYDPI(DPI, deviceID) {
		const CurrentDPI = this.FetchProperty("DPI", deviceID);

		if(CurrentDPI === DPI){
			return;
		}

		device.log(`Current device DPI is [${CurrentDPI}], Desired value is [${DPI}]. Setting DPI!`);
		this.SetProperty(this.properties.dpi, DPI, deviceID);

		device.log(`DPI is now [${this.FetchProperty(this.properties.dpi, deviceID)}]`);
	}

	/**
	 * Helper function to grab the devices battery level and charge state. Battery Level is on a scale of 0-1000.
	 * @returns [number, number] An array containing [Battery Level, Charging State]
	 */
	FetchBatteryStatus(deviceID){
		const BatteryLevel = this.FetchProperty(this.properties.batteryLevel, deviceID);
		const ChargingState = this.FetchProperty(this.properties.batteryStatus, deviceID);

		return [BatteryLevel, ChargingState];
	}
	/**
	 *
	 * @param {number[]} Data - Data packet read from the device.
	 * @param {string} Context - String representing the calling location.
	 * @returns {number} An Error Code if the Data packet contained an error, otherwise 0.
	 */
	CheckError(Data, Context){
		const hasError = Data[3] ?? 0;

		if(!hasError){
			return hasError;
		}

		return false;

		const caller_line = (new Error).stack.split("\n")[2];
		const caller_function = caller_line.slice(0, caller_line.indexOf("@"));
		const line_number = caller_line.slice(caller_line.lastIndexOf(":")+1);
		const caller_context = `${caller_function}():${line_number}`;

		switch(Data[4]){
		case 1: // Invalid Value
			device.log(`${caller_context} CorsairProtocol Error [${hasError}]: Invalid Value Set!`);
			break;

		case 3: // Endpoint Error
			device.log(`${caller_context} CorsairProtocol Error [${hasError}]: Operation Failed!`);
			break;

		case 5: // Property Not Supported
			device.log(`${caller_context} CorsairProtocol Error [${hasError}]: Property is not supported on this device!`);
			break;

		case 9: // Read only property
			device.log(`${caller_context} CorsairProtocol Error [${hasError}]: Property is read only!`);
			break;
		case 13:
		case 55:
			// Value still gets set properly?
			//device.log(`${caller_context} CorsairProtocol Unknown Error Code [${hasError}]: ${Context}. This may not be an error.`);
			return 0;
		default:
			device.log(`${caller_context} CorsairProtocol Error [${hasError}]: ${Context}`);
		}


		return hasError;
	}
	/**
	 * Helper Function to Read a Property from the device, Check its value, and Set it on the device if they don't match.
	 * 	@param {number|string} PropertyId Property Index to be checked and set on the device. This value can either be the {@link ModernCorsairProtocol#properties|PropertyId}, or the readable string version of it.
	 * 	@param {number} Value The Value to be checked against and set if the device's value doesn't match.
	 *  @return {boolean} a Boolean on if the Property value on the device did match, or now matches the value desired.
	 */
	CheckAndSetProperty(PropertyId, Value, deviceID = 0){
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.propertyNames, PropertyId);
		}

		const CurrentValue = this.FetchProperty(PropertyId, deviceID);

		if(CurrentValue === Value){
			return true;
		}

		device.log(`Device ${this.GetNameOfProperty(PropertyId)} is currently [${CurrentValue}]. Desired Value is [${Value}]. Setting Property!`);

		this.SetProperty(PropertyId, Value);
		device.read([0x00], this.GetReadLength(), 5); // TODO: Check if this is needed?

		const NewValue = this.FetchProperty(PropertyId, deviceID);
		device.log(`Device ${this.propertyNames[PropertyId]} is now [${NewValue}]`);

		return NewValue === Value;
	}

	/**
	 * Reads a property from the device and returns the joined value after combining any high/low bytes. This function can return a null value if it's unable to read the property; i.e. it's unavailable on this device.
	 * @param {number | string } PropertyId Property Index to be read from the device. This value can either be the {@link ModernCorsairProtocol#properties|PropertyId}, or the readable string version of it.
	 * @returns The joined value, or undefined if the device fetch failed.
	 */
	FetchProperty(PropertyId, deviceID = 0) {
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.propertyNames, PropertyId);
		}

		const data = this.ReadProperty(PropertyId, deviceID);

		// Don't return error codes.
		if(data.length === 0){
			return -1;
		}

		return BinaryUtils.ReadInt32LittleEndian(data.slice(5, 8));
	}

	/**
	 * Attempts to sets a property on the device and returns if the operation was a success.
	 * @param {number|string} PropertyId Property Index to be written to on the device. This value can either be the {@link ModernCorsairProtocol#properties|PropertyId}, or the readable string version of it.
	 * @param {number} Value The Value to be set.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	SetProperty(PropertyId, Value, deviceID = 0) {
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.propertyNames, PropertyId);
		}

		const packet = [0x00, 0x00, deviceID | 0x00, this.command.setProperty, PropertyId, 0x00, (Value & 0xFF), (Value >> 8 & 0xFF), (Value >> 16 & 0xFF)];
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());
		device.log(returnPacket);

		const ErrorCode = this.CheckError(returnPacket, `SetProperty`);

		if(ErrorCode === 1){
			device.log(`Failed to set Property [${this.propertyNames[PropertyId]}, ${HexFormatter.toHex2(PropertyId)}]. [${Value}] is an Invalid Value`);

			return ErrorCode;
		}

		if(ErrorCode === 3){
			device.log(`Failed to set Property [${this.propertyNames[PropertyId]}, ${HexFormatter.toHex2(PropertyId)}]. Are you sure it's supported?`);

			return ErrorCode;
		}

		if(ErrorCode === 9){
			device.log(`Failed to set Property [${this.propertyNames[PropertyId]}, ${HexFormatter.toHex2(PropertyId)}]. The device says this is a read only property!`);

			return ErrorCode;
		}

		return 0;
	}

	/**
	 * Reads a property from the device and returns the raw packet.
	 * @param {number} PropertyId Property Index to be read from the device.  This value can either be the {@link ModernCorsairProtocol#properties|PropertyId}, or the readable string version of it.
	 * @returns The packet data read from the device.
	 */
	ReadProperty(PropertyId, deviceID = 0) {
		const packet = [0x00, 0x00, deviceID, this.command.getProperty, ...BinaryUtils.WriteInt16LittleEndian(PropertyId)];
		device.clearReadBuffer();
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());

		const ErrorCode = this.CheckError(returnPacket, `ReadProperty`);

		if(ErrorCode){
			device.log(`Failed to read Property [${this.GetNameOfProperty(PropertyId)}, ${HexFormatter.toHex2(PropertyId)}]. Are you sure it's supported?`);

			return [];
		}

		return returnPacket;
	}
	/**
	 * Opens a Endpoint on the device. Only one Endpoint can be open on a Handle at a time so if the handle is already open this function will fail.
	 * @param {Handle} Handle The Handle to open the Endpoint on. Default is 0.
	 * @param {number} Endpoint Endpoint Address to be opened.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	OpenHandle(Handle, Endpoint, deviceID = 0) {
		if(typeof Handle === "string"){
			Handle = this.handles[Handle];
		}

		const packet = [0x00, 0x00, deviceID, this.command.openEndpoint, Handle, Endpoint];
		device.clearReadBuffer();
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());

		const ErrorCode = this.CheckError(returnPacket, `OpenHandle`);

		if(ErrorCode){
			device.log(`Failed to open Endpoint [${this.GetNameOfEndpoint(Endpoint)}, ${HexFormatter.toHex2(Endpoint)}] on Handle [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}]. Are you sure it's supported and wasn't already open?`);
		}

		return ErrorCode;
	}
	/**
	 * Closes a Handle on the device.
	 * @param {Handle} Handle The HandleId to Close.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	CloseHandle(Handle, deviceID = 0) {
		if(typeof Handle === "string"){
			Handle = this.handles[Handle];
		}

		const packet = [0x00, 0x00, deviceID, this.command.closeHandle, 1, Handle];
		device.clearReadBuffer();
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());

		const ErrorCode = this.CheckError(returnPacket, `CloseHandle`);

		if(ErrorCode){
			device.log(`Failed to close Handle [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}]. was it even open?`);
		}

		return ErrorCode;
	}
	/**
	 * Helper function to Check the Handle is currently open and closes it if it is.
	 * @param {Handle} Handle - HandleId to perform the check on.
	 */
	CloseHandleIfOpen(Handle, deviceID = 0){
		if(typeof Handle === "string"){
			Handle = this.handles[Handle];
		}

		if(this.IsHandleOpen(Handle, deviceID)){
			device.log(`${this.GetNameOfHandle(Handle)} Handle is open. Closing...`);
			this.CloseHandle(Handle, deviceID);
		}
	}

	/**
	 * Performs a Check Command on the HandleId given and returns whether the handle is open.
	 * @param {Handle} Handle - HandleId to perform the check on.
	 * @returns {Boolean} Boolean representing if the Handle is already open.
	 */
	IsHandleOpen(Handle, deviceID){
		if(typeof Handle === "string"){
			Handle = this.handles[Handle];
		}

		device.clearReadBuffer();

		const packet = [0x00, 0x00, deviceID, this.command.checkHandle, Handle, 0x00];
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());
		const isOpen = returnPacket[4] !== 3;

		return isOpen;
	}

	/**
	 * Performs a Check Command on the HandleId given and returns the packet from the device.
	 * This function will return an Error Code if the Handle is not open.
	 * The Format of the returned packet is currently not understood.
	 * @param {Handle} Handle - HandleId to perform the check on.
	 * @returns The packet read from the device on success. Otherwise and Error Code.
	 * @Deprecated IsHandleOpen should be used in place of this function.
	 */
	CheckHandle(Handle, deviceID = 0){
		if(typeof Handle === "string"){
			Handle = this.handles[Handle];
		}
		const packet = [0x00, 0x00, deviceID, this.command.checkHandle, Handle, 0x00];

		device.clearReadBuffer();
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());

		const ErrorCode = this.CheckError(returnPacket, `CheckHandle`);

		if(ErrorCode){
			this.CloseHandle(Handle);
			device.log(`Failed to check Handle [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle,)}]. Did you open it?`);

			return ErrorCode;
		}

		return returnPacket;
	}
	/**
	 * This Helper Function will Open, Read, and Close a device Handle for the Endpoint given.
	 * If the read packet does not contain the ResponseId given the packet will be reread up to 4 times before giving up and returning the last packet read.
	 * If the Handle given is currently open this function will close it and then re-attempt opening it.
	 * @param {Handle} Handle - Handle to be used.
	 * @param {number} Endpoint - Endpoint to be read from
	 * @returns The entire packet read from the device.
	 */
	ReadFromEndpoint(Handle, Endpoint, deviceID = 0) {
		if(typeof Handle === "string"){
			Handle = this.handles[Handle];
		}

		if(this.IsHandleOpen(Handle, deviceID)){
			device.log(`CorsairProtocol: Handle is already open: [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}]. Attemping to close...`);
			this.CloseHandle(Handle, deviceID);
		}

		const ErrorCode = this.OpenHandle(Handle, Endpoint, deviceID);

		if(ErrorCode){
			this.CloseHandle(Handle);
			device.log(`CorsairProtocol: Failed to open Device Handle [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}]. Aborting ReadEndpoint operation.`);

			return [];
		}

		device.clearReadBuffer();

		device.write([0x00, 0x00, deviceID, this.command.readEndpoint, Handle], this.GetWriteLength());

		let Data = [];
		Data = device.read([0x00], this.GetReadLength());

		this.CloseHandle(Handle, deviceID);

		return Data;
	}
	/**
	 * This Helper Function will Open, Write to, and Close a device Handle for the Endpoint given.
	 *
	 * This function will handle setting the header data expected by the device. If the Data Array Length provided doesn't match what the device's endpoint is expecting the operation will Error.
	 *
	 * If the Handle given is currently open this function will close it and then re-attempt opening it.
	 * @param {Handle} Handle - HandleId to be used.
	 * @param {number} Endpoint - EndpointId to be written too.
	 * @param {number[]} Data - Data to be written to the Endpoint.
	 * @returns {number} 0 on success, otherwise an error code value.
	 */
	WriteToEndpoint(Handle, Endpoint, Data, deviceID = 0) {
		if(typeof Handle === "string"){
			Handle = this.handles[Handle];
		}

		if(this.IsHandleOpen(Handle, deviceID)){
			device.log(`CorsairProtocol: Handle is already open: [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}]. Attemping to close...`);

			this.CloseHandle(Handle, deviceID);
		}

		let ErrorCode = this.OpenHandle(Handle, Endpoint, deviceID);

		if(ErrorCode){
			device.log(`CorsairProtocol: Failed to open Device Handle [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}]. Aborting WriteEndpoint operation.`);

			return ErrorCode;
		}
		let packet = [0x00, 0x00, deviceID, this.command.writeEndpoint, Handle, ...BinaryUtils.WriteInt32LittleEndian(Data.length)];
		packet = packet.concat(Data);
		device.clearReadBuffer();
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read([0x00], this.GetReadLength());

		ErrorCode = this.CheckError(returnPacket, `WriteEndpoint`);

		if(ErrorCode){
			device.log(`Failed to Write to Handle [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}].`);
		}

		this.CloseHandle(Handle, deviceID);

		return ErrorCode;
	}
	/**
	 * This Helper Function to write RGB data to the device. This function will split the data into as many packets as needed and do multiple WriteEndpoints(Handle, Endpoint, Data) based on the DeviceBufferSize set.
	 *
	 * This function expects the Lighting HandleId (0x00) to already be open.
	 *
	 * This function will handle setting the header data expected by the device. If the RGBData Array Length provided doesn't match what the devices Lighting Endpoint expects this command will Error.
	 *
	 * @param {number[]} RGBData - RGBData to be written to the device in a RRRGGGBBB(Lighting Endpoint 0x01) or RGBRGBRGB(LightingController Endpoint 0x22) format.
	 */
	SendRGBData(RGBData, deviceID, ){
		const InitialHeaderSize = 9;
		const HeaderSize = 5;

		// All packets sent to the LightingController Endpoint have these 2 values added before any other data.
		RGBData.splice(0, 0, ...[this.dataTypes.LightingController, 0x00]);

		const isLightingEndpointOpen = this.IsHandleOpen("Lighting", deviceID);

		if(!isLightingEndpointOpen){
			this.OpenHandle("Lighting", this.endpoints.LightingController, deviceID);
		}

		let TotalBytes = RGBData.length;
		const InitialPacketSize = this.GetWriteLength() - InitialHeaderSize;

		this.WriteLighting(RGBData.length, RGBData.splice(0, InitialPacketSize), deviceID);

		TotalBytes -= InitialPacketSize;

		while(TotalBytes > 0){
			const BytesToSend = Math.min(this.GetWriteLength() - HeaderSize, TotalBytes);
			this.StreamLighting(RGBData.splice(0, BytesToSend), deviceID);

			TotalBytes -= BytesToSend;
		}
	}

	/** @private */
	WriteLighting(LedCount, RGBData, deviceID = 0){
		const packet = [0x00, 0x00, deviceID, this.command.writeEndpoint, 0x00, ...BinaryUtils.WriteInt32LittleEndian(LedCount)].concat(RGBData);

		device.write(packet, this.GetWriteLength());
		device.pause(1);
	}

	/** @private */
	StreamLighting(RGBData, deviceID = 0) {
		const packet = [0x00, 0x00, deviceID, this.command.streamEndpoint, 0x00].concat(RGBData);

		device.write(packet, this.GetWriteLength());
		device.pause(1);
	}

	/**
	 * Helper Function to Fetch and Set the devices mode. This function will close all currently open Handles on the device to ensure a clean slate and to prevent issues interacting with the device.
	 * Closing Handles in this function leads to iCUE not being able to function anymore, but solves issues with us not being able to find an open handle when trying to access non-lighting endpoints.
	 * @param {number | "Hardware" | "Software"} Mode ModeId to be checks against and set on the device.
	 */
	SetMode(Mode, deviceID = 0){
		if(typeof Mode === "string"){
			Mode = this.modes[Mode];
		}

		let CurrentMode = this.FetchProperty(this.properties.mode, deviceID);

		if(CurrentMode === Mode) {
			return true;
		}

		// if going into hardware mode we want to close all handles.
		// if going into software mode we don't want any handles stuck open from Icue or the file watchdog trigger.
		this.CloseHandleIfOpen("Lighting", deviceID);
		this.CloseHandleIfOpen("Background", deviceID);
		this.CloseHandleIfOpen("Auxiliary", deviceID);

		device.log(`Setting Device Mode to ${this.modes[Mode]}`);
		this.SetProperty(this.properties.mode, Mode, deviceID);
		CurrentMode = this.FetchProperty(this.properties.mode, deviceID);
		device.log(`Mode is now ${this.modes[CurrentMode]}`);

		if(this.modes[CurrentMode] === undefined) {
			return false;
		}

		return true;
	}

	/**
	 * Helper function to set the Hardware level device brightness if it is different then the Brightness value provided. This property is saved to flash.
	 * @param {number} Brightness Brightness Value to be set in the range of 0-1000
	 */
	SetHWBrightness(Brightness, deviceID = 0){
		const HardwareBrightness = this.FetchProperty(this.properties.brightness, deviceID);

		if(HardwareBrightness === Brightness){
			return;
		}

		device.log(`Hardware Level Brightness is ${HardwareBrightness/10}%`);

		this.SetProperty(this.properties.brightness, Brightness, deviceID);

		// Setting brightness appears to queue 2 packets to be read from the device
		// instead of the expected one.
		//TODO: investigate?
		this.ReadProperty(this.properties.brightness, deviceID);

		device.log(`Hardware Level Brightness is now ${this.FetchProperty(this.properties.brightness, deviceID)/10}%`);

	}

	/**
	 * Helper function to set the device's angle snapping if it is difference then the bool provided. This property is saved to flash.
	 * @param {boolean} AngleSnapping boolean Status to be set for Angle Snapping.
	 */
	SetAngleSnapping(AngleSnapping, deviceID = 0){
		const HardwareAngleSnap = this.FetchProperty(this.properties.angleSnap, deviceID);

		if(!!HardwareAngleSnap !== AngleSnapping){
			device.log(`Device Angle Snapping is set to [${HardwareAngleSnap ? "True" : "False"}]`);

			this.SetProperty(this.properties.angleSnap, AngleSnapping ? 1 : 0, deviceID);

			const NewAngleSnap = this.FetchProperty(this.properties.angleSnap, deviceID);
			device.log(`Device Angle Snapping is now [${NewAngleSnap ? "True" : "False"}]`);
		}
	}

	/** */
	FetchFanRPM(deviceID = 0) {
		//device.log("CorsairProtocol: Reading Fan RPM's.");

		if(device.fanControlDisabled()) {
			device.log("Fan Control is Disabled! Are you sure you want to try this?");

			return [];
		}

		const data = this.ReadFromEndpoint("Background", this.endpoints.FanRPM, deviceID);

		if(data.length === 0){
			this.log("Failed To Read Fan RPM's.");

			return [];
		}

		const FanSpeeds = [];

		if(data[5] !== 6 && data[6] !== 0) {
			device.log("Failed to get Fan RPM's");
		}

		const fanCount = data[7] ?? 0;
		//this.log(`Device Reported [${fanCount}] Fan RPM's`);

		const fanSpeeds = data.slice(8, 8 + 3 * fanCount);

		for(let i = 0; i < fanCount; i++) {
			const rpmData = fanSpeeds.splice(1, 3);
			FanSpeeds[i] = BinaryUtils.ReadInt16LittleEndian(rpmData);
		}

		return FanSpeeds;
	}
	/** */
	FetchFanStates(deviceID = 0) {
		const data = this.ReadFromEndpoint("Background", this.endpoints.FanStates, deviceID);

		if(data.length === 0){
			device.log(`CorsairProtocol: Failed To Read Fan States.`);

			return [];
		}

		if(data[5] !== 9 || data[6] !== 0) {
			device.log("Failed to get Fan Settings", {toFile: true});

			return [];
		}

		const FanCount = data[7] ?? 0;
		//device.log(`CorsairProtocol: Device Reported [${FanCount}] Fans`);

		const FanData = data.slice(8, 8 + FanCount);

		return FanData;
	}
	/** */
	SetFanType(deviceID = 0) {
		// Configure Fan Ports to use QL Fan size grouping. 34 Leds
		const FanCount = 7;

		const FanSettings = [this.dataTypes.FanTypes, 0x00, FanCount];

		for(let iIdx = 0; iIdx < FanCount; iIdx++) {
			FanSettings.push(0x01);
			FanSettings.push(iIdx === 0 ? 0x01 : this.fanTypes.QL); // 1 for nothing, 0x08 for pump?
		}

		this.WriteToEndpoint("Background", this.endpoints.LedCount_4Pin, FanSettings, deviceID);
	}

	SetInitialFanSpeeds(fanIdArray, deviceID = 0) {
		const FanCount = fanIdArray.length;
		const DefaultFanSpeed = 0x35;

		const FanSpeedData = [
			this.dataTypes.FanDuty, 0x00, FanCount,
		];

		for(let FanId = 0; FanId < FanCount; FanId++) {
			const FanData = [fanIdArray[FanId], 0x00, DefaultFanSpeed, 0x00];
			FanSpeedData.push(...FanData);
		}

		this.WriteToEndpoint("Background", this.endpoints.FanSpeeds, FanSpeedData, deviceID);
	}

	SetFanSpeeds(fanIdArray, deviceID = 0) {
		const FanCount = fanIdArray.length;
		const DefaultFanSpeed = 0x35;

		const FanSpeedData = [
			this.dataTypes.FanDuty, 0x00, FanCount,
		];

		for(let FanId = 0; FanId < fanIdArray.length; FanId++) {
			const FanData = [fanIdArray[FanId].rpmId, 0x00, DefaultFanSpeed, 0x00];

			const fanLevel = device.getFanlevel(fanIdArray[FanId].name);


			FanData[2] = fanLevel;

			if(fanIdArray[FanId].deviceType === 0x07) {
				FanData[2] = Math.max(fanLevel, 20);
			}

			device.log(`Setting Fan ${FanId + 1} Level to ${FanData[2]}%`); //Properly logs the speed if the pump bumps it.

			FanSpeedData.push(...FanData);
		}

		this.WriteToEndpoint("Background", this.endpoints.FanSpeeds, FanSpeedData, 0x01);
	}

	/** */
	FetchTemperatures(deviceID = 0) {
		//device.log(`CorsairProtocol: Reading Temp Data.`);

		const data = this.ReadFromEndpoint("Background", this.endpoints.TemperatureData, deviceID);

		if(data.length === 0){
			device.log(`CorsairProtocol: Failed To Read Temperature Data.`);

			return [];
		}

		if(data[5] !== this.dataTypes.TemperatureProbes || data[6] !== 0) {
			device.log("Failed to get Temperature Data", {toFile: true});

			return [];
		}

		const ProbeTemps = [];
		const ProbeCount = data[7] ?? 0;
		//this.log(`Device Reported [${ProbeCount}] Temperature Probes`); //Link system reports 15. We iterate through them skipping any with a value of 0 as they don't exist?

		const TempValues = data.slice(8, 8 + 3 * ProbeCount);

		for(let i = 0; i < ProbeCount; i++) {
			const probe = TempValues.slice(i * 3 + 1, i * 3 + 3);
			const temp = BinaryUtils.ReadInt16LittleEndian(probe) / 10;

			ProbeTemps.push(temp);
		}

		return ProbeTemps;
	}
}
const Corsair = new ModernCorsairProtocol(options);

class CorsairBragiController{
	constructor() {
		this.children = new Map();
	}
	/** Add a Child Device to the Children Map.*/
	addChildDevice(childDeviceId, childDevice) {
		if(this.children.has(childDeviceId)) {
			device.log("Child Device to Add Already Exists or is Undefined. Skipping!");

			return;
		}

		this.children.set(childDeviceId, childDevice);

		createSubdevice(childDevice);
	}

	/** Remove a Child Device from the Children Map.*/
	removeChildDevice(childDeviceId) {
		if(!this.children.has(childDeviceId)) {
			device.log("Child Device Does Not Exist in Map or is Undefined. Skipping!");

			return;
		}

		device.removeSubdevice(this.children.get(childDeviceId).name);
		this.children.delete(childDeviceId);

	}
}
class CorsairBragiDevice{

	constructor(device){

		this.name = device?.name ?? "Unknown Device";
		this.size = device?.size ?? [1, 1];
		this.ledNames = device?.ledNames ?? [];
		this.ledPositions =device?.ledPositions ?? [];
		this.ledMap = device?.ledMap ?? [];
		this.childDeviceIDString = device?.childDeviceId ?? -1;
		this.sensorId = device?.sensorId ?? -1;
		this.rpmId = device?.rpmId ?? -1;
		this.deviceType = device?.deviceType ?? -1;
	}
	toString(){
		return `BragiDevice: \n\tName: ${this.name} \n\tSize: [${this.size}] \n\tchildDeviceId: ${this.childDeviceId}`;
	}
}


class StateManager{
	constructor(){
		/** @type {State[]} */
		this.states = [];
		/** @type {State?} */
		this.currentState = null;
		this.lastProcessTime = Date.now();
		this.interval = 1000;
	}
	UpdateState(){
		if (this.states.length > 0) {
			this.currentState = this.states[this.states.length - 1];
			this.interval = this.currentState.interval || 3000;
			//device.log(`Set State Interval to ${this.interval}`);
		} else {
			this.currentState = null;
		}
	}
	/**
	 * @param {State} newState
	 */
	Push(newState){
		if(!newState){
			return;
		}

		this.states.push(newState);
		this.UpdateState();
	}
	/**
	 * @param {State} newState
	 */
	Replace(newState){
		this.states.pop();
		this.Push(newState);
	}
	Pop(){
		this.states.pop();
		this.UpdateState();
	}

	Shift(){
		const state = this.states.shift();

		if(state){
			this.Push(state);
		}
	}

	process(){
		//Break if were not ready to process this state
		if(Date.now() - this.lastProcessTime < this.interval) {
			return;
		}
		const startTime = Date.now();

		if(this.currentState !== null){
			this.currentState.run();
		}

		this.lastProcessTime = Date.now();
		//device.log(`State Took [${Date.now() - startTime}]ms to process`);

	}
}
const StateMgr = new StateManager();

class State{
	/**
	 * @param {StateManager} controller
	 * @param {number} interval
	 */
	constructor(controller, interval){
		this.controller = controller;
		this.interval = interval;
	}
	run(){

	}
}
class StateSystemMonitoringDisabled extends State{
	constructor(controller){
		super(controller, 5000);
	}
	run(){
		// Clear Existing Fans
		for(const FanID of deviceFanArray){
			device.log(`Removing Fan Control: ${FanID.name}`);
			device.removeFanControl(FanID.name);
		}

		deviceFanArray = [];

		// Clear Existing Probes
		for(const Probe of deviceTempSensorArray){
			device.log(`Removing Temperature Probe ${Probe.name}`);
			device.removeTemperatureSensor(`Temperature Probe ${Probe.name}`);
		}

		deviceTempSensorArray = [];

		// Stay here until fan control is enabled.
		if(!device.fanControlDisabled()) {
			device.log(`Fan Control Enabled, Fetching Connected Fans...`);
			this.controller.Replace(new StateEnumerateConnectedFans(this.controller));

		}
	};
};

class StateEnumerateConnectedFans extends State{
	constructor(controller){
		super(controller, 1000);
	}
	run(){
		// Add Blocking State if fan control is disabled
		if(device.fanControlDisabled()) {
			device.log(`Fan Control Disabled...`);
			this.controller.Push(new StateSystemMonitoringDisabled(this.controller));

			return;
		}

		if(createSensors()){
			device.log(`Found Connected Fans. Starting Polling Loop...`);
			this.controller.Pop();
		}else{
			device.log(`Connected Fans are still being initialized by the controller. Delaying Detection!`, {toFile: true});
			// delay next poll operation to give the device time to finish booting.
			this.interval = 5000;
		}
	};
}

class StatePollFanSpeeds extends State{
	constructor(controller){
		super(controller, 2000);
	}
	run(){
		// Add Blocking State if fan control is disabled
		if(device.fanControlDisabled()) {
			device.log(`Fan Control Disabled...`);
			this.controller.Push(new StateSystemMonitoringDisabled(this.controller));

			return;
		}

		// Add Blocking State if we have no connected fans detected
		if(deviceFanArray.length === 0){
			device.log(`No Connected Fans Known. Fetching Connected Fans... `);
			this.controller.Push(new StateEnumerateConnectedFans(this.controller));

			return;
		}

		// Read Fan RPM
		const [FanSpeeds, fans] = parseFanRPMs();

		for(let i = 0; i < FanSpeeds.length; i++) {
			const fanRPM = FanSpeeds[i];

			if(fans[i] === deviceFanArray[i].rpmId) {
				device.log(`${deviceFanArray[i].name} is running at rpm ${fanRPM}`);
			}

			device.setRPM(deviceFanArray[i].name, fanRPM);
		}

		this.controller.Shift();
	};
};

class StatePollTempProbes extends State{
	constructor(controller){
		super(controller, 2000);
	}
	run(){
		// Add Blocking State if fan control is disabled
		if(device.fanControlDisabled()) {
			device.log(`Fan Control Disabled...`);
			this.controller.Push(new StateSystemMonitoringDisabled(this.controller));

			return;
		}

		// Read Temperature Probes
		const [Temperatures, sensors] = fetchTempSensors();

		for(let i = 0; i < Temperatures.length; i++) {
			const temperature = Temperatures[i];

			if(sensors[i] === deviceTempSensorArray[i].sensorId){
				device.SetTemperature(deviceTempSensorArray[i].name, temperature);
				device.log(`${deviceTempSensorArray[i].name} is at ${temperature}C`);
			}
		}

		this.controller.Shift();
	};
};

class StateSetFanSpeeds extends State{
	constructor(controller){
		super(controller, 2000);
	}
	run(){
		// Add Blocking State if fan control is disabled
		if(device.fanControlDisabled()) {
			device.log(`Fan Control Disabled...`);
			this.controller.Push(new StateSystemMonitoringDisabled(this.controller));

			return;
		}

		// Add Blocking State if we have no connected fans detected
		if(deviceFanArray.length === 0){
			device.log(`No Connected Fans Known. Fetching Connected Fans... `);
			this.controller.Push(new StateEnumerateConnectedFans(this.controller));

			return;
		}

		//Set Fan Speeds
		Corsair.SetFanSpeeds(deviceFanArray, 0x01);

		this.controller.Shift();
	};
};

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png";
}