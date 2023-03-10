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

	if(renderFrames > 9000 && unstableController === false) {
		frameBufferReset();
		renderFrames = 0;
	}
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
			sendZone(BytesLeft, RGBData.splice(0, BytesToSend), packetsSent, 0x01);
		} else {
			sendZone(BytesToSend, RGBData.splice(0, BytesToSend), packetsSent, 0x00);
		}

		BytesLeft -= BytesToSend;
		packetsSent++;
	}

}

let failedPacket = false;
let unstableController = false;
let renderFrames = 0;

function sendZone(packetRGBDataLength, RGBData, packetsSent, finalPacket) {
	const BackupRGBData = RGBData;
	let packet = [0x02, 0x05, 0x40, finalPacket, packetsSent, 0x00, (packetRGBDataLength >> 8 & 0xFF), (packetRGBDataLength & 0xFF)];
	packet = packet.concat(RGBData);

	const result = device.write(packet, 1024);

	if(result !== 1024) { //Successful crash mitigation. We still get fragmented packets if we hit an error mid-way through a frame. This makes sense as the device is missing parts of a frame.
		failedPacket = true; //attempt letting the device complete its frame, then clear it.
	}

	if(failedPacket && finalPacket) {
		let backupPacket = [0x03, 0x19, 0x40, finalPacket, packetsSent, 0x00, (packetRGBDataLength >> 8 & 0xFF), (packetRGBDataLength & 0xFF)];
		backupPacket = backupPacket.concat(BackupRGBData.splice(0, 24));
		device.send_report(backupPacket, 32);

		//Only other option we have is to clear the device buffer out. This is what the MCU really wants.

		device.pause(6000); //let the device breathe.
		failedPacket = false; //Mitigation results are highly dependent on the effect. Smoothness is also highly dependent on the number of packets we're spamming at the device.
		unstableController = true; //If we failed like this, trying to continually clear the buffer isn't going to fix our problems.
	}
}

function frameBufferReset() {
	device.send_report([0x03, 0x0D, 0x01, 0x01, 0x78, 0x00, 0xC0, 0x03, 0x2F, 0x2F, 0x2F, 0xFF, 0x2F, 0x2F, 0x2F, 0xFF, 0x2F, 0x2F, 0x2F, 0xFF, 0x2F, 0x2F, 0x2F, 0xFF, 0x2F, 0x2F, 0x2F, 0xFF, 0x2F, 0x2F, 0x2F, 0xFF], 32); // or this one?
	device.pause(100);
}

export function Validate(endpoint) {
	return endpoint.interface === -1;
}