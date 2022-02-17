export function Name() { return "ThermalTake Argent Mouse Bungee"; }
export function VendorId() { return 0x264A; }
export function ProductId() { return 0x8020; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [9, 9]; }
export function DefaultPosition(){return [240,120]}
export function DefaultScale(){return 8.0}
export function ControllableParameters(){
    return [
        {"property":"shutdownColor", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"},
    ];
}

var vLedNames = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Zone 10", "Null", "Logo", "Null 2 Electric Boogaloo" ];
var vLedPositions = [ [4,8],[3,7],[2,6],[1,5],[2,4],[3,3],[4,4],[5,5],[6,6],[5,7],[4,7],[4,7],[4,7] ];

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
	var packet = []
    packet[0x01] = 0x41;
    packet[0x02] = 0x03;
	device.write(packet,64);
	
	var packet = []
    packet[0x01] = 0x12;
    packet[0x02] = 0x22;
	device.write(packet,64);
}

export function Render()
{
    sendZone();
}

export function Shutdown()
{

}

function sendZone(shutdown = false)
{
    var packet = []
    packet[0] = 0x00;
    packet[1] = 0xC0;
    packet[2] = 0x01;
    packet[3] = 0x0d;
    packet[4] = 0x00;

    for(var iIdx = 0; iIdx < 13; iIdx++)
	{
     var iPxX = vLedPositions[iIdx][0];
     var iPxY = vLedPositions[iIdx][1];
     var color;
     if(shutdown)
		{
         color = hexToRgb(shutdownColor)
        }
	 else if (LightingMode == "Forced") 
		{
         color = hexToRgb(forcedColor)
        }
	 else
		{
         color = device.color(iPxX, iPxY);
        }

     var iLedIdx = 5 + iIdx *4
     packet[iLedIdx] =  iIdx; 
     packet[iLedIdx+1] = color[0];
     packet[iLedIdx+2] = color[1];
     packet[iLedIdx+3] = color[2];
    }
	
	
    device.write(packet, 65);
}

export function Validate(endpoint)
{
    return endpoint.interface === 1;
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