export function Name() { return "EVGA 3000 Series GPU"; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/evga"; }
export function Type() { return "SMBUS"; }
export function Size() { return [5, 2]; }
export function DefaultPosition(){return [192, 127];}
export function DefaultScale(){return 12.5;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
ARGBLedCount:readonly
DisableMainBar:readonly
DisableSideLogo:readonly
DisableBackLogo:readonly
DisableARGBHeader:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"ARGBLedCount", "group":"lighting", "label":"ARGB Header Led Count", "min":"0", "max":"60", "type":"number", "default":"60"},
		{"property":"DisableMainBar", "group":"settings", "label":"Disable Main Bar Zone", "type":"boolean", "default":"0"},
		{"property":"DisableSideLogo", "group":"settings", "label":"Disable Side Logo Zone", "type":"boolean", "default":"0"},
		{"property":"DisableBackLogo", "group":"settings", "label":"Disable Back Logo Zone", "type":"boolean", "default":"0"},
		{"property":"DisableARGBHeader", "group":"settings", "label":"Disable ARGB Header Zone", "type":"boolean", "default":"0"},
	];
}

let vLedNames = [];
let vLedPositions = [];

/** @param {FreeAddressBus} bus */
export function Scan(bus) {
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus()) {
		return [];
	}

	for(const EVGAGpuId of EVGA3000GpuIds){
		if(EVGAGpuId.Vendor === bus.Vendor() &&
		EVGAGpuId.SubVendor === bus.SubVendor() &&
		EVGAGpuId.Device === bus.Product() &&
		EVGAGpuId.SubDevice === bus.SubDevice()
		){
			// No Quick Write test on Nvidia
			if(bus.ReadByteWithoutRegister(EVGAGpuId.Address) > 0){
				FoundAddresses.push(EVGAGpuId.Address);
			}

		}else{
			bus.log(`Expected Vendor [${EVGAGpuId.Vendor}] got Vendor [${bus.Vendor()}]`);
			bus.log(`Expected SubVender [${EVGAGpuId.SubVendor}] got Vendor [${bus.SubVendor()}]`);
			bus.log(`Expected Device [${EVGAGpuId.Device}] got Vendor [${bus.Product()}]`);
			bus.log(`Expected SubDevice [${EVGAGpuId.SubDevice}] got Vendor [${bus.SubDevice()}]`);
		}
	}

	return FoundAddresses;
}


export function onARGBLedCountChanged(){
	AmpereProtocol.SetARGBLedCount(ARGBLedCount);
}

export function Initialize() {
	SetGPUNameFromBusIds();
	AmpereProtocol.FetchFirmwareVersion();
	AmpereProtocol.SetSoftwareControl(true);
	AmpereProtocol.ReadCurrentModeData();
	RebuildLedArrays();
	HandleZoneDisables();

	AmpereProtocol.SetARGBLedCount(ARGBLedCount);

}

export function Render() {
	SendRGB();
	PollHardwareModes();
	// Mimic old Refresh Speed. Noticing slight color blending going from Blue to Red where a Purple color gets flashed
	device.pause(10);
}


export function Shutdown() {
	SendRGB(true);
}

function PollHardwareModes(){
	const PollInterval = 15000;

	if (Date.now() - PollHardwareModes.lastPollTime < PollInterval) {
		return;
	}

	AmpereProtocol.ReadCurrentModeData();

	let InvalidMode = false;

	for(const ZoneId in AmpereProtocol.Config.Zones){
		const Zone = AmpereProtocol.Config.Zones[ZoneId];

		if(Zone.ledCount > 0 && Zone.mode != 1 && !Zone.disabled){
			device.log(`Setting Zone: [${Zone.name}] back to Static Mode! Was in mode: [${Zone.mode}]`);
			InvalidMode = true;
			AmpereProtocol.SetZoneMode(ZoneId, 1);
		}
	}

	if(InvalidMode){
		AmpereProtocol.SetSoftwareControl(true);
	}

	PollHardwareModes.lastPollTime = Date.now();
}

export function onDisableMainBarChanged(){
	HandleZoneDisables();
}
export function onDisableSideLogoChanged(){
	HandleZoneDisables();
}
export function onDisableBackLogoChanged(){
	HandleZoneDisables();
}
export function onDisableARGBHeaderChanged(){
	HandleZoneDisables();
}

function HandleZoneDisables(){
	AmpereProtocol.Config.Zones.MainBar.disabled = DisableMainBar;
	AmpereProtocol.Config.Zones.SideLogo.disabled = DisableSideLogo;
	AmpereProtocol.Config.Zones.BackLogo.disabled = DisableBackLogo;
	AmpereProtocol.Config.Zones.ARGBHeader.disabled = DisableARGBHeader;
}

function SendRGB(shutdown = false){

	for(const ZoneId in AmpereProtocol.Config.Zones){
		const Zone = AmpereProtocol.Config.Zones[ZoneId];

		if(Zone.ledCount === 0 || Zone.disabled){
			continue;
		}

		let Color;

		if(shutdown){
			Color = hexToRgb(shutdownColor);
		}else if(LightingMode === "Forced") {
			Color = hexToRgb(forcedColor);
		} else {
			Color = device.color(...Zone.position);
		}

		AmpereProtocol.WriteRGB(Zone, Color);
	}
}


function SetGPUNameFromBusIds(){
	for(const EVGAGpuId of EVGA3000GpuIds){
		if(EVGAGpuId.Vendor === bus.Vendor() &&
		EVGAGpuId.SubVendor === bus.SubVendor() &&
		EVGAGpuId.Device === bus.Product() &&
		EVGAGpuId.SubDevice === bus.SubDevice()
		){
			device.setName(EVGAGpuId.Name);
		}
	}
}

function RebuildLedArrays(){
	vLedNames = [];
	vLedPositions = [];

	for(const ZoneId in AmpereProtocol.Config.Zones){
		const Zone = AmpereProtocol.Config.Zones[ZoneId];

		if(Zone.ledCount > 0){
			vLedNames.push(Zone.name);
			vLedPositions.push(Zone.position);
		}
	}

	device.setControllableLeds(vLedNames, vLedPositions);
}


function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}


class EVGAAmpereLedZone{
	constructor(offset, name, position, mode = -1, ledCount = -1){
		this.offset = offset;
		this.name = name;
		this.position = position;
		this.mode = mode;
		this.ledCount = ledCount;
		this.disabled = false;
	}
}

class EVGAAmpereProtocol{
	constructor(){
		this.Registers = {
			Firmware: 0xB1,
			CurrentMode: 0xC0,
			StaticColor: 0xC1
		};
		this.Config = {
			FirmwareVersion: "UNKNOWN",
			ARGBLedCount: 0,
			Zones: {
				MainBar: new EVGAAmpereLedZone(0, "Main Bar", [2, 1]),
				SideLogo: new EVGAAmpereLedZone(1, "Side Logo", [4, 1]),
				BackLogo: new EVGAAmpereLedZone(2, "Back Logo", [3, 1]),
				ARGBHeader: new EVGAAmpereLedZone(3, "ARGB Header", [3, 1]),
			}
		};
	};
	/**
	 * @returns string
	 */
	FetchFirmwareVersion(){
		const [ReturnCode, Data] = bus.ReadBlockBytes(this.Registers.Firmware, 6, []);

		if(ReturnCode < 0){
			device.log(`Failed to read Firmware version. Error Code: [${ReturnCode}]`);

			return "UNKNOWN";
		}

		const Firmware = `${Data[3]}.${Data[4]}.${Data[5]}`;
		this.Config.FirmwareVersion = Firmware;

		device.log(`Firmware Version: [${this.Config.FirmwareVersion}]`);

		return Firmware;
	}

	ReadCurrentModeData(){
		const [ReturnCode, Data] = bus.ReadBlockBytes(this.Registers.CurrentMode, 10, []);

		if(ReturnCode < 0){
			device.log(`Failed to read Current Modes. Error Code: [${ReturnCode}]`);

			return;
		}

		this.Config.Zones.MainBar.mode = Data[1];
		this.Config.Zones.SideLogo.mode = Data[2];
		this.Config.Zones.BackLogo.mode = Data[3];
		this.Config.Zones.ARGBHeader.mode = Data[4];
		this.Config.Zones.MainBar.ledCount = Data[5];
		this.Config.Zones.SideLogo.ledCount = Data[6];
		this.Config.Zones.BackLogo.ledCount = Data[7];
		this.Config.Zones.ARGBHeader.ledCount = Data[8];
		this.Config.ARGBLedCount = Data[8];

		//device.log(Data);
		//device.log(`Current Modes:\n Zone 1 Mode: [${this.Config.Zones.MainBar.mode}],\n Zone 2 Mode: [${this.Config.Zones.SideLogo.mode}],\n Zone 3 Mode: [${this.Config.Zones.BackLogo.mode}],\n Zone 4 Mode: [${this.Config.Zones.ARGBHeader.mode}]\n ARGB Led Count: [${this.Config.ARGBLedCount}]`);
	}
	SetARGBLedCount(Count){
		device.log(`Setting ARGB Led Count to: [${Count}]`);

		const packet = [
			0x09,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			Count,
			0x00,
		];

		const ReturnCode = bus.WriteBlock(this.Registers.CurrentMode, 10, packet);

		if(ReturnCode < 0){
			device.log(`Failed to write Current Modes. Error Code: [${ReturnCode}]`);
		}

		// Read current modes again to confirm the change
		this.ReadCurrentModeData();
	}
	SetZoneMode(ZoneId, Mode){
		if(!this.Config.Zones.hasOwnProperty(ZoneId)){
			device.log(`SetZoneMode(): Zone: [${ZoneId}] does not exist!`);
		}
		const ZoneObject = this.Config.Zones[ZoneId];

		device.log(`Setting Zone: [${ZoneId}] to mode: [${Mode}]`);

		const packet = [
			0x09,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			0xFF,
			0x00,
		];

		packet[ZoneObject.offset + 1] = Mode;

		const ReturnCode = bus.WriteBlock(this.Registers.CurrentMode, 10, packet);

		if(ReturnCode < 0){
			device.log(`Failed to write Current Modes. Error Code: [${ReturnCode}]`);
		}

		// Read current modes again to confirm the change
		this.ReadCurrentModeData();
	}

	SyncModesToHardware(){

		const packet = [
			0x09,
			this.Config.Zones.MainBar.mode,
			this.Config.Zones.SideLogo.mode,
			this.Config.Zones.BackLogo.mode,
			this.Config.Zones.ARGBHeader.mode
		];
		const ReturnCode = bus.WriteBlock(this.Registers.CurrentMode, 10, packet);

		if(ReturnCode < 0){
			device.log(`Failed to write Current Modes. Error Code: [${ReturnCode}]`);
		}
	}
	SetSoftwareControl(Enabled){
		if(Enabled){
			const packet = [0x04, 0xc6, 0xEB, 0xEA, 0x15];
			bus.WriteBlock(0xB2, 5, packet);

			//packet = [0x07, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00];
			//bus.WriteBlock(0x52, 8, packet);
		}
	}
	WriteRGB(Zone, Color = []){
		const packet = [0x04, 0x255];
		packet.push(...Color);

		bus.WriteBlock(this.Registers.StaticColor + Zone.offset, 5, packet);
	}

};

const AmpereProtocol = new EVGAAmpereProtocol();


class GPUIdentifier{
	constructor(Vendor, SubVendor, Device, SubDevice, Address, Name, Model = ""){
		this.Vendor = Vendor;
		this.SubVendor = SubVendor;
		this.Device = Device;
		this.SubDevice = SubDevice;
		this.Address = Address;
		this.Name = Name;
		this.Model = Model;
	}
}

class EVGAAmpereIdentifier extends GPUIdentifier{
	constructor(Device, SubDevice, Name, Model = ""){
		super(0x10DE, 0x3842, Device, SubDevice, 0x2D, Name, Model);
	}
}


const EVGA3000GpuIds = [
	new EVGAAmpereIdentifier(0x2482, 0x3783, "EVGA RTX 3070Ti XC3 Gaming")
];