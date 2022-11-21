export function Name() { return "Asus Ampere/Lovelace GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/asus"; }
export function Type() { return "SMBUS"; }
export function Size() { return [30, 1]; }
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

let vLedNames = [];
let vLedPositions = [];

/** @param {FreeAddressBus} bus */
export function Scan(bus) 
{
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus()) 
      {
		return [];
	}

	for(const AsusGPUID of Asus3000GPUIDs)
    {
		if(AsusGPUID.Vendor === bus.Vendor() &&
		AsusGPUID.SubVendor === bus.SubVendor() &&
		AsusGPUID.Device === bus.Product() &&
		AsusGPUID.SubDevice === bus.SubDevice()
		)
        {
			// No Quick Write test on Nvidia
			if(bus.ReadByteWithoutRegister(AsusGPUID.Address) > 0)
            {
				FoundAddresses.push(AsusGPUID.Address);
			}

		}
        else
        {
			bus.log(`Expected Vendor [${AsusGPUID.Vendor}] got Vendor [${bus.Vendor()}]`);
			bus.log(`Expected SubVender [${AsusGPUID.SubVendor}] got Vendor [${bus.SubVendor()}]`);
			bus.log(`Expected Device [${AsusGPUID.Device}] got Vendor [${bus.Product()}]`);
			bus.log(`Expected SubDevice [${AsusGPUID.SubDevice}] got Vendor [${bus.SubDevice()}]`);
		}
	}

	return FoundAddresses;
}

export function Initialize() 
{
    AsusGPU.getDeviceInformation();
    SetGPUNameFromBusIds();
    AsusGPU.setMode(AsusGPU.modes.static);
}

export function Render() 
{
    sendColors();
}

export function Shutdown() 
{
    AsusGPU.setMode(AsusGPU.modes.rainbow);
}

function SetGPUNameFromBusIds()
{
	for(const AsusGPUID of Asus3000GPUIDs)
    {
		if(AsusGPUID.Vendor === bus.Vendor() &&
		AsusGPUID.SubVendor === bus.SubVendor() &&
		AsusGPUID.Device === bus.Product() &&
		AsusGPUID.SubDevice === bus.SubDevice()
		)
        {
			device.setName(AsusGPUID.Name);
		}
	}
}

function sendColors(shutdown = false)
{
    bus.WriteBlock(AsusGPU.registers.command, 2, [0x81, 0x60]);
    let RGBData = new Array(90);
    for(let iIdx = 0; iIdx < vLedPositions.length; iIdx++) 
    {
		let iPxX = vLedPositions[iIdx][0];
		let iPxY = vLedPositions[iIdx][1];
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

		let iLedIdx = iIdx * 3;
		RGBData[iLedIdx] = color[0];
		RGBData[iLedIdx+1] = color[2];
		RGBData[iLedIdx+2] = color[1];
	}

    while(RGBData.length > 0)
    {
        let packet = [0x1E];
        packet.push(...RGBData.splice(0,30));
        bus.WriteBlock(AsusGPU.registers.color, 31, packet);
    }
    bus.WriteBlock(AsusGPU.registers.command, 2, [0x80, 0x2F]);
    bus.WriteByte(AsusGPU.registers.direction, 0x01);
}

class AsusGPUController
{
    constructor()
    {
        this.registers =
        {
            command   : 0x00,
            direction : 0x01,
            speed     : 0x02,
            color     : 0x03
        };

        this.commands =
        {
            action    : 0x80,
            speed     : 0x20,
            direction : 0x24,
            apply     : 0x2F
        };

        this.modes =
        {
            static       : 0x01,
            breathing    : 0x02,
            rainbow      : 0x05,
            comet        : 0x07,
            yoyo         : 0x0C,
            starryNight  : 0x0D,
            flashAndDash : 0x0A,
        };

        this.speeds =
        {
            slow   : 0x05,
            medium : 0x00,
            fast   : 0xFB
        };

        this.auraCommands =
        {
            deviceName   : 0x1000,
            configTable  : 0x1C00,
            directAccess : 0x8020,
            colorCtlV1   : 0x8000,
            colorCtlV2   : 0x8100,
            apply        : 0x80A0
        }
    }

    auraReadRegister(reg)
    {
        bus.WriteBlock(this.registers.command, 2, [reg >> 8 & 0xFF , reg & 0xff]);

        return bus.ReadByte(0x81);
    }

    auraWriteRegister(reg, value)
    {
        bus.WriteBlock(this.registers.command, 2, [reg >> 8 & 0xFF , reg & 0xff]);

        bus.WriteByte(this.registers.direction, value);
    }

    auraWriteRegisterBlock(reg, size, data)
    {
        let iWord = bus.WriteBlock(this.registers.command, 2, [reg >> 8 & 0xFF , reg & 0xff]); //The variable here isn't needed for gpus and normal cases. Hence, we aren't making use of it.
        bus.WriteBlock(this.registers.color, size, data);
    }

    getDeviceInformation()
    {
        let deviceName = AsusGPU.getDeviceName();
        let deviceConfigTable = AsusGPU.getDeviceConfigTable();
        let deviceLEDCount = deviceConfigTable[3]; //No need to properly parse this. We only pull a single value off it for now.
        device.log("Device Controller Identifier: " + deviceName, {toFile: true});
        device.log("Device LED Count: " + deviceLEDCount, {toFile: true});
        if(deviceLEDCount > 30 || deviceLEDCount < 0)
        {
            device.log("Device returned out of bounds LED Count.", {toFile: true});
            deviceLEDCount = 30;
        }
        
        for(let i = 0; i < deviceLEDCount; i++)
        {
            vLedNames.push(`LED ${i + 1}`);
            vLedPositions.push([ (deviceLEDCount - 1) - i, 0 ]);
        }
       
        device.setControllableLeds(vLedNames,vLedPositions);
        device.setSize([deviceLEDCount, 1]);
    }

    getDeviceName()
    {
        let deviceName = [];
        for(let iIdx = 0; iIdx < 16; iIdx++)
        {
            let character = this.auraReadRegister(this.auraCommands.deviceName + iIdx);
            if(character > 0)
            {
                deviceName.push(character);
            }
        }
        return String.fromCharCode(...deviceName);
    }

    getDeviceConfigTable()
    {
        let configTable = new Array(65);
        for(let iIdx = 0; iIdx < 64; iIdx++)
        {
            configTable[iIdx] = this.auraReadRegister(this.auraCommands.configTable + iIdx);
        }
        return configTable;
    }

    setMode(deviceMode)
    {
        bus.WriteBlock(this.registers.command, 2, [this.commands.action, this.commands.speed]);
        bus.WriteBlock(this.registers.speed, 2, [this.speeds.medium, deviceMode]);
        this.setDirection(0x00); //0x00 is left. 0x01 is right. I'm not making a dict for two values.
    }

    setDirection(direction)
    {
        bus.WriteBlock(this.registers.command, 2, [this.commands.action, this.commands.direction]);
        bus.WriteByte(this.registers.direction, direction);
        bus.WriteBlock(this.registers.command, 2, [this.commands.action, this.commands.apply]);
        bus.WriteByte(this.registers.direction, 0x01); //apply direction
    }
}

const AsusGPU = new AsusGPUController();

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

class AsusGPUIdentifier extends GPUIdentifier
{
	constructor(Device, SubDevice, Name, Model = "")
    {
		super(0x10DE, 0x1043, Device, SubDevice, 0x67, Name, Model);
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
        this.RTX4090         = 0x2684;
    }
};

const Nvidia = new NvidiaGPUDeviceIds();

class Asus_Ampere_Lovelace_IDs
{
	constructor()
    {
		this.RTX3050_STRIX_GAMING           = 0x8872;

        this.RTX3060_STRIX_GAMING           = 0x8818;
        this.RTX3060_STRIX_GAMING_OC        = 0x87F3;
        this.RTX3060_STRIX_GAMING_OC_2      = 0x87F4;
        this.RTX3060_TUF_GAMING_OC          = 0x87F5;
        this.RTX3060_TUF_GAMING_OC_V2       = 0x8816;
        this.RTX3060_TUF_GAMING_O12G        = 0x87F6; //0x2503
        this.RTX3060_TUF_GAMING_OC_V2_LHR   = 0x8817; //0x2504
        this.RTX3060_DUAL_GAMING_OC_V2      = 0x881D; //0x2504
        this.RTX3060_STRIX_O12G_KO          = 0x8821; //0x2504

        this.RTX3060TI_STRIX_GAMING         = 0x87BA;
        this.RTX3060TI_STRIX_GAMING_KO      = 0x883E;
        this.RTX3060TI_STRIX_GAMING_KO_2    = 0x87CA; //0x2486
        this.RTX3060TI_STRIX_GAMING_V2      = 0x8834;
        this.RTX3060TI_TUF_GAMING_OC        = 0x87C6;
        this.RTX3060TI_TUF_GAMING_OC_LHR    = 0x8827;
        this.RTX3060TI_DUAL_GAMING_OC       = 0x884F; //0x2489

        this.RTX3070_STRIX_GAMING           = 0x87BE;
        this.RTX3070_STRIX_GAMING_OC        = 0x87D8;
        this.RTX3070_STRIX_GAMING_OC_2      = 0x87B8;
        this.RTX3070_STRIX_GAMING_OC_WHITE  = 0x87E0;
        this.RTX3070_STRIX_GAMING_OC_WHITE_V2 = 0x8833; //LHR
        this.RTX3070_STRIX_GAMING_OC_LHR    = 0x882C;
        this.RTX3070_STRIX_GAMING_V2_LHR    = 0x882D;
        this.RTX3070_STRIX_GAMING_WHITE_LHR = 0x8832;
        this.RTX3070_STRIX_GAMING_LHR       = 0x883A;
        this.RTX3070_STRIX_KO_V2            = 0x8842; //LHR
        this.RTX3070_TUF_GAMING             = 0x87B9;
        this.RTX3070_TUF_GAMING_OC          = 0x87E1;
        this.RTX3070_TUF_GAMING_OC_2        = 0x87C1;
        this.RTX3070_TUF_GAMING_OC_LHR      = 0x8825;

        this.RTX3070TI_STRIX_GAMING         = 0x880E;
        this.RTX3070TI_TUF_GAMING           = 0x8812;
        this.RTX3070TI_TUF_GAMING_2         = 0x8813;
        

        this.RTX3080_STRIX_GAMING_WHITE     = 0x87D1;
        this.RTX3080_STRIX_GAMING_WHITE_OC_LHR = 0x8830;
        this.RTX3080_STRIX_GAMING_GUNDAM       = 0x87CE;
        this.RTX3080_STRIX_GAMING              = 0x87AC;
        this.RTX3080_STRIX_O10G_GAMING_WHITE_V2= 0x8831; //2216
        this.RTX3080_TUF_GAMING_V2_LHR         = 0x8822;
        this.RTX3080_TUF_GAMING_LHR            = 0x8823;
        this.RTX3080_TUF_GAMING                = 0x87B2;
        this.RTX3080_TUF_GAMING_V2             = 0x87C4;
        this.RTX3080_TUF_O10G_GAMING           = 0x882B;
        this.RTX3080_TUF_GAMING_OC_LHR         = 0x882E;
        this.RTX3080_TUF_GAMING_OC             = 0x87B0;
        this.RTX3080_TUF_GAMING_OC_GDDR6X      = 0x886E; //0x220A
        this.RTX3080_TUF_GAMING_OC_GDDR6X_LHR  = 0x886F; //0x220A
        this.RTX3080_STRIX_O12G_GAMING_OC      = 0x886B;
        this.RTX3080_STRIX_EVA                 = 0x8887;
        
        this.RTX3080TI_TUF_GAMING_OC               = 0x8802;
        this.RTX3080TI_TUF_GAMING                  = 0x8803;
        this.RTX3080TI_STRIX_GAMING                = 0x8807;
        this.RTX3080TI_STRIX_GAMING_OC             = 0x8808;
        this.RTX3080TI_STRIX_LC_GAMING_OC          = 0x8809;

        this.RTX3090_TUF_GAMING_OC                 = 0x87B3;
        this.RTX3090_TUF_GAMING                    = 0x87B5;
        this.RTX3090_STRIX_GAMING                  = 0x87AF;
        this.RTX3090_STRIX_GAMING_WHITE            = 0x87D9;
        this.RTX3090_STRIX_GAMING_WHITE_V2         = 0x87DA;

        this.RTX3090TI_STRIX_LC_GAMING_OC          = 0x8870;

        this.RTX4090_STRIX_GAMING                  = 0x889C;
        this.RTX4090_TUF_GAMING                    = 0x889A;
        this.RTX4090_TUF_GAMING_2                  = 0x889B;
	}
}

const AsusID = new Asus_Ampere_Lovelace_IDs

const Asus3000GPUIDs =
[
    new AsusGPUIdentifier(Nvidia.RTX3050, AsusID.RTX3050_STRIX_GAMING, "Asus ROG Strix RTX 3050 Gaming"),

    new AsusGPUIdentifier(Nvidia.RTX3060_LHR, AsusID.RTX3060_STRIX_GAMING, "Asus ROG Strix RTX 3060 O12G Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3060, AsusID.RTX3060_STRIX_GAMING_OC, "Asus ROG Strix RTX 3060 O12G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3060, AsusID.RTX3060_STRIX_GAMING_OC_2, "Asus ROG Strix RTX 3060 O12G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3060, AsusID.RTX3060_TUF_GAMING_O12G, "Asus TUF RTX 3060 Gaming O12G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3060, AsusID.RTX3060_TUF_GAMING_OC, "Asus TUF RTX 3060 Gaming O12G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3060_LHR, AsusID.RTX3060_TUF_GAMING_OC_V2, "Asus TUF RTX 3060 Gaming O12G Gaming OC V2"),
    new AsusGPUIdentifier(Nvidia.RTX3060_LHR, AsusID.RTX3060_TUF_GAMING_OC_V2_LHR, "Asus TUF 3060 Gaming O12G Gaming OC V2 LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3060_LHR, AsusID.RTX3060_DUAL_GAMING_OC_V2, "Asus Dual 3060 V2 OC"),

    new AsusGPUIdentifier(Nvidia.RTX3060TI_LHR, AsusID.RTX3060TI_STRIX_GAMING_V2, "Asus ROG Strix 3060TI O8G Gaming V2"),
    new AsusGPUIdentifier(Nvidia.RTX3060TI_LHR, AsusID.RTX3060TI_TUF_GAMING_OC_LHR, "Asus TUF 3060TI O8G Gaming OC LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3060TI, AsusID.RTX3060TI_STRIX_GAMING, "Asus ROG Strix 3060TI O8G Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3060TI_LHR, AsusID.RTX3060TI_STRIX_GAMING_KO, "Asus ROG Strix 3060TI O8G Gaming KO"),
    new AsusGPUIdentifier(Nvidia.RTX3060TI, AsusID.RTX3060TI_TUF_GAMING_OC, "Asus TUF 3060TI O8G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3060TI_LHR, AsusID.RTX3060TI_DUAL_GAMING_OC, "Asus ROG Strix 3060TI O8G Gaming LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3060TI, AsusID.RTX3060TI_STRIX_GAMING_KO_2, "Asus TUF 3060TI O8G KO Gaming OC "),

    new AsusGPUIdentifier(Nvidia.RTX3070, AsusID.RTX3070_STRIX_GAMING, "Asus ROG Strix 3070 O8G Gaming"),
	new AsusGPUIdentifier(Nvidia.RTX3070, AsusID.RTX3070_STRIX_GAMING_OC, "Asus ROG Strix 3070 O8G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3070, AsusID.RTX3070_STRIX_GAMING_OC_2, "Asus ROG Strix 3070 O8G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3070, AsusID.RTX3070_STRIX_GAMING_OC_WHITE, "Asus ROG Strix 3070 Gaming OC White"),
    new AsusGPUIdentifier(Nvidia.RTX3070_LHR, AsusID.RTX3070_STRIX_GAMING_OC_WHITE_V2, "Asus ROG Strix 3070 Gaming OC White V2"),
    new AsusGPUIdentifier(Nvidia.RTX3070_LHR, AsusID.RTX3070_STRIX_GAMING_OC_LHR, "Asus ROG Strix 3070 Gaming OC LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3070, AsusID.RTX3070_TUF_GAMING, "Asus TUF 3070 Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3070, AsusID.RTX3070_TUF_GAMING_OC, "Asus TUF 3070 Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3070_LHR, AsusID.RTX3070_STRIX_KO_V2, "Asus 3070 KO V2 OC"),
    new AsusGPUIdentifier(Nvidia.RTX3070, AsusID.RTX3070_TUF_GAMING_OC_2, "Asus TUF 3070 Gaming OC 2"),
    new AsusGPUIdentifier(Nvidia.RTX3070_LHR, AsusID.RTX3070_TUF_GAMING_OC_LHR, "Asus TUF 3070 Gaming OC LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3070_LHR, AsusID.RTX3070_STRIX_GAMING_V2_LHR, "Asus ROG Strix 3070 O8G V2 LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3070_LHR, AsusID.RTX3070_STRIX_GAMING_WHITE_LHR, "Asus ROG Strix 3070 O8G White LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3070_LHR, AsusID.RTX3070_STRIX_GAMING_LHR, "Asus ROG Strix 3070 O8G Gaming LHR"),

    new AsusGPUIdentifier(Nvidia.RTX3070TI, AsusID.RTX3070TI_STRIX_GAMING, "Asus ROG Strix 3070TI O8G Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3070TI, AsusID.RTX3070TI_TUF_GAMING, "Asus TUF 3070TI Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3070TI, AsusID.RTX3070TI_TUF_GAMING_2, "Asus TUF 3070TI Gaming 2"),

    new AsusGPUIdentifier(Nvidia.RTX3080, AsusID.RTX3080_STRIX_GAMING_WHITE, "Asus ROG Strix 3080 O10G White Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3080_LHR, AsusID.RTX3080_STRIX_GAMING_WHITE_OC_LHR, "Asus ROG Strix 3080 O10G White OC LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3080, AsusID.RTX3080_STRIX_GAMING_GUNDAM, "Asus ROG Strix 3080 O10G Gundam"),
    new AsusGPUIdentifier(Nvidia.RTX3080, AsusID.RTX3080_STRIX_GAMING, "Asus ROG Strix 3080 O10G Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3080_LHR, AsusID.RTX3080_TUF_GAMING_V2_LHR, "Asus TUF 3080 O10G V2 LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3080_LHR, AsusID.RTX3080_TUF_GAMING_LHR, "Asus TUF 3080 O10G Gaming LHR"),

    new AsusGPUIdentifier(Nvidia.RTX3080, AsusID.RTX3080_TUF_GAMING, "Asus TUF 3080 Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3080, AsusID.RTX3080_TUF_GAMING_V2, "Asus TUF 3080 Gaming V2"),
    new AsusGPUIdentifier(Nvidia.RTX3080_LHR, AsusID.RTX3080_TUF_O10G_GAMING, "Asus TUF 3080 O10G Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3080_GA102, AsusID.RTX3080_TUF_GAMING_OC_GDDR6X, "Asus TUF 3080 Gaming OC GDDR6X"),
    new AsusGPUIdentifier(Nvidia.RTX3080_GA102, AsusID.RTX3080_TUF_GAMING_OC_GDDR6X_LHR, "Asus TUF 3080 Gaming OC GDDR6X LHR"),
    new AsusGPUIdentifier(Nvidia.RTX3080_LHR, AsusID.RTX3080_TUF_GAMING_OC_LHR, "Asus ROG Strix 3080 O10G Gaming OC LHR"),

    new AsusGPUIdentifier(Nvidia.RTX3080, AsusID.RTX3080_TUF_GAMING_OC, "Asus TUF 3080 Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3080_GA102, AsusID.RTX3080_STRIX_O12G_GAMING_OC, "Asus ROG Strix 3080 O12G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3080_LHR, AsusID.RTX3080_STRIX_O10G_GAMING_WHITE_V2, "Asus ROG Strix 3080 O10G Gaming White V2"),
    new AsusGPUIdentifier(Nvidia.RTX3080_GA102, AsusID.RTX3080_STRIX_EVA, "Asus ROG Strix 3080 O12G EVA"),

    new AsusGPUIdentifier(Nvidia.RTX3080TI, AsusID.RTX3080TI_TUF_GAMING_OC, "Asus TUF 3080TI Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3080TI, AsusID.RTX3080TI_TUF_GAMING, "Asus TUF 3080TI Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3080TI, AsusID.RTX3080TI_STRIX_GAMING, "Asus ROG Strix 3080TI O12G Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3080TI, AsusID.RTX3080TI_STRIX_GAMING_OC, "Asus ROG Strix 3080TI O12G Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3080TI, AsusID.RTX3080TI_STRIX_LC_GAMING_OC, "Asus ROG Strix 3080TI LC Gaming OC"),

    new AsusGPUIdentifier(Nvidia.RTX3090, AsusID.RTX3090_TUF_GAMING_OC, "Asus TUF 3090 Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX3090, AsusID.RTX3090_TUF_GAMING, "Asus TUF 3090 Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3090, AsusID.RTX3090_STRIX_GAMING, "Asus ROG Strix 3090 O24G Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX3090, AsusID.RTX3090_STRIX_GAMING_WHITE, "Asus ROG Strix 3090 O24G Gaming White"),
    new AsusGPUIdentifier(Nvidia.RTX3090, AsusID.RTX3090_STRIX_GAMING_WHITE_V2, "Asus ROG Strix 3090 O24G Gaming White V2"),

    new AsusGPUIdentifier(Nvidia.RTX3090TI, AsusID.RTX3090TI_STRIX_LC_GAMING_OC, "Asus ROG Strix 3090TI LC OC"),
    
    new AsusGPUIdentifier(Nvidia.RTX4090, AsusID.RTX4090_STRIX_GAMING, "Asus ROG Strix 4090 Gaming OC"),
    new AsusGPUIdentifier(Nvidia.RTX4090, AsusID.RTX4090_TUF_GAMING, "Asus TUF RTX 4090 Gaming"),
    new AsusGPUIdentifier(Nvidia.RTX4090, AsusID.RTX4090_TUF_GAMING_2, "Asus TUF RTX 4090 Gaming")
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

export function Image() 
{
}