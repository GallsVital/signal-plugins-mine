function GetReport(cmd_class, cmd_id, size) {
	const report = new Array(91).fill(0);

	report[0] = 0;

	// Status.
	report[1] = 0x00;

	// Transaction ID.
	report[2] = 0xFF;

	// Remaining packets.
	report[3] = 0x00;
	report[4] = 0x00;

	// Protocol type.
	report[5] = 0x00;

	// Data size.
	report[6] = size;

	// Command class.
	report[7] = cmd_class;

	// Command id.
	report[8] = cmd_id;

	//report[8-87] = data;

	//report[89] = crc;

	//report[89] = reserved;

	return report;
}


function CalculateCrc(report) {
	let iCrc = 0;

	for (let iIdx = 3; iIdx < 89; iIdx++) {
		iCrc ^= report[iIdx];
	}

	return iCrc;
}


export function Name() { return "Razer FireFly Hard Edition"; }
export function VendorId() { return 0x1532; }
export function Documentation(){ return "troubleshooting/razer"; }
export function ProductId() { return 0x0c00; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [10, 10]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

const vLedNames = [
	"Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10", "Led 11", "Led 12",
	"Led 13", "Led 14", "Led 15"
];
const vLedPositions = [

	[9, 0], [9, 2], [9, 4], [9, 6], [9, 7], [7, 7], [7, 5], [7, 3], [7, 1], [6, 1], [5, 1], [4, 1], [3, 0], [2, 0], [1, 0]

];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

function EnableSoftwareControl() {
	const report = GetReport(0x0F, 0x03, 0x47);

	report[2] = 0x3F; // transaction id.

	report[11] = 0; // row index.

	report[13] = 15; // led count.

	report[89] = CalculateCrc(report);


	device.send_report(report, 91);
}


function ReturnToHardwareControl() {

}


export function Initialize() {

}

function SendPacket(shutdown = false) {
	const packet = [];
	packet[0] = 0x00;
	packet[1] = 0x00;
	packet[2] = 0x1F;
	packet[3] = 0x00;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = 0x2F;
	packet[7] = 0x03;
	packet[8] = 0x0C;
	packet[9] = 0x00;
	packet[10] = 0x0E;


	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++){

		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];
		var col;

		if(shutdown){
			col = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		}else{
			col = device.color(iPxX, iPxY);
		}
		const iLedIdx = (iIdx*3) + 11;
		packet[iLedIdx] = col[0];
		packet[iLedIdx+1] = col[1];
		packet[iLedIdx+2] = col[2];
	}

	packet[89] = CalculateCrc(packet);

	device.send_report(packet, 91);
	device.pause(1); // We need a pause here (between packets), otherwise the ornata can't keep up.

}


function Apply() {
	const packet = []; //new Array(91).fill(0);
	packet[0] = 0x00;
	packet[1] = 0x00;
	packet[2] = 0x1F;
	packet[3] = 0x00;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = 0x02;
	packet[7] = 0x03;
	packet[8] = 0x0A;
	packet[9] = 0x05;

	packet[89] = CalculateCrc(packet);

	device.send_report(packet, 91);
}


export function Render() {
	SendPacket();
	Apply();


}


export function Shutdown() {
	SendPacket(true);
	Apply();
}

export function Validate(endpoint) {
	return endpoint.interface === 0 && endpoint.usage === 0x0002;

}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/razer/mousepads/firefly-v1.png";
}