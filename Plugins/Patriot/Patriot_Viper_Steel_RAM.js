// Modifying SMBUS Plugins is -DANGEROUS- and can -DESTROY- devices.
export function Name() { return "Patriot Viper Steel RAM"; }
export function Publisher() { return "WhirlwindFX"; }
export function Type() { return "SMBUS"; }
export function Size() { return [1, 5]; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 8.0;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
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

/** @param {FreeAddressBus} bus */
export function Scan(bus) {
	const addr = 0x77;

	// Skip any non AMD / Nuvoton Busses
	if(!bus.IsSystemBus()){return[];}

	const masterControllerAddressExist = checkForMasterController(bus, addr);

	if(!masterControllerAddressExist) {
		return [];
	}

	bus.log("Possible Master Controller Found on Address: " + addr);

	let validSticks = 0;
	const addressList = [0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57];

	for(const addy of addressList) {
		const result = bus.WriteQuick(addy);

		if(result < 0) {
			bus.log(`Failed Quick Write test on Address: ${addy}`, {toFile: true});
			continue;
		}

		bus.WriteByte(0x36, 0x00, 0xff);//Crate does this

		if(bus.ReadByte(addy, 0x00) === 0x23) {
			bus.log("Address: " + addy + " Returned 0x23", {toFile: true});

			const registerstoReadFrom = [0x40, 0x41, 0x61, 0x62, 0x63, 0x64];
			const registerResponses = [0xFF, 0xFF, 0x50, 0x44, 0x41, 0x31];
			bus.WriteByte(0x37, 0x00, 0xFF);
			bus.pause(30);

			let validResponse = true;

			for(let bytes = 0; bytes < registerResponses.length; bytes++) { //Could add a retry loop in here.
				const response = bus.ReadByte(addy, registerstoReadFrom[bytes]);
				bus.pause(30);
				bus.log(`Patriot Viper Steel returned: ${response} for register: ${registerstoReadFrom[bytes]}`, {toFile: true});

				if(response !== registerResponses[bytes]) {
					validResponse = false;
				}
			}

			if(validResponse) {
				bus.log(`Patriot Viper Steel Stick Found at: ${addy}`, {toFile: true});
				validSticks++;
			}
		}
	}


	if(validSticks > 0) {
		return [addr];
	}

	return [];

}

function checkForMasterController(bus, addr) {
	let attempts = 0;
	const maxAttempts = 5;


	while(attempts < maxAttempts){
		const result = bus.WriteQuick(addr);

		if(result !== -1) {

			return true;
		}

		attempts++;
		bus.pause(30);
	}

	bus.log(`Failed Quick Write test on Address: 0x77 after 5 attempts`, {toFile: true});

	return false;
}

const vLedNames = [ "LED 1", "LED 2", "LED 3", "LED 4", "LED 5" ];
const vLedPositions = [ [0, 0], [0, 1], [0, 2], [0, 3], [0, 4] ];

export function Initialize() {

}

export function Render() {
	sendColors();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		bus.WriteByte(0x01, 0x01);
		bus.WriteByte(0x00, 0x00);
	}

}

function sendColors(overrideColor) {
	let color;

	for(let iIdx = 0; iIdx < 5; iIdx++) {
		const iPxX = vLedPositions[iIdx][0];
		const iPxY = vLedPositions[iIdx][1];


		if(overrideColor) {
			color = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(iPxX, iPxY);
		}

		ViperSteel.writeRegister(ViperSteel.registers[iIdx], color);
	}
}

class PatriotViperSteelController {
	constructor() {
		this.registers = [0x17, 0x18, 0x19, 0x1A, 0x1B];
	}

	writeRegister(register, color) {
		bus.WriteByte(register, color[0]);
		bus.WriteByte(color[1], color[2]);
	}
}

const ViperSteel = new PatriotViperSteelController();

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/ram.png";
}
