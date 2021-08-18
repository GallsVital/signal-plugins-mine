export function Name() { return "AMD Wraith Prism"; }
export function VendorId() { return 0x2516; }
export function ProductId() { return 0x0051; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }
export function DefaultPosition(){return [50,100]}
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
    sendPacketString("00 41 80",65)
    SendChannelSetup();
}


export function Shutdown()
{
    sendColors(true);
    sendPacketString("00 41 00",65)
}


var vZones = [
5,0,6
];

var vKeyNames = [
    "Logo","Ring", "Fan",
];
var vKeyPositions = [
    [0,0], [1,1],[2,2],
];

function sendPacketString(string, size){

    var packet= [];
    var data = string.split(' ');
    
    for(let i = 0; i < data.length; i++){
        packet[i] = parseInt (data[i],16)//.toString(16)
    }

    device.write(packet, size);
}
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
    sendColors();
}
function sendColors(shutdown = false){

    for(var iIdx = 0; iIdx < vZones.length; iIdx++)
    {
        var iPxX = vKeyPositions[iIdx][0];
        var iPxY = vKeyPositions[iIdx][1];
        var col;
        if(shutdown){
            col = hexToRgb(shutdownColor)
        }else if (LightingMode == "Forced") {
            col = hexToRgb(forcedColor)
        }else{
            col = device.color(iPxX, iPxY);
        }           
        sendColorPacket(vZones[iIdx],col);
    }
    sendPacketString("00 51 28 00 00 E0",65)
}

var ColorPacket = [
0x00, 0x51, 0x2C, 0x01, 0x00, 0x05, 0xFF, 0x00, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
]

function sendColorPacket(zone,data){
    ColorPacket[5] = zone;
    ColorPacket[11] = data[0];
    ColorPacket[12] = data[1];
    ColorPacket[13] = data[2];

    device.write(ColorPacket,65);
    //device.read(packet,64);
}

var ChannelPacket = [
    0x00, 0x51, 0xA0, 0x01, 0x00,
    0x00, 0x03, 0x00, 0x00,
    0x05, 0x06, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00
]
function SendChannelSetup(){
    device.write(ChannelPacket,65);
}
export function Validate(endpoint)
{
    return endpoint.interface === 1;
}


// export function Image()
// {
// }