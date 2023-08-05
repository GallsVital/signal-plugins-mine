export function Name() { return "MSI Mystic Light Controller"; }
export function VendorId() { return 0x1462; }
export function Documentation(){ return "troubleshooting/msi"; }
// DO NOT PID SWAP THIS IF YOU DONT KNOW WHAT YOUR DOING
export function ProductId() { return Object.keys(MSIMotherboard.Library);}
// YOU CAN BRICK THESE MOTHERBOARDS RGB CONTROLLER WITH ONE WRONG PACKET
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [0, 0]; }
export function Type() { return "Hid"; }
export function DefaultPosition(){return [0, 0];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
advancedMode:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"advancedMode", "group":"", "label":"Advanced Onboard LED Placement", "type":"boolean", "default": "false"},
	];
}
export function ConflictingProcesses() {
	return ["LedKeeper.exe", "Dragon Center", "DCv2.exe", "LightKeeperService.exe", "LightKeeperService2.exe" ];
}

const ParentDeviceName = "Mystic Light Controller";

const DeviceMaxLedLimit = 360;

//Channel Name, Led Limit
const ChannelArray = [];

let vLedNames = [];
let vLedPositions = [];

let perLED = false;
let CorsairHeaders = 0;
let ARGBHeaders = 0;
let OnboardLEDs = 0;
let JPipeLEDs = 0;
let RGBHeaders = 0;
let gen2Support = false;

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	MSIMotherboard.checkPerLEDSupport();
	MSIMotherboard.detectGen2Support(); //Kind of cheating to call this detection, but welcome to MSI. Abandon all hope of autodetection.
	MSIMotherboard.createLEDs();

	if(perLED) { MSIMotherboard.setPerledMode(true); }

	device.setName(device.getMotherboardName());
	//device.write([0x01, 0xbb, 0x00, 0x00, 0x00, 0x00, 0x01], 64); //Let's make sure users have their leds on in bios.
}

export function Render() {
	MSIMotherboard.choosePacketSendType();
}

export function Shutdown() {
	MSIMotherboard.choosePacketSendType(true);
}

export function onadvancedModeChanged() {
	MSIMotherboard.createLEDs();
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint) {
	return endpoint.interface === 2 | -1;
}

class MysticLight {
	constructor() {

		this.ConfigurationOverrides =
		{
			"MAG Z790 TOMAHAWK DDR4 WIFI (MS-7D91)":
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
			},

			"MAG Z790 TOMAHAWK WIFI (MS-7D91)":
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
			},

			"MPG B550 GAMING EDGE WIFI (MS-7C91)" :
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
		};


		this.Library =
		{
			0x7B93 : //X570 Gaming Pro Carbon Wifi
			{
				OnboardLEDs    : 7,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 1,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 8,
				ForceZoneBased	  : true,
				JARGB_V2		  : false
			},
			0x7C34 : //X570 Godlike
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 2,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 20,
				ForceZoneBased	  : true,
				JARGB_V2		  : false //WHY ARE YOU LIKE THIS
			},
			0x7C35 : //X570 Ace
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 1,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 17,
				ForceZoneBased	  : true,
				JARGB_V2		  : false
			},
			0x7C36 : //X570 Creation
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 1,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 12,
				ForceZoneBased	  : true,
				JARGB_V2		  : false
			},
			0x7C37 : //X570 Gaming Edge
			{
				OnboardLEDs    : 7,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : true,
				JARGB_V2		  : false
			},
			0x7C56 : //B550 Gaming Plus
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C59 : //Creator TRX40
			{
				OnboardLEDs    : 8,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 8,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C70 : //Z490 Godlike
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 2,
				CorsairHeaders : 2,
				//PERLED
				PerLEDOnboardLEDs : 26,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C71 : //Z490 Ace
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 2,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 12,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C73 : //Z490 Gaming Carbon
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 10,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C75 : //Z490 Gaming Plus
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C76 : //Z490M Gaming Edge
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C77 : //Z490 Ace
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 0,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C79 : //Z490 Gaming Edge
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C80 : //Z490 Tomahawk
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C81 : //B460 Tomahawk
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C82 : //B460 M Mortar
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C83 : //Mag B460 M Bazooka
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C84 : //Mag X570 Tomahawk Wifi
			{
				OnboardLEDs    : 7,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C85 : //B460-A Pro
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C86 : //B460I Gaming Edge
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C88 : //B460M Pro
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C89 : //H410M Pro
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C90 : //B550 Gaming Carbon Wifi
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 10,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C91 : //B550 Gaming Edge Max Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C92 : //B550I Gaming Edge Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 0,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C94 : //B550M Mortar
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C95 : //B550-M Bazooka
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C98 : //Z490-S01
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7C99 : //Z490M
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D03 : //Z590 GODLIKE
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 32, //?!?!?!?
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D04 : //Z590 Ace
			{
				OnboardLEDs    : 6, //This thing has 21 LEDs
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 21,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D05 : //Z590I Unify
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 0,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D06 : //Z590 Carbon Wifi/Z590 Gaming Force
			{
				OnboardLEDs    : 8,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 8,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D07 : //Z590 Gaming Edge
			{
				OnboardLEDs    : 8,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 8,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D08 : //Z590 Tomahawk
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D09 : //Z590 Pro
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D10 : //Z590-A Pro
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D11 : //Z590 Plus
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D12 : //Z690M Gaming Edge Wifi
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 10,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D13 : //B550 Unify-X
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D14 : //B550 Gaming Carbon Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D15 : //B560 Tomahawk Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D16 : //B560 Tomahawk
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D17 : //B560M Mortar
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D18 : //B560M Bazooka
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D19 : //B560I Gaming Edge
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D20 : //B560M Pro
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D21 : //B560M Pro Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
			},
			0x7D22 : //H510M-Pro
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D25 : //Pro Z690-A
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D27 : //MEG Z690 Ace
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D28 : //MEG Z690 Unify
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D29 : //MEG Z690I Unify
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 0,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D30 : //MPG Z690 Carbon
			{
				OnboardLEDs    : 10,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 1,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 11,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D31 : //MPG Z690 Edge
			{
				OnboardLEDs    : 8,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0, //This board has a Jpipe? It says to combine so idk what led is on that, we'll bypass it assuming it's PERLED
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 8,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D32 : //MAG Z690 Tomahawk
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D36 : //Pro Z690-P
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D37 : //B660M-A CEC
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D38 : //Z590 Unify
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D40 : //B660I Gaming Edge Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : true
			},
			0x7D41 : //B660 Tomahawk
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D42 : //Z690M Mortar
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D43 : //B660M Bazooka
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D45 : //B660M-G
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D46 : //H610M-G
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D50 : //X570S Ace Max
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 2,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 18,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D51 : //X570S Unify-X Max
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D52 : //X570 Carbon Max Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 2,
				CorsairHeaders : 1,
				//PERLED
				PerLEDOnboardLEDs : 20, //REDEMPTION!
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D53 : //X570 Edge Max Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D54 : //X570S Tomahawk
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D59 : //Pro B660-A
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : false
			},
			0x7D67 : //Pro X670
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D69 : //X670E Ace
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 12,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D70 : //X670E Carbon Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D73 : //B650I Edge Wifi
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 0,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D74 : //B650 Carbon Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D75 : //B650 Tomahawk WIFI
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true
			},
			0x7D76 : //B650M Mortar Wifi
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D77 : //B650M-A WIFI
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D78 : //B650-P
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D86 : //Z790 Ace
			{
				OnboardLEDs    : 7,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 12,
				ForceZoneBase	  : false,
				JARGB_V2		  : true,
			},
			0x7D89 : //Z790 Carbon Wifi
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D91 : //Z790 Edge
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D96 : //B760 Tomahawk Wifi
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D97 : //B660M Mortar Max
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7D98 : //B760-P
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},

			0x7D99 : //B760M-A Wifi
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7E01 : //B760M-MORTAR-MAX-WIFI-DDR4
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7E03 : //Z790-I Edge
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 0,
				ARGBHeaders    : 1,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7E06 : //Z790-P Wifi
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7E07 : //Z790-A Pro DDR4
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 1,
				ARGBHeaders    : 3,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x7E10 : //B650 Edge
			{
				OnboardLEDs    : 6,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 6,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
			0x0076 : //X670E Tomahawk I doubt this is actually the pid or MSI god so help me.
			{
				OnboardLEDs    : 0,
				RGBHeaders     : 2,
				ARGBHeaders    : 2,
				JPipeLEDs	   : 0,
				CorsairHeaders : 0,
				//PERLED
				PerLEDOnboardLEDs : 0,
				ForceZoneBased	  : false,
				JARGB_V2		  : true,
			},
		};

		this.OffsetDict =
		{
			MSI_185_JRGB1_OFFSET 	      : 0x01,
			MSI_185_JPIPE1_OFFSET         : 0x0B,
			MSI_185_JPIPE2_OFFSET         : 0x15,
			MSI_185_RAINBOW1_OFFSET   	  : 0x1F,
			MSI_185_RAINBOW2_OFFSET   	  : 0x2A,
			MSI_185_CORSAIR_OFFSET        : 0x35,
			MSI_185_CORSAIR_BACKUP_OFFSET : 0x40,
			MSI_185_MAINBOARD_1_OFFSET    : 0x4A,
			MSI_185_MAINBOARD_2_OFFSET    : 0x54,
			MSI_185_MAINBOARD_3_OFFSET    : 0x5E,
			MSI_185_MAINBOARD_4_OFFSET 	  : 0x68,
			MSI_185_MAINBOARD_5_OFFSET    : 0x72,
			MSI_185_MAINBOARD_6_OFFSET    : 0x7C,
			MSI_185_MAINBOARD_7_OFFSET    : 0x86,
			MSI_185_MAINBOARD_8_OFFSET    : 0x90,
			MSI_185_MAINBOARD_9_OFFSET    : 0x9A,
			MSI_185_MAINBOARD_10_OFFSET   : 0xA4,
			MSI_185_JRGB2_OFFSET 		  : 0xAE
		};

		this.packetOffsets =
		{
			mainboardDict :
			[
				this.OffsetDict.MSI_185_MAINBOARD_1_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_2_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_3_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_4_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_5_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_6_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_7_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_8_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_9_OFFSET,
				this.OffsetDict.MSI_185_MAINBOARD_10_OFFSET
			],

			JPipeDict :
			[
				this.OffsetDict.MSI_185_JPIPE1_OFFSET,
				this.OffsetDict.MSI_185_JPIPE2_OFFSET
			],

			RGBHeaderDict :
			[
				this.OffsetDict.MSI_185_JRGB1_OFFSET,
				this.OffsetDict.MSI_185_JRGB2_OFFSET
			],

			ARGBHeaderDict :
			[
				this.OffsetDict.MSI_185_RAINBOW1_OFFSET,
				this.OffsetDict.MSI_185_RAINBOW2_OFFSET
			],

			CorsairDict :
			[
				this.OffsetDict.MSI_185_CORSAIR_OFFSET,
				this.OffsetDict.MSI_185_CORSAIR_BACKUP_OFFSET
			]
		};

		this.ComponentArrays =
		{
			JRainbowArray :
			[
				["JRainbow 1", 120],
				["JRainbow 2", 120],
				["Jrainbow 3", 120]
			],

			JCorsairArray :
			[
				["JCorsair",  120],
			]
		};

		this.LEDArrays =
		{
			OnboardArray :
			[
				"Mainboard Led 1",
				"Mainboard Led 2",
				"Mainboard Led 3",
				"Mainboard Led 4",
				"Mainboard Led 5",
				"Mainboard Led 6",
				"Mainboard Led 7",
				"Mainboard Led 8",
				"Mainboard Led 9",
				"Mainboard Led 10",
				"Mainboard Led 11",
				"Mainboard Led 12",
				"Mainboard Led 13",
				"Mainboard Led 14",
				"Mainboard Led 15",
				"Mainboard Led 16",
				"Mainboard Led 17",
				"Mainboard Led 18",
				"Mainboard Led 19",
				"Mainboard Led 20"
			],

			JPipeArray :
			[
				"Jpipe Led 1",
				"Jpipe Led 2",
			],

			RGBHeaderArray :
			[
				"12v RGB Header 1",
				"12v RGB Header 2"
			],

			CorsairHeaderArray :
			[
				"Corsair",
				"Corsair Outer"
			],

			ARGBHeaderArray :
			[
				"5v ARGB Header 1",
				"5v ARGB Header 2"
			]
		};

		this.initialPacket =
		[
			0x52, //Header
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00, //JRGB1
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x64,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x64,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x82, 0x54, 0x0A,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x80, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00,
			0x01, 0xFF, 0x00, 0x00, 0x28, 0xFF, 0x00, 0x00, 0x00, 0x00, //JRGB2
			0x00 //No saving
		];

		this.perledpacket =
		[
			0x52, //enable, r,g,b, options, r,g,b,sync,seperator
			0x01, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x80, 0x00, //JRGB1
			0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JPipe1
			0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JPipe2
			0x01, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x80, 0x00, 0x4B, //JRainbow1 //Extra Byte determines number of leds
			0x00, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x80, 0x00, 0x4B, //JRainbow2
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x82, 0x00, 0x78, //JRainbow3 or Corsair?
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JCorsair other?
			0x25, 0x00, 0x00, 0x00, 0xa9, 0x00, 0x00, 0x00, 0x9f, 0x00, //JOnboard1
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard2
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard3
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard4
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard5
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard6
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard7
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard8
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard9
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard10
			0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JRGB2
			0x00 //Save Flag
		];

		this.splitPerLEDPacket =
		[
			0x52, //enable, r,g,b, options, r,g,b,sync,seperator
			0x01, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x80, 0x00, //JRGB1
			0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JPipe1
			0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JPipe2
			0x25, 0x00, 0x00, 0x00, 0x29, 0x00, 0x00, 0x00, 0x80, 0x00, 0x78, //JRainbow1 //Extra Byte determines number of leds We're keeping these capped at 75 for now. No boom. This does give headroom for up to 200.
			0x25, 0x00, 0x00, 0x00, 0x29, 0x00, 0x00, 0x00, 0x80, 0x00, 0x78, //JRainbow2
			0x25, 0x00, 0x00, 0x00, 0x29, 0x00, 0x00, 0x00, 0x82, 0x00, 0x78, //JRainbow3 or Corsair?
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JCorsair other?
			0x25, 0x00, 0x00, 0x00, 0xa9, 0x00, 0x00, 0x00, 0xb1, 0x00, //JOnboard1
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard2
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard3
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard4
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard5
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard6
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard7
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard8
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard9
			0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard10
			0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JRGB2
			0x00 //Save Flag
		];

		this.lastonboardData = [];
		this.lastheader1Data = [];
		this.lastheader2Data = [];
		this.lastheader3Data = [];

		this.header1LEDCount = 0;
		this.header2LEDCount = 0;
		this.header3LEDCount = 0;

	}

	checkPerLEDSupport() {
		const response = device.send_report([0x53], 725);

		if(response > 0) {
			perLED = true;
			device.log("Motherboard is PerLED 🙂", {toFile:true});
		} else {
			device.log("Motherboard is not PerLED 😔", {toFile:true});
		}

		if(this.Library[device.productId()]["ForceZoneBased"] === true) //I'm leaving this untouched, as no new boards are zone based. Lord so help me if that changes MSI.
		{
			perLED = false;
		}
	}

	CheckPacketLength() {
		device.get_report([0x52], 200);

		return device.getLastReadSize();
	}

	createLEDs() {
		if(device.getMotherboardName() in this.ConfigurationOverrides) {
			this.createStandardLEDs(this.ConfigurationOverrides[device.getMotherboardName()]);
			device.log("Using Configuration Override", {toFile:true});
		} else {
			this.createStandardLEDs(this.Library[device.productId()], advancedMode);
		}

		device.log(`Device has ${OnboardLEDs} Onboard LEDs, ${RGBHeaders} RGB Headers, ${ARGBHeaders} ARGB Headers, and ${JPipeLEDs} JPipe LEDs.`);
	}

	createStandardLEDs(configTable, advancedMode = false) {

		for(let RGBHeaders = 0; RGBHeaders < configTable["RGBHeaders"]; RGBHeaders++) {
			this.createSubdevice(this.LEDArrays.RGBHeaderArray[RGBHeaders]);
		}

		ARGBHeaders = configTable["ARGBHeaders"];
		CorsairHeaders = configTable["CorsairHeaders"];

		if(perLED === false) {
			for(let JPipeLEDs = 0; JPipeLEDs < configTable["JPipeLEDs"]; JPipeLEDs++) {
				this.createSubdevice(this.LEDArrays.JPipeArray[JPipeLEDs]);
			}

			for(let ARGBHeaders = 0; ARGBHeaders < configTable["ARGBHeaders"]; ARGBHeaders++) {
				this.createSubdevice(this.LEDArrays.ARGBHeaderArray[ARGBHeaders]);
			}

			for(let CorsairHeaders = 0; CorsairHeaders < configTable["CorsairHeaders"]; CorsairHeaders++) {
				this.createSubdevice(this.LEDArrays.CorsairHeaderArray[CorsairHeaders]);
			}

			for(let OnboardLEDs = 0; OnboardLEDs < configTable["OnboardLEDs"]; OnboardLEDs++) {
				this.createSubdevice(this.LEDArrays.OnboardArray[OnboardLEDs]);
			}

			JPipeLEDs = configTable["JPipeLEDs"];
			OnboardLEDs = configTable["OnboardLEDs"];
		} else {

			OnboardLEDs = configTable["PerLEDOnboardLEDs"];

			if(advancedMode === true) {
				vLedNames = [];
				vLedPositions = [];

				for(let OnboardLEDs = 0; OnboardLEDs < (configTable["PerLEDOnboardLEDs"]); OnboardLEDs++) {
					device.removeSubdevice(this.LEDArrays.OnboardArray[OnboardLEDs]);
					this.createSubdevice(this.LEDArrays.OnboardArray[OnboardLEDs]);
					device.setControllableLeds(vLedNames, vLedPositions);
				}
			} else {
				vLedNames = [];
				vLedPositions = [];

				for(let deviceLEDs = 0; deviceLEDs < OnboardLEDs; deviceLEDs++) {
					device.removeSubdevice(this.LEDArrays.OnboardArray[deviceLEDs]);
					vLedNames.push(`LED ${deviceLEDs + 1}`);
					vLedPositions.push([ deviceLEDs, 0 ]);
					device.setSize([vLedPositions.length+1, 2]);
					device.setControllableLeds(vLedNames, vLedPositions);
				}
			}

			this.SetupChannels();
		}

		RGBHeaders = configTable["RGBHeaders"];
	}

	createConfigurationOverrideLEDs() {
		for(let RGBHeaders = 0; RGBHeaders < this.ConfigurationOverrides[device.getMotherboardName()]["RGBHeaders"]; RGBHeaders++) {
			this.createSubdevice(this.LEDArrays.RGBHeaderArray[RGBHeaders]);
		}

		ARGBHeaders = this.ConfigurationOverrides[device.getMotherboardName()]["ARGBHeaders"];
		CorsairHeaders = this.ConfigurationOverrides[device.getMotherboardName()]["CorsairHeaders"];

		if(perLED === false) {
			for(let JPipeLEDs = 0; JPipeLEDs < this.ConfigurationOverrides[device.getMotherboardName()]["JPipeLEDs"]; JPipeLEDs++) {
				this.createSubdevice(this.LEDArrays.JPipeArray[JPipeLEDs]);
			}

			for(let ARGBHeaders = 0; ARGBHeaders < this.ConfigurationOverrides[device.getMotherboardName()]["ARGBHeaders"]; ARGBHeaders++) {
				this.createSubdevice(this.LEDArrays.ARGBHeaderArray[ARGBHeaders]);
			}

			for(let CorsairHeaders = 0; CorsairHeaders < this.ConfigurationOverrides[device.getMotherboardName()]["CorsairHeaders"]; CorsairHeaders++) {
				this.createSubdevice(this.LEDArrays.CorsairHeaderArray[CorsairHeaders]);
			}

			for(let OnboardLEDs = 0; OnboardLEDs < this.ConfigurationOverrides[device.getMotherboardName()]["OnboardLEDs"]; OnboardLEDs++) {
				this.createSubdevice(this.LEDArrays.OnboardArray[OnboardLEDs]);
			}

			JPipeLEDs = this.ConfigurationOverrides[device.getMotherboardName()]["JPipeLEDs"];
			OnboardLEDs = this.ConfigurationOverrides[device.getMotherboardName()]["OnboardLEDs"];
		} else {

			const moboName = device.getMotherboardName();

			OnboardLEDs = this.ConfigurationOverrides[moboName]["PerLEDOnboardLEDs"];

			if(advancedMode === true) {
				vLedNames = [];
				vLedPositions = [];

				for(let OnboardLEDs = 0; OnboardLEDs < (this.ConfigurationOverrides[moboName]["PerLEDOnboardLEDs"]); OnboardLEDs++) {
					device.removeSubdevice(this.LEDArrays.OnboardArray[OnboardLEDs]);
					this.createSubdevice(this.LEDArrays.OnboardArray[OnboardLEDs]);
					device.setControllableLeds(vLedNames, vLedPositions);
				}
			} else {
				vLedNames = [];
				vLedPositions = [];

				for(let deviceLEDs = 0; deviceLEDs < OnboardLEDs; deviceLEDs++) {
					device.removeSubdevice(this.ConfigurationOverrides[moboName]["PerLEDOnboardLEDs"]);
					vLedNames.push(`LED ${deviceLEDs + 1}`);
					vLedPositions.push([ deviceLEDs, 0 ]);
					device.setSize([vLedPositions.length+1, 2]);
					device.setControllableLeds(vLedNames, vLedPositions);
				}
			}

			this.SetupChannels();
		}

		RGBHeaders  = this.ConfigurationOverrides[device.getMotherboardName()]["RGBHeaders"];
	}

	SetupChannels() {
		device.SetLedLimit(DeviceMaxLedLimit);

		for(let i = 0; i < ARGBHeaders; i++) {
			ChannelArray.push(this.ComponentArrays.JRainbowArray[i]);
		}

		for(let i = 0; i < CorsairHeaders; i++) {
			ChannelArray.push(this.ComponentArrays.JCorsairArray[i]);
		}

		for(let i = 0; i < ChannelArray.length; i++) {
			device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
		}
	}

	createSubdevice(SubdeviceName) {

		device.createSubdevice(SubdeviceName);
		device.setSubdeviceName(SubdeviceName, `${ParentDeviceName} - ${SubdeviceName}`);
		device.setSubdeviceImage(SubdeviceName, "");
		device.setSubdeviceSize(SubdeviceName, 3, 3);
	}

	setDeviceZones(shutdown = false) {
		this.setZoneLeds(this.packetOffsets.mainboardDict, this.LEDArrays.OnboardArray, OnboardLEDs, shutdown);
		this.setZoneLeds(this.packetOffsets.JPipeDict, this.LEDArrays.JPipeArray, JPipeLEDs, shutdown);
		this.setZoneLeds(this.packetOffsets.ARGBHeaderDict, this.LEDArrays.ARGBHeaderArray, ARGBHeaders, shutdown);
		this.setZoneLeds(this.packetOffsets.CorsairDict, this.LEDArrays.CorsairHeaderArray, CorsairHeaders, shutdown);
		this.setZoneLeds(this.packetOffsets.RGBHeaderDict, this.LEDArrays.RGBHeaderArray, RGBHeaders, shutdown);
	}

	setZoneLeds(zone, zoneArray, zoneLEDs, shutdown) {
		for(let iIdx = 0; iIdx < zoneLEDs; iIdx++) {
			let col;

			if(shutdown) {
				col = hexToRgb(shutdownColor);
			} else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			} else {
				col = device.subdeviceColor(zoneArray[iIdx], 1, 1);
			}

			this.setZoneColor(this.initialPacket, zone[iIdx], col);
		}
	}

	setZoneColor(packet, zone, color) {
		packet[zone + 1] = color[0];
		packet[zone + 2] = color[1];
		packet[zone + 3] = color[2];
	}

	applyZones() {
		device.send_report(this.initialPacket, 185);
	}

	GrabOnboardLEDs(iIdx, shutdown = false) {
		let col;

		if(advancedMode === true) {

			if(shutdown) {
				col = hexToRgb(shutdownColor);
			} else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			} else {
				col = device.subdeviceColor(this.LEDArrays.OnboardArray[iIdx], 1, 1);
			}

			return col;
		}

		if(shutdown){
			col = hexToRgb(shutdownColor);
		}else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		}else{
			col = device.color(vLedPositions[iIdx][0], vLedPositions[iIdx][1]);
		}

		return col;
	}

	GrabRGBHeaders(iIdx, shutdown = false) {
		let col;

		if(shutdown) {
			col = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			col = hexToRgb(forcedColor);
		} else {
			col = device.subdeviceColor(this.LEDArrays.RGBHeaderArray[iIdx], 1, 1);
		}

		return col;
	}

	grabChannelRGBData(Channel, shutdown) {
    	let ChannelLedCount = device.channel(ChannelArray[Channel][0]).LedCount();
		const componentChannel = device.channel(ChannelArray[Channel][0]);

		let RGBData = [];

		if(shutdown){
			RGBData = device.createColorArray(shutdownColor, ChannelLedCount, "Inline");
		} else if(LightingMode === "Forced") {
			RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline");
		} else if(componentChannel.shouldPulseColors()) {
			ChannelLedCount = 80;

			const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0], ChannelLedCount);
			RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline");
		} else {
			RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline");
		}

    	return RGBData;
	}

	detectGen2Support() {
		if(this.Library[device.productId()]["JARGB_V2"] === true) {
			gen2Support = true;
			device.log("Gen 2 Supported.");

			for(let headers = 0; headers < ARGBHeaders; headers++){
				device.write([0x01, 0x84, 0x00, 0x00, 0x00, 0x00, headers, 0x00], 64);
				device.pause(1000);
			}
		}
	}

	detectGen2Devices() {
		let ARGBGen2Strips = 0;
		device.clearReadBuffer();

		for(let ports = 0; ports < this.Library[device.productId()]["ARGBHeaders"]; ports++) {
			const portStrips = this.detectARGBGen2(ports);
			ARGBGen2Strips = ARGBGen2Strips + portStrips;
		}

		const Gen2InfoPacket = device.get_report([0x80], 242); //0x80 is for first port. If I want accurate counts from second port I need to do 0x81. Probably 0x82 for 3rd port.

		for(let gen2Strips = 0; gen2Strips < ARGBGen2Strips; gen2Strips++) {
			device.log(`Gen 2 Strip ${gen2Strips} has ${Gen2InfoPacket[15 + 16 * gen2Strips]} LEDs in it.`);
		}
	}

	detectARGBGen2(port) {
		device.write([0x01, 0x82, 0x00, 0x00, 0x00, 0x00, port], 64);

		const returnPacket = device.read([0x01, 0x82], 64);
		const gen2DeviceSupport = false;

		if(returnPacket[7] !== 0) {
			device.log(`Port ${port} has ${returnPacket[7]} Gen 2 Devices Connected to it.`);

			return returnPacket[7];
		}

		device.log(`Port ${port} has no Gen 2 Devices Connected.`);

		return 0;

		//device.log(returnPacket[6]); //Port
		//device.log(returnPacket[7]); //Gen 2 Strips.

	}

	getARGBGen2Mode(port) {
		device.write([0x01, 0x80, 0x00, 0x00, 0x00, 0x00, port], 64);

		const returnPacket = device.read([0x01, 0x80], 64);
		device.log(returnPacket);

		const Gen2Enabled = returnPacket[7];

		return Gen2Enabled;
	}

	setARGBGen2Mode(port, enable) {
		device.write([0x01, 0x84, 0x00, 0x00, 0x00, 0x00, port, enable], 64);
	}

	grabZones(shutdown) {
		const OnboardLEDData = [];
		const RGBHeaderData = [];

		for(let iIdx = 0; iIdx < OnboardLEDs; iIdx++) {
			OnboardLEDData.push(...this.GrabOnboardLEDs(iIdx, shutdown));
		}

		for(let iIdx = 0; iIdx < RGBHeaders; iIdx++) {
			RGBHeaderData.push(...this.GrabRGBHeaders(iIdx, shutdown));
		}

		return [ OnboardLEDData, RGBHeaderData ];
	}

	choosePacketSendType(shutdown = false) {
		if(perLED) {
			MSIMotherboard.setPerledMode();

			if(this.getTotalLEDCount()) {
				this.sendGen1ARGB(shutdown);
			} else {
				if(gen2Support) {
					this.sendGen2SplitPacketARGB(shutdown);
				} else {
					this.sendGen1SplitPacketARGB(shutdown);
				}
			}
		} else {
			if(MSIMotherboard.CheckPacketLength() !== 185) {
				device.log("PACKET LENGTH ERROR. ABORTING RENDERING");

				return;
			}

			MSIMotherboard.setDeviceZones();
			MSIMotherboard.applyZones();
		}

	}

	getTotalLEDCount() {
		const totalLEDCount = this.header1LEDCount + this.header2LEDCount + this.header3LEDCount + OnboardLEDs + RGBHeaders;

		if(totalLEDCount < 235) {
			return true; //return true if we can use the smaller packets.
		}

		return false;
	}

	checkChangedLengths() {
		let header1Count = 1;
		let header2Count = 1;
		let header3Count = 1;

		if(ARGBHeaders > 0) {
			header1Count = device.channel(ChannelArray[0][0]).LedCount();

			if(ARGBHeaders > 1) {
				header2Count = device.channel(ChannelArray[1][0]).LedCount();
			}
		}

		if(ARGBHeaders > 2 || CorsairHeaders > 0) {
			header3Count = device.channel(ChannelArray[2][0]).LedCount();
		}

		if(header1Count !== this.header1LEDCount || header2Count !== this.header2LEDCount || header3Count !== this.header3LEDCount) {
			this.header1LEDCount = header1Count;
			this.header2LEDCount = header2Count;
			this.header3LEDCount = header3Count;

			return true;
		}

		return false;
	}

	setPerledMode(bypass = false) {
		if(this.checkChangedLengths() || bypass) {
			if(this.getTotalLEDCount()) {
				device.send_report([
					0x52, //enable, r,g,b, options, r,g,b,sync,seperator
					0x01, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x80, 0x00, //JRGB1
					0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JPipe1
					0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JPipe2
					0x00, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, this.header1LEDCount > 1 ? this.header1LEDCount : 1, //JRainbow1 //Extra Byte determines number of leds
					0x00, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, this.header2LEDCount > 1 ? this.header2LEDCount : 1, //JRainbow2
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x82, 0x00, this.header3LEDCount > 1 ? this.header3LEDCount : 1, //JRainbow3 or Corsair? //61
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JCorsair other?
					0x25, 0x00, 0x00, 0x00, 0xa9, 0x00, 0x00, 0x00, 0x9f, 0x00, //JOnboard1
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard2
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard3
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard4
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard5
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard6
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard7
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard8
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard9
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard10
					0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JRGB2
					0x00 //Save Flag
				], 185);
				device.log("Sent Efficiency PerLED Config Setup Packet.");
			} else {
				device.send_report([
					0x52, //enable, r,g,b, options, r,g,b,sync,seperator
					0x00, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x80, 0x00, //JRGB1
					0x00, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JPipe1
					0x00, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JPipe2
					0x25, 0x00, 0x00, 0x00, 0x29, 0x00, 0x00, 0x00, 0x80, 0x00, this.header1LEDCount > 1 ? this.header1LEDCount : 1, //JRainbow1
					0x25, 0x00, 0x00, 0x00, 0x29, 0x00, 0x00, 0x00, 0x80, 0x00, this.header2LEDCount > 1 ? this.header2LEDCount : 1, //JRainbow2
					0x25, 0x00, 0x00, 0x00, 0x29, 0x00, 0x00, 0x00, 0x82, 0x00, this.header3LEDCount > 1 ? this.header3LEDCount : 1, //JRainbow3 or Corsair?
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JCorsair other?
					0x25, 0x00, 0x00, 0x00, 0xa9, 0x00, 0x00, 0x00, 0xb1, 0x00, //JOnboard1
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard2
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard3
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard4
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard5
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard6
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard7
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard8
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard9
					0x01, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x80, 0x00, //JOnboard10
					0x01, 0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x80, 0x00, //JRGB2
					0x00 //Save Flag
				], 185);
				device.log("Sent High Capacity PerLED Config Setup Packet.");
			}

		}
	}

	sendGen1ARGB(shutdown = false) {
		const [OnboardLEDData, RGBHeaderData] = this.grabZones(shutdown);
		const packet = [0x53, 0x25, 0x06, 0x00, 0x00]; //Header for RGB Sends
		packet.push(...OnboardLEDData.splice(0, 3*OnboardLEDs)); //Push Onboard LEDs First.
		packet.push(...RGBHeaderData.splice(0, 3*RGBHeaders)); //Push Data From RGB Headers.

		if(ARGBHeaders > 0) {
			const header1Data = this.grabChannelRGBData(0);
			packet.push(...header1Data.splice(0, this.header1LEDCount !== 0 ? this.header1LEDCount*3 : 3));

			if(ARGBHeaders > 1 || CorsairHeaders > 0) {
				const header2Data = this.grabChannelRGBData(1);
				packet.push(...header2Data.splice(0, this.header2LEDCount !== 0 ? this.header2LEDCount*3 : 3));
			}

			if(ARGBHeaders > 2 || (CorsairHeaders > 0 && ARGBHeaders > 1)) {
				const header3Data = this.grabChannelRGBData(2);
				packet.push(...header3Data.splice(0, this.header3LEDCount !== 0 ? this.header3LEDCount*3 : 3));
			}
		}

		device.send_report(packet, 725);
	}

	sendGen1SplitPacketARGB(shutdown = false) {
		const [OnboardLEDData, RGBHeaderData] = this.grabZones(shutdown);
		OnboardLEDData.push(...RGBHeaderData); //Why did I separate these in the first place?

		const header1Data = this.grabChannelRGBData(0, shutdown);
		const header2Data = this.grabChannelRGBData(1, shutdown);
		let header3Data = [];

		if(ARGBHeaders > 2 || CorsairHeaders > 0) {
			header3Data = this.grabChannelRGBData(2, shutdown);
		}

		if(header1Data.length > 0 && !this.CompareArrays(this.lastheader1Data, header1Data)) {
			device.send_report([0x53, 0x25, 0x04, 0x00, 0x00].concat(header1Data), 725);
			device.pause(10);
			this.lastheader1Data = header1Data;
		}

		if(header2Data.length > 0 && !this.CompareArrays(this.lastheader2Data, header2Data)) {
			device.send_report([0x53, 0x25, 0x04, 0x01, 0x00].concat(header2Data), 725);
			device.pause(10);
			this.lastheader2Data = header2Data;
		}

		if(header3Data.length > 0 && !this.CompareArrays(this.lastheader3Data, header3Data)) {
			device.send_report([0x53, 0x25, 0x05, 0x00, 0x00].concat(header3Data), 725);
			device.pause(10);
			this.lastheader3Data = header3Data;
		}

		if(OnboardLEDData.length > 0 && !this.CompareArrays(this.lastonboardData, OnboardLEDData)) {
			device.send_report([0x53, 0x25, 0x06, 0x00, 0x00].concat(OnboardLEDData), 725);
			device.pause(10);
			this.lastonboardData = OnboardLEDData;
		}
	}

	CompareArrays(array1, array2) {
		return array1.length === array2.length &&
		array1.every(function(value, index) { return value === array2[index];});
	}

	sendGen2SplitPacketARGB(shutdown = false) {
		const [OnboardLEDData, RGBHeaderData] = this.grabZones(shutdown);
		OnboardLEDData.push(...RGBHeaderData); //Why did I separate these in the first place?

		const header1Data = this.grabChannelRGBData(0, shutdown);
		const header2Data = this.grabChannelRGBData(1, shutdown);

		if(header1Data.length > 0 && !this.CompareArrays(this.lastheader1Data, header1Data)) {
			device.send_report([0x53, 0x25, 0x04, 0x00, 0x00].concat(header1Data), 725);
			this.lastheader1Data = header1Data;

		}

		if(header2Data.length > 0 && !this.CompareArrays(this.lastheader2Data, header2Data)) {
			device.send_report([0x53, 0x25, 0x04, 0x01, 0x00].concat(header2Data), 725);
			this.lastheader2Data = header2Data;
		}

		if(ARGBHeaders > 2) {
			const header3Data = this.grabChannelRGBData(2, shutdown);

			if(header3Data.length > 0 && !this.CompareArrays(this.lastheader3Data, header3Data)) {
				device.send_report([0x53, 0x25, 0x04, 0x02, 0x00].concat(header3Data), 725);
				this.lastheader3Data = header3Data;
			}
		}

		if(OnboardLEDData.length > 0 && !this.CompareArrays(this.lastonboardData, OnboardLEDData)) {
			device.send_report([0x53, 0x25, 0x06, 0x00, 0x00].concat(OnboardLEDData), 725);
			this.lastonboardData = OnboardLEDData;
		}
	}
}

const MSIMotherboard = new MysticLight();

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/default/motherboard.png";
}
