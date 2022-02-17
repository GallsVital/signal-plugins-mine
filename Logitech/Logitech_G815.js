export function Name() { return "Logitech G815 Lightsync"; }
export function VendorId() { return 0x046d; }
export function ProductId() { return 0xc33f; }
export function Publisher() { return "WhirlwindFX"; } // Fixed by FreeBlack 

/* Changelog: (09/12/2021)
* Fixed the keymapping to reflect G815
* Corrected the obsolete 64 Byte communication protocol (taken from the G810) to the correct 20 Byte communication protocol for the G815
* Corrected the coloring and applying Hexcodes to reflect the G815 communication protocol
* Unified the color rendering function, now all led colors are rendered in one function (unfortunately will be harder to recycle on other devices...)
* Updated the device image
*/

export function Size() { return [22, 7]; }
export function DefaultPosition(){return [10,100]}
const DESIRED_HEIGHT = 85;
export function DefaultScale(){return Math.floor(DESIRED_HEIGHT/Size()[1])}
export function ControllableParameters(){
    return [
        {"property":"shutdownColor", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"},

    ];
}

var vLedNames = [
    
    "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",         "Print Screen", "Scroll Lock", "Pause Break",   
    "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",                        "Insert", "Home", "Page Up",       "NumLock", "Num /", "Num *", "Num -", 
    "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",                               "Del", "End", "Page Down",         "Num 7", "Num 8", "Num 9", "Num +",   
    "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'","ISO_/", "Enter",                                                              "Num 4", "Num 5", "Num 6",             
    "Left Shift", "ISO_Y","Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",                                  "Up Arrow",               "Num 1", "Num 2", "Num 3", "Num Enter",
    "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",  "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .",                     
	"G1","G2","G3","G4","G5","G logo", "Brightness", "Previous", "Play" ,"Next", "Mute"
];

var vKeymap = [ 
     
    0x29,   0x3A, 0x3B, 0x3C, 0x3D,   0x3E, 0x3F, 0x40, 0x41,   0x42, 0x43, 0x44, 0x45,      0x46, 0x47, 0x48,
    0x35, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x2D, 0x2E, 0x2A,      0x49, 0x4A, 0x4B,    0x53, 0x54, 0x55, 0x56,
    0x2B, 0x14, 0x1A, 0x08, 0x15, 0x17, 0x1C, 0x18, 0x0C, 0x12, 0x13, 0x2F, 0x30, 0x31,      0x4C, 0x4D, 0x4E,    0x5F, 0x60, 0x61, 0x57,
    0x39,   0x04, 0x16, 0x07, 0x09, 0x0A, 0x0B, 0x0D, 0x0E, 0x0F, 0x33, 0x34, 0x32, 0x28,                           0x5C, 0x5D, 0x5E,
    0x6C,  0x64,  0x1D, 0x1B, 0x06, 0x19, 0x05, 0x11, 0x10, 0x36, 0x37, 0x38,       0x70,            0x52,          0x59, 0x5A, 0x5B, 0x58,
    0x6B, 0x6E, 0x6D,                 0x2C,                  0x71, 0x72, 0x65,    0x6F,      0x50, 0x51, 0x4F,    0x62, 0x63,
	0xB7, 0xB8, 0xB9, 0xBA, 0xBB, 0xD5, 0x9C, 0xA1, 0x9E, 0xA0, 0x9F

];

var vLedPositions = [
    
    [1,1], [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1], [13,1],           [15,1], [16,1], [17,1],        
    [1,2], [2,2], [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2], [13,2], [14,2],   [15,2], [16,2], [17,2],   [18,2], [19,2], [20,2], [21,2], 
    [1,3], [2,3], [3,3], [4,3], [5,3], [6,3], [7,3], [8,3], [9,3], [10,3], [11,3], [12,3], [13,3], [14,3],   [15,3], [16,3], [17,3],   [18,3], [19,3], [20,3], [21,3], 
    [1,4], [2,4], [3,4], [4,4], [5,4], [6,4], [7,4], [8,4], [9,4], [10,4], [11,4], [12,4], [13,4], [14,4],                             [18,4], [19,4], [20,4], 
    [1,5], [2,5], [2,5], [3,5], [4,5], [5,5], [6,5], [7,5], [8,5], [9,5], [10,5],  [11,5],         [14,5],           [16,5],           [18,5], [19,5], [20,5], [21,5], 
    [1,6], [2,6], [3,6],                      [7,6],                       [11,6], [12,6], [13,6], [14,6],   [15,6], [16,6], [17,6],   [18,6], [19,6],
    [0,2],[0,3],[0,4],[0,5],[0,6], [0,0],[7,0],[18,1],[19,1],[20,1],[21,1]

];
    
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


export function Initialize()
{

}




export function Apply()
{
    var commit = [];
    
    commit[0] = 0x11;
    commit[1] = 0xFF;
    commit[2] = 0x10;
    commit[3] = 0x7E;

    device.set_endpoint(1, 0x0602, 0xff43); // System IF    
    device.write(commit, 4); 

/* 
    commit[0] = 0x11;
    commit[1] = 0xFF;
    commit[2] = 0x08;
    commit[3] = 0x3E;

 
    device.write(commit, 4); 
	
	commit[0] = 0x11;
    commit[1] = 0xFF;
    commit[2] = 0x08;
    commit[3] = 0x1E;

 
    device.write(commit, 4);  */
	
}



function SendAllPackets(shutdown = false)
{
	
    for(var iIdx = 0; iIdx < 117; iIdx=iIdx + 4){
		
		var packet = []; // Initialize an empty packet
		
		
		
		packet[0] = 0x11; // Message header
		packet[1] = 0xFF; // Message header
		packet[2] = 0x10; // Telling the device we are sending RGB control related packets
		packet[3] = 0x1F; // different led-colors (1F) or unique color on all leds respectively (6F)
		
		// Both modes are limited by the 20-Byte standard USB packet size.
		// There is a mode for sending up to 64 bytes, but it was basically borrowed from the G810. It works perfectly on normal keys, but it fails on all the keys where G815 and G810 are different (Media, GKeys, Logo, Brightness)
		// Using the 20 Bytes, 1F mode can set up to 4 leds to 4 different colors, 6F mode only takes one color info and applies it to up to 13 keys (which is not very useful for our purpose here)
		
		for(var index = 0; index < 4 && index+iIdx < vKeymap.length ;index++){
					let keyNumber = index+iIdx;
					var iKeyPosX = vLedPositions[keyNumber][0];
					var iKeyPosY = vLedPositions[keyNumber][1];
					
					var color;
					if(shutdown){
						color = hexToRgb(shutdownColor)
					}else if (LightingMode == "Forced") {
						color = hexToRgb(forcedColor)
					}else{
						color = device.color(iKeyPosX, iKeyPosY);
					}
					
            packet[4 + index*4] = vKeymap[keyNumber]-3; // The core keyboard keys are all part of zone (-0x03), meaning their keycodes were offset by 3 in the keymap. Out of laziness, I adjusted the rest of the keys to also be offset by 3 rather than putting all true values in the keymap and removing the (-3)
            packet[5 + index*4] = color[0];
            packet[6 + index*4] = color[1];
            packet[7 + index*4] = color[2];
		}		
		
		




		device.set_endpoint(1, 0x0602, 0xff43); // System IF    
		device.write(packet, 20);  
		
	}	
	

}


export function Render()
{    

	SendAllPackets();
	Apply();
}


export function Shutdown()
{
   	SendAllPackets(true);
    Apply();
}


export function Validate(endpoint)
{    
    return (endpoint.interface === 1 && endpoint.usage === 0x0602) ||
           (endpoint.interface === 1 && endpoint.usage === 0x0604);
}

export function Image()
{