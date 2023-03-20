export function Name() { return "Corsair Elite Cappelix LCD"; }
export function VendorId() { return 0x1b1c; }
export function ProductId() { return 0x0C39; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [6, 6]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 1.0;}
/* global
screenSize:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"screenSize", "group":"", "label":"ScreenSize", "step":"1", "type":"number", "min":"1", "max":"200", "default":"50"},
	];
}

const pollInterval = 30000;
let currentTime = Date.now();

let packetsSent = 0;
export function Initialize() {
	device.setSize([screenSize+1, screenSize+1]);

	device.send_report([0x03, 0x1d, 0x01, 0x00], 32);
	device.get_report([0x03, 0x1d, 0x01, 0x00], 32); //Returns literally 3
	device.send_report([0x03, 0x19], 32);
	device.get_report([0x03, 0x19], 32);
	device.send_report([0x03, 0x20, 0x00, 0x19, 0x79, 0xE7, 0x32, 0x2E, 0x30, 0x2E, 0x30, 0x2E, 0x33], 32);
	device.get_report([0x03, 0x20, 0x00, 0x19, 0x79, 0xE7, 0x32, 0x2E, 0x30, 0x2E, 0x30, 0x2E, 0x33], 32);
	device.send_report([0x03, 0x0B, 0x40, 0x01, 0x79, 0xE7, 0x32, 0x2e, 0x30, 0x2E, 0x30, 0x2E, 0x33], 32);
	device.get_report([0x03, 0x0B, 0x40, 0x01, 0x79, 0xE7, 0x32, 0x2e, 0x30, 0x2E, 0x30, 0x2E, 0x33], 32); //THEY ALL RETURN 3
}

export function Render() {
	colorgrabber();
}

export function Shutdown() {
	device.send_report([0x03, 0x1E, 0x40, 0x01, 0x43, 0x00, 0x69, 0x00], 32);
}

export function onscreenSizeChanged() {
	device.setSize([screenSize+1, screenSize+1]);
}

const vLedNames = [ "Device Wide" ];

const vLedPositions = [ [0, 0] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

function colorgrabber() {

	const RGBData = device.getImageBuffer(0, 0, screenSize, screenSize, {flipH: false, outputWidth: 480, outputHeight: 480, format: "JPEG"});

	let BytesLeft = RGBData.length;

	packetsSent = 0;


	while(BytesLeft > 0) {
		const BytesToSend = Math.min(1016, BytesLeft);

		if(BytesToSend < 1015) {
			const RGBDataToSend = RGBData.slice((1016*packetsSent));

			while(RGBDataToSend.length < 1016){

				RGBDataToSend.push(RGBData[(1016 * (packetsSent - 1)) + RGBDataToSend.length]);
			}

			sendZone(RGBDataToSend.length, RGBDataToSend, packetsSent, 0x01);
		} else {
			sendZone(BytesToSend, RGBData.slice((1016*packetsSent), (1016*packetsSent)+BytesToSend), packetsSent, 0x00);
		}

		BytesLeft -= BytesToSend;
		packetsSent++;
	}

}

function sendZone(packetRGBDataLength, RGBData, packetsSent, finalPacket) {

	let packet = [0x02, 0x05, 0x40, finalPacket, packetsSent, 0x00, (packetRGBDataLength & 0xFF), (packetRGBDataLength >> 8 & 0xFF)];
	packet = packet.concat(RGBData);

	const result = device.write(packet, 1024);

	if(Date.now()-currentTime >= pollInterval && finalPacket) {
		device.send_report([0x03, 0x19, 0x40, finalPacket, packetsSent, 0x00, (packetRGBDataLength & 0xFF), (packetRGBDataLength >> 8 & 0xFF)], 32);
		currentTime = Date.now();
	}
}

export function Validate(endpoint) {
	return endpoint.interface === -1;
}