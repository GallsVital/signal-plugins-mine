export function Name() { return "Corsair Vengenace Pro Ram"; }
export function Publisher() { return "WhirlwindFX"; }

export function Type() { return "SMBUS"; }

export function Scan(bus) {
  
  var addys = [0x58, 0x59, 0x5A, 0x5B, 0x5C, 0x5D, 0x5E, 0x5F];
  var found = [];
  
  for (var addr of addys) {
    if (bus.IsSystemBus())
    {
      var result = bus.WriteQuick(addr);
      if (result === 0){
        var vendor = bus.ReadByte(addr, 0x43);
        if (vendor === 0x1C){
          var model = bus.ReadByte(addr, 0x44);
          if (model === 0x03 || model === 0x04){
            bus.log("Vengeance pro fram found at: "+addr);
            found.push(addr);
          }
        }
      }
    }
  }

  return found;
}

export function Size() { return [2, 10]; }
export function DefaultPosition(){return [40, 30];}
export function DefaultScale(){return 10.0;}
export function ControllableParameters(){
    return [
        {"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color","min":"0","max":"360","type":"color","default":"009bde"},
        {"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas","Forced"], "default":"Canvas"},
        {"property":"forcedColor", "group":"lighting", "label":"Forced Color","min":"0","max":"360","type":"color","default":"009bde"}
    ];
}
var vLedNames = ["Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10"];
var vLedPositions = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9]];
var iRamVersion = 0;
const ciLedCount = 10;

export function LedNames()
{
    return vLedNames;
}

export function LedPositions()
{
    return vLedPositions;
}

function GetRamVersion()
{
  iRamVersion = bus.ReadByte(0x44);
  device.log("Vengeance Ram Version: "+iRamVersion);
}

var vPecTable = [
  0,   7,   14,  9,   28,  27,  18,  21,  56,  63,  54,  49,  36,  35,  42,  45,  112, 119, 126, 121, 108, 107, 98,  101, 72,  79,
  70,  65,  84,  83,  90,  93,  224, 231, 238, 233, 252, 251, 242, 245, 216, 223, 214, 209, 196, 195, 202, 205, 144, 151, 158, 153,
  140, 139, 130, 133, 168, 175, 166, 161, 180, 179, 186, 189, 199, 192, 201, 206, 219, 220, 213, 210, 255, 248, 241, 246, 227, 228,
  237, 234, 183, 176, 185, 190, 171, 172, 165, 162, 143, 136, 129, 134, 147, 148, 157, 154, 39,  32,  41,  46,  59,  60,  53,  50,
  31,  24,  17,  22,  3,   4,   13,  10,  87,  80,  89,  94,  75,  76,  69,  66,  111, 104, 97,  102, 115, 116, 125, 122, 137, 142,
  135, 128, 149, 146, 155, 156, 177, 182, 191, 184, 173, 170, 163, 164, 249, 254, 247, 240, 229, 226, 235, 236, 193, 198, 207, 200,
  221, 218, 211, 212, 105, 110, 103, 96,  117, 114, 123, 124, 81,  86,  95,  88,  77,  74,  67,  68,  25,  30,  23,  16,  5,   2,
  11,  12,  33,  38,  47,  40,  61,  58,  51,  52,  78,  73,  64,  71,  82,  85,  92,  91,  118, 113, 120, 127, 106, 109, 100, 99,
  62,  57,  48,  55,  34,  37,  44,  43,  6,   1,   8,   15,  26,  29,  20,  19,  174, 169, 160, 167, 178, 181, 188, 187, 150, 145,
  152, 159, 138, 141, 132, 131, 222, 217, 208, 215, 194, 197, 204, 203, 230, 225, 232, 239, 250, 253, 244, 243];


function WritePacket()
{
  if (iRamVersion === 4) { WritePacketV4(); }
  else if (iRamVersion === 3) { WritePacketV3(); }
} 


function WritePacketV4()
{
  var vLedPacket = [0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

  // Set Colors.
  for (var iIdx = 0; iIdx < ciLedCount; iIdx++){
    var iRedIdx = iIdx * 3 + 1;
    var iGrnIdx = iIdx * 3 + 2;
    var iBlueIdx = iIdx * 3 + 3;

    var vColor;
    if (LightingMode === "Forced") { vColor = hexToRgb(forcedColor); }
    else { vColor = device.color(vLedPositions[iIdx][0], vLedPositions[iIdx][1]); }
    
    vLedPacket[iRedIdx] = vColor[0];
    vLedPacket[iGrnIdx] = vColor[1];
    vLedPacket[iBlueIdx] = vColor[2];
  }

  // Calc CRC.
  var iCrc = 0;
  for (var iIdx = 0; iIdx < 31; iIdx++) {
    if (iIdx < 31) {
      var iTableIdx = iCrc ^ vLedPacket[iIdx];
      iCrc = vPecTable[iTableIdx];
    }
  }
  vLedPacket[31] = iCrc;

  // Write block.
  bus.WriteBlock(0x31, 32, vLedPacket);
}


export function Initialize()
{
  GetRamVersion();
  
}


export function Render()
{
  WritePacket();
}


export function Shutdown()
{    
	// Do nothing.
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

