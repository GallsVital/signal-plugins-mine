export function Name() { return "NZXT Keyboard"; }
export function VendorId() { return 0x1E71; }
export function ProductId() { return Object.keys(NZXTdeviceLibrary.PIDLibrary); }
export function Publisher() { return "WhirlwindFx"; }
export function Documentation(){ return "troubleshooting/nzxt"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 1.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

export function Initialize() {
	NZXT.InitializeNZXT();
}

export function Render() {
	NZXT.sendColors();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		NZXT.sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		NZXT.sendColors(shutdownColor);
	}

}

export class NZXT_Keyboard_Protocol {
	constructor() {
		this.Config = {
			DeviceProductID: 0x0000,
			DeviceName: "NZXT Keyboard",
			DeviceEndpoint: { "interface": 1, "usage": 0x0001, "usage_page": 0xFF01, "collection": 0x0000 },
			LedNames: [],
			LedPositions: [],
			lastRGBData : new Array(30, 0x00)
		};
	}

	getDeviceProperties(deviceName) { return NZXTdeviceLibrary.LEDLibrary[deviceName];};

	getDeviceProductId() { return this.Config.DeviceProductID; }
	setDeviceProductId(productID) { this.Config.DeviceProductID = productID; }

	getDeviceName() { return this.Config.DeviceName; }
	setDeviceName(deviceName) { this.Config.DeviceName = deviceName; }

	getDeviceEndpoint() { return this.Config.DeviceEndpoint; }
	setDeviceEndpoint(deviceEndpoint) { this.Config.DeviceEndpoint = deviceEndpoint; }

	getLedNames() { return this.Config.LedNames; }
	setLedNames(ledNames) { this.Config.LedNames = ledNames; }

	getLedPositions() { return this.Config.LedPositions; }
	setLedPositions(ledPositions) { this.Config.LedPositions = ledPositions; }

	getDeviceImage(deviceName) { return NZXTdeviceLibrary.imageLibrary[deviceName]; }

	InitializeNZXT() {
		//Initializing vars
		this.setDeviceProductId(device.productId());
		this.setDeviceName(NZXTdeviceLibrary.PIDLibrary[this.getDeviceProductId()]);

		const DeviceProperties = this.getDeviceProperties(this.getDeviceName());
		this.setDeviceEndpoint(DeviceProperties.endpoint);
		this.setLedNames(DeviceProperties.vLedNames);
		this.setLedPositions(DeviceProperties.vLedPositions);

		device.log(`Device model found: ` + this.getDeviceName());
		device.setName("NZXT " + this.getDeviceName());
		device.setSize(DeviceProperties.size);
		device.setControllableLeds(this.getLedNames(), this.getLedPositions());
		device.setImageFromUrl(this.getDeviceImage(this.getDeviceName()));
		device.set_endpoint(DeviceProperties.endpoint[`interface`], DeviceProperties.endpoint[`usage`], DeviceProperties.endpoint[`usage_page`], DeviceProperties.endpoint[`collection`]);
		this.setSoftwareMode();
	}

	setSoftwareMode() {
		device.write([0x43, 0x81, 0x00, 0x84], 64);
		device.write([0x43, 0x81, 0x00, 0x86], 64);
		device.write([0x43, 0x97, 0x00, 0x10, 0x01], 64);
		device.clearReadBuffer();
	}

	sendColors(overrideColor) {
		const deviceLedPositions = this.getLedPositions();

		const packet = [0x43, 0xbd, 0x01, 0x10, 0x02, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x0a]; //This protocol is less stupid than the previous iteration. Current iteration uses a single packet. the 0xff's are setting every key in every bank on. 0x0a is the number of zones.
		const RGBData = [];

		for(let idx = 0; idx < deviceLedPositions.length; idx++) {
			const iPxX = deviceLedPositions[idx][0];
			const iPxY = deviceLedPositions[idx][1];
			let col;

			if(overrideColor) {
				col = hexToRgb(overrideColor);
			} else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			} else {
				col = device.color(iPxX, iPxY);
			}

			RGBData[idx * 4] = col[0];
			RGBData[idx * 4 + 1] = col[1];
			RGBData[idx * 4 + 2] = col[2];
			RGBData[idx * 4 + 3] = 0;
		}
	
		if(!CompareArrays(this.Config.lastRGBData, RGBData)) {
			this.Config.lastRGBData = RGBData;
			device.write(packet.concat(RGBData),64);
			device.write([0x43, 0x01], 64);
		}
	
		device.clearReadBuffer();
	}
}

export class deviceLibrary {
	constructor(){
		this.PIDLibrary	=	{
			0x2103: "Function",
			0x2106: "Function", // ISO
			0x2104: "Function TKL",
			0x2107: "Function TKL", // ISO
			0x2105: "Function MiniTKL",
			0x2108: "Function MiniTKL", // ISO
		};

		this.LEDLibrary	=	{
			"Function":
			{
				size: [10, 5],
				vLedNames: [ "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Zone 10" ],
				vLedPositions: [ [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1] ],
				endpoint : { "interface": 1, "usage": 0x0001, "usage_page": 0xFFCA, "collection": 0x0000 },
			},
			"Function TKL":
			{
				size: [10, 5],
				vLedNames: [ "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Zone 10" ],
				vLedPositions: [ [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1] ],
				endpoint : { "interface": 1, "usage": 0x0001, "usage_page": 0xFFCA, "collection": 0x0000 },
			},
			"Function MiniTKL":
			{
				size: [10, 5],
				vLedNames: [ "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Zone 10" ],
				vLedPositions: [ [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1] ],
				endpoint : { "interface": 1, "usage": 0x0001, "usage_page": 0xFFCA, "collection": 0x0000 },
			},
		};

		this.imageLibrary = {
			"Function": 		"https://marketplace.signalrgb.com/devices/brands/nzxt/keyboards/function.png",
			"Function TKL": 	"https://marketplace.signalrgb.com/devices/brands/nzxt/keyboards/function-tkl.png",
			"Function MiniTKL":	"https://marketplace.signalrgb.com/devices/brands/nzxt/keyboards/function-mini-tkl.png",
		};
	}
}

const NZXTdeviceLibrary = new deviceLibrary();
const NZXT = new NZXT_Keyboard_Protocol();

function CompareArrays(array1, array2){
	return array1.length === array2.length &&
	array1.every(function(value, index) { return value === array2[index];});
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
	return endpoint.interface === 1;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/default/keyboards/full-size-keyboard-render.png";
}