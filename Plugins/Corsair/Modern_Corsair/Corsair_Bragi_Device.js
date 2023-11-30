export function Name() { return "Corsair Bragi Device"; }
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
settingControl:readonly
dpiStages:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
dpi5:readonly
dpi6:readonly
dpiRollover:readonly
PollRate:readonly
dpiStages:readonly
ConnectedFans:readonly
FanControllerArray:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property": "PollRate", "group":"", "label": "Poll Rate", "type": "combobox", "values": ["125hz", "250hz", "500hz", "1000hz"], "default": "1000hz" }, //Add a high polling rate check and leverage dyn props.
	];
}

const devFlags = false;

export function SubdeviceController() { return devFlags; } //Fix DPI Logic. If you remove too many stages, it blows up.

export function onsettingControlChanged() {
	if(settingControl) {
		DPIHandler.setActiveControl(true);
		DPIHandler.update();
	} else {
		DPIHandler.setActiveControl(false);
	}
}

export function ondpiStagesChanged() {
	DPIHandler.setMaxStageCount(dpiStages);
	DPIHandler.update();
}

export function ondpiRolloverChanged() {
	DPIHandler.setRollover(dpiRollover);
}

export function ondpi1Changed() {
	DPIHandler.DPIStageUpdated(1);
}

export function ondpi2Changed() {
	DPIHandler.DPIStageUpdated(2);
}

export function ondpi3Changed() {
	DPIHandler.DPIStageUpdated(3);
}
export function ondpi4Changed() {
	DPIHandler.DPIStageUpdated(4);
}

export function ondpi5Changed() {
	DPIHandler.DPIStageUpdated(5);
}

export function ondpi6Changed() {
	DPIHandler.DPIStageUpdated(6);
}

/** @type {CorsairBragiDongle | undefined} */
let BragiDongle;
/** @type {CorsairBragiDevice | undefined} */
let wiredDevice;
// Dark core Pro SE wired firmware 5.0.41
// wireless firmware 5.6.126

/** @type {Options} */
const options = {
	developmentFirmwareVersion: "5.6.126",
};

/** @param {HidEndpoint} endpoint */
export function Validate(endpoint) {
	return (endpoint.interface === 1 && endpoint.usage === 0x0001 && endpoint.usage_page === 0xFF42) ||
	(endpoint.interface === 2 && endpoint.usage === 0x0002 && endpoint.usage_page === 0xFF42);
}

export function onPollRateChanged() {
	setPollRate(PollRate);
}

export function Initialize() {
	device.set_endpoint(0x01, 0x01, 0xFF42);
	device.setImageFromUrl("https://assets.signalrgb.com/devices/default/usb-dongle.png");
	Corsair.SetMode("Software");
	Corsair.FetchDeviceInformation();
	fetchAndConfigureChildren();
	macroInputArray.setCallback((bitIdx, isPressed) => { return processMacroInputs(bitIdx, isPressed); });
}

let subdevicesEditedLastFrame = false;

export function Render() {
	readDeviceNotifications();

	if(subdevicesEditedLastFrame) {
		subdevicesEditedLastFrame = false;

		return;
	}

	if(wiredDevice){
		PollDeviceMode();
		PollDeviceState();
		UpdateRGB(wiredDevice);
	}

	if(BragiDongle) {
		PollDeviceMode();
		PollDeviceState(); //this one pings the dongle. I could have it ping the device but I don't see a need.

		for(const [key, value] of BragiDongle.children){
			PollDeviceMode(key);
			PollDeviceState(key);
			UpdateRGB(value, key);
		}
	}
}


export function Shutdown() {
	if(wiredDevice) {
		Corsair.SetMode("Hardware");
	}

	if(BragiDongle){
		for(const [key, value] of BragiDongle.children){
			Corsair.SetMode("Hardware", key);
		}
	}
}

function setMacroKeys(deviceID = 0) {
	//Corsair.OpenHandle(1, Corsair.endpoints.Buttons, deviceID);
	const macroFill = new Array(135).fill(1);

	device.log("Doing things to keys");
	Corsair.WriteToEndpoint(1, Corsair.endpoints.Buttons, macroFill, deviceID);
}


function fetchAndConfigureChildren() {
	if(Corsair.IsPropertySupported(Corsair.properties.subdeviceBitmask)){
		device.log(`Wireless Dongle detected!`, {toFile : true});

		if(!BragiDongle){
			BragiDongle = new CorsairBragiDongle();
		}

		setupDongle();

		return;
	}

	device.log("Device is not a wireless dongle. Setting up Wired Mode...", {toFile : true});
	setupWiredDevice();

}

function setupDongle() {
	const children = GetConnectedSubdevices();

	device.log(`Detected ${children.length} connected device(s)!`);


	for(let devices = 0; devices < children.length; devices++) {
		device.log("Child BitID: " + children[devices]);

		if(devices > 1 && !devFlags){
			device.notify("Multipoint is not supported!", "Multipoint is not supported on Corsair devices due to instability issues. Please pair devices to their respective dongles.", 1);
			device.log(`Multiple Devices Connected. Plugin Doesn't support this!`);

			return;
		}

		if(devFlags) {
			addChildDevice(children[devices]);
		} else { addSinglePointChild(children[devices]); }

	}
}

function setupWiredDevice() {
	const devicePID = Corsair.FetchProperty(Corsair.properties.pid);
	const deviceConfig = CorsairLibrary.GetDeviceByProductId(devicePID);

	Corsair.SetDeviceImage(devicePID);
	wiredDevice = new CorsairBragiDevice(deviceConfig, 0x00);

	if(!devFlags) {
		device.setName(wiredDevice.name);
		device.setSize(wiredDevice.size);
		device.setControllableLeds(wiredDevice.ledNames, wiredDevice.ledPositions);
		initializeDevice(wiredDevice);
	}

	if(devFlags) { createSubdevice(wiredDevice); initializeDevice(wiredDevice); }
}

/* eslint-disable complexity */
function initializeDevice(deviceConfig, deviceID = 0) {
	Corsair.SetMode("Software", deviceID);

	const devicePID = Corsair.FetchProperty(Corsair.properties.pid);

	if(devicePID === 0x1BAB) {
		Corsair.SetHWBrightness(999, deviceID); //K100 Air reports 100% brightness even when not at 100% on Dev FW Version: 5.6.126.
	} else {
		Corsair.SetHWBrightness(1000, deviceID);
	}

	deviceConfig.supportsBattery = Corsair.FetchBatterySupport(deviceID);
	device.log(`Device Battery Support: ${deviceConfig.supportsBattery}`);

	if(deviceConfig.supportsBattery) {
		device.addFeature("battery");

		const [BatteryLevel, ChargeState] = Corsair.FetchBatteryStatus(deviceID);

		device.log(`Battery Level is [${(BatteryLevel ?? 0)/10}%]`);
		device.log(`Battery Status is [${Corsair.chargingStates[ChargeState ?? 0]}]`);

		battery.setBatteryLevel((BatteryLevel ?? 0)/ 10);
		battery.setBatteryState(Corsair.chargingStateDictionary[ChargeState ?? 0]);
	}

	if(deviceConfig.keymapType === "Mouse") {
		device.addFeature("mouse");

		if(devicePID === 0x1B9E) {
			Corsair.WriteToEndpoint("Background", this.endpoints.Buttons, [0x01, 0x01, 0x01, 0x00, 0x00, 0x01, 0x01, 0x01], deviceID);
		} else { configureMouseButtons(deviceID); }

	} else if(deviceConfig.keymapType === "Keyboard") {
		setMacroKeys(deviceID);
		device.addFeature("keyboard");
	}

	device.pause(5);

	if(Corsair.FetchDPISupport(deviceID) && DPIHandler.minDpi === 50) { //safety check. We check if the DPIHandler prop was updated. If it hasn't been then there's only a single instance.
		if(deviceConfig.hasSniperButton) {
			DPIHandler.addSniperProperty();
		}

		DPIHandler.setMinDpi(200);
		DPIHandler.setMaxDpi(deviceConfig.maxDPI?? 15000);
		DPIHandler.setUpdateCallback((dpi) => { return Corsair.SetDPI(dpi, deviceID); });
		DPIHandler.addProperties();
		DPIHandler.setRollover(dpiRollover);

		if(settingControl) {
			DPIHandler.setActiveControl(settingControl);
			DPIHandler.update();
		}
	}

	deviceConfig.isLightingController = Corsair.FetchLightingControllerSupport(deviceID);
	device.log(`Device Uses Lighting Controller Scheme: ${deviceConfig.isLightingController}`);
	device.log("Let There Be Light!");
}
/* eslint-enable complexity */

function GetConnectedSubdevices(){
	device.log(`Checking for connected devices!`);

	const bitmask = Corsair.FetchProperty(Corsair.properties.subdeviceBitmask);
	device.log("Bitmask:" + bitmask);

	const ConnectedChildren = [];

	for(let i = 1; i < 8; i ++){
		const mask = 1 << i;

		if(bitmask & mask){
			ConnectedChildren.push(i);
		}
	}

	return ConnectedChildren;
}

function createSubdevice(subdevice) {
	device.createSubdevice(subdevice.name);
	device.setSubdeviceName(subdevice.name, `${subdevice.name}`);
	//TODO: Attach image url to device library
	//device.setSubdeviceImage(subdevice.name, Image()); //can't wait to have a dict for these
	device.setSubdeviceSize(subdevice.name, subdevice.size[0], subdevice.size[1]);
	device.setSubdeviceLeds(subdevice.name,
		subdevice.ledNames,
		subdevice.ledPositions);
}

function readDeviceNotifications(){
	device.set_endpoint(0x02, 0x02, 0xFF42);

	do{
		const data = device.read([0x00], Corsair.config.ReadLength, 0); // Read Key Event

		if(device.getLastReadSize() === 0){
			break;
		}

		ProcessInput(data);

	}while(device.getLastReadSize() > 0);

	device.set_endpoint(0x01, 0x01, 0xFF42);
}

let macroSubdeviceID = 0;

//Possibly make a bragi notification struct?
function ProcessInput(InputData){
	// Notification
	if(InputData[2] === 1){

		const subdeviceId = InputData[1];
		const NotificationType = BinaryUtils.ReadInt16LittleEndian(InputData.slice(3, 5));
		const value = BinaryUtils.ReadInt32LittleEndian(InputData.slice(5, 9));

		switch(NotificationType){
		case Corsair.properties.batteryLevel:
			setDeviceBatteryLevel(subdeviceId, value);
			break;
		case Corsair.properties.batteryStatus:
			setDeviceBatteryState(subdeviceId, value);
			break;

		case(Corsair.properties.subdeviceBitmask): {
			device.log(`Subdevice: [${subdeviceId}], Subdevice Notification. Value is [${value}]`);

			if(subdeviceId === 0) {
				addAndRemoveDevicesFromDongleNotifications(value);
				subdevicesEditedLastFrame = true;
			} //If it isn't subdevice 0 it isn't coming from the dongle.

			break;
		}

		default:
			device.log(`Subdevice: [${subdeviceId}], Unknown Notification: [${NotificationType}]. Value is [${value}]`);
		}
	}

	if(InputData[2] === 2){
		macroSubdeviceID = InputData[1]; //Doesn't persist through the macroInputArray, so I save to a global var.
		// I doubt we'll ever have over 32 bytes (256 Keys) of bit flags.
		macroInputArray.update(InputData.slice(3, 35));
	}
}

function processMacroInputs(bitIdx, state) {
	device.set_endpoint(0x01, 0x01, 0xFF42);

	let deviceType;

	if(macroSubdeviceID === 0) {
		deviceType = wiredDevice?.keymapType;
	} else {
		deviceType = BragiDongle?.children.get(macroSubdeviceID).keymapType;
	}
	const keyName = CorsairLibrary.GetKeyMapping(bitIdx, deviceType);

	if(deviceType === "Keyboard") {
		const eventData = {
			key : keyName,
			keyCode : 0,
			"released": !state,
		};
		//device.log(`Key ${keyName} is state ${state}`);
		keyboard.sendEvent(eventData, "Key Press");
	} else if(deviceType === "Mouse") {
		if(state) {
			switch(keyName) {
			case "Dpi Stage Up":
				DPIHandler.increment();
				break;
			case "Dpi Stage Down":
				DPIHandler.decrement();
				break;
			case "Sniper":
				DPIHandler.setSniperMode(true);
				break;
			default:
				const eventData = {
					"buttonCode": 0,
					"released": !state,
					"name":keyName
				};
				device.log(`bitIdx ${bitIdx} is state ${state}`);
				//device.log(`Key ${keyName} is state ${state}`);
				mouse.sendEvent(eventData, "Button Press");
			}
		} else {
			if(keyName === "Sniper") { DPIHandler.setSniperMode(false); } else { const eventData = { "buttonCode": 0, "released": !state, "name":keyName }; mouse.sendEvent(eventData, "Button Press"); }
		}
	}

}

function configureMouseButtons(deviceID) { //TODO: Rewrite this properly once I get user confirmation of functionality.
	device.log("Made buttons do button things again!");
	Corsair.SetKeyStates(0x01, 5, deviceID);
	device.log(Corsair.ReadFromEndpoint(1, Corsair.endpoints.Buttons, deviceID));
}

function addSinglePointChild(subdeviceID) {
	let devicePID = Corsair.FetchProperty(Corsair.properties.pid, subdeviceID);
	device.log(`Device PID: ${devicePID}`);

	Corsair.SetDeviceImage(devicePID);

	let retries = 0;

	while(devicePID === -1 && retries < 5) {
		device.log("Resetting Dongle");
		Corsair.ResetDongle();
		devicePID = Corsair.FetchProperty(Corsair.properties.pid, subdeviceID);
		retries++;

		if(retries === 5) {
			device.log(`Subdevice ID ${subdeviceID} failed after 5 resets.`, {toFile : true});

			break; //break the loop. Don't init a bad device.
		}
	}

	const deviceConfig = CorsairLibrary.GetDeviceByProductId(devicePID);

	const connectedDevice = new CorsairBragiDevice(deviceConfig, subdeviceID);

	if(BragiDongle) {
		BragiDongle.addChildDevice(connectedDevice.subdeviceId, connectedDevice, false);
		device.setName(connectedDevice.name);
		device.setSize(connectedDevice.size);
		device.setControllableLeds(connectedDevice.ledNames, connectedDevice.ledPositions);
		initializeDevice(connectedDevice, connectedDevice.subdeviceId);
	} else {
		device.log(`Bragi Dongle is not defined! Throwing error`, {toFile : true});
	}
}

function addChildDevice(subdeviceID) {
	let devicePID = Corsair.FetchProperty(Corsair.properties.pid, subdeviceID);
	device.log(`Device PID: ${devicePID}`);

	let retries = 0;

	while(devicePID === -1 && retries < 5) {
		device.log("Resetting Dongle");
		Corsair.ResetDongle();
		devicePID = Corsair.FetchProperty(Corsair.properties.pid, subdeviceID);
		retries++;

		if(retries === 5) {
			device.log(`Subdevice ID ${subdeviceID} failed after 5 resets.`, {toFile : true});

			break; //break the loop. Don't init a bad device.
		}
	}

	const deviceConfig = CorsairLibrary.GetDeviceByProductId(devicePID);

	const connectedDevice = new CorsairBragiDevice(deviceConfig, subdeviceID);

	if(BragiDongle) {
		BragiDongle.addChildDevice(connectedDevice.subdeviceId, connectedDevice);
		initializeDevice(connectedDevice, connectedDevice.subdeviceId);
	} else {
		device.log(`Bragi Dongle is not defined! Throwing error`, {toFile : true});
	}

}

function addAndRemoveDevicesFromDongleNotifications(bitmask) {
	device.set_endpoint(0x01, 0x01, 0xFF42);

	const ConnectedChildren = [];

	for(let i = 1; i < 8; i ++){
		const mask = 1 << i;

		if(bitmask & mask){
			ConnectedChildren.push(i);
		}
	}

	const mapChildren = Array.from(BragiDongle.children.keys());

	const childrenToAdd = ConnectedChildren.filter(x => !mapChildren.includes(x));
	const childrenToRemove = mapChildren.filter(x => !ConnectedChildren.includes(x));

	for(const child of childrenToRemove) {
		device.log(`Removing Child Device ${child}`);
		BragiDongle.removeChildDevice(child);
	}

	if(ConnectedChildren.length === 0) {
		device.setImageFromUrl("https://assets.signalrgb.com/devices/default/usb-dongle.png");
	}

	for(const child of childrenToAdd) {
		device.log(`Adding Child Device ${child}`);

		if(mapChildren.length === 0 && !devFlags) { //All of this will be cleaned up when we deprecate and remove devflags.
			addSinglePointChild(child);
		} else if(devFlags) {
			addChildDevice(child);
		}
	}
}

function setDeviceBatteryLevel(subdeviceId, value) {
	if(wiredDevice) {
		wiredDevice.batteryPercentage = value / 10;

		return;
	}

	const subdevice = BragiDongle ? BragiDongle.children.get(subdeviceId) : undefined;

	if(!subdevice){
		console.log("Por que dongle?");

		return;
	}

	subdevice.batteryPercentage = value / 10;

	device.log(`Subdevice: [${subdeviceId}], Battery Level is [${value / 10}]`); //We'll need a handler to split these by subdeviceID. For now that isn't an issue per se.
	battery.setBatteryLevel(value / 10);
}

function setDeviceBatteryState(subdeviceId, value) {
	if(wiredDevice) {
		wiredDevice.batteryPercentage = value / 10;

		return;
	}

	const subdevice = BragiDongle ? BragiDongle.children.get(subdeviceId) : undefined;

	if(!subdevice){
		console.log("Por que dongle?");

		return;
	}

	subdevice.batteryPercentage = value / 10;

	device.log(`Subdevice: [${subdeviceId}], Battery Status is [${Corsair.chargingStates[value]}]`);
	battery.setBatteryState(Corsair.chargingStateDictionary[value]);
}

function PollDeviceMode(deviceID = 0){
	const PollInterval = 5000;

	if(Date.now() - PollDeviceMode.lastPollTime < PollInterval) {
		return;
	}

	//K100 Air Hates devices disconnecting from the dongle, and hates reconnecting to the dongle.
	// Either the dongle or the K100 Air falls into an errored state. It seems to be the dongle.
	//To fix the error, we reset the dongle, which makes the dongle d/c every device and it resends subdevice notifications.
	//We drop everything and pick it all back up when that happens.
	if(BragiDongle) {
		for(const [key, value] of BragiDongle.children) {
			if(!Corsair.SetMode("Software", key)) {
				Corsair.ResetDongle();
			}
		}
	}

	if(wiredDevice) {
		Corsair.SetMode("Software", deviceID);
	}


	PollDeviceMode.lastPollTime = Date.now();
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

function setPollRate(pollRate) {

	const pollingRateId = Corsair.pollingRateNames[pollRate];

	device.log(`Setting Polling Rate to [${pollRate}, ${pollingRateId}]`);

	const CurrentValue = Corsair.FetchProperty("Polling Rate");

	if(CurrentValue === pollingRateId){
		return;
	}

	device.log(`Device "Polling Rate" is currently [${CurrentValue}]. Desired Value is [${pollingRateId}]. Setting Property!`);

	Corsair.SetProperty("Polling Rate", pollingRateId);
	// Device Disconnect, Error Thrown, We're done here.
}

function UpdateRGB(childDevice, deviceID, shutdown = false){
	const isLightingController = childDevice.isLightingController;
	const RGBData = getColors(childDevice, shutdown, isLightingController);

	if(RGBData){
		Corsair.SendRGBData(RGBData, deviceID, isLightingController);
	}
}

function getColors(childDevice, shutdown, isLightingController) {
	if(isLightingController) {
		return getLightingControllerColors(childDevice, shutdown, devFlags);
	}

	return getStandardColors(childDevice, shutdown, devFlags);
}

function getStandardColors(deviceConfig, shutdown = false, subdevice = false){

	if(!deviceConfig){
		throw new Error(`Device config is undefined. Is this a supported mouse?`);
	}

	const RGBData = new Array(deviceConfig.ledSpacing * 3);

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
			col = subdevice ? device.subdeviceColor(deviceConfig.name, ledPosition[0], ledPosition[1]) : device.color(ledPosition[0], ledPosition[1]);
		}

		const ledIdx = deviceConfig.ledMap[iIdx];

		RGBData[ledIdx] = col[0];
		RGBData[ledIdx + deviceConfig.ledSpacing] = col[1];
		RGBData[ledIdx + deviceConfig.ledSpacing * 2] = col[2];
	}

	return RGBData;
}

function getLightingControllerColors(deviceConfig, shutdown = false, subdevice = false) {
	if(!deviceConfig){
		throw new Error(`Device config is undefined. Is this a supported mouse?`);
	}

	const RGBData = new Array(deviceConfig.ledMap.length * 3);

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
			col = subdevice? device.subdeviceColor(deviceConfig.name, ledPosition[0], ledPosition[1]) : device.color(ledPosition[0], ledPosition[1]);
		}

		const ledIdx = deviceConfig.ledMap[iIdx];

		RGBData[ledIdx * 3] = col[0];
		RGBData[ledIdx * 3 + 1] = col[1];
		RGBData[ledIdx * 3 + 2] = col[2];
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

	static GetKeyMapping(keyIdx, deviceType) {
		if(deviceType === "Keyboard") {
			return CorsairLibrary.KeyboardKeyMapping()[keyIdx];
		} else if(deviceType === "Mouse") {
			return CorsairLibrary.MouseKeyMapping()[keyIdx];
		}

		device.log(`deviceType ${deviceType} is either undefined or not a keyboard/mouse.`);
	};

	static MouseKeyMapping(){
		return Object.freeze({
			//0: "Left Click",
			//1: "Right Click",
			//2: "Middle Click",
			//3: "Forward",
			//4: "Back",
			5: "Dpi Stage Up",
			6: "Dpi Stage Down", //Cycle DPI on Sabre Pro.
			7: "Profile Switch",
			//8: "Scroll Up",
			//9: "Scroll Down",
			//200: "Sniper" //This is a placeholder
		});
	}

	static KeyboardKeyMapping(){
		return Object.freeze({
			//0  : "",
			//1  : "",
			//2  : "",
			//3  : "",
			//4  : "A",
			//5  : "B",
			//6  : "C",
			//7  : "D",
			//8  : "E",
			//9  : "F",
			//10 : "G",
			//11 : "H",
			//12 : "I",
			//13 : "J",
			//14 : "K",
			//15 : "L",
			//16 : "M",
			//17 : "N",
			//18 : "O",
			//19 : "P",
			//20 : "Q",
			//21 : "R",
			//22 : "S",
			//23 : "T",
			//24 : "U",
			//25 : "V",
			//26 : "W",
			//27 : "X",
			//28 : "Y",
			//29 : "Z",
			//30 : "1",
			//31 : "2",
			//32 : "3",
			//33 : "4",
			//34 : "5",
			//35 : "6",
			//36 : "7",
			//37 : "8",
			//38 : "9",
			//39 : "0",
			//40 : "Enter",
			//41 : "Esc",
			//42 : "",
			//43 : "Tab",
			//44 : "Space",
			//45 : "-",
			//46 : "=",
			//47 : "[",
			//48 : "]",
			//49 : "\\",
			//50 : "",
			//51 : ";",
			//52 : "'",
			//53 : "`",
			//54 : ",",
			//55 : ".",
			//56 : "/",
			//57 : "Caps",
			//58 : "F1",
			//59 : "F2",
			//60 : "F3",
			//61 : "F4",
			//62 : "F5",
			//63 : "F6",
			//64 : "F7",
			//65 : "F8",
			//66 : "F9",
			//67 : "F10",
			//68 : "F11",
			//69 : "F12",
			//70 : "Print Screen",
			//71 : "Scroll Lock",
			//72 : "Pause Break",
			//73 : "Insert",
			//74 : "Home",
			//75 : "Page Up",
			//76 : "Delete",
			//77 : "End",
			//78 : "Page Down",
			//79 : "Right Arrow",
			//80 : "Left Arrow",
			//81 : "Down Arrow",
			//82 : "Up Arrow",
			//83 : "Num Lock",
			//84 : "Num /",
			//85 : "Num *",
			//86 : "Num -",
			//87 : "Num +",
			//88 : "Num Enter",
			//89 : "Num 1",
			//90 : "Num 2",
			//91 : "Num 3",
			//92 : "Num 4",
			//93 : "Num 5",
			//94 : "Num 6",
			//95 : "Num 7",
			//96 : "Num 8",
			//97 : "Num 9",
			//98 : "Num 0",
			//99 : "Num .",
			//100 : "",
			//101 : "Menu",
			//102 : "Mute",
			//103 : "Volume Up",
			//104 : "Volume Down",
			//105 : "Left Ctrl",
			//106 : "",
			//107 : "Left Alt",
			//108 : "Windows",
			//109 : "Right Ctrl",
			//110 : "Right Shift",
			//111 : "Right Alt",
			//112 : "",
			113 : "Brightness",
			114 : "Lock",
			//115 : "",
			//116 : "",
			//117 : "",
			//118 : "",
			//119 : "",
			//120 : "",
			//121 : "",
			122 : "Fn",
			//123 : "Stop",
			//124 : "Play/Pause",
			//125 : "Skip",
			//126 : "Rewind",
			//127 : "",
			128 : "Profile",
			//129 : "",
			//130 : "",
			131 : "G1",
			132 : "G2",
			133 : "G3",
			134 : "G4",
			135 : "G5",
			136 : "G6",
			137 : "Wheel Key",
			//138 : "",
			//139 : "",
			//140 : "",
			//141 : "",
			//142 : "",
			//143 : ""
		});
	}

	static ProductIDList(){
		return Object.freeze({
			0x1BA6 : "Multipoint Slip Stream Dongle", // Slip Stream Dongle (multipoint)
			0x1B7F : "Dark Core Pro SE", //"Slip Stream Dongle", // Dark Core Pro SE Wireless Dongle
			0x1B7E : "Dark Core Pro SE", // Dark Core Pro SE Wired
			0x1B80 : "Dark Core Pro", //"Slip Stream Dongle", // Dark Core Pro Wireless //These receivers can be paired to any slipstream capable device.
			0x1B81 : "Dark Core Pro", // Dark Core Pro Wired
			0x1BB2 : "Darkstar",
			0x1B98 : "Sabre RGB Pro Wireless",
			0x1B79 : "Sabre RGB Pro",
			0x1B14 : "Sabre RGB",
			0x1B2F : "Sabre RGB",
			0x1B5E : "Harpoon Wireless",
			0x1B65 : "Harpoon Wireless",
			0x1B4C : "Ironclaw Wireless",
			0x1B66 : "Ironclaw Wireless",
			0x1B70 : "M55",
			0x1b9e : "M65 Ultra",
			0x1B89 : "K95 Plat XT",
			0x1BAB : "K100 Air",
			0x1BA4 : "K55 Pro",
			0x1BA1 : "K55 Pro XT",
			0x1B6E : "K57",
			0x1BA0 : "K60 Pro",
			0x1BAD : "K60 Pro", //Low Profile
			0x1B8D : "K60 Pro", //SE
			0x1BC7 : "K60 Pro TKL",
			0x1BAF : "K65 Mini",
			0x1bcf : "K65 Mini",
			0x1bc3 : "K65 Mini",
			0x1BBD : "K65 Mini",
			0x1BC0 : "K70 Max",
			0x1bb6 : "K70 Pro Mini",
			0x1BC4 : "K70 Pro",
			0x1BB3 : "K70 Pro",
			0x1BD4 : "K70 Pro",
			0x1BC6 : "K70 Pro",
			0x1bb9 : "K70 TKL",
			0x1B73 : "K70 TKL",
			0x1BFD : "K70 Core",
			0x1BFF : "K70 Core",
			0x1B7D : "K100",
			0x1BC5 : "K100",
			0x1B7C : "K100"
		});
	}

	static DeviceImageLibrary() {
		return Object.freeze({
			"Dark Core Pro SE" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"Dark Core Pro" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"Darkstar" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"Sabre RGB Pro Wireless" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"Sabre RGB Pro" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"Sabre RGB" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"Harpoon Wireless" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"Ironclaw Wireless" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"M55" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"M65 Ultra" : "https://assets.signalrgb.com/devices/default/mice/mouse.png",
			"K55 Pro" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K55 Pro XT" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K57" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K60 Pro" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K60 Pro TKL" : "https://assets.signalrgb.com/devices/default/keyboards/tkl-keyboard-render.png",
			"K65 Mini"  : "https://assets.signalrgb.com/devices/default/keyboards/65-keyboard-render.png",
			"K70 Pro Mini"  : "https://assets.signalrgb.com/devices/default/keyboards/keyboard-60.png",
			"K70 Pro" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K70 Core" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K70 Max" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K70 TKL" : "https://assets.signalrgb.com/devices/default/keyboards/keyboard-80.png",
			"K95 Plat XT" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K100 Air" : "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png",
			"K100" : "https://assets.signalrgb.com/devices/default/keyboards/6-macro-keyboard-render.png",
		});
	}

	// Qt needs to add support for static properties...
	/** @return {Object<string, CorsairDeviceInfo>} */
	static DeviceList(){
		return Object.freeze({
			"Multipoint Slip Stream Dongle": {
				name: "Slipstream Dongle",
				size: [7, 7],
				ledNames: [],
				ledPositions: [],
				ledMap: [],
				devFirmware: "5.6.126",
				ledSpacing: 0,
			},
			"Dark Core Pro SE": {
				name: "Dark Core Pro SE Wireless",
				size: [7, 7],
				ledNames: ["Scroll Wheel",
					"Side Led 1", "Side Led 2", "Side Led 3", "Side Led 4", "Side Led 5", "logo", "Right Side Led",
					"Dpi 1", "dpi 2", "Dpi 3",
					"Battery indicator"
				],
				ledPositions: [
					[3, 0],
					[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [3, 5], [5, 5],
					[0, 0], [0, 1], [0, 2],
					[3, 1]
				],
				ledMap: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
				devFirmware: "5.6.126",
				ledSpacing: 12,
				keyCount: 8,
				keymapType : "Mouse",
				maxDPI : 18000
			},
			"Dark Core Pro": {
				name: "Dark Core Pro Wireless",
				size: [7, 7],
				ledNames: ["Scroll Wheel",
					"Side Led 1", "Side Led 2", "Side Led 3", "Side Led 4", "Side Led 5", "logo", "Right Side Led",
					"Dpi 1", "dpi 2", "Dpi 3",
					"Battery indicator"
				],
				ledPositions: [
					[3, 0],
					[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [3, 5], [5, 5],
					[0, 0], [0, 1], [0, 2],
					[3, 1]
				],
				ledMap: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
				devFirmware: "5.6.126",
				ledSpacing: 12,
				keyCount: 8,
				keymapType : "Mouse",
				maxDPI : 18000
			},
			"Darkstar": {
				name: "Darkstar Wireless",
				size: [7, 7],
				ledNames: [
					"Front Left", "Front Right",
					"Scroll Wheel",
					"Top Led 1", "Top Led 2", "Top Led 3", "Top Led 4", "Top Led 5", "Top Led 6",
					"Logo",
					"DPI LED 1", "DPI LED 2", "DPI LED 3"
				],
				ledPositions: [
					[1, 0], 		[5, 0],
					[3, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
					[3, 4],
					[0, 1], [1, 1], [2, 1]
				],
				ledMap: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
				devFirmware: "0.0.0",
				ledSpacing: 13,
				keyCount: 15,
				keymapType : "Mouse",
				maxDPI : 26000
			},
			"Harpoon Wireless": {
				name: "Harpoon Wireless",
				size: [3, 5],
				ledNames: [ "Dpi Zone", "Logo Zone" ],
				ledPositions: [ [1, 0], [1, 2] ],
				ledMap: [ 0, 1 ],
				devFirmware: "5.6.126",
				ledSpacing: 2,
				keymapType : "Mouse",
				maxDPI : 12400
			},
			"Ironclaw Wireless": {
				name: "Ironclaw Wireless",
				size: [5, 3],
				ledNames: [ "Logo", "Scroll Zone", "Front Zone", "Dpi Zone Low", "Dpi Zone Mid", "Dpi Zone High" ],
				ledPositions: [ [3, 2], [3, 1], [3, 0], [0, 1], [1, 1], [2, 1] ],
				ledMap: [ 0, 1, 2, 3, 4, 5 ],
				devFirmware: "5.6.126",
				ledSpacing: 6,
				keymapType : "Mouse",
				maxDPI : 12400
			},
			"M55": {
				name: "M55",
				size: [3, 3],
				ledNames: [ "DPI Zone", "Logo Zone" ],
				ledPositions: [ [1, 0], [1, 1] ],
				ledMap: [ 0, 1 ],
				devFirmware: "4.7.23",
				ledSpacing: 2,
				keymapType : "Mouse",
				maxDPI : 12400,
			},
			"M65 Ultra": {
				name: "M65 Ultra",
				size: [5, 4],
				ledNames: [ "Scroll wheel", "DPI button", "Logo" ],
				ledPositions: [ [1, 1], [1, 2], [1, 3] ],
				ledMap: [ 0, 1, 2 ],
				devFirmware: "0.0.0",
				ledSpacing: 3,
				keymapType : "Mouse",
				maxDPI : 26500,
				hasSniperButton : true
			},
			"Sabre RGB Pro": {
				name: "Sabre Pro",
				size: [3, 5],
				ledNames: [ "Logo Zone", "Scroll Zone", "DPI Zone 1", "DPI Zone 2", "DPI Zone 3" ],
				ledPositions: [ [1, 4], [1, 2], [0, 1], [0, 2], [0, 3] ],
				ledMap: [ 0, 1, 2, 3, 4 ],
				devFirmware: "5.6.126",
				ledSpacing: 5,
				keymapType : "Mouse",
				maxDPI : 12400
			},
			"Sabre RGB": {
				name: "Sabre RGB",
				size: [3, 3],
				ledNames: [ "Scroll Zone", "Front Zone", "Bottom LED?", "Logo Zone" ],
				ledPositions: [ [1, 1], [1, 0], [1, 1], [1, 2] ],
				ledMap: [ 0, 1, 2, 3 ],
				devFirmware: "5.6.126",
				ledSpacing: 4,
				keymapType : "Mouse",
				maxDPI : 12400
			},
			"Sabre RGB Pro Wireless": {
				name: "Sabre Pro Wireless",
				size: [3, 5],
				ledNames: [ "Logo Zone",  "Profile Indicator", "DPI Indicator" ],
				ledPositions: [ [1, 4], [1, 3], [1, 2] ],
				ledMap: [ 0, 1, 2 ],
				devFirmware: "5.6.126",
				ledSpacing: 3,
				keymapType : "Mouse",
				maxDPI : 26000
			},
			"K55 Pro": {
				name: "K55 Pro",
				size: [24, 6],
				ledNames: [ "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", ],
				ledPositions: [ [0, 0], [6, 0], [13, 0], [17, 0], [21, 0] ],
				ledMap: [ 1, 2, 3, 4, 5 ],
				devFirmware: "0.0.0",
				ledSpacing: 6,
				keymapType : "Keyboard",
			},
			"K55 Pro XT": {
				name: "K55 Pro XT",
				size: [24, 8],
				ledNames: [
					"G1", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",        "Print Screen", "Scroll Lock", "Pause Break",
					"G2", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",  //21
					"G3", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",    //21
					"G4", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                              "Num 4", "Num 5", "Num 6",             //16
					"G5", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter", //17
					"G6", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",                       //13
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 1],  [1, 1],    [3, 1], [4, 1], [5, 1], [6, 1],     [7, 1], [8, 1], [9, 1], [10, 1],   [12, 1], [13, 1], [14, 1], [15, 1],  [15, 1], [16, 1], [17, 1],
					[0, 2],  [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],   [18, 2], [19, 2], [20, 2], [21, 2],
					[0, 3],  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],   [15, 3], [16, 3], [17, 3],   [18, 3], [19, 3], [20, 3], [21, 3],
					[0, 4],  [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],         [14, 4],                             [18, 4], [19, 4], [20, 4],
					[0, 5],  [1, 5],     [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],            [14, 5],           [16, 5],           [18, 5], [19, 5], [20, 5], [21, 5],
					[0, 6],  [1, 6], [2, 6], [3, 6],                      [7, 6],                       [11, 6], [12, 6], [13, 6], [14, 6],   [15, 6], [16, 6], [17, 6],   [18, 6],        [20, 6],
					//ISO
					[2, 5], [13, 4]
				 ],
				ledMap: [
					//Main Keyboard
					131,  41,       58,  59,  60,  61,       62,  63,  64,  65,       66,  67,  68,  69,  70,  71,  72,
					132,  53,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,       45,  46,  42,       73,  74,  75,  83,  84,  85,  86,
					133,  43,       20,  26,   8,  21,       23,  28,  24,  12,  18,  19,  47,  48,  49,  76,  77,  78,  95,  96,  97,  87,
					134,  57,        4,  22,   7,   9,       10,  11,  13,  14,  15,  51,  52,       40,                 92,  93,  94,
					135, 106,       29,  27,   6,  25,        5,       17,  16,  54,  55,  56, 110,            82,       89,  90,  91,  88,
					136, 105, 108, 107,                      44,                     111, 122, 101, 109,  80,  81,  79,  98,    99,

					100, 50 //ISO
				 ],
				devFirmware: "0.0.0",
				ledSpacing: 137,
				keymapType : "Keyboard",
			},
			"K57": {
				name: "K57",
				size: [22, 7],
				ledNames: [
					"G1", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",        "Print Screen", "Scroll Lock", "Pause Break",
					"G2", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",  //21
					"G3", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",    //21
					"G4", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                              "Num 4", "Num 5", "Num 6",             //16
					"G5", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter", //17
					"G6", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",                       //13
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 1],  [1, 1],    [3, 1], [4, 1], [5, 1], [6, 1],     [7, 1], [8, 1], [9, 1], [10, 1],   [12, 1], [13, 1], [14, 1], [15, 1],  [15, 1], [16, 1], [17, 1],
					[0, 2],  [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],   [18, 2], [19, 2], [20, 2], [21, 2],
					[0, 3],  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],   [15, 3], [16, 3], [17, 3],   [18, 3], [19, 3], [20, 3], [21, 3],
					[0, 4],  [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],         [14, 4],                             [18, 4], [19, 4], [20, 4],
					[0, 5],  [1, 5],     [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],            [14, 5],           [16, 5],           [18, 5], [19, 5], [20, 5], [21, 5],
					[0, 6],  [1, 6], [2, 6], [3, 6],                      [7, 6],                       [11, 6], [12, 6], [13, 6], [14, 6],   [15, 6], [16, 6], [17, 6],   [18, 6],        [20, 6],
					//ISO
					[2, 5], [13, 4]
				 ],
				ledMap: [
					//Main KeyBoard
					131,  41,       58,  59,  60,  61,       62,  63,  64,  65,       66,  67,  68,  69,  70,  71,  72,
					132,  53,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,       45,  46,  42,       73,  74,  75,  83,  84,  85,  86,
					133,  43,       20,  26,   8,  21,       23,  28,  24,  12,  18,  19,  47,  48,  49,  76,  77,  78,  95,  96,  97,  87,
					134,  57,        4,  22,   7,   9,       10,  11,  13,  14,  15,  51,  52,       40,                 92,  93,  94,
					135, 106,       29,  27,   6,  25,        5,       17,  16,  54,  55,  56, 110,            82,       89,  90,  91,  88,
					136, 105, 108, 107,                      44,                     111, 122, 101, 109,  80,  81,  79,  98,    99,

					100, 50 //ISO
				 ],
				devFirmware: "0.0.0",
				ledSpacing: 137,
				keymapType : "Keyboard",
			},
			"K60 Pro": {
				name: "K60 Pro",
				size: [24, 8],
				ledNames: [
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",  //21
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",    //21
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                              "Num 4", "Num 5", "Num 6",             //16
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter", //17
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",                       //13

					"ISO #", "ISO <"
				],
				ledPositions: [
					[1, 1],    [3, 1], [4, 1], [5, 1], [6, 1],     [7, 1], [8, 1], [9, 1], [10, 1],  [11, 1], [12, 1], [13, 1], [14, 1],  [15, 1], [16, 1], [17, 1],     //[18,1], [19,1],[20,1], [21,1],
					[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],   [18, 2], [19, 2], [20, 2], [21, 2],
					[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],   [15, 3], [16, 3], [17, 3],   [18, 3], [19, 3], [20, 3], [21, 3],
					[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],         [14, 4],                             [18, 4], [19, 4], [20, 4],
					[1, 5],     [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],            [14, 5],           [16, 5],           [18, 5], [19, 5], [20, 5], [21, 5],
					[1, 6], [2, 6], [3, 6],                      [7, 6],                       [11, 6], [12, 6], [13, 6], [14, 6],   [15, 6], [16, 6], [17, 6],   [18, 6],        [20, 6],

					//ISO
					[2, 5], [13, 4]
				 ],
				ledMap: [
					41, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,    //120, 123, 121, 122,
					53, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 73, 74, 75, 83, 84, 85, 86,
					43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49, 76, 77, 78, 95, 96, 97, 87,
					57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40, 92, 93, 94,
					106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 82, 89, 90, 91, 88,
					105, 108, 107, 44, 111, 122, 101, 109, 80, 81, 79, 98, 99,

					//ISO
					100, 50
				 ],
				devFirmware: "0.0.0",
				ledSpacing: 150,
				keymapType : "Keyboard",
			},
			"K60 Pro TKL": {
				name: "K60 Pro TKL",
				size: [18, 7],
				ledNames: [
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up", //21
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down", //21
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", //16
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",  //17
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",                    //13

					"ISO #", "ISO <"
				],
				ledPositions: [
					[1, 1],    [3, 1], [4, 1], [5, 1], [6, 1],     [7, 1], [8, 1], [9, 1], [10, 1],   [12, 1], [13, 1], [14, 1], [15, 1],  [15, 1], [16, 1], [17, 1],     //[18,1], [19,1],[20,1], [21,1],
					[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],   [15, 2], [16, 2], [17, 2],
					[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],   [15, 3], [16, 3], [17, 3],
					[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],         [14, 4],
					[1, 5],     [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],            [14, 5],           [16, 5],
					[1, 6], [2, 6], [3, 6],                      [7, 6],                       [11, 6], [12, 6], [13, 6], [14, 6],   [15, 6], [16, 6], [17, 6],

					//ISO
					[2, 5], [13, 4]
				 ],
				ledMap: [
					41, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,    //120, 123, 121, 122,
					53, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 73, 74, 75,
					43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49, 76, 77, 78,
					57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40,
					106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 82,
					105, 108, 107, 44, 111, 122, 101, 109, 80, 81, 79,

					//ISO
					100, 50
				 ],
				devFirmware: "0.0.0",
				ledSpacing: 150,
				keymapType : "Keyboard",
			},
			"K65 Mini": { //Broken keymap is very very likely
				name: "K65 Mini",
				size: [14, 7],
				ledNames: [
					"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",
					"Left Ctrl", "Left Win", "Left Alt", "Space Left", "Space", "Space Right", "Right Alt", "Fn", "Menu", "Right Ctrl",
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],  [10, 2], [11, 2], [12, 2], [13, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],  [10, 3], [11, 3], [12, 3], [13, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],  [10, 4], [11, 4],         [13, 4],
					[0, 5],        [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],  [10, 5], [11, 5],         [13, 5],
					[0, 6], [1, 6], [2, 6],        [4, 6],       [6, 6],         [8, 6],              [10, 6], [11, 6], [12, 6], [13, 6],
					//ISO
					[2, 5], [12, 4]
				 ],
				ledMap: [
					41,   30, 31,  32, 33, 34, 35,  36,  37,  38, 39, 45, 46,   42,
					43,   20, 26,  8,  21, 23, 28,  24,  12,  18, 19, 47, 48,   49,
					57,   4,  22,  7,  9,  10, 11,  13,  14,  15, 51, 52,       40,
					106,  29, 27,  6,  25, 5,  17,  16,  54,  55, 56,           110,
					105,  108, 107, 0, 44, 1,  111, 122, 101,                   109,
					100, 50 //ISO
				 ],
				devFirmware: "0.0.0",
				ledSpacing: 0,
				keymapType : "Keyboard",
			},
			"K70 Pro Mini": {
				name: "K70 Pro Mini",
				size: [16, 8],
				ledNames: [
					"TopBar1", "TopBar2", "TopBar3", "TopBar4", "TopBar5", "TopBar6", "TopBar7", "TopBar8", "TopBar9", "TopBar10", "TopBar11",
					"LeftBar1", "Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace", "RightBar1",
					"LeftBar2", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "RightBar2",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
					"LeftBar3", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "RightBar3",
					"LeftBar4", "Left Ctrl", "Left Win", "Left Alt", "Space Left", "Space", "Space Right", "Right Alt", "Fn", "Menu", "Right Ctrl", "RightBar4",
					"BottomBar1", "BottomBar2", "BottomBar3", "BottomBar4", "BottomBar5", "BottomBar6", "BottomBar7", "BottomBar8", "BottomBar9", "BottomBar10", "BottomBar11",
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 1], [1, 1],         [3, 1], [4, 1],         [6, 1], [7, 1],         [9, 1],  [10, 1], [11, 1], [12, 1], [13, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],  [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],  [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],  [10, 4], [11, 4],          [13, 4],
					[0, 5],         [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],  [10, 5], [11, 5],          [13, 5], [14, 5], [15, 5],
					[0, 6], [1, 6], [2, 6],         [4, 6],         [6, 6],         [8, 6],          [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6],
					[0, 7], [1, 7],         [3, 7], [4, 7],         [6, 7], [7, 7],         [9, 7],  [10, 7], [11, 7], [12, 7], [13, 7],
					//ISO
					[2, 5], [12, 4]
				],
				ledMap: [
					123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133,
					160, 41, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 171,
					43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49,
					161, 57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40, 172,
					162, 106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 173,
					163, 105, 108, 107, 0, 44, 1, 111, 122, 101, 109, 174,
					193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203,
					100, 50 //ISO
				],
				devFirmware: "0.0.0",
				ledSpacing: 0,
				keymapType : "Keyboard"
			},
			"K70 Pro": {
				name: "K70 Pro",
				size: [22, 7],
				ledNames: [
					"Profile", "Brightness", "Lock",    "LeftLogo", "RightLogo",  "VOLUME_MUTE",
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break", "MediaStop", "MediaRewind", "MediaPlayPause", "MediaFastForward",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",      "Insert", "Home", "Page Up",    "NumLock", "Num /", "Num *", "Num -",

					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",             "Del", "End", "Page Down",      "Num 7", "Num 8", "Num 9", "Num +",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                   "Num 4", "Num 5", "Num 6",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                          "Up Arrow",           "Num 1", "Num 2", "Num 3", "Num Enter",
					"Left Ctrl", "Left Win", "Left Alt", "SpaceBar Left", "Space", "SpaceBar Right", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 0], [1, 0], [2, 0],   								    [8, 0], [8, 0],                                                         				  [19, 0],
					[0, 1],        [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],         [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 1], [21, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   	  [15, 2], [16, 2], [17, 2], [18, 2], [19, 2], [20, 2], [21, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], 		  [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3], [20, 3], [21, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],         [13, 4],                                 [18, 4], [19, 4], [20, 4],
					[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],         [12, 5],                         [16, 5],         [18, 5], [19, 5], [20, 5], [21, 5],
					[0, 6], [1, 6], [2, 6],                      [6, 6], [7, 6], [8, 6],                [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6],        [20, 6],

					//ISO
					[13, 3], [2, 5]
				],
				ledMap: [
					128, 113, 114, 137, 138, 102,
					41, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 123, 126, 124, 125,
					53, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 73, 74, 75, 83, 84, 85, 86,
					43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49, 76, 77, 78, 95, 96, 97, 87,
					57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40, 92, 93, 94,
					106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 82, 89, 90, 91, 88,
					105, 108, 107, 140, 44, 141, 111, 122, 101, 109, 80, 81, 79, 98, 99,

					100, 50 //ISO
				],
				devFirmware: "5.6.126",
				ledSpacing: 0,
				keymapType : "Keyboard"
			},
			"K70 Core": {
				name: "K70 Core",
				size: [22, 7],
				ledNames: [
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",      "Insert", "Home", "Page Up",    "NumLock", "Num /", "Num *", "Num -",

					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",             "Del", "End", "Page Down",      "Num 7", "Num 8", "Num 9", "Num +",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                   "Num 4", "Num 5", "Num 6",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                          "Up Arrow",           "Num 1", "Num 2", "Num 3", "Num Enter",
					"Left Ctrl", "Left Win", "Left Alt", "Space",  "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 1],        [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],         [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   	  [15, 2], [16, 2], [17, 2], [18, 2], [19, 2], [20, 2], [21, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], 		  [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3], [20, 3], [21, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],         [13, 4],                                 [18, 4], [19, 4], [20, 4],
					[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],         [12, 5],                         [16, 5],         [18, 5], [19, 5], [20, 5], [21, 5],
					[0, 6], [1, 6], [2, 6],                      [7, 6],                [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6],        [20, 6],

					//ISO
					[13, 3], [2, 5]
				],
				ledMap: [
					41, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
					53, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 73, 74, 75, 83, 84, 85, 86,
					43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49, 76, 77, 78, 95, 96, 97, 87,
					57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40, 92, 93, 94,
					106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 82, 89, 90, 91, 88,
					105, 108, 107, 44, 111, 122, 101, 109, 80, 81, 79, 98, 99,

					100, 50 //ISO
				],
				devFirmware: "5.6.126",
				ledSpacing: 0,
				keymapType : "Keyboard"
			},
			"K70 Max": {
				name: "K70 Max",
				size: [22, 7],
				ledNames: [
					"Profile", "Brightness", "Lock",    "LeftLogo", "RightLogo",  "VOLUME_MUTE",
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break", "MediaStop", "MediaRewind", "MediaPlayPause", "MediaFastForward",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",      "Insert", "Home", "Page Up",    "NumLock", "Num /", "Num *", "Num -",

					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",             "Del", "End", "Page Down",      "Num 7", "Num 8", "Num 9", "Num +",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                   "Num 4", "Num 5", "Num 6",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                          "Up Arrow",           "Num 1", "Num 2", "Num 3", "Num Enter",
					"Left Ctrl", "Left Win", "Left Alt", "SpaceBar Left", "Space", "SpaceBar Right", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 0], [1, 0], [2, 0],   								    [8, 0], [8, 0],                                                         				  [19, 0],
					[0, 1],        [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],         [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 1], [21, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   	  [15, 2], [16, 2], [17, 2], [18, 2], [19, 2], [20, 2], [21, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], 		  [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3], [20, 3], [21, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],         [13, 4],                                 [18, 4], [19, 4], [20, 4],
					[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],         [12, 5],                         [16, 5],         [18, 5], [19, 5], [20, 5], [21, 5],
					[0, 6], [1, 6], [2, 6],                      [6, 6], [7, 6], [8, 6],                [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6],        [20, 6],

					//ISO
					[13, 3], [2, 5]
				],
				ledMap: [
					128, 113, 114, 137, 138, 102,
					41, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 123, 126, 124, 125,
					53, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 73, 74, 75, 83, 84, 85, 86,
					43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49, 76, 77, 78, 95, 96, 97, 87,
					57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40, 92, 93, 94,
					106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 82, 89, 90, 91, 88,
					105, 108, 107, 140, 44, 141, 111, 122, 101, 109, 80, 81, 79, 98, 99,

					100, 50 //ISO
				],
				devFirmware: "5.6.126",
				ledSpacing: 0,
				keymapType : "Keyboard"
			},
			"K70 TKL": {
				name: "K70 TKL",
				size: [22, 8],
				ledNames: [
					"MediaStop", "MediaPreviousTrack", "MediaPlayPause", "MediaNextTrack",  "Logo 1", "Logo 2", "Profile", "Brightness", "Lock", "VOLUME_MUTE",
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",
					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",
					"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow",
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 0], [1, 0], [2, 0],  [3, 0],         [7, 0], [8, 0],                               [11, 0], [12, 0], [13, 0],   [14, 0],
					[0, 1],        [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],  [10, 1], [11, 1], [12, 1], [13, 1],   [14, 1], [15, 1], [16, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],  [10, 2], [11, 2], [12, 2], [13, 2],   [14, 2], [15, 2], [16, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],  [10, 3], [11, 3], [12, 3], [13, 3],   [14, 3], [15, 3], [16, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],  [10, 4], [11, 4],         [13, 4],
					[0, 5],        [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],  [10, 5], [11, 5],         [13, 5],           [15, 5],
					[0, 6], [1, 6], [2, 6],                      [6, 6],                       [10, 6], [11, 6], [12, 6], [13, 6],   [14, 6], [15, 6], [16, 6],
					//ISO
					[2, 5], [13, 4]
				],
				ledMap: [
					123, 126, 124, 125, 3, 1, 128, 113, 114, 102,
					41, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
					53, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 73, 74, 75,
					43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49, 76, 77, 78,
					57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40,
					106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 82,
					105, 108, 107, 44, 111, 122, 101, 109, 80, 81, 79,
					100, 50 //ISO
				],
				devFirmware: "0.0.0",
				ledSpacing: 0,
				keymapType : "Keyboard"
			},
			"K95 Plat XT": {
				name: "K95 Platinum XT",
				size: [22, 7],
				ledNames: [
					"lightBar1", "lightBar2", "lightBar3", "lightBar4", "lightBar5", "lightBar6", "lightBar7", "lightBar8", "lightBar9", "lightBar10", "lightBar11", "lightBar12", "lightBar13", "lightBar14",
					"lightBar15", "lightBar16", "lightBar17", "lightBar18", "lightBar19",

					"Profile", "Brightness", "Lock", "Mute",
					"G1", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Print Screen", "Scroll Lock", "Pause Break", "MediaStop", "MediaRewind", "MediaPlayPause", "MediaFastForward",
					"G2", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace", "Insert", "Home", "Page Up", "NumLock", "Num /", "Num *", "Num -",
					"G3", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Del", "End", "Page Down", "Num 7", "Num 8", "Num 9", "Num +",
					"G4", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", "Num 4", "Num 5", "Num 6",
					"G5", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "Num 1", "Num 2", "Num 3", "Num Enter",
					"G6", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl", "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",
					//ISO
					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [11, 0], [12, 0], [13, 0], [14, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0],

					[4, 0], [5, 0], [6, 0], [18, 0],
					[0, 1], [1, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [12, 1], [13, 1], [14, 1], [15, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 1], [21, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [18, 2], [19, 2], [20, 2], [21, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3], [20, 3], [21, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [14, 4], [18, 4], [19, 4], [20, 4],
					[0, 5], [1, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [14, 5], [16, 5], [18, 5], [19, 5], [20, 5], [21, 5],
					[0, 6], [1, 6], [2, 6], [3, 6], [7, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6], [20, 6],

					//ISO
					[2, 5], [13, 4]
				],
				ledMap: [
					137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155,

					128, 113, 114, 102,
					131, 41, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 123, 126, 124, 125,
					132, 53, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 73, 74, 75, 83, 84, 85, 86,
					133, 43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49, 76, 77, 78, 95, 96, 97, 87,
					134, 57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40, 92, 93, 94,
					135, 106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 82, 89, 90, 91, 88,
					136, 105, 108, 107, 44, 111, 112, 101, 109, 80, 81, 79, 98, 99,
					100, 50
				],
				devFirmware: "4.22.30",
				ledSpacing: 156,
				keymapType : "Keyboard"
			},
			"K100 Air": {
				name: "K100 Air",
				size: [22, 7],
				ledNames: [
					"Profile", "Brightness", "Lock",    "LeftLogo", "RightLogo",  "MediaRewind", "MediaPlayPause", "MediaFastForward", "VOLUME_MUTE",
					"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",  "Print Screen", "Scroll Lock", "Pause Break",  "G1", "G2", "G3", "G4",
					"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",      "Insert", "Home", "Page Up",    "NumLock", "Num /", "Num *", "Num -",

					"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",             "Del", "End", "Page Down",      "Num 7", "Num 8", "Num 9", "Num +",
					"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                   "Num 4", "Num 5", "Num 6",
					"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                          "Up Arrow",           "Num 1", "Num 2", "Num 3", "Num Enter",
					"Left Ctrl", "Left Win", "Left Alt",  "Space",  "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",
				],
				ledPositions: [
					[0, 0], [1, 0], [2, 0],   								        [8, 0], [8, 0],                                              [15, 0], [16, 0], [17, 0], [18, 0],
					[0, 1],         [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],          [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 1], [21, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2],   	     [15, 2], [16, 2], [17, 2], [18, 2], [19, 2], [20, 2], [21, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], 		    [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3], [20, 3], [21, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4],          [13, 4],                                     [18, 4], [19, 4], [20, 4],
					[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],          [12, 5],                            [16, 5],          [18, 5], [19, 5], [20, 5], [21, 5],
					[0, 6], [1, 6], [2, 6],                          	    [7, 6],                          [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6],          [20, 6],
				],
				ledMap: [
					128, 113, 114, 							 135, 136,				      126, 124, 125,	102,
					41,  58,  59,  60,  61,       62,  63,  64,  65,  66,  67,  68,  69,  70,  71,  72,     131, 132, 133, 134,
					53,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  45,  46,  42,  73,  74,  75,     83,  84,  85,  86,
					43,  20,  26,  8,   21,  23,  28,  24,  12,  18,  19,  47,  48,  49,  76,  77,  78,     95,  96,  97,  87,
					57,  4,   22,  7,   9,   10,  11,  13,  14,  15,  51,  52,  40,                         92,  93,  94,
					106, 29,  27,  6,   25,  5,   17,  16,  54,  55,  56,       110,           82,          89,  90,  91,  88,
					105, 108, 107,              44,             111,  122, 101, 109,      80,  81,  79,     98,       99,
				],
				devFirmware: "5.13.81",
				ledSpacing: 0,
				keymapType : "Keyboard"
				//Wireless indicator is 3, 1 is battery indicator
			},
			"K100": {
				name: "K100 RGB",
				size: [28, 12],
				ledNames: [
					"lightBar1", "lightBar2", "lightBar3", "lightBar4", "lightBar5", "lightBar6", "lightBar7", "lightBar8", "lightBar9", "lightBar10", "lightBar11", "lightBar12", "lightBar13", "lightBar14", "lightBar15", "lightBar16", "lightBar17", "lightBar18", "lightBar19", "lightBar20", "lightBar21", "lightBar22",
					"LeftBar1",             "Control Wheel 1", "Control Wheel 2", "Control Wheel 3",                                                                                 "RightBar 1",
					"LeftBar2",   "Profile", "Control Wheel 8", "Control Wheel Center", "Control Wheel 4", "Lock",    "Logo 1", "Logo 2", "Logo 3",    "VOLUME_MUTE",                    "RightBar 2",
					"LeftBar3",             "Control Wheel 7", "Control Wheel 6", "Control Wheel 5",                                                                                  "RightBar 3",
					"LeftBar4", "G1", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break", "MediaStop", "MediaRewind", "MediaPlayPause", "MediaFastForward", "RightBar 4",
					"LeftBar5", "G2", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",      "Insert", "Home", "Page Up",    "NumLock", "Num /", "Num *", "Num -", "RightBar 5",
					"LeftBar6",                                                                                                                                                         "RightBar 6",
					"LeftBar7", "G3", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",             "Del", "End", "Page Down",      "Num 7", "Num 8", "Num 9", "Num +",   "RightBar 7",
					"LeftBar8", "G4", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                   "Num 4", "Num 5", "Num 6",  "RightBar 8",
					"LeftBar9", "G5", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                          "Up Arrow",           "Num 1", "Num 2", "Num 3", "Num Enter", "RightBar 9",
					"LeftBar10", "G6", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .", "RightBar 10",
					"LeftBar11", "RightBar11",

					"ISO #", "ISO <"
				],
				ledPositions: [
					[0, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [11, 0], [12, 0], [13, 0], [14, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [23, 0], [24, 0], [25, 0],
					[0, 1],         [3, 1], [4, 1], [5, 1],                                                                                                                                                    [25, 1],
					[0, 2],   [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],                               [11, 2], [12, 2], [13, 2],                                       [21, 2],                                             [25, 2],
					[0, 3],         [3, 3], [4, 3], [5, 3],                                                                                                                                                    [25, 3],
					[0, 4],   [2, 4], [3, 4],    [5, 4], [6, 4], [7, 4], [8, 4],     [9, 4], [10, 4], [11, 4], [12, 4],   [14, 4], [15, 4], [16, 4], [17, 4],  [18, 4], [19, 4], [20, 4],    [21, 4], [22, 4], [23, 4], [24, 4],    [25, 4],
					[0, 5],   [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [17, 5],   [18, 5], [19, 5], [20, 5],    [21, 5], [22, 5], [23, 5], [24, 5],    [25, 5],
					[0, 6],                                                                                                                                                                               [25, 6],
					[0, 7],   [2, 7],  [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7], [16, 7], [17, 7], [18, 7], [19, 7], [20, 7],   [21, 7], [22, 7], [23, 7], [24, 7],   [25, 7],
					[0, 8],    [2, 8],  [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],         [16, 8],                           [21, 8], [22, 8], [23, 8],          [25, 8],
					[0, 9],   [2, 9],  [3, 9],     [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9],            [16, 9],           [19, 9],           [21, 9], [22, 9], [23, 9], [24, 9],  [25, 9],
					[0, 10],  [2, 10],  [3, 10], [4, 10], [5, 10],                      [9, 10],                       [12, 10], [13, 10], [15, 10], [17, 10],   [19, 10], [20, 10], [21, 10],      [22, 10], [23, 10], [25, 10],
					[0, 11],                                                                                                                                                                              [25, 11],
					//ISO
					[2, 5], [13, 4]
				],
				ledMap: [138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 189, 182, 183, 171, 161, 128, 188, 137, 184, 114, 190, 191, 192, 102, 172, 162, 187, 186, 185, 173, 163, 131, 41, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 123, 126, 124, 125, 174, 164, 132, 53, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 42, 73, 74, 75, 83, 84, 85, 86, 175, 165, 176, 166, 133, 43, 20, 26, 8, 21, 23, 28, 24, 12, 18, 19, 47, 48, 49, 76, 77, 78, 95, 96, 97, 87, 177, 167, 134, 57, 4, 22, 7, 9, 10, 11, 13, 14, 15, 51, 52, 40, 92, 93, 94, 178, 168, 135, 106, 29, 27, 6, 25, 5, 17, 16, 54, 55, 56, 110, 82, 89, 90, 91, 88, 179, 169, 136, 105, 108, 107, 44, 111, 122, 101, 109, 80, 81, 79, 98, 99, 180, 170, 181, 100, 50],
				devFirmware: "0.0.0",
				ledSpacing: 0,
				keymapType : "Keyboard"
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

		this.properties =  Object.freeze({ //55 and 5A both return their subdevices on the Link Hub. Not sure on other Bragi Proper devices. ICUE Logs note temp sensors and cooling sensors
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
			0x27: "Error Log"
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
		const packet = [0x00, deviceID | 0x08, this.command.pingDevice];
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());

		if(returnPacket[2] !== 0x12){
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

		 device.log(`Poll Rate is [${this.pollingRates[Corsair.FetchProperty("Polling Rate")]}]`);
		 device.log(`Max Poll Rate is [${this.pollingRates[Corsair.FetchProperty("Max Polling Rate")]}]`);
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

		const firmwareString = `${data[4]}.${data[5]}.${data[6]}`;
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
		const hasIndependentAxes = this.FetchProperty("DPI X", deviceID) !== -1;

		if(hasIndependentAxes) {
			this.SetIndependentXYDPI(DPI, deviceID);
		} else {
			device.log(`Device uses Linked XY DPI's. Ignore Above Error Message.`);
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

		const caller_line = (new Error).stack.split("\n")[2];
		const caller_function = caller_line.slice(0, caller_line.indexOf("@"));
		const line_number = caller_line.slice(caller_line.lastIndexOf(":")+1);
		const caller_context = `${caller_function}():${line_number}`;

		switch(Data[3]){
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

		return BinaryUtils.ReadInt32LittleEndian(data.slice(4, 7));
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

		const packet = [0x00, deviceID | 0x08, this.command.setProperty, PropertyId, 0x00, (Value & 0xFF), (Value >> 8 & 0xFF), (Value >> 16 & 0xFF)];
		device.clearReadBuffer(); //I added this, it shouldn't technically be necessary as we're really only checking if it worked.
		device.pause(1);
		device.write(packet, this.GetWriteLength());

		const returnPacket = device.read(packet, this.GetReadLength());

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

		const packet = [0x00, deviceID | 0x08, this.command.getProperty, ...BinaryUtils.WriteInt16LittleEndian(PropertyId)];
		device.clearReadBuffer();
		device.pause(1);
		device.write(packet, this.GetWriteLength());
		device.pause(1);

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

		const packet = [0x00, deviceID | 0x08, this.command.openEndpoint, Handle, Endpoint];
		device.clearReadBuffer();
		device.pause(1);
		device.write(packet, this.GetWriteLength());
		device.pause(1);

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

		const packet = [0x00, deviceID | 0x08, this.command.closeHandle, 1, Handle];
		device.clearReadBuffer();
		device.pause(1);
		device.write(packet, this.GetWriteLength());
		device.pause(1);

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

		if(this.IsHandleOpen(Handle)){
			device.log(`${this.GetNameOfHandle(Handle)} Handle is open. Closing...`);
			this.CloseHandle(Handle, deviceID);
		}
	}

	/**
	 * Performs a Check Command on the HandleId given and returns whether the handle is open.
	 * @param {Handle} Handle - HandleId to perform the check on.
	 * @returns {Boolean} Boolean representing if the Handle is already open.
	 */
	IsHandleOpen(Handle, deviceID = 0){
		if(typeof Handle === "string"){
			Handle = this.handles[Handle];
		}

		device.clearReadBuffer();

		const packet = [0x00, deviceID | 0x08, this.command.checkHandle, Handle, 0x00];
		device.pause(1);
		device.write(packet, this.GetWriteLength());
		device.pause(1);

		const returnPacket = device.read(packet, this.GetReadLength());
		const isOpen = returnPacket[3] !== 3;

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
		const packet = [0x00, deviceID | 0x08, this.command.checkHandle, Handle, 0x00];
		device.clearReadBuffer();
		device.pause(1);
		device.write(packet, this.GetWriteLength());
		device.pause(1);

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
	// * @param {number} Command - CommandId that is contained in the return packet to verify the correct packet was read from the device.
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
		device.pause(1);
		device.write([0x00, deviceID | 0x08, this.command.readEndpoint, Handle], this.GetWriteLength());
		device.pause(1);

		//let Data = [];
		const Data = device.read([0x00], this.GetReadLength());

		//const RetryCount = 4;

		// do {
		// 	RetryCount--;
		// 	device.write([0x00, this.ConnectionType, this.command.readEndpoint, Handle], this.GetWriteLength());
		// 	Data = device.read(Data, this.GetReadLength());

		// 	if(this.dataTypes[Data[4]] !== this.dataTypes[Command]) {
		// 		device.log(`Invalid Command Read: Got [${this.dataTypes[Data[2]]}][${Data[4]}], Wanted [${this.dataTypes[Command]}][${Command}]`);
		// 	}

		// } while(this.dataTypes[Data[4]] !== this.dataTypes[Command] && RetryCount > 0);

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

		if(this.IsHandleOpen(Handle)){
			device.log(`CorsairProtocol: Handle is already open: [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}]. Attemping to close...`);

			this.CloseHandle(Handle);
		}

		let ErrorCode = this.OpenHandle(Handle, Endpoint, deviceID);

		if(ErrorCode){
			device.log(`CorsairProtocol: Failed to open Device Handle [${this.GetNameOfHandle(Handle)}, ${HexFormatter.toHex2(Handle)}]. Aborting WriteEndpoint operation.`);

			return ErrorCode;
		}

		device.clearReadBuffer();
		device.pause(1);
		device.write([0x00, deviceID | 0x08, this.command.writeEndpoint, Handle, ...BinaryUtils.WriteInt32LittleEndian(Data.length)].concat(Data), this.GetWriteLength());

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
	SendRGBData(RGBData, deviceID, isLightingController = false){
		const InitialHeaderSize = 8;
		const HeaderSize = 4;

		// All packets sent to the LightingController Endpoint have these 2 values added before any other data.
		if(isLightingController){
			RGBData.splice(0, 0, ...[this.dataTypes.LightingController, 0x00]);
		}

		const isLightingEndpointOpen = this.IsHandleOpen("Lighting", deviceID);

		if(!isLightingEndpointOpen){
			this.OpenHandle("Lighting", isLightingController ? this.endpoints.LightingController : this.endpoints.Lighting, deviceID);
		}

		let TotalBytes = RGBData.length;
		const InitialPacketSize = this.GetWriteLength() - InitialHeaderSize;

		//device.log(`RGBData length: ${RGBData.length}`);
		this.WriteLighting(RGBData.length, RGBData.splice(0, InitialPacketSize), deviceID);

		TotalBytes -= InitialPacketSize;

		while(TotalBytes > 0){
			const BytesToSend = Math.min(this.GetWriteLength() - HeaderSize, TotalBytes);
			this.StreamLighting(RGBData.splice(0, BytesToSend), deviceID);

			TotalBytes -= BytesToSend;
		}
	}

	/** @private */
	WriteLighting(LedCount, RGBData, deviceID = 0){ //We don't follow proper safety for this technically. There's no error checking in the pursuit of higher framerates.
		device.write([0x00, deviceID | 0x08, this.command.writeEndpoint, 0x00, ...BinaryUtils.WriteInt32LittleEndian(LedCount)].concat(RGBData), this.GetWriteLength());
		device.pause(1);

		const returnPacket = device.read([0x00], this.GetReadLength());

		const ErrorCode = this.CheckError(returnPacket, `WriteLighting`);

		if(ErrorCode){
			device.log(`WriteLighting Error`);
		}
	}

	/** @private */
	StreamLighting(RGBData, deviceID = 0) {
		device.write([0x00, deviceID | 0x08, this.command.streamEndpoint, 0x00].concat(RGBData), this.GetWriteLength());
		device.pause(1);

		const returnPacket = device.read([0x00], this.GetReadLength());

		const ErrorCode = this.CheckError(returnPacket, `StreamLighting`);

		if(ErrorCode){
			device.log(`StreamLighting Error`);
		}
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

		if(data[4] !== 6 && data[5] !== 0) {
			device.log("Failed to get Fan RPM's");
		}

		const fanCount = data[6] ?? 0;
		this.log(`Device Reported [${fanCount}] Fan RPM's`);

		const fanSpeeds = data.slice(7, 7 + 2 * fanCount);

		for(let i = 0; i < fanCount; i++) {
			const rpmData = fanSpeeds.splice(0, 2);
			FanSpeeds[i] = BinaryUtils.ReadInt16LittleEndian(rpmData);
		}

		return FanSpeeds;
	}
	/** */
	FetchFanStates(deviceID = 0) {
		const data = this.ReadFromEndpoint("Background", this.endpoints.FanStates, deviceID | 0x08);

		if(data.length === 0){
			device.log(`CorsairProtocol: Failed To Read Fan States.`);

			return [];
		}

		if(data[4] !== 9 || data[5] !== 0) {
			device.log("Failed to get Fan Settings", {toFile: true});

			return [];
		}

		const FanCount = data[6] ?? 0;
		device.log(`CorsairProtocol: Device Reported [${FanCount}] Fans`);

		const FanData = data.slice(7, 7 + FanCount);

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

	SetFanSpeeds(deviceID = 0) {
		const FanCount = 6;
		const DefaultFanSpeed = 0x32;

		const FanSpeedData = [
			this.dataTypes.FanDuty, 0x00, FanCount,
		];

		for(let FanId = 0; FanId < FanCount; FanId++) {
			const FanData = [FanId, 0x00, DefaultFanSpeed, 0x00];

			if(ConnectedFans.includes(FanId)){

				const fanLevel = device.getFanlevel(FanControllerArray[FanId]);
				device.log(`Setting Fan ${FanId + 1} Level to ${fanLevel}%`);
				FanData[2] = fanLevel;
			}

			FanSpeedData.push(...FanData);
		}

		this.WriteToEndpoint("Background", this.endpoints.FanSpeeds, FanSpeedData, deviceID);
	}

	/** */
	FetchTemperatures(deviceID = 0) {
		//device.log(`CorsairProtocol: Reading Temp Data.`);

		const data = this.ReadFromEndpoint("Background", this.endpoints.TemperatureData, deviceID);

		if(data.length === 0){
			device.log(`CorsairProtocol: Failed To Read Temperature Data.`);

			return [];
		}

		if(data[4] !== this.dataTypes.TemperatureProbes || data[5] !== 0) {
			device.log("Failed to get Temperature Data", {toFile: true});

			return [];
		}

		const ProbeTemps = [];
		const ProbeCount = data[6] ?? 0;
		this.log(`Device Reported [${ProbeCount}] Temperature Probes`);

		const TempValues = data.slice(7, 7 + 3 * ProbeCount);

		for(let i = 0; i < ProbeCount; i++) {
			const probe = TempValues.slice(i * 3 + 1, i * 3 + 3);
			const temp = BinaryUtils.ReadInt16LittleEndian(probe) / 10;

			ProbeTemps[i] = temp;
		}

		return ProbeTemps;
	}
}
const Corsair = new ModernCorsairProtocol(options);

class CorsairBragiDongle{
	constructor() {
		this.children = new Map();
	}
	/** Add a Child Device to the Children Map.*/
	addChildDevice(subdeviceID, childDevice, subdevice = true) {
		if(this.children.has(subdeviceID)) {
			device.log("Child Device to Add Already Exists or is Undefined. Skipping!");

			return;
		}

		this.children.set(subdeviceID, childDevice);

		if(subdevice) { createSubdevice(childDevice); }
	}

	/** Remove a Child Device from the Children Map.*/
	removeChildDevice(subdeviceID) {
		if(!this.children.has(subdeviceID)) {
			device.log("Child Device Does Not Exist in Map or is Undefined. Skipping!");

			return;
		}

		device.removeSubdevice(this.children.get(subdeviceID).name);
		this.children.delete(subdeviceID);

	}
}
class CorsairBragiDevice{

	constructor(device, subdeviceID = 0){

		this.name = device?.name ?? "Unknown Device";
		this.size = device?.size ?? [1, 1];
		this.ledNames = device?.ledNames ?? [];
		this.ledPositions =device?.ledPositions ?? [];
		this.ledMap = device?.ledMap ?? [];
		this.ledSpacing = device?.ledSpacing ?? -1;
		this.isLightingController = device?.isLightingController ?? false;
		this.lightingEndpoint = -1;
		this.subdeviceId = subdeviceID;
		this.supportsBattery = false;
		this.keymapType = device?.keymapType ?? "Unknown";
		this.maxDPI = device?.maxDPI ?? "0";
		this.hasSniperButton = device?.hasSniperButton ?? false;
		this.batteryPercentage = -1;
		this.batteryStatus = -1;
		this.pressedKeys = [];
	}
	toString(){
		return `BragiDevice: \n\tName: ${this.name} \n\tSize: [${this.size}] \n\tSubdeviceId: ${this.subdeviceId}`;
	}
}

export default class DpiController {
	constructor() {
		this.currentStageIdx = 1;
		this.maxSelectedableStage = 5;
		this.maxStageIdx = 5; //Default to 5 as it's most common if not defined
		this.sniperStageIdx = 6;

		this.updateCallback = (dpi) => { this.log("No Set DPI Callback given. DPI Handler cannot function!"); dpi; };

		this.logCallback = (message) => { console.log(message); };

		this.sniperMode = false;
		this.enabled = false;
		this.dpiRollover = false;
		this.dpiMap = new Map();
		this.maxDpi = 18000;
		this.minDpi = 50;
	}
	addProperties() {
		device.addProperty({ "property": "settingControl", "group": "mouse", "label": "Enable Setting Control", "type": "boolean", "default": "false", "order": 1 });
		device.addProperty({ "property": "dpiStages", "group": "mouse", "label": "Number of DPI Stages", "step": "1", "type": "number", "min": "1", "max": this.maxSelectedableStage, "default": this.maxStageIdx, "order": 1, "live" : false });
		device.addProperty({ "property": "dpiRollover", "group": "mouse", "label": "DPI Stage Rollover", "type": "boolean", "default": "false", "order": 1 });

		try {
			// @ts-ignore
			this.maxStageIdx = dpiStages;
		} catch (e) {
			this.log("Skipping setting of user selected max stage count. Property is undefined");
		}

		this.rebuildUserProperties();
	}
	addSniperProperty() {
		device.addProperty({ "property": `dpi${this.sniperStageIdx}`, "group": "mouse", "label": "Sniper Button DPI", "step": "50", "type": "number", "min": this.minDpi, "max": this.maxDpi, "default": "400", "order": 3, "live" : false });
		// eslint-disable-next-line no-eval
		this.dpiMap.set(6, () => { return eval(`dpi${6}`); });
	}
	getCurrentStage() {
		return this.currentStageIdx;
	}
	getMaxStage() {
		return this.maxStageIdx;
	}
	getSniperIdx() { return this.sniperStageIdx; }
	setRollover(enabled) {
		this.dpiRollover = enabled;
	}
	setMaxStageCount(count) {
		this.maxStageIdx = count;
		this.rebuildUserProperties();
	}
	setMinDpi(minDpi) { this.minDpi = minDpi; this.updateDpiRange(); }
	setMaxDpi(maxDpi) { this.maxDpi = maxDpi; this.updateDpiRange(); }
	setUpdateCallback(callback) {
		this.updateCallback = callback;
	}
	active() { return this.enabled; }
	setActiveControl(EnableDpiControl) {
		this.enabled = EnableDpiControl;

		if (this.enabled) {
			this.update();
		}
	}
	/** GetDpi Value for a given stage.*/
	getDpiForStage(stage) {
		if (!this.dpiMap.has(stage)) {
			device.log("bad stage: " + stage);
			this.log("Invalid Stage...");

			return;
		}

		// This is a dict of functions, make sure to call them
		this.log("Current DPI Stage: " + stage);

		const dpiWrapper = this.dpiMap.get(stage);
		const dpi = dpiWrapper();
		this.log("Current DPI: " + dpi);

		// eslint-disable-next-line consistent-return
		return dpi; //ESlint complains about not wanting a return. The dpi call checks if it has a return. If there's no return it does nothing. ESLint can't see that though.
	}
	/** Increment DPIStage */
	increment() {
		this.setStage(this.currentStageIdx + 1);
	}
	/** Decrement DPIStage */
	decrement() {
		this.setStage(this.currentStageIdx - 1);
	}
	/** Set DPIStage and then set DPI to that stage.*/
	setStage(stage) {
		if (stage > this.maxStageIdx) {
			this.currentStageIdx = this.dpiRollover ? 1 : this.maxStageIdx;
		} else if (stage < 1) {
			this.currentStageIdx = this.dpiRollover ? this.maxStageIdx : 1;
		} else {
			this.currentStageIdx = stage;
		}

		this.update();
	}
	/** SetDpi Using Callback. Bypasses setStage.*/
	update() {
		if (!this.enabled) {
			return;
		}
		const stage = this.sniperMode ? this.sniperStageIdx : this.currentStageIdx;
		const dpi = this.getDpiForStage(stage);

		if (dpi) {
			this.updateCallback(dpi);
		}
	}
	/** Stage update check to update DPI if current stage values are changed.*/
	DPIStageUpdated(stage) {
		// if the current stage's value was changed by the user
		// reapply the current stage with the new value
		if (stage === this.currentStageIdx) {
			this.update();
		}
	}
	/** Set Sniper Mode on or off. */
	setSniperMode(sniperMode) {
		this.sniperMode = sniperMode;
		this.log("Sniper Mode: " + this.sniperMode);
		this.update();
	}
	rebuildUserProperties() {
		// Remove Stages

		for (const stage in Array.from(this.dpiMap.keys())) {
			if(+stage+1 === this.sniperStageIdx) {
				continue;
			}

			if (+stage >= this.maxStageIdx) {
				this.log(`Removing Stage: ${+stage+1}`);
				device.removeProperty(`dpi${+stage+1}`);
				this.dpiMap.delete(+stage+1);
			}
		}
		// Add new Stages
		const stages = Array.from(this.dpiMap.keys());

		for (let i = 1; i <= this.maxStageIdx; i++) {
			if (stages.includes(i)) {
				continue;
			}

			this.log(`Adding Stage: ${i}`);
			device.addProperty({ "property": `dpi${i}`, "group": "mouse", "label": `DPI ${i}`, "step": "50", "type": "number", "min": this.minDpi, "max": this.maxDpi, "default": 800 + (400*i), "order": 2, "live" : false });
			// eslint-disable-next-line no-eval
			this.dpiMap.set(i, () => { return eval(`dpi${i}`); });
		}
	}
	updateDpiRange() {
		for (const stage in this.dpiMap.keys()) {
			const prop = device.getProperty(`dpi${+stage}`);
			prop.min = this.minDpi;
			prop.max = this.maxDpi;
			device.addProperty(prop);
		}
	}
	log(message) {
		if (this.logCallback) {
			this.logCallback(message);
		}
	}
}

const DPIHandler = new DpiController();

/**
 * @callback bitArrayCallback
 * @param {number} bitIdx
 * @param {boolean} state
 */

export class BitArray {
	constructor(length) {
		// Create Backing Array
		this.buffer = new ArrayBuffer(length);
		// Byte View
		this.bitArray = new Uint8Array(this.buffer);
		// Constant for width of each index
		this.byteWidth = 8;

		/** @type {bitArrayCallback} */
		this.callback = (bitIdx, state) => {throw new Error("BitArray(): No Callback Available?");};
	}

	toArray() {
		return [...this.bitArray];
	}

	/** @param {number} bitIdx */
	get(bitIdx) {
		const byte = this.bitArray[bitIdx / this.byteWidth | 0] ?? 0;

		return Boolean(byte & 1 << (bitIdx % this.byteWidth));
	}

	/** @param {number} bitIdx */
	set(bitIdx) {
		this.bitArray[bitIdx / this.byteWidth | 0] |= 1 << (bitIdx % this.byteWidth);
	}

	/** @param {number} bitIdx */
	clear(bitIdx) {
		this.bitArray[bitIdx / this.byteWidth | 0] &= ~(1 << (bitIdx % this.byteWidth));
	}

	/** @param {number} bitIdx */
	toggle(bitIdx) {
		this.bitArray[bitIdx / this.byteWidth | 0] ^= 1 << (bitIdx % this.byteWidth);
	}

	/**
	 * @param {number} bitIdx
	 * @param {boolean} state
	 *  */
	setState(bitIdx, state) {
		if(state) {
			this.set(bitIdx);
		} else {
			this.clear(bitIdx);
		}
	}

	/** @param {bitArrayCallback} callback */
	setCallback(callback){
		this.callback = callback;
	}

	/** @param {number[]} newArray */
	update(newArray) {
		// Check Every Byte
		for(let byteIdx = 0; byteIdx < newArray.length; byteIdx++) {
			const value = newArray[byteIdx] ?? 0;

			if(this.bitArray[byteIdx] === value) {
				continue;
			}

			// Check Every bit of every changed Byte
			for (let bit = 0; bit < this.byteWidth; bit++) {
				const isPressed = Boolean((value) & (1 << (bit)));

				const bitIdx = byteIdx * 8 + bit;

				// Skip if the new bit state matches the old bit state
				if(isPressed === this.get(bitIdx)) {
					continue;
				}

				// Save new State
				this.setState(bitIdx, isPressed);

				// Fire callback
				this.callback(bitIdx, isPressed);
			}

		}
	}
}
/* eslint-enable complexity */
const macroInputArray = new BitArray(32);

class PolledFunction{
	constructor(callback, interval){
		this.callback = callback;
		this.interval = interval;
		this.lastPollTime = Date.now();
	}
	Poll(){
		if (Date.now() - this.lastPollTime < this.interval) {
			return;
		}

		this.callback();

		this.lastPollTime = Date.now();
	}
	RunNow(){
		this.callback();

		this.lastPollTime = Date.now();
	}
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png";
}