const { RazerProtocol } = require("./Razer_Modern_Mouse.js");
const { MockDevice } = require("../../tests/mocks.js");

const pluginPath = "./Razer_Modern_Mouse.js"; // we could make this fetched from the current file path?

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

describe("Razer Mice", () => {


	test("StandardPacketSend With Default Tranaction Id", () => {
		const Razer = new RazerProtocol();
		// using default transaction id
		Razer.Config.TransactionID = 0x3F;

		Razer.StandardPacketSend([0x39, 0x0f, 0x03, 0x00, 0x00, 0x00, 0x00, 0x10, 0x57, 0xfd, 0x3c, 0x57, 0xfd, 0x3c, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0x9a, 0xf9, 0x24, 0x41, 0xfb, 0x75, 0x57, 0xf4, 0xd1, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
		expect(global.device.send_report.mock.calls.length).toBe(1);
		expect(global.device.send_report.mock.calls[0]).toEqual([[0x00, 0x00, 0x3f, 0x00, 0x00, 0x00, 0x39, 0x0f, 0x03, 0x00, 0x00, 0x00, 0x00, 0x10, 0x57, 0xfd, 0x3c, 0x57, 0xfd, 0x3c, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0x9a, 0xf9, 0x24, 0x41, 0xfb, 0x75, 0x57, 0xf4, 0xd1, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xd3, 0x00], 91]);
	});

	test.each(
		[
			[
				0x1F,
				0x00,
				0x01,
			],
			[
				0x2f,
				0x01,
				0x02,
			],
		])("Battery Status Fetch", (TransactionId, inputStatus, translatedStatus) => {
		const Razer = new RazerProtocol();
		global.device.get_report.mockImplementationOnce(() => {
			const array = new Array(91).fill(0);
			array[1] = 0x02;
			array[10] = inputStatus;

			return array;
		});

		Razer.Config.TransactionID = TransactionId;


		expect(Razer.getDeviceChargingStatus()).toBe(translatedStatus);
		expect(global.device.send_report.mock.calls.length).toBe(1);
		expect(global.device.get_report.mock.calls.length).toBe(1);
	});

	test.each(
		[
			[
				0x1F,
				0xff,
				100,
			],
			[
				0x2f,
				0x20,
				12,
			],
			[
				0x3f,
				0x00,
				-1,
			],
		])("Battery Level Fetch", (TransactionId, inputPercentage, expectedBatteryPercentage) => {
		const Razer = new RazerProtocol();
		global.device.get_report.mockImplementationOnce(() => {
			const array = new Array(91).fill(0);
			array[1] = 0x02;
			array[10] = inputPercentage;

			return array;
		});

		Razer.Config.TransactionID = TransactionId;


		expect(Razer.getDeviceBatteryLevel()).toBe(expectedBatteryPercentage);
		expect(global.device.send_report.mock.calls.length).toBe(1);
		expect(global.device.get_report.mock.calls.length).toBe(1);
	});

	test.each(
		[
			[
				0x1F,
				[80, 77, 50, 49, 48, 55, 72, 48, 53, 56, 48, 51, 49, 52, 50],
				"PM2107H05803142",
			],
			[
				0x2f,
				[54, 51, 50, 49, 51, 57, 72, 50, 49, 51, 48, 50, 52, 55, 52],
				"632139H21302474",
			],
		])("Fetch Serial Number", (TransactionId, inputArray, decodedSerial) => {
		const Razer = new RazerProtocol();
		global.device.get_report.mockImplementationOnce(() => {
			const array = new Array(91).fill(0);
			array[1] = 0x02;

			for (let arrayValues = 0; arrayValues < inputArray.length; arrayValues++) {
				array[arrayValues + 9] = inputArray[arrayValues];
			}

			return array;
		});

		Razer.Config.TransactionID = TransactionId;


		expect(Razer.getDeviceSerial()).toBe(decodedSerial);
		expect(global.device.send_report.mock.calls.length).toBe(1);
		expect(global.device.get_report.mock.calls.length).toBe(1);
	});

	test.each(
		[
			[
				0x1F,
				[2, 3],
				[2, 3],
			],
			[
				0x2f,
				[1, 0],
				[1, 0],
			],
		])("Fetch Firmware Version", (TransactionId, inputArray, expectedFirmwareVersion) => {
		const Razer = new RazerProtocol();
		global.device.get_report.mockImplementationOnce(() => {
			const array = new Array(91).fill(0);
			array[1] = 0x02;
			array[9] = inputArray[0];
			array[10] = inputArray[1];

			return array;
		});

		Razer.Config.TransactionID = TransactionId;


		expect(Razer.getDeviceFirmwareVersion()).toStrictEqual(expectedFirmwareVersion);
		expect(global.device.send_report.mock.calls.length).toBe(1);
		expect(global.device.get_report.mock.calls.length).toBe(1);
	});

	test.each(
		[
			[
				0x1F,
				0,
				0,
			],
			[
				0x2f,
				2,
				2,
			],
			[
				0x3f,
				3,
				3,
			],
		])("Fetch Device Mode", (TransactionId, inputMode, expectedDeviceMode) => {
		const Razer = new RazerProtocol();
		global.device.get_report.mockImplementationOnce(() => {
			const array = new Array(91).fill(0);
			array[1] = 0x02;
			array[9] = inputMode;

			return array;
		});

		Razer.Config.TransactionID = TransactionId;


		expect(Razer.getDeviceMode()).toBe(expectedDeviceMode);
		expect(global.device.send_report.mock.calls.length).toBe(1);
		expect(global.device.get_report.mock.calls.length).toBe(1);
	});

	test.each([
		//[transactionId, data, ExpectedOutput]
		[
			0x1F,
			[0x38, 0x0f, 0x03, 0x00, 0x00, 0x00, 0x00, 0x10, 0x57, 0xfd, 0x3c, 0x57, 0xfd, 0x3c, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0x9a, 0xf9, 0x24, 0x41, 0xfb, 0x75, 0x57, 0xf4, 0xd1, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[[0x00, 0x00, 0x1f, 0x00, 0x00, 0x00, 0x38, 0x0f, 0x03, 0x00, 0x00, 0x00, 0x00, 0x10, 0x57, 0xfd, 0x3c, 0x57, 0xfd, 0x3c, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0x9a, 0xf9, 0x24, 0x41, 0xfb, 0x75, 0x57, 0xf4, 0xd1, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xd2, 0x00], 91],
		],
		[
			0x2f,
			[0x39, 0x0f, 0x03, 0x00, 0x00, 0x00, 0x00, 0x10, 0x57, 0xfd, 0x3c, 0x57, 0xfd, 0x3c, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0x9a, 0xf9, 0x24, 0x41, 0xfb, 0x75, 0x57, 0xf4, 0xd1, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[[0x00, 0x00, 0x2f, 0x00, 0x00, 0x00, 0x39, 0x0f, 0x03, 0x00, 0x00, 0x00, 0x00, 0x10, 0x57, 0xfd, 0x3c, 0x57, 0xfd, 0x3c, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0xff, 0xf3, 0x00, 0x9a, 0xf9, 0x24, 0x41, 0xfb, 0x75, 0x57, 0xf4, 0xd1, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x62, 0xf1, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xd3, 0x00], 91],
		],

	])("StandardPacketSend With Passed Transaction ID", (TransactionId, Data, ExpectedOutput) => {
		const Razer = new RazerProtocol();
		Razer.StandardPacketSend(Data, TransactionId);
		expect(global.device.send_report.mock.calls.length).toBe(1);
		expect(global.device.send_report.mock.calls[0]).toEqual(ExpectedOutput);
	});
});