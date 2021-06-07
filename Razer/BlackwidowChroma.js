export function Name() { return "Razer Blackwidow Chroma"; }
export function VendorId() { return 0x1532; }
export function ProductId() { return 0x0203; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [22, 6]; }
export function Type() { return "Hid"; }
export function DefaultPosition() {return [75,70]; }
export function DefaultScale(){return 8.0}
export function ControllableParameters(){
    return [
        {"property":"shutdownColor", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"},
    ];
}
var vLedNames = [
    "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",   
    "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -",  //21
    "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",    //21
    "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",                                                              "Num 4", "Num 5", "Num 6",             //16
    "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter",//17
    "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num ."                       //13
];

var vLedPositions = [
    [0,0], [1,0], [2,0], [3,0], [4,0], [5,0], [6,0], [7,0], [8,0], [9,0], [10,0], [11,0], [12,0],           [14,0], [15,0], [16,0],            //20
    [0,1], [1,1], [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1], [13,1],   [14,1], [15,1], [16,1],   [17,1], [18,1], [19,1], [20,1], //21
    [0,2], [1,2], [2,2], [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2], [13,2],   [14,2], [15,2], [16,2],   [17,2], [18,2], [19,2], [20,2], //20
    [0,3], [1,3], [2,3], [3,3], [4,3], [5,3], [6,3], [7,3], [8,3], [9,3], [10,3], [11,3],         [13,3],                             [17,3], [18,3], [19,3], // 17
    [0,4], [1,4], [2,4], [3,4], [4,4], [5,4], [6,4], [7,4], [8,4], [9,4], [10,4],                 [13,4],           [15,4],           [17,4], [18,4], [19,4], [20,4], // 17
    [0,5], [1,5], [2,5],                      [6,5],                      [10,5], [11,5], [12,5], [13,5],   [14,5], [15,5], [16,5],   [17,5], [19,5] // 13
];

function GetReport(cmd_class, cmd_id, size)
{
    var report = new Array(91).fill(0);

    report[0] = 0;

    // Status.
    report[1] = 0x00;

    // Transaction ID.
    report[2] = 0xFF;
    
    // Remaining packets.
    report[3] = 0x00;
    report[4] = 0x00;

    // Protocol type.
    report[5] = 0x00;

    // Data size.
    report[6] = size;

    // Command class.
    report[7] = cmd_class;

    // Command id.
    report[8] = cmd_id;

    //report[8-87] = data;

    //report[89] = crc;

    //report[89] = reserved;

    return report;
}


function CalculateCrc(report)
{
    var iCrc = 0;

    for (var iIdx = 3; iIdx < 89; iIdx++) {
        iCrc ^= report[iIdx];
    }

    return iCrc;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    var colors = [];
    colors[0] = parseInt(result[1], 16);
    colors[1] = parseInt(result[2], 16);
    colors[2] = parseInt(result[3], 16);

    return colors;
  }
export function LedNames()
{
  return vLedNames;
}

export function LedPositions()
{
  return vLedPositions;
}

function EnableSoftwareControl()
{    
    var report = GetReport(0x0F, 0x03, 0x47);
   // 0x03, 0x0B, 0x46

    report[2] = 0x3F; // transaction id.

    report[11] = 0; // row index.

    report[13] = 15; // led count.

    report[89] = CalculateCrc(report);

    
    device.send_report(report, 91);    
}


function ReturnToHardwareControl()
{

}


export function Initialize()
{      
    
}


function SendPacket(idx,shutdown = false)
{
    var packet = new Array(91).fill(0);
    packet[0] = 0x00;
    packet[1] = 0x00;
    packet[2] = 0xFF;
    packet[3] = 0x00;
    packet[4] = 0x00;
    packet[5] = 0x00;
    packet[6] = 0x46;
    packet[7] = 0x03;
    packet[8] = 0x0B;
    packet[9] = 0xFF;
    packet[10] = idx;
    packet[12] = 0x15;

    
    for(var iIdx = 0; iIdx < 22; iIdx++){
        var col;
        if(shutdown){
            col = hexToRgb(shutdownColor)
        }else if (LightingMode == "Forced") {
            col = hexToRgb(forcedColor)
        }else{
            col = device.color(iIdx, idx);
        }        
        var iLedIdx = (iIdx*3) + 13;
        packet[iLedIdx] = col[0]; //0; //0xF7;
        packet[iLedIdx+1] = col[1]; //0;
        packet[iLedIdx+2] = col[2]; //255;
    }

    packet[89] = CalculateCrc(packet);
    device.send_report(packet, 91);    
    device.pause(1); // We need a pause here (between packets), otherwise the ornata can't keep up.
}


function Apply()
{
    var packet = new Array(91).fill(0);
    packet[0] = 0x00;
    packet[1] = 0x00;
    packet[2] = 0xFF;
    packet[3] = 0x00;
    packet[4] = 0x00;
    packet[5] = 0x00;
    packet[6] = 0x02;
    packet[7] = 0x03;
    packet[8] = 0x0A;
    packet[9] = 0x05;
    packet[10] = 0x01;
        
    packet[89] = CalculateCrc(packet);

    device.send_report(packet, 91);
}


export function Render()
{                
    SendPacket(0);   
    SendPacket(1);  
    SendPacket(2);
    SendPacket(3);    
    SendPacket(4);   
    SendPacket(5);          
    Apply();        
}


export function Shutdown()
{
    SendPacket(0,true);   
    SendPacket(1,true);  
    SendPacket(2,true);
    SendPacket(3,true);    
    SendPacket(4,true);   
    SendPacket(5,true);          
    Apply(); 
}


export function Validate(endpoint)
{
    return endpoint.interface === 2;
}


// export function Image()
// {
// }