

var G600_RGB_WRITE = 0xF1;
var G600_DPI_WRITE = 0xF2;

var G600_FIXED_MODE = 0x00;
var G600_BRETHING_MODE = 0x01;
var G600_CYCLE_MODE = 0x02;



export function Name() { return "Logitech G600 Mouse"; }
export function VendorId() { return 0x046D; } 
export function ProductId() { return 0xC24A; } 
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3,3]; } 
export function DefaultPosition(){return [240,120]}
export function DefaultScale(){return 8.0}

var vLedNames = ["MouseWide"];

var vLedPositions = [[1,1]];

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
    
    return "Logitech G600 Initialized";
}


export function Render()
{
    var packet = []
    //packet[0x00] = 0x00;
    packet[0x00]   = G600_RGB_WRITE;

    // Fetch color at 1,1
    var iX = vLedPositions[0][0];
    var iY = vLedPositions[0][1];
    var col = device.color(iX,iY);
    //assign to packets 2-4
    packet[0x01] = col[0];
    packet[0x02] = col[1];
    packet[0x03] = col[2];
    //packet 5 is mode
    packet[0x04] = G600_FIXED_MODE;
    //packet 6 is effect duration, default 4
    packet[0x05] = 0x04;
    //both 0
    packet[0x06] = 0x00;
    packet[0x07] = 0x00;

    device.send_report(packet, 8);
    
}
export function Validate(endpoint)
{
    return  endpoint.interface === 1 && endpoint.usage === 0x0080;
}

export function Shutdown()
{
    
    return "Logitech G600 Disconnected";
}

export function Image() 
{ 
}