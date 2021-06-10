export function Name() { return "Logitech G733 Headset"; }
export function VendorId() { return 0x046d; }
export function ProductId() { return 0x0AB5;}
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition(){return [240,120]}
export function DefaultScale(){return 8.0}
export function ControllableParameters(){
    return [
        {"property":"shutdownColor", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"sideTone", "label":"Sidetone", "step":"1","type":"number","min":"0", "max":"100","default":"100"},

    ];
}
var savedSidetone;
var vLedNames = ["Bottom Zone", "Logo Zone"];
var vLedPositions = [
    [0,2],[0,1]
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


function Apply()
{

}
function sendZone(zone, shutdown = false){
    var packet = [];
    packet[0x00] = 0x11;
    packet[0x01] = 0xFF;
    packet[0x02] = 0x04;
    packet[0x03] = 0x3E;
    packet[0x04] = zone;
    packet[0x05] = 0x01;

        var iX = vLedPositions[zone][0];
        var iY = vLedPositions[zone][1];
        var color
        var color;
        if(shutdown){
            color = hexToRgb(shutdownColor)
        }else if (LightingMode == "Forced") {
            color = hexToRgb(forcedColor)
        }else{
            color = device.color(iX, iY);
        }
        packet[0x06] = color[0];
        packet[0x07] = color[1];
        packet[0x08] = color[2];
    
    
    packet[0x09] = 0x02;

    device.write(packet, 20);
    device.pause(1);
}

export function Render()
{
    sendZone(0); //bottom
    sendZone(1); //top

    if(sideTone != savedSidetone){
        setSideTone();
    }
} 


export function Shutdown()
{
    sendZone(0,true);
    sendZone(1,true);
    
}
function setSideTone(){
    savedSidetone = sideTone;

    var packet = [];
    packet[0] = 0x11;
    packet[1] = 0xFF;
    packet[2] = 0x07;
    packet[3] = 0x1E;
    packet[5] = savedSidetone
    device.write(packet, 20);
}

function sendPacketString(string, size){
    var packet= [];
    var data = string.split(' ');
    
    for(let i = 0; i < data.length; i++){
        packet[parseInt(i,16)] = parseInt(data[i],16)//.toString(16)
    }

    device.write(packet, size);
}
export function Validate(endpoint)
{    return endpoint.interface === 3 && endpoint.usage === 0x0202 && endpoint.usage_page === 0xff43;
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    var colors = [];
    colors[0] = parseInt(result[1], 16);
    colors[1] = parseInt(result[2], 16);
    colors[2] = parseInt(result[3], 16);

    return colors;
  }

// export function Image()
// {
// }