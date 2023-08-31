export function Name() { return "Razer Leviathan V2"; }
export function VendorId() { return 0x1532; }
export function Documentation(){ return "troubleshooting/razer"; }
export function ProductId() { return 0x0532; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [18, 1]; }
export function Type() { return "Hid"; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
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

const transactionID = 0x1f;

const vLedNames = ["LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10", "LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17 ", "LED 18",];
const vLedPositions = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0],];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}


export function Initialize() {
	getDeviceMode();
	getDeviceFirmwareVersion();
	getDeviceSerial();
}

export function Render() {
	setDeviceColor();
}

export function Shutdown() {
	setDeviceHardwareMode();
}

function packetSend(packet, length) //Wrapper for always including our CRC
{
	const packetToSend = packet;
	packetToSend[89] = CalculateCrc(packet);
	device.send_report(packetToSend, length);
}

function CalculateCrc(report) {
	let iCrc = 0;

	for (let iIdx = 3; iIdx < 89; iIdx++) {
		iCrc ^= report[iIdx];
	}

	return iCrc;
}

function getDeviceMode() {
	const packet = [0x08, 0x00, transactionID, 0x00, 0x00, 0x00, 0x02, 0x00, 0x84];
	packetSend(packet, 91);

	let returnpacket = device.get_report(packet, 91);
	returnpacket = device.get_report(packet, 91);

	const deviceMode = returnpacket[9];
	device.log("Current Device Mode: " + deviceMode);

	if(deviceMode !== 3) {
		setDeviceSoftwareMode();
	}
}

function setDeviceHardwareMode() {
	const packet = [0x08, 0x00, transactionID, 0x00, 0x00, 0x00, 0x02, 0x00, 0x04, 0x00];
	packetSend(packet, 91);

	let returnpacket = device.get_report(packet, 91);
	returnpacket = device.get_report(packet, 91);
}

function setDeviceSoftwareMode() {
	const packet = [0x08, 0x00, transactionID, 0x00, 0x00, 0x00, 0x02, 0x00, 0x04, 0x03];
	packetSend(packet, 91);

	let returnpacket = device.get_report(packet, 91);
	returnpacket = device.get_report(packet, 91);
}

function getDeviceSerial() {
	const packet = [0x08, 0x00, transactionID, 0x00, 0x00, 0x00, 0x16, 0x00, 0x82];
	packetSend(packet, 91);

	let returnpacket = device.get_report(packet, 91);
	returnpacket = device.get_report(packet, 91);

	const Serialpacket = returnpacket.slice(9, 24);
	const SerialString = String.fromCharCode(...Serialpacket);
	device.log("Device Serial: " + SerialString);
}

function getDeviceFirmwareVersion() {
	const packet = [0x08, 0x00, transactionID, 0x00, 0x00, 0x00, 0x02, 0x00, 0x81];
	packetSend(packet, 91);

	let returnpacket = device.get_report(packet, 91);
	returnpacket = device.get_report(packet, 91);

	const FirmwareByte1 = returnpacket[9];
	const FirmwareByte2 = returnpacket[10];
	device.log("Firmware Version: " + FirmwareByte1 + "." + FirmwareByte2);
}

function getDeviceColor() {
	const rgbdata = [];

	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var col;

		if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iPxX, iPxY);
		}

		const iLedIdx = (iIdx*3);
		rgbdata[iLedIdx] = col[0];
		rgbdata[iLedIdx+1] = col[1];
		rgbdata[iLedIdx+2] = col[2];
	}

	return rgbdata;
}

function setDeviceColor() {
	const rgbdata = getDeviceColor();
	const colorpacket1 = [0x08, 0x00, transactionID, 0x00, 0x00, 0x00, 0x20, 0x0F, 0x03, 0x00, 0x00, 0x00, 0x00, 0x08];
	colorpacket1.push(...rgbdata.splice(0, 27));

	const colorpacket2 = [0x08, 0x00, transactionID, 0x00, 0x00, 0x00, 0x20, 0x0F, 0x03, 0x00, 0x00, 0x01, 0x00, 0x08];
	colorpacket2.push(...rgbdata.splice(0, 27));
	packetSend(colorpacket1, 91);
	packetSend(colorpacket2, 91);
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
	return endpoint.interface === 2 && endpoint.usage === 0x0001;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/razer/audio/leviathan-v2.png";
}