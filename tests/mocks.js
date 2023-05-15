export * from "./Mocks/MockBus.js";
export * from "./Mocks/MockDevice.js";

/** Performs a jest.expect().toEqual() check on two packets after matching thier lengths to the size given and changing any undefined values to 0. */
export function ExpectPacketEquivalence(received, expected, length){
	expect(MimicSignalRGBPacket(received.slice(0, length), length)).toEqual(MimicSignalRGBPacket(expected.slice(0, length), length));
}

/** Minics how the SignalRGB backend handles packets. Undefined values become 0 up to the length given. */
export function MimicSignalRGBPacket(packet, length){
	return [PadPacketToLength(packet, length), length];
}

/** Changes any undefined values in the array to 0 while padding it to the length given */
export function PadPacketToLength(packet, length){
	for(let i = 0; i < length; i++){
		if(packet[i] === undefined){
			packet[i] = 0;
		}
	}

	return packet;
}