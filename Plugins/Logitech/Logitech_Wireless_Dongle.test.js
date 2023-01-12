const { MockDevice } = require("../../tests/mocks.js");
const { LogitechProtocol } = require("./Logitech_Wireless_Dongle");

const pluginPath = "./Logitech_Wireless_Dongle.js";


let Plugin;
beforeEach(() => {
	return import(pluginPath).then(module => {
		Plugin = module;
		jest.resetModules();

		global.device = new MockDevice();

	});
});

describe("Logitech Dongle", () => {
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
	it.each([true, false])(
		'SetDpiLightAlwaysOnHero(%d)',
		(state) => {
			const Logitech = new LogitechProtocol();
			Logitech.Config.IsHeroProtocol = true;
			Logitech.Config.HasDPILights = true;

			// set featureId to a random value as it's not controlled by SetDpiLightAlwaysOn()
			const MockRGB8071ID = Math.round(Math.random() * 255);
			Logitech.FeatureIDs.RGB8071ID = MockRGB8071ID;
			Logitech.SetDpiLightAlwaysOn(state);

			expect(global.device.write).toHaveBeenCalledTimes(3);
			// Expected device.write packets. Order may not matter to the device, but we should keep them in the order we know works.
			expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.LongMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x30, 0x01, 0x00, 0x08, state ? 0x04 : 0x02, 0x07]);
			expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x20, 0x00, 0x03]);
			expect(global.device.write.mock.calls.shift()[0]).toEqual([Logitech.ShortMessage, Logitech.ConnectionMode, MockRGB8071ID, 0x30, 0x00, 0x00, 0x08]);
		}
	);

	it.each([true, false])(
		'SetDpiLightAlwaysOnLegacy(%d)',
		(state) => {
			const Logitech = new LogitechProtocol();
			Logitech.Config.IsHeroProtocol = false;
			Logitech.Config.HasDPILights = true;

			// set featureId to a random value as it's not controlled by SetDpiLightAlwaysOn()
			const MockLEDControlID = Math.round(Math.random() * 255);
			Logitech.FeatureIDs.LEDControlID = MockLEDControlID;
			Logitech.SetDpiLightAlwaysOn(state);

			expect(global.device.write).toHaveBeenCalledTimes(3);

			// Expected device.write packets. Order may not matter to the device, but we should keep them in the order we know works.
			expect(global.device.write.mock.calls.shift()[0]).toEqual([0x10, Logitech.ConnectionMode, MockLEDControlID, 0x70, 0x01, state ? 0x02 : 0x04]);
			expect(global.device.write.mock.calls.shift()[0]).toEqual([0x11, Logitech.ConnectionMode, MockLEDControlID, 0x50, 0x01, 0x00, 0x02, 0x00, 0x02]);
			expect(global.device.write.mock.calls.shift()[0]).toEqual([0x10, Logitech.ConnectionMode, MockLEDControlID, 0x60, 0x01]);
		}
	);

	it("SetDpi", () => {
		const Logitech = new LogitechProtocol();

		const DPI = Math.round(Math.random() * 10000);
		const Stage = Math.round(Math.random() * 5);
		const MockFeatureID = Math.round(Math.random() * 255);
		Logitech.FeatureIDs.DPIID = MockFeatureID;
		Logitech.setDpi(DPI, Stage);

		expect(global.device.write).toBeCalledTimes(1);

		const ExpectedPacket = [0x11, Logitech.ConnectionMode, MockFeatureID, 0x30, 0x00, Math.floor(DPI/256), DPI%256, Stage];
		expect(global.device.write.mock.calls[0]).toEqual([ExpectedPacket, 20]);

	});
	it('SetHasDPILights', () => {
		const Logitech = new LogitechProtocol();

		// Default should be false
		expect(Logitech.HasDpiLights()).toBe(false);

		Logitech.SetHasDPILights(true);
		expect(Logitech.HasDpiLights()).toBe(true);

		Logitech.SetHasDPILights(false);
		expect(Logitech.HasDpiLights()).toBe(false);

	});

	it.each([true, false])(
		'SetDirectMode-Legacy(%d)',
		(onboardState) => {
			const Logitech = new LogitechProtocol();
			Logitech.Config.IsHeroProtocol = false;

			const MockFeatureID = Math.round(Math.random() * 255);
			Logitech.FeatureIDs.RGB8070ID = MockFeatureID;

			const MockFeatureID2 = Math.round(Math.random() * 255);
			Logitech.FeatureIDs.LEDCtrlID = MockFeatureID2;

			Logitech.SetDirectMode(onboardState);

			expect(global.device.write).toBeCalledTimes(2);

			const ExpectedSnapshot = [
				[[0x10, Logitech.ConnectionMode, MockFeatureID, 0x80, 0x01, 0x01], 7],
				[[0x10, Logitech.ConnectionMode, MockFeatureID2, 0x30, +onboardState], 7] // + to convert bool to int
			];

			expect(global.device.write.mock.calls[0]).toEqual(ExpectedSnapshot[0]);
			expect(global.device.write.mock.calls[1]).toEqual(ExpectedSnapshot[1]);

		}
	);

	it.each([[true]])(
		'SetDirectMode-Hero(%d)',
		(onboardState) => {
			const Logitech = new LogitechProtocol();
			Logitech.Config.IsHeroProtocol = true;

			const MockFeatureID = Math.round(Math.random() * 255);
			Logitech.FeatureIDs.RGB8071ID = MockFeatureID;

			Logitech.SetDirectMode(onboardState);

			expect(global.device.write).toBeCalledTimes(1);

			const ExpectedSnapshot = [
				[[0x10, Logitech.ConnectionMode, MockFeatureID, 0x50, 0x01, 0x03, 0x05], 7],
			];

			expect(global.device.write.mock.calls[0]).toEqual(ExpectedSnapshot[0]);

		}
	);
});
