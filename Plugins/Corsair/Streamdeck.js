/* eslint-disable brace-style */
export function Name() { return "Elgato Streamdeck"; }
export function VendorId() { return 0x0fd9; }
export function ProductId() { return 0x006d; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [5, 3]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"buttontimeout", "group":"", "label":"Button Press Timeout", "step":"1", "type":"number", "min":"1", "max":"50", "default":"5"},
		{"property":"brightness", "group":"", "label":"Screen Brightness", "step":"1", "type":"number", "min":"1", "max":"100", "default":"50"},
	];
}

var vLedNames = [ "LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10", "LED 11", "LED 12", "LED 13", "LED 14", "LED 15" ];
var vLedPositions = 
[ 
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], 
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], 
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2] 
];

export function LedNames()
{
	return vLedNames;
}

export function LedPositions()
{
	return vLedPositions;
}

export function Initialize()
{
	
}

export function Render()
{
	colorgrabber();
}

export function onbrightnessChanged()
{
	setBrightness();
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
    for(let iIdx = 0; iIdx < 15; iIdx++)
    {

    let rgbdata = [];
    let iPxX = vLedPositions[iIdx][0];
    let iPxY = vLedPositions[iIdx][1];
    let color;
    let finalpacket = 0;

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

    rgbdata = device.ConvertColorToJPEG(buttoncolor);

    for(var packetssent = 0; packetssent * 1016 < rgbdata.length; packetssent++)
        {
        let packetRGBDataLength = Math.min(1016, rgbdata.length)

        finalpacket = (packetRGBDataLength < 1016)
        let data = rgbdata.splice(0, packetRGBDataLength )

        sendZone(iIdx, packetRGBDataLength, data, finalpacket);
        }
    }
}


function sendZone(iIdx, length, rgbdata, finalpacket)
{
    let packet = [];
    packet[0] = 0x02;
    packet[1] = 0x07;
    packet[2] = iIdx;
    packet[3] = finalpacket ? 1 : 0
    packet[4] = (length >> 8 & 0xFF)
    packet[5] = (length & 0xFF)
    packet[6] = 0x00;
    packet[7] = 0x00;
    
    packet = packet.concat(rgbdata.splice(0,1016));

    device.write(packet, 1024);
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