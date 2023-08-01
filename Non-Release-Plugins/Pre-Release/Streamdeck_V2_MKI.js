export function Name() { return "StreamDeck V2"; }
export function VendorId() { return 0xfd9; }
export function ProductId() { return 0x80; }
export function Publisher() { return "l1berate"; }
export function Size() { return [240, 136]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale() { return 1.333333333333; }
export function ControllableParameters() {
	return [
		{
			property: "hwbrightness",
			group: "",
			label: "Hardware Brightness",
			step: "1",
			type: "number",
			min: "1",
			max: "100",
			default: "40",
		},
		{
			property: "shutdownColor",
			group: "lighting",
			label: "Shutdown Color",
			min: "0",
			max: "360",
			type: "color",
			default: "009bde",
		},
		{
			property: "LightingMode",
			group: "lighting",
			label: "Lighting Mode",
			type: "combobox",
			values: ["Canvas", "Forced"],
			default: "Canvas",
		},
		{
			property: "forcedColor",
			group: "lighting",
			label: "Forced Color",
			min: "0",
			max: "360",
			type: "color",
			default: "009bde",
		},
	];
}

// An array called vKeys that contains all integers from 0 to 32,640
const vKeys = [...Array(32640).keys()];

// An array called vLedNames that contains the string "Led 1" 32,640 times
const vLedNames = vKeys.map((vKey) => "Led 1");

// An array called vLedPositions that contains multiple arrays of [x, y] coordinates.
// x goes from 0 to 239, y goes from 0 to 135
const vLedPositions = vKeys.map((vKey) => [vKey % 240, Math.floor(vKey / 240)]);

export function getVKeys() {
	return vKeys;
}

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	readKeys();
	sendPacket();

	return true;
}

export function Type() { return "HID"; }

export function Validate(endpoint) {
	return true;
}

export function Render() {
	sendPacket();
}

function readKeys() {
	const keys = device.read(0x81, 32);
	device.log(keys);
}

function generateImage() {
	if (false || LightingMode === "Forced") {
		return device.ConvertColorToImageBuffer(forcedColor, 480, 272, "JPEG");
	}
	const rawImageData = device.getImageBuffer(0, 0, 239, 135, {
		outputWidth: 480,
		outputHeight: 272,
		flipV: true,
		flipH: true,
	});

	return rawImageData;

}

function sendPacket() {
	const data = generateImage();

	let page_number = 0;
	let bytes_remaining = data.length;

	while (bytes_remaining > 0) {
		const this_length = Math.min(bytes_remaining, 1016);
		const bytes_sent = page_number * 1016;

		const header = [
			0x02,
			0x08,
			0x00,
			this_length === bytes_remaining ? 0x01 : 0x00,
			this_length & 0xff,
			this_length >> 8,
			page_number & 0xff,
			page_number >> 8,
		];

		const payload = new Uint8Array([
			...header,
			...data.slice(bytes_sent, bytes_sent + this_length),
		]);
		const padding = new Uint8Array(1024 - payload.length);
		device.write([...payload, ...padding], 1024);

		bytes_remaining -= this_length;
		page_number += 1;
	}
}

export function Shutdown() {
	resetDevice();
}

export function onhwresetdeviceChanged() {
	resetDevice();
}

function resetDevice() {
	device.write([0x02], 1024);
	device.send_report([0x03, 0x02], 32);
	//setBrightness();
}

export function onhwbrightnessChanged() {
	device.log("hwbrightness changed to " + hwbrightness);

	const byteArray = new Array(32);
	byteArray[0] = 0x03;
	byteArray[1] = 0x08;
	byteArray[2] = hwbrightness;
	device.send_report(byteArray, 32);
}

export function Image() {
	return "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";
}