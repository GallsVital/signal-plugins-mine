export function Name() { return "Razer Deathadder Essential"; }
export function VendorId() { return 0x1532; }
export function Documentation(){ return "troubleshooting/razer"; }
export function ProductId() { return 0x0098; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function Type() { return "Hid"; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
/* global
DpiControl:readonly
dpi1:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"DpiControl", "group":"mouse", "label":"Enable Dpi Control", "type":"boolean", "default":"false"},
		{"property":"dpi1", "group":"mouse", "label":"DPI", "step":"50", "type":"number", "min":"200", "max":"6400", "default":"800"},
	];
}

let savedDpi1;

export function Initialize() {
	if(DpiControl) {
		setDPIRazer(dpi1);
	}
}

export function Render() {
	SendPacket();

	if(DpiControl) {
		setDPIRazer(dpi1);
	}
}


export function Shutdown() {
	SendPacket(true);

}

export function LacksOnBoardLeds() {return true;}

export function onBrightnessChanged() {
	device.log(`Brightness is now set to: ${device.getBrightness()}`);
}

function SendPacket(shutdown = false){


	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x00;
	packet[2] = 0x1F;
	packet[3] = 0x00;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = 0x03;
	packet[7] = 0x0F;
	packet[8] = 0x04;
	packet[9] = 0x01;
	packet[11] = device.getBrightness();


	packet[89] = CalculateCrc(packet);

	device.send_report(packet, 91);
}

function setDPIRazer(dpi){
	savedDpi1 = dpi;

	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x00;
	packet[2] = 0x1F;
	packet[3] = 0x00;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = 0x07;
	packet[7] = 0x04;
	packet[8] = 0x05;
	packet[9] = 0x00;
	packet[10] = Math.floor(dpi/256);
	packet[11] = dpi%256;
	packet[12] = Math.floor(dpi/256);
	packet[13] = dpi%256;
	packet[89] = CalculateCrc(packet);

	device.send_report(packet, 91);
}

function CalculateCrc(report) {
	let iCrc = 0;

	for (let iIdx = 3; iIdx < 89; iIdx++) {
		iCrc ^= report[iIdx];
	}

	return iCrc;
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
	return endpoint.interface === 0 && endpoint.usage === 0x0002;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/razer/mice/deathadder-essential.png";
}