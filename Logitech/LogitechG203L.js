export function Name() { return "Logitech G203 Lightsync"; }
export function VendorId() { return 0x046d; }
export function ProductId() { return 0xc092; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [3, 3]; }

var vLedNames = ["Left Zone", "Logo Zone", "Right Zone"];
var vLedPositions = [
    [1,0],[1,1],[1,2]
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
    var packet = [];

    packet[0x00] = 0x11;
    packet[0x01] = 0xFF;
    packet[0x02] = 0x12;
    packet[0x03] = 0x7E;

    device.write(packet, 20);
    device.read(packet,20);
}


export function Render()
{
    var packet = [];

    packet[0x00] = 0x11;
    packet[0x01] = 0xFF;
    packet[0x02] = 0x12;
    packet[0x03] = 0x1E;

    var offset = 4;
    for (var iIdx = 0; iIdx < vLedPositions.length; iIdx++)
    {
        var iLedIdx = offset + (iIdx * 4);
        var iX = vLedPositions[iIdx][0];
        var iY = vLedPositions[iIdx][1];
        var color = device.color(iX,iY);
        packet[iLedIdx] = iIdx + 1;
        packet[iLedIdx+1] = color[0];
        packet[iLedIdx+2] = color[1];
        packet[iLedIdx+3] = color[2];
    }
    
    packet[0x10] = 0xFF;

    device.write(packet, 20);
    device.read(packet,20);

    Apply();
}


export function Shutdown()
{

}


export function Validate(endpoint)
{
    return endpoint.interface === 1 && endpoint.usage === 0x0002;
}

