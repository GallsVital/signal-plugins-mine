export function Name() { return "Gigabyte Gaming GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/gigabyte"; }
export function Type() { return "SMBUS"; }
export function Size() { return [4, 3]; }
export function DefaultPosition(){return [192, 127];}
export function DefaultScale(){return 12.5;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
export function ConflictingProcesses() { return ["RGBFusion.exe"]; }
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
//PLUGIN IS FULLY FUNCTIONAL, BUT 40 SERIES IS WEIRD.
const vLedNames = ["Fan 1", "Fan 2", "Fan 3", "Logo"];
/** @type {LedPosition[]} */
const vLedPositions = [ [0, 2], [1, 2], [2, 2], [2, 1] ];
const vKeys = [ 0, 1, 2, 4];

let GigabyteVision;

/** @param {FreeAddressBus} bus */
export function Scan(bus)
{
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus())
	{
		return [];
	}

	for(const GPU of new GigabyteVisionGPuList().devices)
	{
		if(CheckForIdMatch(bus, GPU))
		{
			// No Quick Write test on Nvidia

			//if(GigabyteVisionGpuCheck(bus, GPU))
			//{
			bus.log(`Found Gigabyte Vision GPU! [${GPU.Name}]`);
			FoundAddresses.push(GPU.Address);
			//}
		}
	}

	return FoundAddresses;
}

function CheckForIdMatch(bus, Gpu)
{
	return Gpu.Vendor === bus.Vendor() &&
    Gpu.SubVendor === bus.SubVendor() &&
    Gpu.Device === bus.Product() &&
    Gpu.SubDevice === bus.SubDevice();
}

function SetGPUNameFromBusIds(GPUList)
{
	for(const GPU of GPUList)
	{
		if(CheckForIdMatch(bus, GPU))
		{
			device.setName(GPU.Name);
			break;
		}
	}
}

function GigabyteVisionGpuCheck(bus, GPU)
{

	const ValidReturnCodes = [0x10, 0x11, 0x12, 0x14];
	// 0x62 (Gaming OC) cards use a 8 byte write length.
	// GPU will softlock if this is wrong.
	const WriteLength = GPU.Address === 0x62 ? 8 : 4;

	bus.WriteBlockWithoutRegister(GPU.Address, WriteLength, [0xAB]);

	const [iRet, Data] = bus.ReadBlockWithoutRegister(GPU.Address, WriteLength);
	bus.log(`Gigabyte Vision GPU Returned Init Read: [${Data}]`);

	return Data[0] === 0xAB && ValidReturnCodes.includes(Data[1]);
}

export function Initialize()
{
	GigabyteVision = new GigabyteVisionProtocol();
	GigabyteVision.determineWriteLength();
	GigabyteVision.setMode(GigabyteVision.modes.static);
	SetGPUNameFromBusIds(new GigabyteVisionGPuList().devices);

}

export function Render()
{
	SendRGB();
}


export function Shutdown()
{
	SendRGB(true);
}

function CompareArrays(array1, array2)
{
	return array1.length === array2.length &&
	array1.every(function(value, index) { return value === array2[index];});
}

function SendRGB(shutdown = false)
{

	let Color;
	const RGBData = [];

	for(let iIdx = 0; iIdx < vKeys.length; iIdx++)
	{
		if(shutdown)
		{
			Color = hexToRgb(shutdownColor);
		}
		else if(LightingMode === "Forced")
		{
			Color = hexToRgb(forcedColor);
		}
		else
		{
			Color = device.color(vLedPositions[iIdx][0], vLedPositions[iIdx][1]);
		}
		const ledIdx = vKeys[iIdx] * 3;
		RGBData[ledIdx] = Color[0];
		RGBData[ledIdx + 1] = Color[1];
		RGBData[ledIdx + 2] = Color[2];
	}
	const packet1 = [0xB0, 0x01];
	const packet2 = [0xB1, 0x01];
	const packet3 = [0xBC, 0x01];
	packet1.push(...RGBData.splice(0, 6));
	packet2.push(...RGBData.splice(0, 6));
	packet3.push(...RGBData.splice(0, 6));
	bus.WriteBlockWithoutRegister(8, packet1); //Fan 1 Fan 2
	bus.WriteBlockWithoutRegister(8, packet2); //Fan 3, NULL
	bus.WriteBlockWithoutRegister(8, packet3); // Logo, Null
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

class GigabyteVisionProtocol
{
	constructor()
	{

		this.registers = {
			Initialization: 0xAB,
			Mode: 0x88,
			Color: 0x40,
		};
		this.modes = {
			static: 0x01,
			breathing: 0x02,
			flashing: 0x04,
			dualFlash: 0x08,
			specrum: 0x011,
		};
		this.config = {
			writeLength : 0
		};
	}

	determineWriteLength()
	{
		this.config.writeLength = bus.GetAddress() === 0x71 ? 8 : 4;
	}

	setMode(mode)
	{

		const data = [this.registers.Mode, mode, 2, 0x63, 0x00, 0x00]; //WAS 5 //0x01 is probably a perled flag

		const iRet = this.WriteBlockSafe(data);

		if(iRet < 0)
		{
			bus.log("Failed To Set Mode");

			return;
		}

		bus.log(`Set Lighting Mode To [${mode}]`);
	}

	WriteRGB(RGBData)
	{
		if(RGBData.length > 3)
		{
			bus.log(`Invalid RGB Data Length. Expected 3, Got [${RGBData.length}]`);

			return;
		}
		const Data = [this.registers.Color];
		Data.push(...RGBData);
		this.WriteBlockSafe(Data);
	}

	WriteBlockSafe(Data)
	{
		if(this.config.writeLength === -1)
		{
			bus.log("Invalid Write Length. Aborting Write Operation to Redetect...");
			this.determineWriteLength();

			return -1;
		}

		return bus.WriteBlockWithoutRegister(this.config.writeLength, Data);
	}

}

class NvidiaGPUDeviceIds
{
	constructor()
	{
		this.GTX1050TI       = 0x1C82;
		this.GTX1060         = 0x1C03;
		this.GTX1070         = 0x1B81;
		this.GTX1070TI       = 0x1B82;
		this.GTX1080         = 0x1B80;
		this.GTX1080TI       = 0x1B06;
		this.GTX1650         = 0x1F82;
		this.GTX1650S        = 0x2187;
		this.GTX1660         = 0x2184;
		this.GTX1660TI       = 0x2182;
		this.GTX1660S        = 0x21C4;
		this.RTX2060_TU104   = 0x1E89;
		this.RTX2060_TU106   = 0x1F08;
		this.RTX2060S        = 0x1F47;
		this.RTX2060S_OC     = 0x1F06;
		this.RTX2070         = 0x1F02;
		this.RTX2070_OC      = 0x1F07;
		this.RTX2070S        = 0x1E84;
		this.RTX2080         = 0x1E82;
		this.RTX2080_A       = 0x1E87;
		this.RTX2080S        = 0x1E81;
		this.RTX2080TI_TU102 = 0x1E04;
		this.RTX2080TI       = 0x1E07;
		this.RTX2080_SUPER   = 0x1E81;
		this.RTX3050         = 0x2507;
		this.RTX3060         = 0x2503;
		this.RTX3060_LHR     = 0x2504;
		this.RTX3060_GA104   = 0x2487;
		this.RTX3060TI       = 0x2486;
		this.RTX3060TI_LHR   = 0x2489;
		this.RTX3070         = 0x2484;
		this.RTX3070_LHR     = 0x2488;
		this.RTX3070TI       = 0x2482;
		this.RTX3080         = 0x2206;
		this.RTX3080_LHR     = 0x2216;
		this.RTX3080_GA102   = 0x220A;
		this.RTX3080TI       = 0x2208;
		this.RTX3090         = 0x2204;
		this.RTX3090TI       = 0x2203;
		this.RTX4080		 = 0x2704;
		this.RTX4090		 = 0x2684;
	}
};

const Nvidia = new NvidiaGPUDeviceIds();

class GigabyteVisionDeviceIds
{
	constructor()
	{
		this.RTX4090_Gaming_OC_24G		    = 0x40BF;
	}
}

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

//0x1458
class GigabyteVisionIdentifier extends GPUIdentifier
{
	constructor(device, SubDevice, Address, Name)
	{
		super(0x10DE, 0x1458, device, SubDevice, Address, Name, "");
	}
}

class GigabyteVisionGPuList
{
	constructor()
	{
		const Nvidia = new NvidiaGPUDeviceIds();
		const GigabyteVisionIds  = new GigabyteVisionDeviceIds();

		this.devices = [
			new GigabyteVisionIdentifier(Nvidia.RTX4090,        GigabyteVisionIds.RTX4090_Gaming_OC_24G,         0x71, "GIGABYTE RTX4090 Gaming OC 24G"),
		];
	}
}

