export function Name() { return "Corsair Elite Cappelix LCD"; }
export function VendorId() { return 0x1b1c; }
export function ProductId() { return 0x0C39; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [10, 10]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

export function Initialize()
{

}

export function Render()
{
	colorgrabber();
}

let vLedNames = [ "Device Wide" ];

let vLedPositions = [ [0, 0] ];

export function LedNames() 
{
	return vLedNames;
}

export function LedPositions() 
{
	return vLedPositions;
}



function makeHexString(ColorArray)
{
    let hexstring = "#";
    hexstring += decimalToHex(ColorArray[0], 2);
    hexstring += decimalToHex(ColorArray[1], 2);
    hexstring += decimalToHex(ColorArray[2], 2);
    return hexstring;
}

function decimalToHex(d, padding) 
{
    let hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
    //return "0x" + hex;
}

function colorgrabber(shutdown=false)
{
	let rgbdata = [];
	let iPxX = vLedPositions[0][0];
	let iPxY = vLedPositions[0][1];
	let color;
	let finalPacket = 0;

	if(shutdown)
	{
		color = hexToRgb(shutdownColor);
	}
	else if (LightingMode == "Forced")
	{
		color = hexToRgb(forcedColor);
	}
	else
	{
		color = device.color(iPxX, iPxY);
	}

	let buttoncolor = makeHexString(color);
	//rgbdata = device.getImageBuffer(0, 0, 9, 9, 72, 72, "JPEG");
	rgbdata = device.ConvertColorToJPEG(buttoncolor);

	for(var packetsSent = 0; packetsSent * 1016 < rgbdata.length; packetsSent++)
	{
	let packetRGBDataLength = Math.min(1016, rgbdata.length)
	if(packetRGBDataLength < 1016)
	{
		finalPacket = 0x01;
	}

		sendZone(packetRGBDataLength, rgbdata, packetsSent, finalPacket);
	}
}

function sendZone(packetRGBDataLength, rgbdata, packetsSent, finalPacket)
{
	let packet = [];
	packet[0] = 0x02;
	packet[1] = 0x05;
	packet[2] = 0x40; 
	packet[3] = finalPacket;
	packet[4] = (packetsSent >> 8 & 0xFF);
	packet[5] = (packetsSent & 0xFF);
	packet[6] = (packetRGBDataLength >> 8 & 0xFF);
	packet[7] = (packetRGBDataLength & 0xFF);
	
    packet = packet.concat(rgbdata.splice(0,1016));

    device.write(packet, 1024);
	device.pause(3);
}

function sendZoneOriginal(firstbyte,secondbyte,rgbdata)
{
	let packet = [];
	packet[0] = 0x02;
	packet[1] = 0x05;
	packet[2] = 0x40;
	packet[3] = 0x01;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = firstbyte;
	packet[7] = secondbyte;
	
    packet = packet.concat(rgbdata.splice(0,1016));

    device.write(packet, 1024);
	device.pause(3);
}

function colorgrabberOriginal(shutdown=false)
{
	let rgbdata = [];
	let iPxX = vKeyPositions[0][0];
	let iPxY = vKeyPositions[0][1];
	let color;

	if(shutdown)
	{
		color = hexToRgb(shutdownColor);
	}
	else if (LightingMode == "Forced")
	{
		color = hexToRgb(forcedColor);
	}
	else
	{
		color = device.color(iPxX, iPxY);
	}

	//let rgbdata = device.getImageBuffer(0, 0, 9, 9, 72, 72, "JPEG");
	let buttoncolor = makeHexString(color);
	rgbdata = device.ConvertColorToJPEG(buttoncolor);
	//device.log(rgbdata.length);

	let RGBLength = rgbdata.length.toString(10);
	let firstbyte = RGBLength[1] + RGBLength[2];
	let secondbyte = RGBLength[0];

	sendZone(firstbyte,secondbyte,rgbdata);
}



export function Validate(endpoint)
{
	return endpoint.interface === -1;
}

function hexToRgb(hex)
{
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	var colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}