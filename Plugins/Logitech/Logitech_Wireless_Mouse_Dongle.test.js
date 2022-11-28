const { MockDevice } = require("../../tests/mocks.js");
const { LogitechProtocol } = require("./Logitech_Wireless_Mouse_Dongle");

const pluginPath = "./Logitech_Wireless_Mouse_Dongle.js";


let Plugin;
beforeEach(() => {
	return import(pluginPath).then(module => {
		Plugin = module;
		jest.resetModules();

		global.device = new MockDevice();

	});
});

describe("Logitech Mouse Dongle", () => {
	it("SetDpiLightAlwaysOnDoesNothingIfNoDpiLights", () => {
		const Logitech = new LogitechProtocol();
		Logitech.Config.HasDPILights = false;
		Logitech.SetDpiLightAlwaysOn(true);
		Logitech.SetDpiLightAlwaysOn(false);

		Logitech.Config.IsHeroProtocol = true;
		Logitech.SetDpiLightAlwaysOn(true);
		Logitech.SetDpiLightAlwaysOn(false);

		// Calling all potential branches should do nothing if the device lacks DPI lights
		expect(global.device.write.mock.calls.length).toBe(0);

	});

	it("SetDpiLightAlwaysOnHero-True", () => {
		const Logitech = new LogitechProtocol();
		Logitech.Config.IsHeroProtocol = true;
		Logitech.Config.HasDPILights = true;

		// set featureId to a random value as it's not controlled by SetDpiLightAlwaysOn()
		const MockRGB8071ID = Math.round(Math.random() * 255);
		Logitech.FeatureIDs.RGB8071ID = MockRGB8071ID;
		Logitech.SetDpiLightAlwaysOn(true);

		expect(global.device.write).toHaveBeenCalledTimes(3);
		// Expected device.write packets. Order may not matter to the device, but we should keep them in the order we know works.
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.LongMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x30, 0x01, 0x00, 0x08, 0x04, 0x07]);
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x20, 0x00, 0x03]);
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x30, 0x00, 0x00, 0x08]);

	});
	it("SetDpiLightAlwaysOnHero-False", () => {
		const Logitech = new LogitechProtocol();
		Logitech.Config.IsHeroProtocol = true;
		Logitech.Config.HasDPILights = true;

		// set featureId to a random value as it's not controlled by SetDpiLightAlwaysOn()
		const MockRGB8071ID = Math.round(Math.random() * 255);
		Logitech.FeatureIDs.RGB8071ID = MockRGB8071ID;
		Logitech.SetDpiLightAlwaysOn(false);

		expect(global.device.write).toHaveBeenCalledTimes(3);

		// Expected device.write packets. Order may not matter to the device, but we should keep them in the order we know works.
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.LongMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x30, 0x01, 0x00, 0x08, 0x02, 0x07]);
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x20, 0x00, 0x03]);
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x30, 0x00, 0x00, 0x08]);

	});
	it("SetDpiLightAlwaysOnLegacy-True", () => {
		const Logitech = new LogitechProtocol();
		Logitech.Config.IsHeroProtocol = false;
		Logitech.Config.HasDPILights = true;

		// set featureId to a random value as it's not controlled by SetDpiLightAlwaysOn()
		const MockLEDControlID = Math.round(Math.random() * 255);
		Logitech.FeatureIDs.LEDControlID = MockLEDControlID;
		Logitech.SetDpiLightAlwaysOn(true);

		expect(global.device.write).toHaveBeenCalledTimes(3);

		// Expected device.write packets. Order may not matter to the device, but we should keep them in the order we know works.
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockLEDControlID, 0x70, 0x01, 0x02]);
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.LongMessage, Logitech.ConnectionMode, MockLEDControlID, 0x50, 0x01, 0x00, 0x02, 0x00, 0x02]);
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockLEDControlID, 0x60, 0x01]);
	});

	it("SetDpiLightAlwaysOnLegacy-False", () => {
		const Logitech = new LogitechProtocol();
		Logitech.Config.IsHeroProtocol = false;
		Logitech.Config.HasDPILights = true;

		// set featureId to a random value as it's not controlled by SetDpiLightAlwaysOn()
		const MockLEDControlID = Math.round(Math.random() * 255);
		Logitech.FeatureIDs.LEDControlID = MockLEDControlID;
		Logitech.SetDpiLightAlwaysOn(false);

		expect(global.device.write).toHaveBeenCalledTimes(3);

		// Expected device.write packets. Order may not matter to the device, but we should keep them in the order we know works.
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockLEDControlID, 0x70, 0x01, 0x04]);
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.LongMessage, Logitech.ConnectionMode, MockLEDControlID, 0x50, 0x01, 0x00, 0x02, 0x00, 0x02]);
		expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockLEDControlID, 0x60, 0x01]);

	});
});