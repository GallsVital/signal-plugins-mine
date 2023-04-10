const { MockDevice, ExpectPacketEquivalence } = require("../tests/mocks");
const { ModernCorsairProtocol } = require("./ModernCorsairProtocol");


beforeEach(() => {
	global.device = new MockDevice();
});

// GetNameOfHandle(Handle){
// 	if(this.handleNames.hasOwnProperty(Handle)){
// 		return this.handleNames[Handle];
// 	}

// 	return "Unknown Handle";
// }
// GetNameOfProperty(Property){
// 	if(this.propertyNames.hasOwnProperty(Property)){
// 		return this.propertyNames[Property];
// 	}

// 	return "Unknown Property";
// }
// GetNameOfEndpoint(Endpoint){
// 	if(this.endpointNames.hasOwnProperty(Endpoint)){
// 		return this.endpointNames[Endpoint];
// 	}

// 	return "Unknown Endpoint";
// }

describe("Corsair Bragi Protocol", () => {
	it.each([
		[0x00, "Lighting"],
		[0x01, "Background"],
		[0x02, "Auxiliary"],
		[0x03, "Unknown Handle"],
	])("Fetches Handle Names", (handle, name) => {
		const bragi = new ModernCorsairProtocol();
		expect(bragi.GetNameOfHandle(handle)).toEqual(name);
	});
	it.each([
		[0x01, "Lighting"],
		[0x02, "Buttons"],
		[0x10, "Lighting Monochrome"],
		[0x17, "Fan RPM"],
		[0x18, "Fan Speeds"],
		[0x1A, "Fan States"],
		[0x1D, "3Pin Led Count"],
		[0x1E, "4Pin Led Count"],
		[0x21, "Temperature Probes"],
		[0x22, "Lighting Controller"],
		[0x27, "Error Log"],
	])("Fetches Endpoint Names", (endpoint, name) => {
		const bragi = new ModernCorsairProtocol();
		expect(bragi.GetNameOfEndpoint(endpoint)).toEqual(name);
	});

	it.each([
		[0x01, "Polling Rate"],
		[0x02, "HW Brightness"],
		[0x03, "Mode"],
		[0x07, "Angle Snapping"],
		[0x0d, "Idle Mode"],
		[0x0F, "Battery Level"],
		[0x10, "Battery Status"],
		[0x11, "Vendor Id"],
		[0x12, "Product Id"],
		[0x13, "Firmware Version"],
		[0x14, "Bootloader Firmware Version"],
		[0x15, "Wireless Firmware Version"],
		[0x16, "Wireless Bootloader Version"],
		[0x1E, "DPI Profile"],
		[0x1F, "DPI Mask"],
		[0x21, "DPI X"],
		[0x22, "DPI Y"],
		[0x2F, "DPI 0 Color"],
		[0x30, "DPI 1 Color"],
		[0x31, "DPI 2 Color"],
		[0x36, "Wireless Subdevices"],
		[0x37, "Idle Mode Timeout"],
		[0x41, "HW Layout"],
		[0x44, "Brightness Level"],
		[0x45, "WinLock Enabled"],
		[0x4a, "WinLock Disabled Shortcuts"],
		[0x5f, "MultipointConnectionSupport"],
		[0x96, "Max Polling Rate"],
	])("Fetches Property Names", (property, name) => {
		const bragi = new ModernCorsairProtocol();
		expect(bragi.GetNameOfProperty(property)).toEqual(name);
	});

	it.each([
		[0x12, true],
		[0x03, false]
	])("Can Ping a device", (deviceStatus, connectionStatus) => {
		//0x00, this.ConnectionType, this.command.pingDevice
		const bragi = new ModernCorsairProtocol();
		device.read = jest.fn().mockImplementation(() => { return [0x00, 0x00, deviceStatus];});
		bragi.config.writeLength = 65;
		bragi.config.readLength = 64;
		bragi.ConfiguredDeviceBuffer = true;

		const ReturnValue = bragi.PingDevice();

		expect(device.clearReadBuffer).toBeCalled();
		expect(device.write).toBeCalled();
		expect(device.read).toBeCalled();

		const WriteCall = device.write.mock.calls[0];
		ExpectPacketEquivalence(WriteCall[0], [0x00, 0x08, deviceStatus], WriteCall[1]);

		const ReadCall = device.write.mock.calls[0];
		ExpectPacketEquivalence(ReadCall[0], [0x00], ReadCall[1]);

		expect(ReturnValue).toBe(connectionStatus);
	});

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
