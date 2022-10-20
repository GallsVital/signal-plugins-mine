export function Name() { return "Corsair Elite Cappelix LCD"; }
export function VendorId() { return 0x1b1c; }
export function ProductId() { return 0x0C39; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [6, 6]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 1.0;}

export function ControllableParameters()
{
	return [
		{"property":"screenSize", "group":"", "label":"ScreenSize", "step":"1", "type":"number", "min":"1", "max":"210", "default":"5"},
	];
}

export function Initialize()
{
	device.setSize([screenSize+1,screenSize+1]);
}

export function Render()
{
	colorgrabber();
}

export function onscreenSizeChanged()
{
	device.setSize([screenSize+1,screenSize+1]);
}

let vLedNames = [ "Device Wide" ];

let vLedPositions = [ [0, 0] ];

export function LedNames() 
{
	return vLedNames;
}

export function LedPositions() 
{
	return vLedPositions;
}

let savedPollTimer = Date.now();
let PollModeInternal = 40;

function colorgrabber()
{
	if(Date.now() - savedPollTimer < PollModeInternal)
	{
		return; //Break if we hit our render loop wrong
	}
	savedPollTimer = Date.now();

	let RGBData = device.getImageBuffer(0, 0, screenSize, screenSize, 192, 192, "JPEG");
	let BytesLeft = RGBData.length;
	let packetsSent = 0;

	while(BytesLeft > 0)
	{
		const BytesToSend = Math.min(1016, BytesLeft);

		if(BytesToSend < 1016)
		{
			sendZone(BytesLeft, RGBData.splice(0,BytesLeft), packetsSent, 0x01);
		}
		else
		{
			sendZone(BytesToSend, RGBData.splice(0,BytesToSend), packetsSent, 0x00);
		}
		BytesLeft -= BytesToSend;
		packetsSent++;
	}
	
}

function sendZone(packetRGBDataLength, rgbdata, packetsSent, finalPacket)
{
	let packet = [0x02, 0x05, 0x40, finalPacket, packetsSent, 0x00, (packetRGBDataLength >> 8 & 0xFF), (packetRGBDataLength & 0xFF)];
	packet.push(...rgbdata);

    device.write(packet, 1024);
}

export function Validate(endpoint)
{
	return endpoint.interface === -1;
}