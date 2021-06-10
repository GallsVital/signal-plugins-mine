export function Name() { return "ASUS Gladius II Wireless"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return 0x18A0; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3] }
export function DefaultPosition() {return [180,100]; }
export function DefaultScale(){return 8.0}
export function ControllableParameters(){
    return [
        {"property":"shutdownColor", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"},
       
    ];
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    var colors = [];
    colors[0] = parseInt(result[1], 16);
    colors[1] = parseInt(result[2], 16);
    colors[2] = parseInt(result[3], 16);

    return colors;
  }

export function Initialize()
{
    //Direct mode init?
//  51 2C 02 00 19 64 00 FF FF 00 00 00 00 00 00 00 00 00 70 05 FE FF FF FF F4 D9 8D 01 52 04 D4 75 7C 2A 50 77 90 E1 D4 75 98 06 00 00 00 00
// 00 00 1C DA 8D 01 96 CC 8B 70 98 06 00 00 A6 CC 8B 70 
}



export function Shutdown()
{
// revert to rainbow mode
//sendPacketString("00 51 2C 04 00 48 64 00 00 02 07 0E F5 00 FF 1D 00 06 FF 2B 00 FA FF 39 01 FF 00 48 FF F6 00 56 FF 78 07 64 FF 00 0D",65);
//sendPacketString("00 50 55",65);
}


var vKeyNames = [
     "Scroll Wheel", "Logo"

];

// This array must be the same length as vKeys[], and represents the pixel color position in our pixel matrix that we reference.  For example,
// item at index 3 [9,0] represents the corsair logo, and the render routine will grab its color from [9,0].
var vKeyPositions = [
    [1,2], [1,0],
];

export function LedNames()
{
    return vKeyNames;
}

export function LedPositions()
{
    return vKeyPositions;
}

export function Render()
{       
    sendColors(0);
    sendColors(1);
    device.pause(20)
}
function sendColors(zone, shutdown = false){

    var packet = [];
    packet[0] = 0x00;
    packet[1] = 0x51;
    packet[2] = 0x28;
    packet[3] = zone;
    packet[4] = 0x00;
    packet[5] = 0x00;
    packet[6] = 0x04;

        var iPxX = vKeyPositions[zone][0];
        var iPxY = vKeyPositions[zone][1];
        var col;
        if(shutdown){
            col = hexToRgb(shutdownColor)
        }else if (LightingMode == "Forced") {
            col = hexToRgb(forcedColor)
        }else{
            col = device.color(iPxX, iPxY);
        }           
        packet[7] = col[0];
        packet[8] = col[1];
        packet[9] = col[2];

        device.write(packet,65);
}
function sendMouseSettings(){
    savedDpi1 = dpi1;
    savedDpi2 = dpi2;
    savedDpi3 = dpi3;
    savedDpi4 = dpi4;
    savedAngleSnapping = angleSnapping;
    savedPollingRate = pollingDict[mousePolling];
    savedMouseResponse = responseDict[mouseResponse];

    sendPacketString(`00 51 31 06 00 ${savedAngleSnapping ? "01" : "00"}`,65);
    sendPacketString(`00 51 31 04 00 ${savedPollingRate.toString(16)}`,65);
    sendPacketString(`00 51 31 05 00 ${savedMouseResponse.toString(16)}`,65);
    sendPacketString(`00 51 31 00 00 ${(savedDpi1/100 + 1).toString(16)}`,65);
    sendPacketString(`00 51 31 01 00 ${(savedDpi2/100 + 1).toString(16)}`,65);
    sendPacketString(`00 51 31 02 00 ${(savedDpi3/100 + 1).toString(16)}`,65);
    sendPacketString(`00 51 31 03 00 ${(savedDpi4/100 + 1).toString(16)}`,65);
    sendPacketString(`00 50 03 03`,65);

}

export function Validate(endpoint)
{
    return endpoint.interface === 2// && endpoint.usage === 6;
}

function sendPacketString(string, size){

    var packet= [];
    var data = string.split(' ');
    
    for(let i = 0; i < data.length; i++){
        packet[i] =parseInt(data[i],16)//.toString(16)
    }

    device.write(packet, size);
}

// export function Image()
// {
// }