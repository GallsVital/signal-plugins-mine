export function Name() { return "Asus SMBus Motherboard Controller"; }
export function Publisher() { return "WhirlwindFX"; }
export function Type() { return "SMBUS"; }
export function Size() { return [22, 1]; }
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

	let FoundAddresses = [];
    let addys = [0x40, 0x4E, 0x4F];
    
    const AsusSMBusInterface = new AsusSMBusInterfaceFree(bus);
	let AsusMobo = new AsusSMBus(AsusSMBusInterface);

	  // Skip any non AMD / Nuvoton Busses

	for(let addr of addys)
    {
        if(!bus.IsAMDBus && !bus.IsNuvotonBus()){return}
        
        let result = bus.WriteQuick(addr);
        
        if (result === 0x00)
        {//Log good addresses
            bus.log("DeviceAddress: " + addr + " DeviceResult: " + result);
            let ValidModel = AsusMobo.TestDeviceModel(addr);
            let ValidManufacturer = AsusMobo.TestManufactureName(addr);
            if(ValidModel && ValidManufacturer)
            {
                bus.log("Motherboard Returned Valid Model and Non-Micron Manufacturer.");
                FoundAddresses.push(addr);
            }
        }
    }

	return FoundAddresses;
}

let vLedNames = [];
let vLedPositions = [];
let vSubdeviceLeds = [];
let vSubdeviceNames = [];

let configTable = [];
let deviceLEDCount = 0;
let deviceName = "";
let deviceProtocolVersion = "";
let ParentDeviceName = "";
export function SupportsSubdevices(){ return true; }

export function Initialize() 
{
    device.setName(device.getMotherboardName() + " Motherboard Controller");
    ParentDeviceName = device.getMotherboardName();
    AsusMotherboard.getDeviceInformation();
    AsusMotherboard.getDeviceLEDs();
    AsusMotherboard.createSubdevices();
    AsusMotherboard.setDirectMode(0x01);
}

export function Render() 
{
    sendColors();
}

export function Shutdown() 
{
    AsusMotherboard.setDirectMode(0x00);
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
        if(deviceProtocolVersion === "V1")
        {
            AsusMotherboard.auraWriteRegisterBlock(AsusMotherboard.auraCommands.colorCtlV1, RGBData.length, RGBData);
            AsusMotherboard.auraWriteRegister(AsusMotherboard.auraCommands.apply, 0x01);
        }
        else
        {
           AsusMotherboard.auraWriteRegisterBlock(AsusMotherboard.auraCommands.colorCtlV2, RGBData.length, RGBData);
        }
}

class AsusSMBusInterface
{
	constructor(bus)
    {
		this.bus = bus;
	}
	ReadRegister(){ this.bus.log("Unimplimented Virtual Function!"); }
	WriteRegister(){ this.bus.log("Unimplimented Virtual Function!"); }
	WriteBlock(){ this.bus.log("Unimplimented Virtual Function!"); }
}

class AsusSMBusInterfaceFree extends AsusSMBusInterface
{
	constructor(bus)
    {
		super(bus);
	}

	ReadRegister(address, register)
    {
		this.bus.WriteWord(address, 0x00, ((register << 8) & 0xFF00) | ((register >> 8) & 0x00FF));

		return this.bus.ReadByte(address, 0x81);
	}

	WriteRegister(address, register, value)
    {
		this.bus.WriteWord(address, 0x00, ((register << 8) & 0xFF00) | ((register >> 8) & 0x00FF));
		this.bus.WriteByte(address, 0x01, value);
	}
	WriteBlock(address, register, data)
    {
		this.bus.WriteWord(address, 0x00, ((register << 8) & 0xFF00) | ((register >> 8) & 0x00FF));
		this.bus.WriteBlock(address, 0x03, data.length, data);
	}
}

class AsusSMBusInterfaceFixed extends AsusSMBusInterface
{
	constructor(bus)
    {
		super(bus);
	}

	WriteBlock(register, data)
    {
		this.bus.WriteWord(0x00, ((register << 8) & 0xFF00) | ((register >> 8) & 0x00FF));
		this.bus.WriteBlock(0x03, data.length, data);
	}

	WriteRegister(register, value)
    {
		this.bus.WriteWord(0x00, ((register << 8) & 0xFF00) | ((register >> 8) & 0x00FF));
		this.bus.WriteByte(0x01, value);
	}
	ReadRegister(register)
    {
		this.bus.WriteWord(0x00, ((register << 8) & 0xFF00) | ((register >> 8) & 0x00FF));

		return this.bus.ReadByte(0x81);
	}
}

class AsusSMBus
{
	constructor(Interface)
    {
		this.Interface = Interface;

		this.registers = 
        {
			DeviceName: 0x1000,
			ManufactureName: 0x1025,
		};

        this.deviceNameDict =
        {
            "LED-0116"        : "V1",
            "AUMA0-E8K4-0101" : "V1",
            "AUDA0-E6K5-0101" : "V2",
            "AUMA0-E6K5-0104" : "V2",
            "AUMA0-E6K5-0105" : "V2",
            "AUMA0-E6K5-0106" : "V2",
            "AUMA0-E6K5-0107" : "GPU V2",
            "DIMM_LED-0102"   : "V1",
            "DIMM_LED-0103"   : "V1"
        }
	}

	Bus()
    {
		return this.Interface.bus;
	}

	IsFixedBus()
    {
		return this.Interface instanceof AsusSMBusInterfaceFixed;
	}

    TestDeviceModel(address)
    {
        // This can only be used while we have a free address bus.
		// if we do we can't directly call bus. We need to use this.Bus()
		if(this.IsFixedBus())
        {
			this.Bus().log("Bus Interface must be a \"Free\" Type to use this function! This can only be done inside of the Scan() export.");

			return false;
		}

        const Characters = [];

		for (let iIdx = 0; iIdx < 16; iIdx++) 
        {
			const iRet = this.Interface.ReadRegister(address, this.registers.DeviceName + iIdx);

			if(iRet > 0)
            {
				Characters.push(iRet);
			}
		}

		const DeviceModel = String.fromCharCode(...Characters);

        this.Bus().log(`Address: [${address}], Found Device Model: [${DeviceModel}]`);
        if(DeviceModel in this.deviceNameDict)
        {
            return true;
        }
    }

	TestManufactureName(address)
    {
		// This can only be used while we have a free address bus.
		// if we do we can't directly call bus. We need to use this.Bus()
		if(this.IsFixedBus())
        {
			this.Bus().log("Bus Interface must be a \"Free\" Type to use this function! This can only be done inside of the Scan() export.");

			return false;
		}

		const Characters = [];

		for (let iIdx = 0; iIdx < 21; iIdx++) 
        {
			const iRet = this.Interface.ReadRegister(address, this.registers.ManufactureName + iIdx);

			if(iRet > 0)
            {
				Characters.push(iRet);
			}
		}

		const ManufactureName = String.fromCharCode(...Characters);

		const InvalidManufactureString = ManufactureName.includes("Micron");

		if(InvalidManufactureString)
        {
			this.Bus().log(`Address: [${address}], Found Micron Manufacturer Name: [${ManufactureName}]`);
            return false;
		}
        else
        {
			this.Bus().log(`Valid Manufacture Name on address: [${address}]. Address Found: [${ManufactureName}]`);
            return true;
		}
	}
}

class AsusAuraSMBusController
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
            effectMode   : 0x8021,
            colorCtlV1   : 0x8000,
            colorCtlV2   : 0x8100,
            apply        : 0x80A0
        };

        this.ledConfigs = 
        {
            "V1" : 0x13,
            "V2" : 0x1B
        };

        this.deviceNameDict =
        {
            "LED-0116"        : "V1",
            "AUMA0-E8K4-0101" : "V1",
            "AUDA0-E6K5-0101" : "V2",
            "AUMA0-E6K5-0104" : "V2",
            "AUMA0-E6K5-0105" : "V2",
            "AUMA0-E6K5-0106" : "V2",
            "AUMA0-E6K5-0107" : "GPU V2",
            "DIMM_LED-0102"   : "V1",
            "DIMM_LED-0103"   : "V1"
        };
        //Map of zones to their respective names
        this.motherboardZones =
        {
            0x04 : "Sync",
            0x05 : "DRAM_2",
            0x82 : "Center_Start",
            0x83 : "Center",
            0x84 : "Audio",
            0x85 : "Back_IO",
            0x86 : "RGBHeader",
            0x87 : "RGBHeader_2",
            0x88 : "Backplate",
            0x8A : "DRAM",
            0x8B : "PCIE",
            0x91 : "RGBHeader_3",
            0x95 : "QLED"
        };
    }

    auraReadRegister(reg)
    {
        bus.WriteWord(0x00, (reg << 8) & 0xFF00 | (reg >> 8)  & 0x00FF);  

        return bus.ReadByte(0x81);
    }

    auraWriteRegister(reg, value)
    {
        bus.WriteWord(0x00, (reg << 8) & 0xFF00 | (reg >> 8)  & 0x00FF); 

        bus.WriteByte(this.registers.direction, value);
    }
    
    auraWriteRegisterBlock(reg, size, data)
    {
        bus.WriteWord(0x00, (reg << 8) & 0xFF00 | (reg >> 8)  & 0x00FF);
        bus.WriteBlock(this.registers.color, size, data);
    }

    createSubdevices()
    {
        for(let i = 0; i < vSubdeviceLeds.length; i++)
        {
            device.createSubdevice(vSubdeviceNames[i]);
            device.setSubdeviceName(vSubdeviceNames[i], `${ParentDeviceName} - ${vSubdeviceNames[i]}`);
            //device.setSubdeviceImage(vSubdeviceNames[i]);
            device.setSubdeviceSize(vSubdeviceNames[i], 1, 1);
        }
    }

    getDeviceLEDs()
    {
        for(let i = 0; i < deviceLEDCount; i++)
        {
            let ledIdx = configTable[this.ledConfigs[deviceProtocolVersion] + i];
            device.log(this.motherboardZones[ledIdx])
            if(this.motherboardZones[ledIdx])
            {
                vSubdeviceLeds.push(ledIdx);
                vSubdeviceNames.push(this.motherboardZones[ledIdx])
            }
        }
    }

    getDeviceInformation()
    {
        deviceName = this.getDeviceName();
        deviceProtocolVersion = this.deviceNameDict[deviceName];
        configTable = this.getDeviceConfigTable()
        deviceLEDCount = configTable[2];
        device.log("Device Type: " + deviceName);
        device.log("Device Protocol Version: " + deviceProtocolVersion);
        device.log("Device Onboard LED Count: " + deviceLEDCount);
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

    setDirectMode(enabled)
    {
        this.auraWriteRegister(this.auraCommands.directAccess, enabled);
        this.auraWriteRegister(this.auraCommands.apply, 0x01);
    }
}

const AsusMotherboard = new AsusAuraSMBusController();

function hexToRgb(hex) 
{
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}