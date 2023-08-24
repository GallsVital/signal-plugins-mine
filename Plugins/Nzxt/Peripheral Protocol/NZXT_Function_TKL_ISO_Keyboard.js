export function Name() { return "NZXT Function TKL"; }
export function VendorId() { return 0x1E71; }
export function ProductId() { return 0x2107; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/nzxt"; }
export function Size() { return [10, 10]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
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

const vLedNames = [ "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Null", "Null", "Zone 5", "Zone 6", "Zone 7", "Zone 8" ]; //5 and 6 are Null.

const vLedPositions = [ [0, 1], [1, 1], [3, 1], [4, 1], [0, 0], [0, 0], [7, 1], [6, 1], [5, 1], [2, 1] ];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	Header();
	Header2();
}

export function Render() {
	sendColorBurstOne();
	sendColorBurstTwo();
	sendColorBurstThree();
	sendColorBurstFour();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		sendColorBurstOne("#000000"); // Go Dark on System Sleep/Shutdown
		sendColorBurstTwo("#000000");
		sendColorBurstThree("#000000");
		sendColorBurstFour("#000000");
	}else{
		sendColorBurstOne(shutdownColor);
		sendColorBurstTwo(shutdownColor);
		sendColorBurstThree(shutdownColor);
		sendColorBurstFour(shutdownColor);
	}

}

function Header() {
	const packet = [0x43, 0x81, 0x00, 0x84];
	device.write(packet, 10);
}

function Header2() {
	const packet = [0x43, 0x81, 0x00, 0x86];
	device.write(packet, 10);
}

function sendColorBurstOne(overrideColor) {
	const packet = [];

	for(let zone_idx = 0; zone_idx < 2; zone_idx++) {
		const offset = zone_idx;
		const iX = vLedPositions[offset][0];
		const iY = vLedPositions[offset][1];
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode == "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iX, iY);
		}

		packet[(zone_idx * 22) + 23] = col[0];
		packet[(zone_idx * 22) + 24] = col[1];
		packet[(zone_idx * 22) + 25] = col[2];
	}

	packet[0x00]   = 0x43;
	packet[0x01]   = 0xbd;
	packet[0x02]   = 0x03;
	packet[0x03]   = 0x10;
	packet[0x04]   = 0x01;
	packet[0x05] = 0x01; //Mapping Esc Key
	packet[0x06] = 0x00; //Zero Mapping of Second Bank
	packet[0x07] = 0x03;
	packet[0x08] = 0x00;
	packet[0x09] = 0x03;
	packet[0x0A] = 0x00;
	packet[0x0B] = 0x03;
	packet[0x0C] = 0x00;
	packet[0x0D] = 0x03;//Replace 1 with 3 for ISO_<>| in Zone 1
	packet[0x0E] = 0x00;
	packet[0x0F] = 0x03;
	packet[0x10] = 0x00;
	packet[0x11] = 0x00;
	packet[0x12] = 0x00;
	packet[0x13] = 0x00;
	packet[0x14] = 0x00;
	packet[0x1A] = 0x01;
	packet[0x1B] = 0x06;
	packet[29] = 0x0C;
	packet[31] = 0x0C;
	packet[33] = 0x0C;
	packet[35] = 0x0C;
	packet[37] = 0x04;
	packet[48] = 0x01;
	packet[49] = 0x60;
	packet[51] = 0xC0;
	packet[53] = 0xC0;
	packet[55] = 0xC0;
	packet[57] = 0xC0;
	packet[59] = 0x20;

	device.write(packet, 65);
}

function sendColorBurstTwo(overrideColor) {

	const packet = [];

	for(let zone_idx = 0; zone_idx < 3; zone_idx++) {
		const offset = zone_idx + 2;
		const iX = vLedPositions[offset][0];
		const iY = vLedPositions[offset][1];
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode == "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iX, iY);
		}

		packet[(zone_idx * 22) + 6] = col[0];
		packet[(zone_idx * 22) + 7] = col[1];
		packet[(zone_idx * 22) + 8] = col[2];
	}

	packet[0x00]   = 0x43;
	packet[0x01]   = 0x3d;
	packet[0x02]   = 0x02;
	packet[0x03]   = 0x00;
	packet[0x04]   = 0x00;

	packet[0x05] = 0x00;


	packet[0x09] = 0x01; //Activation Byte
	packet[0x0A] = 0x80; //Binary Mapping

	packet[0x0B] = 0x01;
	packet[0x0C] = 0x00;
	packet[0x0D] = 0x03;
	packet[0x0E] = 0x00;
	packet[0x0F] = 0x03;
	packet[0x10] = 0x00;
	packet[0x11] = 0x03;
	packet[0x12] = 0x00;
	packet[0x13] = 0x03;
	packet[0x14] = 0x00;

	packet[0x1B] = 0x00; //Blank as we only dropped one byte

	packet[0x1F] = 0x01;//Activation Byte
	packet[0x2A] = 0x00;//Binary Mapping We drop a byte and lose half our banks.
	packet[0x2c] = 0xC0;
	packet[0x2E] = 0x46;
	packet[0x2F] = 0x0E;

	;
	packet[0x35] = 0x01;

	device.write(packet, 65);
}

function sendColorBurstThree(overrideColor) {
	const packet = [];

	for(let zone_idx = 0; zone_idx < 3; zone_idx++) {
		const offset = zone_idx + 5;
		const iX = vLedPositions[offset][0];
		const iY = vLedPositions[offset][1];
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode == "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iX, iY);
		}

		packet[(zone_idx * 22) + 11] = col[0];
		packet[(zone_idx * 22) + 12] = col[1];
		packet[(zone_idx * 22) + 13] = col[2];
	}

	packet[0x00]   = 0x43;
	packet[0x01]   = 0x3D;
	packet[0x02]   = 0x01;
	packet[0x03]   = 0x00;
	packet[0x04]   = 0x00;

	packet[0x05] = 0x32;
	packet[0x06] = 0x04;
	packet[0x07] = 0xB0;
	packet[0x08] = 0x11;
	packet[0x09] = 0x00;
	packet[0x0A] = 0x00;
	packet[0x0E] = 0x01;
	packet[0x0F] = 0x00;
	packet[0x10] = 0x40;

	packet[0x18] = 0x40;
	packet[0x19] = 0x00;
	packet[0x1A] = 0x40;
	packet[0x1B] = 0x08;
	packet[0x1C] = 0x43;
	packet[0x1D] = 0x08;
	packet[0x1E] = 0x40;
	packet[0x1F] = 0x00;
	packet[0x20] = 0x00;
	packet[0x24] = 0x01;
	packet[0x25] = 0x00;
	packet[0x26] = 0x30;
	packet[0x27] = 0x00;
	packet[0x28] = 0x40;
	packet[0x29] = 0x00;
	packet[0x2A] = 0x60;
	packet[0x2B] = 0x00;
	packet[0x2C] = 0x70;//Replace 60 with 70 for ISO_# in Zone 6
	packet[0x2D] = 0x00;
	packet[0x2E] = 0x20;
	packet[0x2F] = 0x00;
	packet[0x30] = 0x34;

	packet[54] = 0x00;
	packet[58] = 0x01;

	packet[60] = 0x0E;
	packet[62] = 0x1C;

	device.write(packet, 65);
}

function sendColorBurstFour(overrideColor) {
	const packet = [];

	for(let zone_idx = 0; zone_idx < 2; zone_idx++) {
		const offset = zone_idx + 8;
		const iX = vLedPositions[offset][0];
		const iY = vLedPositions[offset][1];
		let col;

		if(overrideColor) {
			col = hexToRgb(overrideColor);
		} else if (LightingMode == "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.color(iX, iY);
		}

		packet[(zone_idx * 22) + 16] = col[0];
		packet[(zone_idx * 22) + 17] = col[1];
		packet[(zone_idx * 22) + 18] = col[2];
	}

	packet[0x00]   = 0x43;
	packet[0x01]   = 0x26;
	packet[0x02]   = 0x00;
	packet[0x03]   = 0x1c;
	packet[0x04]   = 0x00;

	packet[0x05] = 0x0c;
	packet[0x06] = 0x00;
	packet[0x07] = 0x0c;
	packet[0x08] = 0x00;
	packet[0x09] = 0x0A;
	packet[0x0A] = 0x00;
	packet[0x0B] = 0x00;
	packet[0x0C] = 0x00;
	packet[0x0D] = 0x00;
	packet[0x0E] = 0x00;
	packet[0x0F] = 0x00;

	packet[0x13] = 0x01;
	packet[0x14] = 0x18;
	packet[0x16] = 0x30;
	packet[0x18] = 0x30;
	packet[0x1A] = 0x30;
	packet[0x1C] = 0x30;

	device.write(packet, 65);
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
	return "https://marketplace.signalrgb.com/devices/brands/nzxt/keyboards/function-tkl.png";
}
