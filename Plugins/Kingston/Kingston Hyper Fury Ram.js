// Modifying SMBUS Plugins is -DANGEROUS- and can -DESTROY- devices.
export function Name() { return "Kingston Hyper Fury Ram"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting"; }
export function Type() { return "SMBUS"; }
export function Size() { return [2, 12]; }
export function DefaultPosition(){return [150, 40];}
export function DefaultScale(){return 10.0;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/

const vLedNames = ["Led 12", "Led 11", "Led 10", "Led 9", "Led 8", "Led 7", "Led 6", "Led 5", "Led 4", "Led 3", "Led 2", "Led 1"];
const vLedPositions = [
	[0, 11], [0, 10], [0, 9], [0, 8], [0, 7], [0, 6], [0, 5], [0, 4], [0, 3], [0, 2], [0, 1], [0, 0]
];

export function Initialize() {
	SetMode();
}

export function Render() {
	SendColors();
}

export function Shutdown() {
	//SendColors(true);
}
// Address pairs
// 51 -> 49 -> 61?
// 53 -> 4B -> 63?
export function Scan(bus) {

	const PossibleAddresses = [0x60, 0x61, 0x62, 0x63];
	const FoundAddresses = [];

  	for (const addr of PossibleAddresses) {
	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsSystemBus()) {
		  continue;
	  }

	  const validAddress = bus.WriteQuick(addr);
	  //bus.log(`Address: ${addr} returned ${validAddress}`, {toFile: true});

	  // Skip any address that fails a quick write
	  if (validAddress !== 0){
		  continue;
	  }

	  if(CheckForHyperFuryRam(bus, addr)){
			bus.log("Kingston Hyper Fury Ram Found At Address: " + addr, {toFile: true});
			FoundAddresses.push(addr);
	  }
	}

	return FoundAddresses;
}

const AddressPairs = {
	0x60: [0x50, 0x48],
	0x61: [0x51, 0x49],
	0x62: [0x52, 0x4A],
	0x63: [0x53, 0x4B]
};

function CheckForHyperFuryRam(bus, addr){
	if(!AddressPairs.hasOwnProperty(addr)){
		return false;
	}

	const SubAddresses = AddressPairs[addr];

	const iReturn = bus.ReadByte(SubAddresses[0], 0x31); // Value changes every time
	bus.log(`Address [${SubAddresses[0]}], Reg 31: ${iReturn}`, {toFile: true});

	if(iReturn >= 0){
		const iRet1 = bus.ReadByte(SubAddresses[1], 0x21);
		bus.log(`Address [${SubAddresses[1]}], Reg 21: ${iRet1}`, {toFile: true});

		const iRet2 = bus.ReadByte(SubAddresses[1], 0x25);
		bus.log(`Address [${SubAddresses[1]}], Reg 25: ${iRet2}`, {toFile: true});

		const iRet3 = bus.ReadByte(SubAddresses[1], 0x27);
		bus.log(`Address [${SubAddresses[1]}], Reg 27: ${iRet3}`, {toFile: true});

		const ExpectedValues = [120, 130, 180, 200, 220, 240];

		return ExpectedValues.includes(iRet1) && ExpectedValues.includes(iRet2) && ExpectedValues.includes(iRet3);
	}

	return false;

}

function SetMode(){
	bus.WriteByte(0x08, 0x53); // start Command
	bus.WriteByte(0x0b, 0x00);
	bus.WriteByte(0x09, 0x10);
	bus.WriteByte(0x27, 0x02);

	bus.WriteByte(0x0C, 0x01);
	bus.WriteByte(0x18, 0x18);
	bus.WriteByte(0x20, 0x50);

	bus.WriteByte(0x08, 0x44); // End Command
}


function SendColors(shutdown = false){
	const RGBData = [];

	//Fetch Colors
	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++){
 		let Color;

		if(shutdown){
			Color = hexToRgb(shutdownColor);
		}else if(LightingMode === "Forced") {
			Color = hexToRgb(forcedColor);
		} else {
			Color = device.color(vLedPositions[iIdx][0], vLedPositions[iIdx][1]);
		}

		RGBData.push(...Color);
 	}

	WriteRGBData(RGBData);
}

const OldRGBData = [];

function WriteRGBData(RGBData){
	//const start = Date.now();

	bus.WriteByte(0x08, 0x53);
	bus.WriteByte(0x0b, 0x00);
	bus.WriteByte(0x09, 0x10);
	bus.WriteByte(0x27, 0x02);

	for(let i = 0; i < RGBData.length; i++){
		if(RGBData[i] != OldRGBData[i]){
			let returnCode = bus.WriteByte(0x50 + i, RGBData[i]);

			let retryCount = 4;

			while(returnCode != 0 && retryCount > 0){
				retryCount -= 1;
				device.pause(1);
				returnCode = bus.WriteByte(0x50 + i, RGBData[i]);

				if(returnCode === 0){
					OldRGBData[i] = RGBData[i];
				}
			}

			if(returnCode === 0){
				OldRGBData[i] = RGBData[i];
			}else{
				device.log("Failed To Write Byte after within 5 attempts!");
			}
		}
	}

	bus.WriteByte(0x08, 0x44);

	const end = Date.now();
	//device.log(`Frame Took ${end - start}ms!`);
}


function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageResource() {
	return "default/ram";
}