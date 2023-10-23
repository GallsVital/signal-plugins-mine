export function Name() { return "LianLi Galahad II Trinity"; }
export function VendorId() { return  0x0416; }
export function ProductId() { return 0x7373;}
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [1, 1]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [120, 80];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
moboSync:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"moboSync", "group":"lighting", "label":"Motherboard Passthrough Mode", "type":"boolean", "default": "false"},
	];
}

export function SubdeviceController(){ return true; }

export function Initialize() {
	addChannels();

	if(moboSync) {
		setMoboSync(moboSync);
	}
}

export function Render() {
	setColors();
}
//8b, 0, 0, 0, 2, 0, 26
//8a, 0, 0, 0, 2, 0, 33

export function Shutdown() {
	setColors(true);
}

export function onmoboSyncChanged() {
	setMoboSync(moboSync);
}

function setMoboSync(moboSync) {

	//device.send_report([0xE0, 0x10, 0x40, moboSync], 255);
	//device.send_report([0xE0, 0x20], 255);
	//device.send_report([0xE0, 0x50, 0x01], 255);
}

function addChannels() {
	device.removeSubdevice("OuterRing"); //Remove these so I don't make 25 of them on reload.
	device.removeSubdevice("InnerRing");

	device.createSubdevice("OuterRing");
	device.setSubdeviceName("OuterRing", `Outer Ring`);
	device.setSubdeviceSize("OuterRing", 1, 1);
	device.setSubdeviceLeds("OuterRing", ["Led 1"], [0, 0]);
	//device.setSubdeviceImage("Dual8PinStrimer", Image());

	device.createSubdevice("InnerRing");
	device.setSubdeviceName("InnerRing", `Inner Ring`);
	device.setSubdeviceSize("InnerRing", 1, 1);
	device.setSubdeviceLeds("InnerRing", ["Led 1"], [0, 0]);
	//device.setSubdeviceImage("Dual8PinStrimer", Image());

}

function setColors(shutdown = false) {

	let outerColor;

	if(shutdown) {
		outerColor = hexToRgb(shutdownColor);
	} else if (LightingMode === "Forced") {
		outerColor = hexToRgb(forcedColor);
	} else {
		outerColor = device.subdeviceColor("OuterRing", 0, 0);
	}

	let innerColor;

	if(shutdown) {
		innerColor = hexToRgb(shutdownColor);
	} else if (LightingMode === "Forced") {
		innerColor = hexToRgb(forcedColor);
	} else {
		innerColor = device.subdeviceColor("InnerRing", 0, 0);
	}

	device.write([0x01, 0x83, 0x00, 0x00, 0x00, 0x12, 0x02, 0x03, 0x04, 0x03].concat(outerColor).concat(innerColor), 64);
	device.write([0x01, 0x81], 64);
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
	return endpoint.interface === 2;
}

//export function Image() {
//	return "";
//}