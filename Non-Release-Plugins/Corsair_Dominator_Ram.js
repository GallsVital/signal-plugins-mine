export function Name() { return "Corsair Dominator Ram"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/corsair"; }
export function Type() { return "SMBUS"; }
export function Size() { return [2, 12]; }
export function DefaultPosition(){return [40, 30];}
export function DefaultScale(){return 10.0;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"forceRam", "group":"settings", "label":"Force Ram Model", "type":"boolean", "default":"false"},
		{"property":"forcedRamType", "group":"settings", "label":"Forced Ram Model", "type":"combobox", "values": ["Dominator Platinum", "Vengeance Pro SR", "Vengeance Pro SL"], "default":"Dominator Platinum"}
	];
}

/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
forceRam:readonly
forcedRamType:readonly
*/
asd
let vLedNames = [];
let vLedPositions = [];

export function onforceRamChanged(){
	SetupForcedRamType();
}

export function onforcedRamTypeChanged(){
	SetupForcedRamType();
}

export function Initialize() {
	DetermineRamType();
	SetDeviceSettings();
}

export function Render() {
	SendColors();
}

export function Shutdown() {
	SendColors(true);
}

export function Scan(bus) {

	const PossibleAddresses = [0x58, 0x59, 0x5A, 0x5B, 0x5C, 0x5D, 0x5E, 0x5F];
	let FoundAddresses = [];

  	for (let addr of PossibleAddresses) {
	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsSystemBus()) {
		  continue;
	  }
	  let validAddress = bus.WriteQuick(addr);
	  bus.log(validAddress);

	  // Skip any address that fails a quick write
	  if (validAddress !== 0){
		  continue;
	  }

	  if(CheckForDominatorRam(bus, addr)){
			bus.log("Dominator Ram Found At Address: " + addr);
			FoundAddresses.push(addr);
	  }
	}

	return FoundAddresses;
}

function CheckForDominatorRam(bus, address){
	let vendorByte = bus.ReadByte(address, DominatorProtocol.VendorRegister);
	bus.log(`Address ${address} has Vendor Byte ${vendorByte}`);

	if (vendorByte !== DominatorProtocol.VendorId){
		return false;
	}

	let modelByte = bus.ReadByte(address, DominatorProtocol.ModelRegister);
	bus.log(`Address ${address} has Model Byte ${modelByte}`);

	return DominatorProtocol.ModelIds.includes(modelByte);
}


function DetermineRamType(){
	// This Check only works if all sticks are the same.
	// Mapping individual part numbers to specific sticks ins't supported.
	const RamPartNumber = bus.FetchRamInfo();
	device.log(`Found Ram Part Number: [${RamPartNumber}]`);

	// We only care about the first 3 Characters
	const RamTypeString = RamPartNumber.slice(0, 3);

	if(RamModels[RamTypeString] !== null){
		RamType = RamModels[RamTypeString];
		device.log(`Found Ram Type: [${RamType.name}]`);
	}else{
		device.log(`Invalid Ram Type defaulting to Corsair Dominator`);
	}
}

function SetDeviceSettings(){
	device.setName(RamType.name);
	device.setSize([2, RamType.ledCount]);

	CreateLeds();
}

function CreateLeds(){
	// Bash Old Led Info
	vLedNames = [];
	vLedPositions = [];

	for(let iIdx = 0; iIdx < RamType.ledCount; iIdx++){
		vLedNames.push(`Led ${iIdx + 1}`);
		vLedPositions.push([0, iIdx]);
	}

	// Tell SignalRGB We Changed These.
	device.repollLeds();
}

function SendColors(shutdown = false){

	const packet = Array(38).fill(0);
	packet[0] = 0x0C;

	//Fetch Colors
	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++){
		const PacketOffset = iIdx * 3 + 1;
 		let Color;

		if(shutdown){
			Color = hexToRgb(shutdownColor);
		}else if(LightingMode === "Forced") {
			Color = hexToRgb(forcedColor);
		} else {
			Color = device.color(vLedPositions[iIdx][0], vLedPositions[iIdx][1]);
		}

		packet[PacketOffset] = Color[0];
		packet[PacketOffset + 1] = Color[1];
		packet[PacketOffset + 2] = Color[2];
 	}

	// Calc CRC.
	packet[37] = CalcCRC(packet);

	bus.WriteBlock(0x31, 32, packet.splice(0, 32));
	device.pause(1);
	bus.WriteBlock(0x32, 6, packet);

}

function SetupForcedRamType(){
	if(!forceRam){
		DetermineRamType();
	}else{
		RamType = StringToRamModel[forcedRamType];
	}

	SetDeviceSettings();
}

function CalcCRC(data){
	let iCrc = 0;

	for (let iIdx = 0; iIdx < 37; iIdx++) {
		let iTableIdx = iCrc ^ data[iIdx];
		iCrc = vPecTable[iTableIdx];
	}

	return iCrc;
}

class DominatorRamModel{
	constructor(name, ledCount){
		this.name = name;
		this.ledCount = ledCount;
	}
}

// This Protocol Supports multiple Types of Ram,
// the only difference between them in the Led Count
// We can tell them apart via the ram's WMI Part Number
const RamModels = {
	"CMT" : new DominatorRamModel("Corsair Dominator Platinum RGB", 12),
	"CMH" : new DominatorRamModel("Corsair Vengeance Pro SL", 10),
	"CMG" : new DominatorRamModel("Corsair Vengeance Pro SR", 6),
};

const StringToRamModel = {
	"Dominator Platinum" : RamModels["CMT"],
	"Vengeance Pro SL" : RamModels["CMH"],
	"Vengeance Pro SR" : RamModels["CMG"],
};

let RamType = RamModels["CMT"]; // Default to Dominator Platinum

class CorsairDominatorProtocol{
	constructor(){
		this.VendorRegister = 0x43;
		this.ModelRegister = 0x44;

		this.VendorId = 0x1B;
		this.ModelIds = [0x03, 0x04];

		this.DominatorLedCount = 12;
		this.VeneanceProSLLedCount = 10;
		this.VegeanceProSRLedCount = 6;
	}
}

const DominatorProtocol = new CorsairDominatorProtocol();

const vPecTable = [
	0,   7,   14,  9,   28,  27,  18,  21,  56,  63,  54,  49,  36,  35,  42,  45,  112, 119, 126, 121, 108, 107, 98,  101, 72,  79,
	70,  65,  84,  83,  90,  93,  224, 231, 238, 233, 252, 251, 242, 245, 216, 223, 214, 209, 196, 195, 202, 205, 144, 151, 158, 153,
	140, 139, 130, 133, 168, 175, 166, 161, 180, 179, 186, 189, 199, 192, 201, 206, 219, 220, 213, 210, 255, 248, 241, 246, 227, 228,
	237, 234, 183, 176, 185, 190, 171, 172, 165, 162, 143, 136, 129, 134, 147, 148, 157, 154, 39,  32,  41,  46,  59,  60,  53,  50,
	31,  24,  17,  22,  3,   4,   13,  10,  87,  80,  89,  94,  75,  76,  69,  66,  111, 104, 97,  102, 115, 116, 125, 122, 137, 142,
	135, 128, 149, 146, 155, 156, 177, 182, 191, 184, 173, 170, 163, 164, 249, 254, 247, 240, 229, 226, 235, 236, 193, 198, 207, 200,
	221, 218, 211, 212, 105, 110, 103, 96,  117, 114, 123, 124, 81,  86,  95,  88,  77,  74,  67,  68,  25,  30,  23,  16,  5,   2,
	11,  12,  33,  38,  47,  40,  61,  58,  51,  52,  78,  73,  64,  71,  82,  85,  92,  91,  118, 113, 120, 127, 106, 109, 100, 99,
	62,  57,  48,  55,  34,  37,  44,  43,  6,   1,   8,   15,  26,  29,  20,  19,  174, 169, 160, 167, 178, 181, 188, 187, 150, 145,
	152, 159, 138, 141, 132, 131, 222, 217, 208, 215, 194, 197, 204, 203, 230, 225, 232, 239, 250, 253, 244, 243
];

function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	let colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}