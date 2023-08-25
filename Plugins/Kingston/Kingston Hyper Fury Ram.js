/// <reference path="./Kingston_Hyper_Fury_Ram.d.ts" />
// Modifying SMBUS Plugins is -DANGEROUS- and can -DESTROY- devices.
export function Name() { return "Kingston Hyper Fury Ram"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting"; }
export function Type() { return "SMBUS"; }
export function Size() { return [2, 12]; }
export function DefaultPosition(){return [150, 40];}
export function DefaultScale(){return 10.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
highSpeedMode:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"highSpeedMode", "group":"lighting", "label":"Single Color Mode (Higher Speed)", "type":"boolean", "default":"false"},
	];
}

/** @type {LedPosition[]} */
const vPerLEDLedPositions = [ [0, 11], [0, 10], [0, 9], [0, 8], [0, 7], [0, 6], [0, 5], [0, 4], [0, 3], [0, 2], [0, 1], [0, 0] ];
const vPerLEDLedNames = ["Led 12", "Led 11", "Led 10", "Led 9", "Led 8", "Led 7", "Led 6", "Led 5", "Led 4", "Led 3", "Led 2", "Led 1"];

/** @type {LedPosition[]} */
const vSingleLEDPosition = [ [0, 5] ];
const vSingleLEDName = [ "Main LED" ];

let vLedNames = vPerLEDLedNames;
let vLedPositions = vPerLEDLedPositions;

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	SetMode();
	setLEDs();

	if(!highSpeedMode) {
		SendColors(false, true);
	}
}

export function Render() {
	if(highSpeedMode) {
		sendSingleColor();
	} else {
		SendColors();
		device.pause(10);
	}

}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		if(highSpeedMode) {
			sendSingleColor("#000000");
		} else {
			SendColors("#000000");
		}
	}else{
		if(highSpeedMode) {
			sendSingleColor(shutdownColor);
		} else {
			SendColors(shutdownColor);
		}
	}

}

export function onhighSpeedModeChanged() {
	setLEDs();

	if(!highSpeedMode) {
		SendColors(false, true);
	}
}

export function Scan(bus) {

	const PossibleAddresses = [0x60, 0x61, 0x62, 0x63];
	const FoundAddresses = [];

  	for (const addr of PossibleAddresses) {
	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsSystemBus()) {
		  continue;
	  }

	  const validAddress = bus.WriteQuick(addr);

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

function setLEDs() {
	if(highSpeedMode) {
		vLedNames = vSingleLEDName;
		vLedPositions = vSingleLEDPosition;
	} else {
		vLedNames = vPerLEDLedNames;
		vLedPositions = vPerLEDLedPositions;
	}

	device.setControllableLeds(vLedNames, vLedPositions);
}

const addressDict = {
	0x60 : 0x50,
	0x61 : 0x51,
	0x62 : 0x52,
	0x63 : 0x53
};

function CheckForHyperFuryRam(bus, addr) {
	if(!addressDict.hasOwnProperty(addr)){
		return false;
	}

	const SubAddress = addressDict[addr];

	const iRet1 = bus.ReadByte(SubAddress, 0x00);
	bus.log(`Address [${SubAddress}], Reg 00: ${iRet1}`, {toFile: true});

	const iRet2 = bus.ReadByte(SubAddress, 0x80);
	bus.log(`Address [${SubAddress}], Reg 80: ${iRet2}`, {toFile: true});


	bus.WriteByte(addr, 0x08, 0x53);

	const nameReturnBytes = [];

	for(let bytesToRead = 0; bytesToRead < 4; bytesToRead++) {
		const returnByte = BinaryUtils.WriteInt16LittleEndian(bus.ReadWord(addr, bytesToRead+1));
		bus.log(`Return Byte ${bytesToRead} returned ${returnByte[1]}`, {toFile : true});
		nameReturnBytes.push(returnByte[1]);
	}

	bus.log(`Fury Identifier Return: ${nameReturnBytes}`, {toFile : true});

	const deviceCheck = String.fromCharCode(...nameReturnBytes).includes("FURY");

	bus.log(`Return Contains FURY String: ${deviceCheck}`, {toFile : true});

	const modelByte = BinaryUtils.WriteInt16LittleEndian(bus.ReadWord(addr, 0x06))[1]; //byte 0 is 0x5A header.
	bus.log(`Model Byte: ${modelByte}`, {toFile : true});

	bus.WriteByte(addr, 0x08, 0x44);

	return iRet1 === 81 && iRet2 > 0 && deviceCheck;
}

function SetMode(){
	bus.WriteByte(0x08, 0x53); //start Command
	bus.WriteByte(0x0b, 0x00); //LED index
	bus.WriteByte(0x09, 0x10); //Mode set to direct

	bus.WriteByte(0x0C, 0x01); //Effect Direction. Why does this even need set when we're in direct mode??!?!?!
	bus.WriteByte(0x20, 0x50); //Brightness, why does this get set to 0x50/80?

	bus.WriteByte(0x08, 0x44); //End Command
}


function SendColors(overrideColor, firstRun = false){
	const RGBData = [];

	//Fetch Colors
	for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++){
 		let Color;

		if(overrideColor){
			Color = hexToRgb(overrideColor);
		}else if(LightingMode === "Forced") {
			Color = hexToRgb(forcedColor);
		} else {
			Color = device.color(vLedPositions[iIdx][0], vLedPositions[iIdx][1]);
		}

		RGBData.push(...Color);
 	}

	WriteRGBData(RGBData, firstRun);
}


let lastRGBData = [];

function sendSingleColor(overrideColor) {

	let Color;

	if(overrideColor){
		Color = hexToRgb(overrideColor);
	}else if(LightingMode === "Forced") {
		Color = hexToRgb(forcedColor);
	} else {
		Color = device.color(vSingleLEDPosition[0][0], vSingleLEDPosition[0][1]);
	}

	if(!CompareArrays(lastRGBData, Color)) {
		bus.WriteByte(0x08, 0x53);
		device.pause(1);
		bus.WriteByte(0x09, 0x00);
		device.pause(1);
		bus.WriteByte(0x30, 0x01);
		device.pause(1);

		for(let bytes = 0; bytes < 3; bytes++) {
			bus.WriteByte(0x31+bytes, Color[bytes]);
			device.pause(1);
		}

		bus.WriteByte(0x08, 0x44); // End Command
		device.pause(1);
		lastRGBData = Color;
	}

}

const OldRGBData = [];

function WriteRGBData(RGBData, firstRun){
	bus.WriteByte(0x08, 0x53);
	device.pause(3);

	if(firstRun) {
		bus.WriteByte(0x0b, 0x00);
		bus.WriteByte(0x09, 0x10);
	}

	for(let i = 0; i < RGBData.length; i++){
		if(RGBData[i] !== OldRGBData[i]){
			let returnCode = bus.WriteByte(0x50 + i, RGBData[i]);

			let retryCount = 4;

			while(returnCode !== 0 && retryCount > 0){
				retryCount -= 1;
				device.pause(3);
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
	device.pause(3);
}


function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl(){
	return "https://marketplace.signalrgb.com/devices/brands/kingston/ram/fury-ddr5.png";
}

function CompareArrays(array1, array2) {
	return array1.length === array2.length &&
	array1.every(function(value, index) { return value === array2[index];});
}

class BinaryUtils {
	static WriteInt16LittleEndian(value) {
		return [value & 0xFF, (value >> 8) & 0xFF];
	}
	static WriteInt16BigEndian(value) {
		return this.WriteInt16LittleEndian(value).reverse();
	}
	static ReadInt16LittleEndian(array) {
		return (array[0] & 0xFF) | (array[1] & 0xFF) << 8;
	}
	static ReadInt16BigEndian(array) {
		return this.ReadInt16LittleEndian(array.slice(0, 2).reverse());
	}
	static ReadInt32LittleEndian(array) {
		return (array[0] & 0xFF) | ((array[1] << 8) & 0xFF00) | ((array[2] << 16) & 0xFF0000) | ((array[3] << 24) & 0xFF000000);
	}
	static ReadInt32BigEndian(array) {
		if (array.length < 4) {
			array.push(...new Array(4 - array.length).fill(0));
		}

		return this.ReadInt32LittleEndian(array.slice(0, 4).reverse());
	}
	static WriteInt32LittleEndian(value) {
		return [value & 0xFF, ((value >> 8) & 0xFF), ((value >> 16) & 0xFF), ((value >> 24) & 0xFF)];
	}
	static WriteInt32BigEndian(value) {
		return this.WriteInt32LittleEndian(value).reverse();
	}
}