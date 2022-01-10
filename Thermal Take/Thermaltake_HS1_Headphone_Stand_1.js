export function Name() { return "ThermalTake Argent HS1 Headphone Stand"; }
export function VendorId() { return 0x264A; }
export function ProductId() { return 0x8022; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [7, 11]; }
export function DefaultPosition(){return [240,120]}
export function DefaultScale(){return 8.0}
export function ControllableParameters(){
    return [
        {"property":"shutdownColor", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"},
    ];
}
var vKeymap = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ,12, 13, 14, 15, 16, 17, 18, 19 ];
var vLedNames = [ "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Logo Left", "Zone 10", "Zone 11", "Logo Right", "Zone 13", "Zone 14", "Zone 15", "Zone 16", "Zone 17", "Zone 18", "Zone 19", "Zone 20" ];
var vLedPositions = [ [3,1],[3,2],[2,3],[2,4],[1,5],[1,6],[1,7],[1,8],[2,9],[3,10],[4,10],[5,9],[6,8],[6,7],[6,6],[5,5],[5,4],[5,3],[4,2],[4,1] ];

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
    SendPacket(0, 15);
	SendPacket(0x0f, 5);
}

export function Shutdown()
{
    SendPacket(0, 15, true);
	SendPacket(0x0f, 5, true);
}
var ColorPacket = [0x00, 0xC0, 0x01]
function SendPacket(startIdx, count, shutdown = false)
{

    ColorPacket[3] = count;

    for(var iIdx = 0; iIdx < count; iIdx++){
        var iLedIdx = (iIdx * 4) + 5;
        var iKeyIdx = startIdx + iIdx;
        var iKeyPosX = vLedPositions[iKeyIdx][0];
        var iKeyPosY = vLedPositions[iKeyIdx][1];
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
            color = device.color(iKeyPosX, iKeyPosY);
        }        
        ColorPacket[iLedIdx] = vKeymap[iKeyIdx];
        ColorPacket[iLedIdx+1] = color[0];
        ColorPacket[iLedIdx+2] = color[1];
        ColorPacket[iLedIdx+3] = color[2];        
    }
	//device.log(ColorPacket, {toFile: true})
    device.write(ColorPacket, 65);
	device.pause(1);
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