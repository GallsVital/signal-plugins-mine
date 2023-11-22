export function Name() { return "HyperX Pulsefire Haste Wireless"; }
export function VendorId() { return 0x03f0; }
export function ProductId() { return [0x048E, 0x028E]; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition() {return [225, 120]; }
export function DefaultScale(){return 15.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
DpiControl:readonly
dpi1:readonly
dpi2:readonly
dpi3:readonly
dpi4:readonly
dpi5:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"DpiControl", "group":"mouse", "label":"Enable Dpi Control", "type":"boolean", "default":"false"},
		{"property":"dpi1", "group":"mouse", "label":"DPI", "step":"50", "type":"number", "min":"200", "max":"16000", "default":"400"},
		{"property":"dpi2", "group":"mouse", "label":"DPI", "step":"50", "type":"number", "min":"200", "max":"16000", "default":"800"},
		{"property":"dpi3", "group":"mouse", "label":"DPI", "step":"50", "type":"number", "min":"200", "max":"16000", "default":"1600"},
		{"property":"dpi4", "group":"mouse", "label":"DPI", "step":"50", "type":"number", "min":"200", "max":"16000", "default":"2400"},
		{"property":"dpi5", "group":"mouse", "label":"DPI", "step":"50", "type":"number", "min":"200", "max":"16000", "default":"3200"},
	];
}
export function ConflictingProcesses() {
	return ["NGenuity2.exe"];
}

const vLedNames = [ "Scroll" ];

const vLedPositions = [ [1, 0] ];


export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	let packet = [0x00, 0x04, 0x05]; //I think this is an apply packet
	packet[9] = 0x01;

	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x04, 0x66]; //I think this is an apply packet
	packet[9] = 0x01;

	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x04, 0x67]; //I think this is an apply packet
	packet[9] = 0x01;

	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	if(DpiControl){
		setDpi();
	}

	packet = [0x00, 0x04, 0x02];
	packet[63] = 0xaa;
	packet[64] = 0x55;
	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x04, 0x77];
	packet[13] = 0x01;

	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x03];
	packet[63] = 0xaa;
	packet[64] = 0x55;
	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x04, 0x02];
	packet[63] = 0xaa;
	packet[64] = 0x55;
	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x04, 0x51];
	packet[9] = 0x01;

	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x00, 0x00];
	device.send_report(packet, 65);

	packet[63] = 0xaa;
	packet[64] = 0x55;
	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x04, 0x02];
	packet[63] = 0xaa;
	packet[64] = 0x55;
	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x04, 0x65];
	packet[9] = 0x07;

	device.send_report(packet, 65);
	device.get_report([0x00], 65);

	packet = [0x00, 0x00, 0x00];
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
	device.send_report(packet, 65);


	packet = [0x00, 0x04, 0x02];
	packet[63] = 0xaa;
	packet[64] = 0x55;
	device.send_report(packet, 65);
	device.get_report([0x00], 65);

}

export function Render() {
	colorPrimer();
	sendColors();

	const packet = [0x00, 0x00, 0x00];
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
}

export function Shutdown() {
	sendColors(true);
}

function colorPrimer() {
	const packet = [0x00, 0x04, 0xf2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02];
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
}

function sendColors(shutdown = false) {
	const packet = [];
	packet[0] = 0x00;

	packet[1] = 0x81;

	const iPxX = vLedPositions[0][0];
	const iPxY = vLedPositions[0][1];
	let color;

	if(shutdown) {
		color = hexToRgb(shutdownColor);
	} else if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	} else {
		color = device.color(iPxX, iPxY);
	}

	packet[2]= color[0];
	packet[3] = color[1];
	packet[4] = color[2];
	packet[9] = 0x02;
	device.send_report(packet, 65);
	device.get_report([0x00], 65);
}

function setDpi() {
	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x03;
	packet[13] = 0xff;
	packet[18] = 0x1f;
	packet[21] = Math.round(dpi1+100/100);
	packet[23] = Math.round(dpi2+100/100);
	packet[25] = Math.round(dpi3+100/100);
	packet[27] = Math.round(dpi4+100/100);
	packet[29] = Math.round(dpi5+100/100);
	packet[33] = 0x00;//first level
	packet[37] = 0x00;//second level
	packet[41] = 0x00;//third level
	packet[45] = 0x00;//fourth level
	packet[49] = 0x00;//fifth level
	packet[63] = 0xaa;
	packet[64] = 0x55;

	device.send_report(packet, 65);
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
	return endpoint.interface === 3;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/hyperx/mice/pulsefire-haste-wireless.png";
}