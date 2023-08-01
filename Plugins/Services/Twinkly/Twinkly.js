import {encode, decode} from "@SignalRGB/base64";

export function Name() { return "Twinkly"; }
export function Version() { return "1.0.0"; }
export function Type() { return "network"; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [48, 48]; }
export function DefaultPosition() {return [75, 70]; }
export function DefaultScale(){return 1.0;}
/* global
discovery:readonly
controller:readonly
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
autoReconnect:readonly
xScale:readonly
yScale:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"autoReconnect", "group":"", "label":"Auto Reconnect to Devices When Lost", "type":"boolean", "default": "false"},
		{"property": "xScale", "group": "", "label": "Width Scale", "step": "1", "type": "number", "min": "1", "max": "10", "default": "5"},
		{"property": "yScale", "group": "", "label": "Height Scale", "step": "1", "type": "number", "min": "1", "max": "10", "default": "5"},
	];
}

export function Initialize() {
	device.addFeature("udp");
	device.addFeature("base64");
	Twinkly.fetchFirmwareVersionFromDevice();
	Twinkly.deviceLogin();
	Twinkly.verifyToken(Twinkly.getAuthenticationToken(), Twinkly.getChallengeResponse());
	Twinkly.fetchDeviceInformation();
	Twinkly.fetchDeviceBrightness();
	Twinkly.setDeviceBrightness("enabled", "A", 100);
	Twinkly.setLEDMode("rt");
	Twinkly.decodeAuthToken();
	Twinkly.fetchDeviceLayoutType();
}

export function Render() { //TODO: Add an IPCache Purge Button.
	checkConnectionStatus();
	sendColors();
}

export function Shutdown(suspend) {
}

export function onxScaleChanged() {
	Twinkly.fetchDeviceLayoutType();
}

export function onyScaleChanged() {
	Twinkly.fetchDeviceLayoutType();
}

let savedConnectionCheckTimer = Date.now();
const connectionCheckTimeout = 60000;

function checkConnectionStatus() {
	if(Date.now() - savedConnectionCheckTimer < connectionCheckTimeout) {
		return;
	}
	const validToken = Twinkly.fetchLEDMode(true);

	if(validToken !== "Ok") {
		device.log(`Token: ${Twinkly.getAuthenticationToken()} invalidated.`);

		if(autoReconnect) {
			device.log("Attempting to fetch new authentication token and steal control back.");
			Twinkly.deviceLogin();
			Twinkly.verifyToken(Twinkly.getAuthenticationToken(), Twinkly.getChallengeResponse());
			Twinkly.setLEDMode("rt");
			Twinkly.decodeAuthToken();
			Twinkly.fetchDeviceLayoutType();
		}
	}

	savedConnectionCheckTimer = Date.now();
}

function sendColors(shutdown = false) {
	const RGBData = grabColors(shutdown);

	let packetIDX = 0;

	while(RGBData.length > 900) {
		Twinkly.sendGen3RTFrame(packetIDX, RGBData.splice(0, 900));
		packetIDX++;
	}

	Twinkly.sendGen3RTFrame(packetIDX, RGBData);
}

function grabColors(shutdown) {
	const RGBData = [];
	const vLedPositions = Twinkly.getvLedPositions();
	const bytesPerLED = Twinkly.getNumberOfBytesPerLED();

	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
		let col;
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		if(bytesPerLED === 4) {
			const iLedIdx = iIdx * 4;
			RGBData[iLedIdx] = 0x00;
			RGBData[iLedIdx+1] = col[0];
			RGBData[iLedIdx+2] = col[1];
			RGBData[iLedIdx+3] = col[2];
		} else {
			const iLedIdx = iIdx * 3;
			RGBData[iLedIdx] = col[0];
			RGBData[iLedIdx+1] = col[1];
			RGBData[iLedIdx+2] = col[2];
		}

	}

	return RGBData;
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

// -------------------------------------------<( Discovery Service )>--------------------------------------------------

export function DiscoveryService() {
	this.IconUrl = "https://marketplace.signalrgb.com/brands/products/twinkly/icon@2x.png";

	this.firstRun = true;

	this.Initialize = function(){
		service.log("Initializing Plugin!");
		service.log("Searching for network devices...");
		this.LoadCachedDevices();
	};

	this.UdpBroadcastPort = 5555;
	this.UdpListenPort = 59136;

	this.lastPollTime = 0;
	this.PollInterval = 60000;

	this.cache = new IPCache();

	this.activeDevices = [];

	this.CheckForDevices = function(){
		if(Date.now() - discovery.lastPollTime < discovery.PollInterval){
			return;
		}

		discovery.lastPollTime = Date.now();
		service.log("Broadcasting device scan...");
		service.broadcast(`\x01discover`);
	};

	this.forceDiscover = function(ipaddress) {
		if(!ipaddress) {
			service.log(`Force Discovery IP Address is Undefined.`);
		} else {
			service.log("Forcing Discovery for Twinkly device at IP: " + ipaddress);
			this.confirmTwinklyDevice({ip : ipaddress, id: "00:00:00:00:00:00", name: "New Twinkly Device", port: "5555"}); //$5 I am creating an impressive amount of unoptimized overhead with what I'm doing currently. Should probably fix that.
		}
	};

	this.Update = function(){
		for(const cont of service.controllers){
			cont.obj.update();
		}

		this.CheckForDevices();
	};

	this.Discovered = function(value) {
		service.log(`Response: ${value.response}`);

		if(!this.activeDevices.includes(value.ip)) {
			if(value.response.toString().includes("OKTwinkly") || value.response.toString().includes("WHEREAREYOU")) {
				service.log("Possible Twinkly Lights Found!");
				this.confirmTwinklyDevice(value);
			} else {
				service.log("Got bad response from device. Device most likely is not a set of Twinkly Lights");
			}
		} else { service.log("Device Already Active! Ignoring."); }
	};


	this.LoadCachedDevices = function(){
		service.log("Loading Cached Devices...");

		for(const [key, value] of this.cache.Entries()){
			service.log(`Found Cached Device: [${key}: ${JSON.stringify(value)}]`);
			this.confirmTwinklyDevice(value);
		}

	};

	this.CreateControllerDevice = function(value){
		const controller = service.getController(value.id);

		if (controller === undefined) {
			service.addController(new TwinklyController(value));
		} else {
			controller.updateWithValue(value);
		}
	};

	this.confirmTwinklyDevice = function(value) {
		const challengeInput = encode(Array.from({length: 32}, () => Math.floor(Math.random() * 32)));
		let bytesPerLED = 0;
		XmlHttp.Post(`http://${value.ip}/xled/v1/login`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceLoginPacket = JSON.parse(xhr.response);
				service.log(`Authentication Token: ${deviceLoginPacket.authentication_token}`);
				service.log(`Challenge Response: ${deviceLoginPacket["challenge-response"]}`);
				service.log(`Login Return Code: ${deviceLoginPacket.code}`);
				value.name = "Twinkly";

				if(deviceLoginPacket["challenge-response"].length === 40) {

					XmlHttp.Get(`http://${value.ip}/xled/v1/gestalt`, (xhr) => {
						if(xhr.readyState === 4 && xhr.status === 200) {
							const deviceInformationPacket = JSON.parse(xhr.response);

							if(JSON.parse(xhr.response).code === 1000) {
								service.log(`Device Name: ${deviceInformationPacket.device_name}`);
								service.log(`Device Mac Address: ${deviceInformationPacket.mac}`);
								bytesPerLED = deviceInformationPacket.bytes_per_led;
								service.log(`Number of Bytes Per LED: ${bytesPerLED}`);

								value.id = deviceInformationPacket.mac;
								value.name = deviceInformationPacket.device_name; //this is pretty slick. We grab the name in case a user decides that they want to change it, and if somehow two different ones flip ip's we're chilling.
							}
						}
					}, false);

					if(bytesPerLED > 2) {
						service.log("Device has 3 or more Bytes Per LED. Adding Controller.");
						this.activeDevices.push(value.ip);
						this.CreateControllerDevice(value);
					}

				}
			}
		}, {"challenge" : challengeInput}, true);
	};

	this.purgeIPCache = function() {
		this.cache.PurgeCache();
	};
}

class XmlHttp{
	static Get(url, callback, async = false){
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, async);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send();
	}

	static GetWithAuth(url, callback, authToken = Twinkly.getAuthenticationToken(), async = false){
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, async);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader('X-Auth-Token', authToken);

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send();
	}

	static Post(url, callback, data, async = false){
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url, async);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send(JSON.stringify(data));
	}

	static PostWithAuth(url, callback, data, authToken = Twinkly.getAuthenticationToken(), async = false){
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url, async);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader('X-Auth-Token', authToken);
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send(JSON.stringify(data));
	}

	static Put(url, callback, data, async = false){
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url, async);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send(JSON.stringify(data));
	}
}
class TwinklyProtocol {
	constructor() {
		this.authentication_token = "";
		this.challenge_response = "";

		this.statusCodes = {
			1000 : "Ok",
			1001 : "Error",
			1101 : "Invalid Argument",
			1102 : "Error",
			1103 : "Error, Value too long or missing required object key?",
			1104 : "Error, Malformed Json?",
			1105 : "Invalid Argument Key",
			1107 : "Ok?",
			1108 : "Ok?",
			1205 : "Error With Firmware Upgrade"
		};

		this.config = {
			firmwareVersion : "",
			hardwareRevision: "",
			previousDeviceBrightness : -1,
			numberOfDeviceLEDs : -1,
			bytesPerLED : -1,
			decodedAuthToken : [],
			vLedNames : [],
			vLedPositions : []
		};

		this.layoutScale = {
			"25x25" : 12.5,
			"50x50" : 25,
			"100x100" : 50
		};

		this.deviceSKULibrary = {
			"TWC400STP" : "Clusters",
			"TWW210SPP" : "Curtain",
			"TWD400STP" : "Dots",
			"TWF020STP" : "Festoon",
			"TWFL200STW" : "Flex",
			"TWI190SPP" : "Icicle",
			"TWWT050SPP" : "Light Tree", //2D
			"TWP300SPP" : "Light Tree",
			"TWL100ADP" : "Line",
			"TWG050SPP" : "Garland",
			"TG70P3D93P08" : "Prelit Tree",
			"TWT400SPP" : "Prelit Tree",
			"TWT250STP" : "Prelit Tree",
			"TG70P3G21P02" : "Prelit Tree",
			"TWR050SPP" : "Prelit Wreath",
			"TWB200STP" : "Spritzer",
			"TWQ064STW" : "Squares",
			"TWS100SPP" : "Strings",
			"TWS250STP" : "Strings"
		};

		this.deviceImageLibrary = {
			"Clusters" : "https://marketplace.signalrgb.com/devices/brands/twinkly/cluster-multicolor-edition.png",
			"Curtain" : "https://marketplace.signalrgb.com/devices/brands/twinkly/curtain-multicolor-white-edition.png",
			"Dots" : "https://marketplace.signalrgb.com/devices/brands/twinkly/dots-multicolor-edition.png",
			"Festoon" : "https://marketplace.signalrgb.com/devices/brands/twinkly/festoon-multicolor-edition.png",
			"Flex" : "https://marketplace.signalrgb.com/devices/brands/twinkly/flex-multicolor-edition.png",
			"Icicle" : "https://marketplace.signalrgb.com/devices/brands/twinkly/icicle-multicolor-edition.png",
			"Light Tree" : "https://marketplace.signalrgb.com/devices/brands/twinkly/light-tree-3d-multicolor-edition.png",
			"Line" : "https://marketplace.signalrgb.com/devices/brands/twinkly/line-multicolor-edition.png",
			"Garland" : "https://marketplace.signalrgb.com/devices/brands/twinkly/prelit-garland-multicolor-edition.png",
			"Prelit Tree" : "https://marketplace.signalrgb.com/devices/brands/twinkly/prelit-tree-multicolor-edition.png",
			"Prelit Wreath" : "https://marketplace.signalrgb.com/devices/brands/twinkly/prelit-wreath-multicolor-edition.png",
			"Spritzer" : "https://marketplace.signalrgb.com/devices/brands/twinkly/spritzer-multicolor-edition.png",
			"Squares" : "https://marketplace.signalrgb.com/devices/brands/twinkly/squares-multicolor-edition.png",
			"Strings" : "https://marketplace.signalrgb.com/devices/brands/twinkly/strings-multicolor-edition.png"
		};
	}

	getvLedNames() { return this.config.vLedNames; }
	setvLedNames(vLedNames) { this.config.vLedNames = vLedNames; }

	getvLedPositions() { return this.config.vLedPositions; }
	setvLedPositions(vLedPositions) { this.config.vLedPositions = vLedPositions; }

	getFirmwareVersion() { return this.config.firmwareVersion; }
	setFirmwareVersion(firmwareVersion) { this.config.firmwareVersion = firmwareVersion; }

	getHardwareRevision() { return this.config.hardwareRevision; }
	setHardwareRevision(hardwareRevision) { this.config.hardwareRevision = hardwareRevision; }

	getPrevousDeviceBrightness() { return this.config.previousDeviceBrightness; }
	setPreviousDeviceBrightness(previousDeviceBrightness) { this.config.previousDeviceBrightness = previousDeviceBrightness; }

	getAuthenticationToken() { return this.authentication_token; }
	setAuthenticationToken(authenticationToken) {this.authentication_token = authenticationToken; }

	getDecodedAuthenticationToken() { return this.config.decodedAuthToken; }
	setDecodedAuthenticationToken(decodedAuthToken) {this.config.decodedAuthToken = decodedAuthToken; }

	getChallengeResponse() { return this.challenge_response; }
	setChallengeResponse(challenge_response) {this.challenge_response = challenge_response; }

	getNumberOfLEDs() { return this.config.numberOfDeviceLEDs; }
	setNumberOfLEDs(numberOfDeviceLEDs) { this.config.numberOfDeviceLEDs = numberOfDeviceLEDs; }

	getNumberOfBytesPerLED() { return this.config.bytesPerLED; }
	setNumberOfBytesPerLED(bytesPerLED) { this.config.bytesPerLED = bytesPerLED; }

	setImageFromSKU(SKU) {
		const deviceType = this.deviceSKULibrary[SKU];
		device.setImageFromUrl(this.deviceImageLibrary[deviceType]);
	}

	decodeAuthToken() {
		const token = this.getAuthenticationToken();
		const decodedToken = base64.Decode(token);
		device.log("Decoded Auth Token: " + decodedToken);
		this.setDecodedAuthenticationToken(decodedToken);
	}

	fetchFirmwareVersionFromDevice() {
		XmlHttp.Get(`http://${controller.ip}/xled/v1/fw/version`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const firmwareVersionPacket = JSON.parse(xhr.response);
				device.log(`Device Firmware Version: ${firmwareVersionPacket.version}`);
				this.setFirmwareVersion(firmwareVersionPacket.version);
			}
		});
	}

	fetchDeviceBrightness() {
		XmlHttp.GetWithAuth(`http://${controller.ip}/xled/v1/led/out/brightness`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceBrightnessPacket = JSON.parse(xhr.response);
				device.log(`Device Brightness Packet Code: ${deviceBrightnessPacket.code}`);
				device.log(`Device Brightness Value: ${deviceBrightnessPacket.value}`);
				device.log(`Device Brightness Mode: ${deviceBrightnessPacket.mode }`);

				if(deviceBrightnessPacket.mode === "enabled") {
					this.setPreviousDeviceBrightness(deviceBrightnessPacket.value);
				}
			}
		});
	}

	setDeviceBrightness(mode = "enabled", type = "A", value = 100) {
		XmlHttp.PostWithAuth(`http://${controller.ip}/xled/v1/led/out/brightness`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceBrightnessPacket = JSON.parse(xhr.response);
				device.log(`Device Brightness Set Packet Code: ${deviceBrightnessPacket.code}`);
			}
		}, {"mode" : mode, "type" : type, "value": value});
	}

	fetchDeviceLEDEffects() {
		XmlHttp.GetWithAuth(`http://${controller.ip}/xled/v1/led/effects`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceSupportedEffectPacket = JSON.parse(xhr.response);
				device.log(`Device Supported Effects IDs: ${deviceSupportedEffectPacket.unique_ids}`);
				device.log(`Device Number of Supported Effects: ${deviceSupportedEffectPacket.effects_number}`);
			}
		});
	}

	fetchCurrentLEDEffect() {
		XmlHttp.GetWithAuth(`http://${controller.ip}/xled/v1/led/effects/current`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceCurrentEffectPacket = JSON.parse(xhr.response);
				device.log(`Device Current Effect: ${deviceCurrentEffectPacket.preset_id}`);
				device.log(`Device Current Effect Unique ID: ${deviceCurrentEffectPacket.unique_id}`);
			}
		});
	}

	fetchLEDMode(statusCheck = false) {
		let packetStatus = "undefined";
		XmlHttp.GetWithAuth(`http://${controller.ip}/xled/v1/led/mode`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceLEDModePacket = JSON.parse(xhr.response);
				packetStatus = this.statusCodes[deviceLEDModePacket.code];

				if(!statusCheck) { device.log(`Device Current Mode: ${deviceLEDModePacket.mode}`); }

				if(deviceLEDModePacket.mode !== "rt") { packetStatus = "Incorrect Mode"; }
			}
		});

		return packetStatus;
	}

	setLEDMode(LEDMode = "color") {
		XmlHttp.PostWithAuth(`http://${controller.ip}/xled/v1/led/mode`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceCurrentEffectSetPacket = JSON.parse(xhr.response);
				device.log(`Device Mode Set Packet Code: ${deviceCurrentEffectSetPacket.code}`);
			}
		}, {"mode" : LEDMode});
	}

	setCurrentLEDEffect(preset_id = 0) {
		XmlHttp.PostWithAuth(`http://${controller.ip}/xled/v1/led/effects/current`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceCurrentEffectSetPacket = JSON.parse(xhr.response);
				device.log(`Device Current Effect Set Packet Code: ${deviceCurrentEffectSetPacket.code}`);
			}
		}, {"preset_id" : preset_id});
	}

	fetchDeviceInformation() {
		XmlHttp.Get(`http://${controller.ip}/xled/v1/gestalt`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceInformationPacket = JSON.parse(xhr.response);
				//device.log(`Device Information Packet: ${Object.keys(deviceInformationPacket)}`);
				device.log(`Device Product Name: ${deviceInformationPacket.product_name}`);
				device.log(`Device Hardware Version: ${deviceInformationPacket.hardware_version}`);
				device.log(`Device Bytes Per LED: ${deviceInformationPacket.bytes_per_led}`);
				device.log(`Device Hardware ID: ${deviceInformationPacket.hw_id}`);
				device.log(`Device LED Type: ${deviceInformationPacket.led_type}`);
				device.log(`Device Product Code: ${deviceInformationPacket.product_code}`);
				device.log(`Device Name: ${deviceInformationPacket.device_name}`);
				device.log(`Device Number of LEDs: ${deviceInformationPacket.number_of_led}`);
				this.setNumberOfBytesPerLED(deviceInformationPacket.bytes_per_led);
				this.setNumberOfLEDs(deviceInformationPacket.number_of_led);
				this.setHardwareRevision(deviceInformationPacket.hardware_version);
				device.setName(deviceInformationPacket.device_name);
				this.setImageFromSKU(deviceInformationPacket.product_code);
			}
		});
	}

	fetchDeviceLayoutType() {
		XmlHttp.GetWithAuth(`http://${controller.ip}/xled/v1/led/layout/full`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceLayoutPacket = JSON.parse(xhr.response);
				device.log(`Device Layout Packet Code: ${deviceLayoutPacket.code}`);

				device.log(`Device Layout Source: ${deviceLayoutPacket.source}`);


				const xRoundingArray = [];
				const yRoundingArray = [];

				if(deviceLayoutPacket.source === "3d") {
					for(const coordinate in deviceLayoutPacket.coordinates) {
						const XCoordinate = deviceLayoutPacket.coordinates[coordinate].x;
						const YCoordinate = deviceLayoutPacket.coordinates[coordinate].z;
						xRoundingArray.push(XCoordinate);
						yRoundingArray.push(YCoordinate);
					}
				} else if(deviceLayoutPacket.source === "2d") {
					for(const coordinate in deviceLayoutPacket.coordinates) {
						const XCoordinate = deviceLayoutPacket.coordinates[coordinate].x;
						const YCoordinate = deviceLayoutPacket.coordinates[coordinate].z;
						xRoundingArray.push(XCoordinate);
						yRoundingArray.push(YCoordinate);
					}
				}

				device.log(`X Max: ${Math.max(...xRoundingArray)}`);
				device.log(`X Min: ${Math.min(...xRoundingArray)}`);
				device.log(`Y Max: ${Math.max(...yRoundingArray)}`);
				device.log(`Y Min: ${Math.min(...yRoundingArray)}`);

				this.configureDeviceLayout(deviceLayoutPacket);
			}
		});
	}

	configureDeviceLayout(deviceLayoutPacket) {
		const vLedNames = [];
		const vLedPositions = [];

		this.setvLedNames(vLedNames);
		this.setvLedPositions(vLedPositions);

		if(deviceLayoutPacket.source === "3d") {
			for(let coordinate = 0; coordinate < Object.keys(deviceLayoutPacket.coordinates).length; coordinate++) {
				const XCoordinate = Math.round((deviceLayoutPacket.coordinates[coordinate].x+1) * (5*xScale));
				const YCoordinate = Math.round((deviceLayoutPacket.coordinates[coordinate].z+1) * (5*yScale));
				vLedPositions.push([XCoordinate, YCoordinate]);
				vLedNames.push(`LED ${coordinate+1}`);
			}
		} else if(deviceLayoutPacket.source === "2d") {
			for(let coordinate = 0; coordinate < Object.keys(deviceLayoutPacket.coordinates).length; coordinate++) {
				const XCoordinate = Math.round((deviceLayoutPacket.coordinates[coordinate].x+1) * (5*xScale));
				const YCoordinate = Math.round((deviceLayoutPacket.coordinates[coordinate].y+1) * (5*yScale));
				vLedPositions.push([XCoordinate, YCoordinate]);
				vLedNames.push(`LED ${coordinate+1}`);
			}
		}

		this.setvLedNames(vLedNames);
		this.setvLedPositions(vLedPositions);
		device.setSize([10*xScale + 1, 10*yScale + 1]);
		device.setControllableLeds(this.getvLedNames(), this.getvLedPositions());
	}

	deviceLogin() {
		const challengeInput = base64.Encode(Array.from({length: 32}, () => Math.floor(Math.random() * 32)));
		XmlHttp.Post(`http://${controller.ip}/xled/v1/login`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceLoginPacket = JSON.parse(xhr.response);
				device.log(`Authentication Token: ${deviceLoginPacket.authentication_token}`);
				device.log(`Challenge Response: ${deviceLoginPacket["challenge-response"]}`);
				this.setAuthenticationToken(deviceLoginPacket.authentication_token);
				this.setChallengeResponse(deviceLoginPacket["challenge-response"]);
			}
		}, {"challenge" : challengeInput});
	}

	verifyToken(token, challenge_response) {
		XmlHttp.PostWithAuth(`http://${controller.ip}/xled/v1/verify`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				device.log(`Token Verification Response Code: ${this.statusCodes[JSON.parse(xhr.response).code]}`);
			}
		}, {"challenge-response" : challenge_response}, token);
	}

	sendGen1RTFrame(numberOfLEDs, RGBData) {
		udp.send(controller.ip, 7777, [0x01].concat(this.getDecodedAuthenticationToken()).concat(numberOfLEDs).concat(RGBData)); //I Require users
	}
	sendGen2RTFrame(numberOfLEDs, RGBData) {
		udp.send(controller.ip, 7777, [0x02].concat(this.getDecodedAuthenticationToken()).concat(numberOfLEDs).concat(RGBData)); //I Still Require Users. Both of these should work but I need to do some tinkering.
	}
	sendGen3RTFrame(packetIDX, RGBData) {
		udp.send(controller.ip, 7777, [0x03].concat(this.getDecodedAuthenticationToken()).concat([0x00, 0x00, packetIDX]).concat(RGBData));
	}
}

const Twinkly = new TwinklyProtocol();

class TwinklyController{
	constructor(value){
		this.id = value.id;
		this.port = value.port;
		this.ip = value.ip;
		this.name = value.name;
		this.authToken = "";

		this.initialized = false;
	}

	updateWithValue(value){
		this.id = value.id;
		this.port = value.port;
		this.ip = value.ip;
		this.name = value.name;


		this.cacheControllerInfo();

		service.updateController(this);
	}

	update(){
		if(!this.initialized){
			this.initialized = true;

			this.cacheControllerInfo();

			service.updateController(this);
			service.announceController(this);
		}
	}

	login() {
		const challengeInput = encode(Array.from({length: 32}, () => Math.floor(Math.random() * 32)));

		XmlHttp.Post(`http://${this.ip}/xled/v1/login`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				const deviceLoginPacket = JSON.parse(xhr.response);
				service.log(`Authentication Token: ${deviceLoginPacket.authentication_token}`);
				service.log(`Challenge Response: ${deviceLoginPacket["challenge-response"]}`);
				service.log(`Login Return Code: ${deviceLoginPacket.code}`);

				this.authenticate(deviceLoginPacket["challenge-response"], deviceLoginPacket.authentication_token);
			}
		}, {"challenge" : challengeInput});
	}

	authenticate(challengeResponse, authToken) {
		XmlHttp.PostWithAuth(`http://${this.ip}/xled/v1/verify`, (xhr) => {
			if(xhr.readyState === 4 && xhr.status === 200) {
				if(JSON.parse(xhr.response).code === 1000) {
					this.authToken = authToken;
				}
			}
		}, {"challenge-response" : challengeResponse}, authToken);
	}

	cacheControllerInfo(){
		discovery.cache.Add(this.id, {
			name: this.name,
			port: this.port,
			ip: this.ip,
			id: this.id
		});
	}
}

class IPCache{
	constructor(){
		this.cacheMap = new Map();
		this.persistanceId = "ipCache";
		this.persistanceKey = "cache";

		this.PopulateCacheFromStorage();
	}
	Add(key, value){
		service.log(`Adding ${key} to IP Cache...`);

		this.cacheMap.set(key, value);
		this.Persist();
	}

	Remove(key){
		this.cacheMap.delete(key);
		this.Persist();
	}
	Has(key){
		return this.cacheMap.has(key);
	}
	Get(key){
		return this.cacheMap.get(key);
	}
	Entries(){
		return this.cacheMap.entries();
	}

	PurgeCache() {
		service.removeSetting(this.persistanceId, this.persistanceKey);
		service.log("Purging IP Cache from storage!");
	}

	PopulateCacheFromStorage(){
		service.log("Populating IP Cache from storage...");

		const storage = service.getSetting(this.persistanceId, this.persistanceKey);

		if(storage === undefined){
			service.log(`IP Cache is empty...`);

			return;
		}

		let mapValues;

		try{
			mapValues = JSON.parse(storage);
		}catch(e){
			service.log(e);
		}

		if(mapValues === undefined){
			service.log("Failed to load cache from storage! Cache is invalid!");

			return;
		}

		if(mapValues.length === 0){
			service.log(`IP Cache is empty...`);
		}

		this.cacheMap = new Map(mapValues);
	}

	Persist(){
		service.log("Saving IP Cache...");
		service.saveSetting(this.persistanceId, this.persistanceKey, JSON.stringify(Array.from(this.cacheMap.entries())));
	}

	DumpCache(){
		for(const [key, value] of this.cacheMap.entries()){
			service.log([key, value]);
		}
	}
}