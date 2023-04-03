const { MockDevice } = require("../../tests/mocks.js");
const { LogitechProtocol } = require("./Logitech_Mouse.js");
const { LogitechMouseDevice } = require("./Logitech_Mouse.js");
const { LogitechDongleDevice } = require("./Logitech_Mouse.js");
const { LogitechResponse } = require("./Logitech_Mouse.js");

const pluginPath = "./Logitech_Mouse.js";

let Plugin;
beforeEach(() => {
	// Async Plugin Import
	return import(pluginPath).then(module => {
		Plugin = module;

		// Reset any mocked functions
		jest.resetModules();

		global.device = new MockDevice();

	});
});

describe("Logitech Mouse Dongle", () => {
	test("Device Connection Check", () => {
	    const Logitech = new LogitechProtocol();
		const Dongle = new LogitechDongleDevice();
		global.device.read.mockImplementationOnce(() => { return [0x10, 0xff, 0x80, 0x00, 0x00, 0x01, 0x00]; });
		Dongle.SetHidppNotifications(true);
		expect(global.device.write.mock.calls.length).toBe(1);
		expect(global.device.read.mock.calls.length).toBe(1);
		//expect(global.device.write.mock.calls[0]).toEqual([[0x10, 0xff, 0x80, 0x00, 0x00, 0x01, 0x00], 91]);
		//expect(Dongle.SetHidppNotifications()).toBe(0);
	});

	test.each(
		[
			[
				0x8071,
				1,
				1
			],
			[
				0x8070,
				128,
				0
			],
			[
				0x8000,
				0,
				0
			]
		])("Feature ID Mock Test", (featurePage, returnFeatureID, expectedReturnFeatureID) => {
		const Logitech = new LogitechProtocol();
		Logitech.Config.ConnectionMode = Logitech.ConnectionType["Wireless"];
		global.device.read.mockImplementationOnce(() => { return [0x11, 0x01, 0x00, 0x00, returnFeatureID, 0x00, 0x00]; }); //Running twice because we run the function twice.
		global.device.read.mockImplementationOnce(() => { return [0x11, 0x01, 0x00, 0x00, returnFeatureID, 0x00, 0x00]; });

		Logitech.FetchFeatureIdFromPage(featurePage);
		expect(global.device.write.mock.calls.length).toBe(1);
		expect(global.device.read.mock.calls.length).toBe(1);
		expect(global.device.write.mock.calls[0]).toEqual([[0x11, 0x01, 0x00, 0x00, (featurePage >> 8) & 0xFF, featurePage & 0xFF], 20]);
		expect(Logitech.FetchFeatureIdFromPage()).toBe(expectedReturnFeatureID);
	});

	test.each([0, 5, 10])("Feature ID Count Mock Test", (FeatureIDCount) => {
		const Logitech = new LogitechProtocol();
		Logitech.Config.ConnectionMode = Logitech.ConnectionType["Wireless"];
		global.device.read.mockImplementationOnce(() => { return [0x11, 0x01, 0x00, 0x00, FeatureIDCount, 0x00, 0x00]; });

		expect(Logitech.FetchFeatureCount()).toBe(FeatureIDCount);
		expect(global.device.write.mock.calls.length).toBe(1);
		expect(global.device.read.mock.calls.length).toBe(1);
		expect(global.device.write.mock.calls[0]).toEqual([[0x11, 0x01, 0x01, 0x00], 20]);
	});

	test.each([0, 5, 10])
	("Feature ID Count Mock Test", (FeatureIDCount) => {
		const Logitech = new LogitechProtocol();
		Logitech.Config.ConnectionMode = Logitech.ConnectionType["Wireless"];
		global.device.read.mockImplementationOnce(() => { return [0x11, 0x01, 0x00, 0x00, FeatureIDCount, 0x00, 0x00]; });

		expect(Logitech.FetchFeatureCount()).toBe(FeatureIDCount);
		expect(global.device.write.mock.calls.length).toBe(1);
		expect(global.device.read.mock.calls.length).toBe(1);
		expect(global.device.write.mock.calls[0]).toEqual([[0x11, 0x01, 0x01, 0x00], 20]);
	});

	//test.each([
	//	[1, 0, 0],
	//	[5, 1, 0],
	//	[10, 1, 1]
	//])
	//("Unified Battery Percentage Mock Test", (batteryPercent, batteryStatus, wirelessCharging) => {
	//	const Logitech = new LogitechProtocol();
	//	Logitech.Config.ConnectionMode = Logitech.ConnectionType["Wireless"];
	//	global.device.read.mockImplementation(() => { return [0x11, 0x01, 0x00, batteryPercent, 0x00, batteryStatus, wirelessCharging, 0x00]; });

	//	expect(Logitech.GetUnifiedBatteryPercentage()).toBe([batteryPercent, batteryStatus, wirelessCharging]);
	//	expect(global.device.write.mock.calls.length).toBe(1);
	//	expect(global.device.read.mock.calls.length).toBe(1);
	//	expect(global.device.write.mock.calls[0]).toEqual([[0x11, 0x01, 0x01, 0x00], 20]);
	//});

	
});