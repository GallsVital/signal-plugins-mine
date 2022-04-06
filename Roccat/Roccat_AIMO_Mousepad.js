export function Name() { return "Roccat AIMO Pad"; }
export function VendorId() { return 0x1e7d; }
export function ProductId() { return 0x343A; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [2, 2]; }
export function DefaultPosition() {return [75,70]; }
export function DefaultScale() {return 8.0; }
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

function sendPacketString(string, size){
    var packet= [];
    var data = string.split(' ');
    
    for(let i = 0; i < data.length; i++){
        packet[parseInt(i,16)] =parseInt(data[i],16)//.toString(16)
    }

}

export function Initialize()
{
    //device.set_endpoint(1,0,0xb)
    sendReportString("01 FF 00 00 00",5)
    //sendReportString("03 FF FF FF FF FF FF FF",9)

}


export function Shutdown()
{
    //device.set_endpoint(1,0,0xb)

    sendReportString("01 00 00 00 00",5)

}

// This is an array of key indexes for setting colors in our render array, indexed left to right, row top to bottom.
 var vKeys = [  
    
   0,1
 ];



// This array must be the same length as vKeys[], and represents the pixel color position in our pixel matrix that we reference.  For example,
// item at index 3 [9,0] represents the corsair logo, and the render routine will grab its color from [9,0].
var vKeyPositions = [
    [0,0],[1,0]            
];
var vKeyNames = [
    "Left Led", "Right Led",
];

export function LedNames()
{
    return vKeyNames;
}

export function LedPositions()
{
    return vKeyPositions;
}

function sendReportString(string, size){
    var packet= [];
    var data = string.split(' ');
    
    for(let i = 0; i < data.length; i++){
        packet[i] =parseInt(data[i],16)//.toString(16)
    }

    device.send_report(packet, size);
}

export function Render()
{       
    sendColors();
}
function sendColors(shutdown = false){
    
    //device.set_endpoint(3,0,1)

    var packet = [];
    packet[0x00]   = 0x03;
    packet[0x01]   = 0x03;


    for(var iIdx = 0; iIdx < vKeys.length; iIdx++)
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
        packet[iIdx*4 + 1] = col[0];
        packet[iIdx*4 + 2] = col[1];
        packet[iIdx*4 + 3] = col[2];
        packet[iIdx*4 + 4] = 0xFF;
    }

     device.send_report(packet,9);



}

export function Validate(endpoint)
{
    return endpoint.interface ===  0 && endpoint.usage_page === 0xff01;
}


// export function Image()
// {
// }