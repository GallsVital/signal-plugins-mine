export function Name() { return "MSI Monitor Controller"; }
export function VendorId() { return 0x1462; }
export function ProductId() { return 0x3fa4; }
export function Publisher() { return "Derek Huber"; }
export function Size() { return [1, 1]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){ return [0, 0]; }
export function DefaultScale(){ return 1.0; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters() {
	return [
		{ "property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde" },
		{ "property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas" },
		{ "property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde" }
	];
}


export function LedNames() {
	return MSIMonitor.getLedNames();
}

export function LedPositions() {
	return MSIMonitor.getLedPositions();
}

export function Initialize() {
	MSIMonitor.findMonitorModel();
}

export function Shutdown() {
	sendColors(true);
}

export function Render() {
	sendColors();
}

function sendColors(shutdown = false) {
	const packet = [];
	const vLedPostions = MSIMonitor.getLedPositions();
	const vLedKeys = MSIMonitor.getLedIndexes();
	const rgbOffset = MSIMonitor.getRgbPacketIndexOffset();
	const packetLength = MSIMonitor.getPacketLength();

	//initial data
	packet[0] = MSIMonitor.getStartingByte(); //[MAG271CQR, MAG272CR, MAG272CQR].includes(currentMonitor) ? 0x71 : 0x72
	packet[1]  = 0x01;
	packet[5]  = 0x01;
	packet[6]  = 0x64;
	packet[12] = 0x01;
	packet[16] = 0x01;
	packet[17] = 0x64;

	//ff padding - 0xff 0x00 0x00 ... 0xff 0x00 0x00
	for (let ffPaddingIndex = 23; ffPaddingIndex < rgbOffset; ffPaddingIndex += 3) {
		packet[ffPaddingIndex] = 0xff;
	}

	//rgb data
	for (let ledIndex = 0; ledIndex < vLedPostions.length; ledIndex++) {
		const curLedXCoord = vLedPostions[ledIndex][0];
		const curLedYCoord = vLedPostions[ledIndex][1];
		let color;

		if (shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(curLedXCoord, curLedYCoord);
		}

		packet[ledIndex * 3 + rgbOffset] = color[0];
		packet[ledIndex * 3 + rgbOffset + 1] = color[1];
		packet[ledIndex * 3 + rgbOffset + 2] = color[2];
	}

	//more ff padding - 0xff 0x00 0x00 ... 0xff 0x00 0x00
	for (let ffPaddingIndex = rgbOffset + vLedKeys.length * 3; ffPaddingIndex < packetLength - 1; ffPaddingIndex += 3) {
		packet[ffPaddingIndex] = 0xff;
	}

	device.send_report(packet, packetLength);
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

class MSIMonitorProtocol {
	constructor() {

		this.config = {
			ledNames :[],
			ledPositions : [],
			ledIndexes : [],
			size : [0, 0],
			rgbPacketIndexOffset: 0,
			rgbPacketLength: 0,
			startingByte: 0x00
		};

		this.idDict = {
			72 : "MAG273R2",
			65 : "MAG274QRFQD",
			45 : "MAG272CQR",
			52 : "MAG301CR2"
		};

		this.modelDict = {
			MAG271CQR : {
				mapping: [
					0, 1, 2, 3, 4, 5, 6, 7, 8
				],
				positioning: [
					[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0]
				],
				names: [ "LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", ],
				firstRGBDataUSBPacketIndex: 50,
				USBPacketSize: 78,
				displayName: "MSI MAG271CQR",
				ledCount: 9,
				size: [9, 1],
				startingByte: 0x71
			},
			MAG272CR : {
				mapping: [
					0, 1, 2, 3, 4, 5, 6, 7, 8
				],
				positioning: [
					[8, 0], [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0]
				],
				names: [ "LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", ],
				firstRGBDataUSBPacketIndex: 50,
				USBPacketSize: 78,
				displayName: "MSI MAG272CR",
				ledCount: 9,
				size: [9, 1],
				startingByte: 0x71
			},
			MAG272CQR : {
				mapping: [
					0, 1, 2, 3, 4, 5, 6, 7, 8
				],
				positioning: [
					[8, 0], [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0]
				],
				names: [ "LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", ],
				firstRGBDataUSBPacketIndex: 50,
				USBPacketSize: 78,
				displayName: "MSI MAG272CQR",
				ledCount: 9,
				size: [9, 1],
				startingByte: 0x71
			},
			MAG273R2 : {
				mapping: [
					0, 1, 2, 3, 4, 5, 6, 7, 8
				],
				positioning: [
					[8, 0], [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0]
				],
				names: [ "LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", ],
				firstRGBDataUSBPacketIndex: 95,
				USBPacketSize: 168,
				displayName: "MSI MAG273R2",
				ledCount: 9,
				size: [9, 1],
				startingByte: 0x72
			},
			MAG274QRFQD : {
				mapping: [
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
				],
				positioning: [
					[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0]
				],
				names: [ "LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10", "LED 11", "LED 12"],
				firstRGBDataUSBPacketIndex: 95,
				USBPacketSize: 168,
				displayName: "MSI MAG274QRF-QD",
				ledCount: 12,
				size: [12, 1],
				startingByte: 0x72
			},
			MAG301CR2 : {
				mapping: [
					0, 1, 2, 3, 4, 5,
					6, 7, 8, 9, 10, 11,
					12, 13, 14, 15, 16, 17,
					18, 19, 20, 21, 22, 23
				],
				positioning: [
					[5, 11], [4, 10], [3, 9], [2, 8], [1, 7], [0, 6],
					[0, 5], [1, 4], [2, 3], [3, 2], [4, 1], [5, 0],
					[6, 0], [7, 1], [8, 2], [9, 3], [10, 4], [11, 5],
					[11, 6], [10, 7], [9, 8], [8, 9], [7, 10], [6, 11]
				],
				names: [ "LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10", "LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20", "LED 21", "LED 22", "LED 23", "LED 24", ],
				firstRGBDataUSBPacketIndex: 95,
				USBPacketSize: 168,
				displayName: "MSI MAG301CR2",
				ledCount: 24,
				size: [12, 12],
				startingByte: 0x72
			}
		};
	}

	getLedNames() { return this.config.ledNames; }
	setLedNames(ledNames) { this.config.ledNames = ledNames; }

	getLedPositions() { return this.config.ledPositions; }
	setLedPositions(ledPositions) { this.config.ledPositions = ledPositions; }

	getLedIndexes() { return this.config.ledIndexes; }
	setLedIndexes(ledIndexes) { this.config.ledIndexes = ledIndexes; }

	getSize() { return this.config.size; }
	setSize(size) { this.config.size = size; }

	getRgbPacketIndexOffset() { return this.config.rgbPacketIndexOffset; }
	setRgbPacketIndexOffset(rgbPacketIndexOffset) { this.config.rgbPacketIndexOffset = rgbPacketIndexOffset; }

	getPacketLength() { return this.config.rgbPacketLength; }
	setPacketLength(packetLength) { this.config.rgbPacketLength = packetLength; }

	getStartingByte() { return this.config.startingByte; }
	setStartingByte(startingByte) { this.config.startingByte = startingByte; }

	findMonitorModel() {
		device.clearReadBuffer();
		device.write([1, 53, 56, 48, 48, 49, 52, 48, 13], 64);

		const returnPacket1 = device.read([1], 64);
		const model = returnPacket1[10]?.toString(16);
		device.log("Model: " + model);
		this.setDeviceParameters(model);

		device.write([0x01, 0xB0], 64);

		const returnPacket = device.read([0x00], 64);
		const highByte = returnPacket[3];
		const lowByte = returnPacket[2];
		device.log("High Byte: " + highByte);
		device.log("Low Byte: " + lowByte);

	}

	setDeviceParameters(deviceID) {
		const monitor = this.modelDict[this.idDict[deviceID]];
		this.setLedIndexes(monitor.mapping);
		this.setLedNames(monitor.names);
		this.setLedPositions(monitor.positioning);
		this.setSize(monitor.size);
		this.setRgbPacketIndexOffset(monitor.firstRGBDataUSBPacketIndex);
		this.setPacketLength(monitor.USBPacketSize);
		this.setStartingByte(monitor.startingByte);

		device.setName(`MSI ${this.idDict[deviceID]} Monitor`);
		device.setSize(this.getSize());
		device.setControllableLeds(this.getLedNames(), this.getLedPositions());
	}
}

const MSIMonitor = new MSIMonitorProtocol();

export function Validate(endpoint) {
	return endpoint.interface === 0 || endpoint.interface === -1;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/msi/monitors/generic-monitor.png";
}