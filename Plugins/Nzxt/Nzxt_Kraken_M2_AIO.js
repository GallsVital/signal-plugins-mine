export function Name() { return "NZXT Kraken M2"; }
export function VendorId() { return 0x1E71; }
export function Documentation(){ return "troubleshooting/nzxt"; }
export function ProductId() { return 0x1715; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [9, 9]; }
export function DefaultPosition(){return [165, 60];}
export function DefaultScale(){return 3.0;}
const vLedNames = [
	"Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Logo"
];

const vLedPositions = [[4, 0], [5, 2], [7, 3], [5, 5], [4, 7],
	[3, 5], [1, 3], [3, 2], [4, 1], [4, 4]];

export function Initialize() {
	// Kraken doesn't require a setup packet.
	return "Hello, there!";
}

export function Shutdown() {
	const packet = [];

	// Header.
	packet[0] = 0x02;
	packet[1] = 0x4C;
	packet[2] = 0x02;
	packet[3] = 0x00;

	// Speed?
	packet[4] = 0x04;
	packet[4] |= 0 << 3;
	packet[4] |= 0 << 5;

	// Colors.
	for(let iIdx=0; iIdx < 9; iIdx++) {
		const iLedIdx = 0x05 + (iIdx * 3);
		packet[iLedIdx] = 25;
		packet[iLedIdx+1] = 25;
		packet[iLedIdx+2] = 25;
	}

	device.write(packet, 65);
}

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Render() {
	var packet = [];

	// Header.
	packet[0] = 0x02;
	packet[1] = 0x4C;
	packet[2] = 0x02; //channel
	packet[3] = 0x00; //direct mode

	// Speed?
	packet[4] = 0x04;
	packet[4] |= 0 << 3;
	packet[4] |= 0 << 5;

	// Colors.
	for(let iIdx=0; iIdx < 9; iIdx++) {
		const iLedIdx = 0x05 + (iIdx * 3);
		var x = vLedPositions[iIdx][0];
		var y = vLedPositions[iIdx][1];
		var col = device.color(x, y);
		packet[iLedIdx] = col[0];
		packet[iLedIdx+1] = col[1];
		packet[iLedIdx+2] = col[2];
	}

	device.write(packet, 65);

	var packet = [];


	// Header.
	packet[0] = 0x02;
	packet[1] = 0x4C;
	packet[2] = 0x01; //channel
	packet[3] = 0x00;

	// Speed?
	packet[4] = 0x04;
	packet[4] |= 0 << 3;
	packet[4] |= 0 << 5;

	// Logo Colors.
	var x = vLedPositions[9][0];
	var y = vLedPositions[9][1];
	var col = device.color(x, y);
	packet[5] = col[1]; //green
	packet[6] = col[0]; //red
	packet[7] = col[2]; //blue

	device.write(packet, 65);
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/nzxt/aio/kraken-m2-series.png";
}