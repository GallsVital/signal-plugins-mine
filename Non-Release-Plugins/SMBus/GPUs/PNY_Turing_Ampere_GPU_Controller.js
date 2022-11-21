export function Name() { return "PNY GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/asus"; }
export function Type() { return "SMBUS"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 2.5;}
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

let vLedNames = [ "GPU" ];
let vLedPositions = [ [0,0]];

/** @param {FreeAddressBus} bus */
export function Scan(bus) 
{
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus()) 
      {
		return [];
	}

	for(const PNYGPUID of PNYGPUIDs)
    {
		if(PNYGPUID.Vendor === bus.Vendor() &&
		PNYGPUID.SubVendor === bus.SubVendor() &&
		PNYGPUID.Device === bus.Product() &&
		PNYGPUID.SubDevice === bus.SubDevice()
		)
        {
				FoundAddresses.push(PNYGPUID.Address);
		}
        else
        {
			bus.log(`Expected Vendor [${PNYGPUID.Vendor}] got Vendor [${bus.Vendor()}]`);
			bus.log(`Expected SubVender [${PNYGPUID.SubVendor}] got Vendor [${bus.SubVendor()}]`);
			bus.log(`Expected Device [${PNYGPUID.Device}] got Vendor [${bus.Product()}]`);
			bus.log(`Expected SubDevice [${PNYGPUID.SubDevice}] got Vendor [${bus.SubDevice()}]`);
		}
	}

	return FoundAddresses;
}

export function Initialize() 
{
    bus.WriteByte(PNYGPU.registers.Control, 0x00);
    bus.WriteByte(PNYGPU.registers.Mode, 0x01);
    bus.WriteByte(PNYGPU.registers.Brightness, 0x64);
}

export function Render() 
{
    sendColors();
}

export function Shutdown() 
{
}

function SetGPUNameFromBusIds()
{
	for(const PNYGPUID of PNYGPUIDs)
    {
		if(PNYGPUID.Vendor === bus.Vendor() &&
		PNYGPUID.SubVendor === bus.SubVendor() &&
		PNYGPUID.Device === bus.Product() &&
		PNYGPUID.SubDevice === bus.SubDevice()
		)
        {
			device.setName(PNYGPUID.Name);
		}
	}
}

function sendColors(shutdown = false)
{
	let iPxX = vLedPositions[0][0];
	let iPxY = vLedPositions[0][1];
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
		color = device.color(iPxX, iPxY);
	}

    bus.WriteByte(PNYGPU.registers.R, color[0]);
    bus.WriteByte(PNYGPU.registers.G, color[1]);
    bus.WriteByte(PNYGPU.registers.B, color[2]);
}

class PNYGPUController
{
    constructor()
    {
        this.registers =
        {
            Control    : 0xE0,
            Mode       : 0x60,
            R          : 0x6C,
            G          : 0x6D,
            B          : 0x6E,
            Brightness : 0x6F
        };
    }

    setDeviceMode(mode)
    {
        bus.WriteByte(this.registers.Mode, mode);
    }
}

const PNYGPU = new PNYGPUController();

class GPUIdentifier
{
	constructor(Vendor, SubVendor, Device, SubDevice, Address, Name, Model = "")
    {
		this.Vendor = Vendor;
		this.SubVendor = SubVendor;
		this.Device = Device;
		this.SubDevice = SubDevice;
		this.Address = Address;
		this.Name = Name;
		this.Model = Model;
	}
}

class PNYGPUIdentifier extends GPUIdentifier
{
	constructor(Device, SubDevice, Name, Model = "")
    {
		super(0x10DE, 0x196E, Device, SubDevice, 0x49, Name, Model);
	}
}

const PNYGPUIDs =
[
    new PNYGPUIdentifier(0x2216, 0x138B, "PNY RTX 3080 XLR8"),
];

function hexToRgb(hex) 
{
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}