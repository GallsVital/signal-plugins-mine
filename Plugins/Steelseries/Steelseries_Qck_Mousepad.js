export function Name() { return "Steelseries QcK Prism"; }
export function VendorId() { return 0x1038; }
export function Documentation(){ return "troubleshooting/steelseries"; }
export function ProductId() { return 0x150d; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [2, 2]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
const vLedNames = [
	"Mousemat Top", "Mousemap Bottom"
];

const vLedPositions = [[0, 0], [0, 1]];

export function Initialize() {
	// Qck doesn't require a setup packet.
	return "Hello, there!";
}

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Shutdown() {
	// Most of this is grabbed using usblyzer.  Usblyzer sent 524 byte packets followed
	// by 64 byte commit packets.  Here, we sent the bytes we'll use and the engine will
	// pad the rest with zeroes.  Important to note that we add 1 to the send and write functions
	// because hid firstbyte is (almost) always zero.  Use usblyzer to verify the packets sent.
	const packet = [];

	// first byte is zero.
	packet[0] = 0;

	// packet start.
	packet[1] = 14;
	packet[2] = 0;
	packet[3] = 2;
	packet[4] = 0;

	// Color, bottom.
	packet[5] = 100; //r
	packet[6] = 100; //g
	packet[7] = 100; //b

	packet[8] = 255; //?
	packet[9] = 50;
	packet[10] = 200;

	packet[11] = 0; //?
	packet[12] = 0;
	packet[13] = 0;

	packet[14] = 1; //?
	packet[15] = 0;
	packet[16] = 0;

	// Color, top.
	packet[17] = 100;
	packet[18] = 100;
	packet[19] = 100;

	packet[20] = 255; //?
	packet[21] = 50;
	packet[22] = 200;

	packet[23] = 0; //?
	packet[24] = 0;
	packet[25] = 1;

	packet[26] = 1; //?
	packet[27] = 0;
	packet[28] = 1;


	device.send_report(packet, 525);

	// We have to send 'write' vs 'send_report' here with only 0x0D as byte 1. (first byte
	// is always zero)
	const apply = [];
	apply[0] = 0;
	apply[1] = 0x0D;
	device.write(apply, 65);
}

export function Validate(endpoint) {
	// Qck has two interfaces - return 'true' if the endpoint is at interface
	// zero.
	return endpoint.interface === 0;
}

export function Render() {

	// Most of this is grabbed using usblyzer.  Usblyzer sent 524 byte packets followed
	// by 64 byte commit packets.  Here, we sent the bytes we'll use and the engine will
	// pad the rest with zeroes.  Important to note that we add 1 to the send and write functions
	// because hid firstbyte is (almost) always zero.  Use usblyzer to verify the packets sent.
	const packet = [];

	// first byte is zero.
	packet[0] = 0;

	// packet start.
	packet[1] = 14;
	packet[2] = 0;
	packet[3] = 2;
	packet[4] = 0;

	// Color, bottom.
	const iBX = vLedPositions[1][0];
	const iBY = vLedPositions[1][1];
	const bottom = device.color(iBX, iBY);
	packet[5] = bottom[0]; //r
	packet[6] = bottom[1]; //g
	packet[7] = bottom[2]; //b

	packet[8] = 255; //?
	packet[9] = 50;
	packet[10] = 200;

	packet[11] = 0; //?
	packet[12] = 0;
	packet[13] = 0;

	packet[14] = 1; //?
	packet[15] = 0;
	packet[16] = 0;

	// Color, top.
	const iTX = vLedPositions[0][0];
	const iTY = vLedPositions[0][1];
	const top = device.color(iTX, iTY);
	packet[17] = top[0];
	packet[18] = top[1];
	packet[19] = top[2];

	packet[20] = 255; //?
	packet[21] = 50;
	packet[22] = 200;

	packet[23] = 0; //?
	packet[24] = 0;
	packet[25] = 1;

	packet[26] = 1; //?
	packet[27] = 0;
	packet[28] = 1;


	device.send_report(packet, 525);

	// We have to send 'write' vs 'send_report' here with only 0x0D as byte 1. (first byte
	// is always zero)
	const apply = [];
	apply[0] = 0;
	apply[1] = 0x0D;
	device.write(apply, 65);
}


