export function Name() { return "Asus Aura Terminal"; }
export function VendorId() { return 0x0b05; }
export function ProductId() { return 0x1889; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [5, 1]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

const vLedNames = [ "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Logo" ];
const vLedPositions = [ [0,0], [1,0], [2,0], [3,0], [4,0] ];

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

function sendZone(zone, shutdown = false) 
{
	let packet = [];
	//packet[0] = 0x00;
	packet[0] = 0xec;
	packet[1] = 0x3b;
	packet[2] = zone;
	packet[3] = 0x00;
    packet[4] = 0x01;//Might be number of zones flag


    var iX = vLedPositions[zone][0];
    var iY = vLedPositions[zone][1];
    var color;
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
        color = device.color(iX, iY);
    }
    packet[5] = color[0];
    packet[6] = color[1];
	packet[7] = color[2];


	device.write(packet, 65);
	device.pause(5);
}

export function Render() 
{
    sendZone(0);
	sendZone(1);
    sendZone(2);
    sendZone(3);
    sendZone(4);
}

export function Shutdown() 
{
    sendZone(0, true);
    sendZone(1, true);
    sendZone(2, true);
    sendZone(3, true);
    sendZone(4, true);
}

export function Validate(endpoint) 
{
	return endpoint.interface === -1;
}

function hexToRgb(hex) 
{
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	let colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Image() {
	return "";
}