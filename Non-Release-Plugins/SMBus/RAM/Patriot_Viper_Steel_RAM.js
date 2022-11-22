export function Name() { return "Patriot Viper Steel RAM Test"; }
export function Publisher() { return "WhirlwindFX"; }
export function Type() { return "SMBUS"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 8.0;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters()
{
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

/** @param {FreeAddressBus} bus */
export function Scan(bus) 
{
    let addr = 0x77;
	  // Skip any non AMD / Nuvoton Busses

        if(!bus.IsSystemBus()){return}

        let result = bus.WriteQuick(addr);
        let validSticks = 0;
        if (result !== 0) //If result is greater than zero, run the rest of our checks
        {//Log good addresses
            bus.log("Master Controller Found on DeviceAddress: " + addr);
            let addressList = [0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57];

            for(let addy of addressList)
            {
                let result = bus.WriteQuick(addy);
                if(result === 0)
                {
                    bus.WriteByte(0x36, 0x00, 0xff);//Crate does this
                    if(bus.ReadByte(addy, 0x00) === 0x23)
                    {
                        bus.log("Address: " + addy + "Returned 0x23");
                        let registerstoReadFrom = [0x40, 0x41, 0x61, 0x62, 0x63, 0x64];
                        let registerResponses = [0xFF, 0xFF, 0x50, 0x44, 0x41, 0x31];
                        bus.WriteByte(0x37, 0x00, 0xFF);
                        let validResponse = true;
                        for(let bytes = 0; bytes < registerResponses.length; bytes++)
                        {
                            let response = bus.ReadByte(addy, registerstoReadFrom[bytes]);
                            if(response !== registerResponses[bytes])
                            {
                                validResponse = false;
                            }
                        }
                        if(validResponse)
                        {
                            bus.log("Patriot Viper Steel Stick Found at: " + addy);
                            validSticks++
                        }
                    }
                }
            }
        }
        if(validSticks > 0)
        {
            return addr;
        }
}

let vLedNames = [];
let vLedPositions = [];

export function Initialize() 
{

}

export function Render() 
{
    //sendColors();
}

export function Shutdown() 
{
}

function sendColors(shutdown = false)
{
    let RGBData = [];
    for(let iIdx = 0; iIdx < vSubdeviceLeds.length; iIdx++) 
    {
		var color;

        if(shutdown)
        {
            color = hexToRgb(shutdownColor);
        }
        else if (LightingMode === "Forced")
        {
            color = hexToRgb(forcedColor);
        }
        else
        {
            color = device.subdeviceColor(vSubdeviceNames[iIdx], 0, 0);
        }

		let iLedIdx = iIdx * 3;
		RGBData[iLedIdx] = color[0];
		RGBData[iLedIdx+1] = color[2];
		RGBData[iLedIdx+2] = color[1];
	}
       
}

function hexToRgb(hex) 
{
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}