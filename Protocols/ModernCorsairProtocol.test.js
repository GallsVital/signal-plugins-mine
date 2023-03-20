const { MockDevice, ExpectPacketEquivalence, MimicSignalRGBPacket } = require("../tests/mocks");
const { ModernCorsairProtocol } = require("./ModernCorsairProtocol");


beforeEach(() => {
	global.device = new MockDevice();
});


describe("Corsair Bragi Protocol", () => {
	it("Read Property", () => {
		const WriteLength = Math.floor(Math.random() * 200);
		const ReadLength = Math.floor(Math.random() * 200);
		const Property = Math.floor(Math.random() * 200);
		device.read = jest.fn().mockImplementation(() => { return [0x00, 0x00, 0x02, 0x00, 0xE8, 0x03];});
		device.getHidInfo = jest.fn().mockImplementation(() => { return {writeLength: WriteLength, readLength: ReadLength};});

		const bragi = new ModernCorsairProtocol();
		const ReturnValue = bragi.ReadProperty(Property);
		expect(device.clearReadBuffer).toBeCalled();
		expect(device.write).toBeCalled();
		expect(device.read).toBeCalled();

		const WriteCall = device.write.mock.calls[0];
		ExpectPacketEquivalence(WriteCall[0], [0x00, 0x08, 0x02, Property], WriteCall[1]);

		const ReadCall = device.write.mock.calls[0];
		ExpectPacketEquivalence(ReadCall[0], [0x00, 0x08, 0x02, Property], ReadCall[1]);

		ExpectPacketEquivalence(ReturnValue, [0x00, 0x00, 0x02, 0x00, 0xE8, 0x03], ReadLength);
	});

	it("Fetch Property", () => {
		const WriteLength = Math.floor(Math.random() * 200);
		const ReadLength = Math.floor(Math.random() * 200);
		const Property = Math.floor(Math.random() * 200);
		const ChildId = 8 + Math.floor(Math.random() * 8);

		device.read = jest.fn().mockImplementation(() => { return [0x00, 0x00, 0x02, 0x00, 0xE8, 0x03];});
		device.getHidInfo = jest.fn().mockImplementation(() => { return {writeLength: WriteLength, readLength: ReadLength};});

		const bragi = new ModernCorsairProtocol();
		bragi.ConnectionType = ChildId;

		const ReturnValue = bragi.FetchProperty(Property);
		expect(device.clearReadBuffer).toBeCalled();
		expect(device.write).toBeCalled();
		expect(device.read).toBeCalled();

		const WriteCall = device.write.mock.calls[0];
		ExpectPacketEquivalence(WriteCall[0], [0x00, ChildId, 0x02, Property], WriteCall[1]);

		const ReadCall = device.write.mock.calls[0];
		ExpectPacketEquivalence(ReadCall[0], [0x00, ChildId, 0x02, Property], ReadCall[1]);

		expect(ReturnValue).toBe(1000);
	});
});
