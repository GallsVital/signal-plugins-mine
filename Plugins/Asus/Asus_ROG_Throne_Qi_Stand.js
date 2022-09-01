export function Name() { return "Asus Throne QI"; }
export function VendorId() { return 0x0B05; }
export function ProductId() { return 0x18C5; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [18, 1]; }
export function DefaultPosition(){return [10, 100]; }
export function DefaultScale(){return 8.0;}
export function ControllableParameters()
{
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

export function Initialize()
{

}

let vLedNames = [ "Led 1", "Led 2", "Led 3", "Led 4", "Led 5", "Led 6", "Led 7", "Led 8", "Led 9", "Led 10", "Led 11", "Led 12", "Led 13", "Led 14", "Led 15", "Led 16", "Led 17", "Led 18" ];
let vLedPositions = [ [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0]  ];

export function LedNames()
{
	return vLedNames;
}

export function LedPositions()
{
	return vLedPositions;
}

export function Render()
{
	sendColors();
}

export function Shutdown()
{

}

function grabColors(shutdown = false)
{
	let rgbdata = [];

	for(let iIdx = 0; iIdx < 18; iIdx++)
	{
		let iPxX = vLedPositions[iIdx][0];
		let iPxY = vLedPositions[iIdx][1];
		let color;

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

		let iLedIdx = iIdx * 4;
		rgbdata[iLedIdx] = 0x00;
		rgbdata[iLedIdx+1] = color[0];
		rgbdata[iLedIdx+2] = color[1];
		rgbdata[iLedIdx+3] = color[2];
	}

	return rgbdata;
}

function sendColors()
{
	let rgbdata = grabColors();

	let packet = [];
	packet[0] = 0x00;
	packet[1] = 0xC0;
	packet[2] = 0x81;
	packet[3] = 0x00;
	packet[4] = 0x00;
	packet = packet.concat(rgbdata.splice(0, 60));
	device.write(packet, 65);

	packet = [];
	packet[0] = 0x00;
	packet[1] = 0xC0;
	packet[2] = 0x81;
	packet[3] = 0x01;
	packet[4] = 0x00;
	packet = packet.concat(rgbdata.splice(0, 12));
	device.write(packet, 65);

}

function hexToRgb(hex)
{
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	let colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint)
{
	return endpoint.interface === 0;
}

export function Image()
{
	return "";
}