export function Name() { return "MSI GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/MSI"; }
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

let startupRed;
let startupBlue;
let startupGreen;
let startupBrightness;
let startupMode;

/** @param {FreeAddressBus} bus */
export function Scan(bus) 
{
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus()) 
      {
		return [];
	}

	for(const MSIGPUID of new MSIGPUList().devices)
	{
		if(MSIGPUID.Vendor === bus.Vendor() &&
		MSIGPUID.SubVendor === bus.SubVendor() &&
		MSIGPUID.Device === bus.Product() &&
		MSIGPUID.SubDevice === bus.SubDevice()
		)
        {
			FoundAddresses.push(MSIGPUID.Address);
		}
        else
        {
			bus.log(`Expected Vendor [${MSIGPUID.Vendor}] got Vendor [${bus.Vendor()}]`);
			bus.log(`Expected SubVender [${MSIGPUID.SubVendor}] got Vendor [${bus.SubVendor()}]`);
			bus.log(`Expected Device [${MSIGPUID.Device}] got Vendor [${bus.Product()}]`);
			bus.log(`Expected SubDevice [${MSIGPUID.SubDevice}] got Vendor [${bus.SubDevice()}]`);
		}
	}

	return FoundAddresses;
}

export function BrandGPUList(){ return new MSIGPUList().devices; }

export function Initialize() 
{
    //bus.WriteByte(0x2E, 0x00);
    //bus.WriteByte(0x2D, 0x00); 40 Series flags
    MSIGPU.setDeviceMode(MSIGPU.modes.STATIC);
    MSIGPU.setDeviceBrightness(0x64);
    //MSIGPU.setDeviceEffectSpeed(0x00); Yay 40 series quirks
    SetGPUNameFromBusIds(new MSIGPUList().devices);
}

export function Render() 
{
    sendColors();
}

export function Shutdown() 
{
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

function sendColors(shutdown = false)
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
		color = device.color( vLedPositions[0][0],  vLedPositions[0][1]);
	}
    //MSIGPU.setDeviceMode(MSIGPU.modes.STATIC); //40 Series special.
    //We aren't using the start flag here. The 40 series card didn't need it, so let's just try without.
    bus.WriteByte(MSIGPU.registers.R1, color[0]);
    bus.WriteByte(MSIGPU.registers.G1, color[1]);
    bus.WriteByte(MSIGPU.registers.B1, color[2]);
    device.pause(120);
}

class MSIGPUController
{
    constructor()
    {
        this.registers =
        {
            BRIGHTNESS                 : 0x36,
            SPEED                      : 0x38,
            START                      : 0x26,
            R1                         : 0x30,
            G1                         : 0x31,
            B1                         : 0x32,
            R2                         : 0x27,
            G2                         : 0x28,
            B2                         : 0x29,
            R3                         : 0x2a,
            G3                         : 0x2b,
            B3                         : 0x2c,
            MODE                       : 0x22,
            APPLY                      : 0x3f,
            MSI_GPU_APPLY_VAL          : 0x01,
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
            OFF                       : 0x01,
            RAINBOW                   : 0x08,
            STATIC                    : 0x13,
            RAINDROP                  : 0x1a,
            MAGIC                     : 0x07,
            PATROLLING                : 0x05,
            STREAMING                 : 0x06,
            LIGHTNING                 : 0x15,
            WAVE                      : 0x1f,
            METEOR                    : 0x16,
            MARQUEE                   : 0x18,
            STACK                     : 0x0d,
            RHYTHM                    : 0x0b,
            FLOWING                   : 0x09,
            WHIRLING                  : 0x0f,
            TWISTING                  : 0x11,
            LAMINATING                : 0x1d,
            FADEIN                    : 0x14,
            BREATHING                 : 0x04,
            FLASHING                  : 0x02,
            DOUBLEFLASHING            : 0x03,
        };
    }

    getStartupValues() //Return startup color and brightness values.
    {
        let startupRed = bus.ReadByte(this.registers.R1);
        let startupGreen = bus.ReadByte(this.registers.G1);
        let startupBlue = bus.ReadByte(this.registers.B1);
        let startupBrightness = bus.ReadByte(this.registers.BRIGHTNESS);
        let startupMode = bus.ReadByte(this.registers.MODE);
        return [startupRed, startupBlue, startupGreen, startupBrightness, startupMode];
    }

    initializeGPU(brightness, mode)
    {
        if(mode !== this.modes.STATIC)
        {
            this.setDeviceMode(this.modes.STATIC);
            device.log(this.getStartupValues[4]); //Recheck
        }

        if(brightness !== 0x64)
        {
            this.setDeviceBrightness(0x64);
            device.log(this.getStartupValues[3]); //Recheck brightness
        }

        device.log("Startup Color Code" + startupRed << 8 + startupGreen << 8 + startupBlue << 8)
    }

    setDeviceMode(mode)
    {
        bus.WriteByte(this.registers.MODE, mode);
    }

    setDeviceBrightness(brightness)
    {
        bus.WriteByte(this.registers.BRIGHTNESS, brightness);
    }

    setDeviceEffectSpeed(speed)
    {
        bus.WriteByte(this.registers.SPEED, speed);
    }
}

const MSIGPU = new MSIGPUController();

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

class MSIGPUIdentifier extends GPUIdentifier
{
    constructor(device, SubDevice, Address, Name)
	{
		super(0x10DE, 0x1458, device, SubDevice, Address, Name, "");
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

class MSIGPUDeviceIDs
{
	constructor()
	{
        this.MSI_GTX1060_3GB                         = 0x3285;
        this.MSI_GTX1060_6GB                         = 0x3282;
        //MSI_GTX1070TI_TITANIUM                          0xc300 //FAILED
        this.MSI_GTX1070_GAMING_X                    = 0x3306;
        this.MSI_GTX1070_GAMING_X_8G                 = 0x3302;
       // MSI_GTX1080_GAMING_X_PLUS                       0x3362 //FAILED
        //MSI_GTX1080TI_GAMING_X                          0x3602 //FAILED
        this.MSI_GTX1080TI_GAMING_X                  = 0x3603;
        this.MSI_GTX1080_DUKE                        = 0x3369;

        this.MSI_GTX1660_GAMING_X_6G                 = 0x3790;
        this.MSI_GTX1660TI_GAMING_X_6G               = 0x375A;
        this.MSI_GTX1660TI_GAMING_X_6G_2             = 0x375C;
        this.MSI_GTX1660_SUPER_GAMING_6G             = 0xC759;
        this.MSI_GTX1660_SUPER_GAMING_X_6G           = 0xC758;
        this.MSI_RTX2060_GAMING_Z_6G                 = 0x3752;
        this.MSI_RTX2060_GAMING_Z_6G_2               = 0x3754;
        this.MSI_RTX2060_SUPER_GAMING_X              = 0xC752;
        this.MSI_RTX2060_SUPER_GAMING                = 0xC753;
        this.MSI_RTX2060_SUPER_ARMOR_OC              = 0xC754;
        this.MSI_RTX2070_GAMING_Z_SUB_DEV            = 0x3732;
        this.MSI_RTX2070_GAMING                      = 0x3733;
        this.MSI_RTX2070_ARMOR                       = 0x3734;
        this.MSI_RTX2070_SUPER_GAMING_TRIO           = 0xC727;
        this.MSI_RTX2070_SUPER_GAMING_Z_TRIO         = 0x37B6;
        this.MSI_RTX2070_SUPER_GAMING_X              = 0x373e;
        this.MSI_RTX2070_SUPER_GAMING_X_TRIO         = 0xC726;
        this.MSI_RTX2080_DUKE_OC                     = 0x3721;
        this.MSI_RTX2080_GAMING_TRIO                 = 0x372E;
        this.MSI_RTX2080_GAMING_X_TRIO               = 0x3726;
        this.MSI_RTX2080_SEA_HAWK_EK_X               = 0x3728;
        this.MSI_RTX2080S_GAMING_X_TRIO              = 0xC724;
        this.MSI_RTX2080TI_GAMING_X_TRIO             = 0x3715;
        this.MSI_RTX2080TI_GAMING_Z_TRIO             = 0x371E;
        this.MSI_RTX2080TI_SEA_HAWK_EK_X             = 0x3717;
        this.MSI_RTX2080TI_LIGHTNING_Z               = 0x3770;

        this.MSI_RTX3060_GAMING_X_12G                = 0x3976;
        this.MSI_RTX3060_GAMING_X_TRIO_12G           = 0x3903;
        this.MSI_RTX3060_GAMING_X_TRIO_LHR           = 0x3903;
        this.MSI_RTX3060TI_GAMING_X_LHR              = 0x3973;
        this.MSI_RTX3060TI_GAMING_X_TRIO_LHR         = 0x3903;

        this.MSI_RTX3070_SUPRIM_X                    = 0x3901;
        this.MSI_RTX3070_SUPRIM                      = 0x390C;
        this.MSI_RTX3070_GAMING_X_TRIO               = 0x3903;
        this.MSI_RTX3070_GAMING_Z_TRIO               = 0x3904;
        this.MSI_RTX3070TI_SUPRIM_X                  = 0x5051;
        this.MSI_RTX3070TI_GAMING_X_TRIO             = 0x5052;

        this.MSI_RTX3080_GAMING_X_TRIO               = 0x3892;
        this.MSI_RTX3080_GAMING_Z_TRIO               = 0x389B;

        this.MSI_RTX3080_SUPRIM_X                    = 0x3897;
        this.MSI_RTX3080TI_GAMING_X_TRIO             = 0x389B;
        this.MSI_RTX3090_GAMING_X_TRIO               = 0x3884;
        this.MSI_RTX3090_SUPRIM_X                    = 0x3882;
        this.MSI_RTX3090TI_SUPRIX_X                  = 0x5090;
        this.MSI_RTX3090TI_GAMING_TRIO               = 0x5091;
		this.RTX4090_GAMING_TRIO			         = 0x5103;
	}
}


class MSIGPUList
{
    constructor()
    {
        const Nvidia = new NvidiaGPUDeviceIds();
        const MSIGPUIDs  = new MSIGPUDeviceIDs();
        this.devices =
        [

            new MSIGPUIdentifier(Nvidia.GTX1060, MSIGPUIDs.MSI_GTX1060_3GB, 0x68, "MSI GTX 1060 Gaming 3GB"), //Untested
            new MSIGPUIdentifier(Nvidia.GTX1060, MSIGPUIDs.MSI_GTX1060_6GB, 0x68, "MSI GTX 1060 Gaming 6GB"), //Untested
            new MSIGPUIdentifier(Nvidia.GTX1070, MSIGPUIDs.MSI_GTX1070_GAMING_X, 0x68, "MSI GTX 1070 Gaming X"),
            new MSIGPUIdentifier(Nvidia.GTX1070, MSIGPUIDs.MSI_GTX1070_GAMING_X_8G, 0x68, "MSI GTX 1070 Gaming X 8G"), //Untested
            // new MSIGPUIdentifier(Nvidia.GTX1080, MSIGPUIDs.MSI_GTX1080_DUKE, 0x68, "MSI GTX 1080 DUKE"), //Untested, and unlikely to work, based on nvapi capture provided
            // new MSIGPUIdentifier(Nvidia.GTX1080TI, MSIGPUIDs.MSI_GTX1080TI_GAMING_X, 0x68, "MSI GTX 1080 Gaming X"), //Untested and unlikely to work. Dev is 0x38.

            new MSIGPUIdentifier(Nvidia.GTX1660, MSIGPUIDs.MSI_GTX1660_GAMING_X_6G,           0x68, "MSI GTX 1660 Gaming X 6G"),
            new MSIGPUIdentifier(Nvidia.GTX1660TI, MSIGPUIDs.MSI_GTX1660TI_GAMING_X_6G,         0x68, "MSI GTX 1060Ti Gaming X"),
            new MSIGPUIdentifier(Nvidia.GTX1660TI, MSIGPUIDs.MSI_GTX1660TI_GAMING_X_6G_2,         0x68, "MSI GTX 1060Ti Gaming X"), //Untested
            new MSIGPUIdentifier(Nvidia.GTX1660, MSIGPUIDs.MSI_GTX1660_GAMING_X_6G,           0x68, "MSI GTX 1660 Gaming X 6G"),
            new MSIGPUIdentifier(Nvidia.GTX1660S, MSIGPUIDs.MSI_GTX1660_SUPER_GAMING_6G,       0x68, "MSI GTX 1660 Super Gaming 6G"),      
            new MSIGPUIdentifier(Nvidia.GTX1660S, MSIGPUIDs.MSI_GTX1660_SUPER_GAMING_X_6G,     0x68, "MSI GTX 1660 Super Gaming X 6G"),      
       
            new MSIGPUIdentifier(Nvidia.RTX2060_TU104, MSIGPUIDs. MSI_RTX2060_GAMING_Z_6G,           0x68, "MSI RTX 2060 Gaming Z"),
            new MSIGPUIdentifier(Nvidia.RTX2060_TU106, MSIGPUIDs. MSI_RTX2060_GAMING_Z_6G,           0x68, "MSI RTX 2060 Gaming Z"),
            new MSIGPUIdentifier(Nvidia.RTX2060_TU106, MSIGPUIDs. MSI_RTX2060_GAMING_Z_6G_2,         0x68, "MSI RTX 2060 Gaming Z"),
            new MSIGPUIdentifier(Nvidia.RTX2060S_OC, MSIGPUIDs.MSI_RTX2060_SUPER_GAMING_X,        0x68, "MSI RTX 2060 Super Gaming X"),      
            new MSIGPUIdentifier(Nvidia.RTX2060S_OC, MSIGPUIDs.MSI_RTX2060_SUPER_GAMING,          0x68, "MSI RTX 2060 Super Gaming"),        
            new MSIGPUIdentifier(Nvidia.RTX2060S_OC, MSIGPUIDs.MSI_RTX2060_SUPER_ARMOR_OC,        0x68, "MSI RTX 2060 Super Armor OC"),        
            new MSIGPUIdentifier(Nvidia.RTX2070_OC, MSIGPUIDs.MSI_RTX2070_GAMING_Z_SUB_DEV,      0x68, "MSI RTX 2070 Gaming Z"),      
            new MSIGPUIdentifier(Nvidia.RTX2070, MSIGPUIDs.MSI_RTX2070_GAMING,                0x68, "MSI RTX 2070 Gaming"),     
            new MSIGPUIdentifier(Nvidia.RTX2070, MSIGPUIDs.MSI_RTX2070_ARMOR,                 0x68, "MSI RTX 2070 Armor"),     
            new MSIGPUIdentifier(Nvidia.RTX2070_OC, MSIGPUIDs.MSI_RTX2070_ARMOR,                 0x68, "MSI RTX 2070 Armor OC"),
            new MSIGPUIdentifier(Nvidia.RTX2070S, MSIGPUIDs.MSI_RTX2070_SUPER_GAMING_TRIO,     0x68, "MSI RTX 2070 Super Gaming Trio"),     
            new MSIGPUIdentifier(Nvidia.RTX2070S, MSIGPUIDs.MSI_RTX2070_SUPER_GAMING_X,        0x68, "MSI RTX 2070 Super Gaming X"),     
            new MSIGPUIdentifier(Nvidia.RTX2070S, MSIGPUIDs.MSI_RTX2070_SUPER_GAMING_X_TRIO,   0x68, "MSI RTX 2070 Super Gaming X Trio"),     
            new MSIGPUIdentifier(Nvidia.RTX2070S, MSIGPUIDs.MSI_RTX2070_SUPER_GAMING_Z_TRIO,   0x68, "MSI RTX 2070 Super Gaming Z Trio"),     
            new MSIGPUIdentifier(Nvidia.RTX2080, MSIGPUIDs.MSI_RTX2080_GAMING_TRIO,           0x68, "MSI RTX 2080 Gaming Trio"),     
            new MSIGPUIdentifier(Nvidia.RTX2080_A, MSIGPUIDs.MSI_RTX2080_GAMING_X_TRIO,         0x68, "MSI RTX 2080 Gaming X Trio"),       
            new MSIGPUIdentifier(Nvidia.RTX2080_A, MSIGPUIDs.MSI_RTX2080_DUKE_OC,               0x68, "MSI RTX 2080 Duke OC"),       
            new MSIGPUIdentifier(Nvidia.RTX2080_A, MSIGPUIDs.MSI_RTX2080_SEA_HAWK_EK_X,         0x68, "MSI RTX 2080 Sea Hawk EK x"),       
            new MSIGPUIdentifier(Nvidia.RTX2080S, MSIGPUIDs.MSI_RTX2080S_GAMING_X_TRIO,        0x68, "MSI RTX 2080 Super Gaming X Trio"),
            new MSIGPUIdentifier(Nvidia.RTX2080TI, MSIGPUIDs.MSI_RTX2080TI_GAMING_X_TRIO,       0x68, "MSI RTX 2080Ti Gaming X Trio"),      
            new MSIGPUIdentifier(Nvidia.RTX2080TI, MSIGPUIDs.MSI_RTX2080TI_GAMING_Z_TRIO,       0x68, "MSI RTX 2080Ti Gaming Z Trio"), //Untested
            new MSIGPUIdentifier(Nvidia.RTX2080TI, MSIGPUIDs.MSI_RTX2080TI_SEA_HAWK_EK_X,       0x68, "MSI RTX 2080Ti Sea Hawk EK X"),
            new MSIGPUIdentifier(Nvidia.RTX2080TI, MSIGPUIDs.MSI_RTX2080TI_LIGHTNING_Z,       0x68, "MSI RTX 2080Ti Lightning Z"),    //Untested
       
            new MSIGPUIdentifier(Nvidia.RTX3060, MSIGPUIDs.MSI_RTX3060_GAMING_X_TRIO_12G,     0x68, "MSI RTX 3060 Gaming X Trio 12G"),     //Duplicate sub dev id on different dev id
            new MSIGPUIdentifier(Nvidia.RTX3060, MSIGPUIDs.MSI_RTX3060_GAMING_X_12G,          0x68, "MSI RTX 3060 Gaming X 12g"),
            new MSIGPUIdentifier(Nvidia.RTX3060_LHR, MSIGPUIDs.MSI_RTX3060_GAMING_X_12G,          0x68, "MSI RTX 3060 Gaming X 12G LHR"),        
            new MSIGPUIdentifier(Nvidia.RTX3060_GA104, MSIGPUIDs.MSI_RTX3060_GAMING_X_12G,          0x68, "MSI RTX 3060 Gaming X 12G (GA104)"),
            new MSIGPUIdentifier(Nvidia.RTX3060_LHR, MSIGPUIDs.MSI_RTX3060_GAMING_X_TRIO_LHR,     0x68, "MSI RTX 3060 Gaming X Trio 12G LHR"),
       
            new MSIGPUIdentifier(Nvidia.RTX3060TI, MSIGPUIDs.MSI_RTX3070_GAMING_X_TRIO,         0x68, "MSI RTX 3060Ti Gaming X Trio"), //Duplicate sub dev id on different dev id
            new MSIGPUIdentifier(Nvidia.RTX3060TI_LHR, MSIGPUIDs.MSI_RTX3060TI_GAMING_X_LHR,        0x68, "MSI RTX 3060Ti Gaming X LHR"),      
            new MSIGPUIdentifier(Nvidia.RTX3060TI_LHR, MSIGPUIDs.MSI_RTX3060TI_GAMING_X_TRIO_LHR,   0x68, "MSI RTX 3060Ti Gaming X Trio LHR"),      
       
            new MSIGPUIdentifier(Nvidia.RTX3070, MSIGPUIDs.MSI_RTX3070_GAMING_X_TRIO,         0x68, "MSI RTX 3070 Gaming X Trio"),    
            new MSIGPUIdentifier(Nvidia.RTX3070, MSIGPUIDs.MSI_RTX3070_GAMING_Z_TRIO,         0x68, "MSI RTX 3070 Gaming X Trio"),    
            new MSIGPUIdentifier(Nvidia.RTX3070_LHR, MSIGPUIDs.MSI_RTX3070_GAMING_Z_TRIO,         0x68, "MSI RTX 3070 Gaming Z Trio"),
            new MSIGPUIdentifier(Nvidia.RTX3070, MSIGPUIDs.MSI_RTX3070_SUPRIM_X,              0x68, "MSI RTX 3070 Suprim X"),
            new MSIGPUIdentifier(Nvidia.RTX3070_LHR, MSIGPUIDs. MSI_RTX3070_SUPRIM_X,              0x68, "MSI RTX 3070 Suprim X LHR"),
            new MSIGPUIdentifier(Nvidia.RTX3070, MSIGPUIDs.MSI_RTX3070_SUPRIM,                0x68, "MSI RTX 3070 Suprim"),
            new MSIGPUIdentifier(Nvidia.RTX3070_LHR, MSIGPUIDs.MSI_RTX3070_SUPRIM,                0x68, "MSI RTX 3070 Suprim LHR"),
            new MSIGPUIdentifier(Nvidia.RTX3070TI, MSIGPUIDs.MSI_RTX3070TI_GAMING_X_TRIO,       0x68, "MSI RTX 3070Ti Gaming X Trio"),
            new MSIGPUIdentifier(Nvidia.RTX3070TI, MSIGPUIDs.MSI_RTX3070TI_SUPRIM_X,            0x68, "MSI RTX 3070Ti Suprim X"),
       
            new MSIGPUIdentifier(Nvidia.RTX3080, MSIGPUIDs.MSI_RTX3080_GAMING_X_TRIO,         0x68, "MSI RTX 3080 Gaming X Trio"),
            new MSIGPUIdentifier(Nvidia.RTX3080_LHR, MSIGPUIDs.MSI_RTX3080_GAMING_Z_TRIO,         0x68, "MSI RTX 3080 Gaming Z Trio LHR"),
            new MSIGPUIdentifier(Nvidia.RTX3080_GA102, MSIGPUIDs.MSI_RTX3080_GAMING_Z_TRIO,    0x68, "MSI RTX 3080 Gaming Z Trio 12g LHR"),
            new MSIGPUIdentifier(Nvidia.RTX3080, MSIGPUIDs.MSI_RTX3080_SUPRIM_X,              0x68, "MSI RTX 3080 Suprim X"),
            new MSIGPUIdentifier(Nvidia.RTX3080_GA102, MSIGPUIDs.MSI_RTX3080_SUPRIM_X,          0x68, "MSI RTX 3080 Suprim X 12g"),
            new MSIGPUIdentifier(Nvidia.RTX3080_LHR, MSIGPUIDs.MSI_RTX3080_SUPRIM_X,              0x68, "MSI RTX 3080 Suprim X LHR"),
            new MSIGPUIdentifier(Nvidia.RTX3080, MSIGPUIDs.MSI_RTX3080TI_GAMING_X_TRIO,       0x68, "MSI RTX 3080 Suprim X"),
            new MSIGPUIdentifier(Nvidia.RTX3080TI, MSIGPUIDs.MSI_RTX3080TI_GAMING_X_TRIO,       0x68, "MSI RTX 3080Ti Gaming X Trio"),
            new MSIGPUIdentifier(Nvidia.RTX3080TI, MSIGPUIDs.MSI_RTX3080_SUPRIM_X,              0x68, "MSI RTX 3080Ti Suprim X"),
            new MSIGPUIdentifier(Nvidia.RTX3090, MSIGPUIDs.MSI_RTX3090_GAMING_X_TRIO,         0x68, "MSI RTX 3090 Gaming X Trio"),
            new MSIGPUIdentifier(Nvidia.RTX3090, MSIGPUIDs.MSI_RTX3090_SUPRIM_X,              0x68, "MSI RTX 3090 Suprim X"),
            new MSIGPUIdentifier(Nvidia.RTX3090TI, MSIGPUIDs.MSI_RTX3090TI_SUPRIX_X, 0x68, "MSI RTX 3090 TI Suprim X"), //Untested
            new MSIGPUIdentifier(Nvidia.RTX3090TI, MSIGPUIDs.MSI_RTX3090TI_GAMING_TRIO, 0x68, "MSI RTX 3090 TI Gaming Trio"), //Untested
            new MSIGPUIdentifier(Nvidia.RTX4090, MSIGPUIDs.RTX4090_GAMING_TRIO, 0x68, "MSI GAMING TRIO RTX 4090")
        ];
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