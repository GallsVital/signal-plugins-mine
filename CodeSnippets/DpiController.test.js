import DpiController from "./DpiController";
const { MockDevice } = require("../tests/mocks");

describe("DpiController", () => {
	it("has proper defaults", () => {
		const controller = new DpiController();

		expect(controller.getCurrentStage()).toBe(1);
		expect(controller.getMaxStage()).toBe(5);

	});

	it("can increment dpi", () => {
		const controller = new DpiController();

		expect(controller.getCurrentStage()).toBe(1);
		controller.increment();
		expect(controller.getCurrentStage()).toBe(2);
	});

	it("can decrement dpi", () => {
		const controller = new DpiController();
		controller.setStage(3);
		expect(controller.getCurrentStage()).toBe(3);
		controller.decrement();
		expect(controller.getCurrentStage()).toBe(2);
	});

	it("Won't go below stage 1", () => {
		const controller = new DpiController();
		expect(controller.getCurrentStage()).toBe(1);
		controller.decrement();
		expect(controller.getCurrentStage()).toBe(1);
	});

	it("Won't go above the max stage", () => {
		const controller = new DpiController();
		controller.setStage(controller.getMaxStage());

		expect(controller.getCurrentStage()).toBe(controller.getMaxStage());
		controller.increment();
		expect(controller.getCurrentStage()).toBe(controller.getMaxStage());
	});

	it("Can rollover with decrements", () => {
		const controller = new DpiController();
		controller.setRollover(true);
		expect(controller.getCurrentStage()).toBe(1);
		controller.decrement();
		expect(controller.getCurrentStage()).toBe(controller.getMaxStage());
	});

	it("Can rollover with increments", () => {
		const controller = new DpiController();
		controller.setRollover(true);

		controller.setStage(controller.getMaxStage());

		expect(controller.getCurrentStage()).toBe(controller.getMaxStage());
		controller.increment();
		expect(controller.getCurrentStage()).toBe(1);
	});

	it("it can't set stages out of bounds", () => {
		const controller = new DpiController();

		controller.setStage(controller.getMaxStage() + 50);
		expect(controller.getCurrentStage()).toBe(controller.getMaxStage());

		controller.setStage(controller.getMaxStage() * -1);
		expect(controller.getCurrentStage()).toBe(1);
	});

	it("Creates default properties", () => {
		global.device = new MockDevice();

		const controller = new DpiController();
		controller.addProperties();

		expect(global.device.addProperty.mock.calls.length).toBe(4 + controller.getMaxStage());

		const mockCalls = global.device.addProperty.mock.calls.flat();

		const propertyNames = [];

		for(const obj of mockCalls){
			propertyNames.push(obj.property);

			if(obj.property.includes("dpi") && obj.property !== "dpiRollover" && obj.property !== "dpiStages"){
				expect(obj.min).toBe(controller.minDpi);
				expect(obj.max).toBe(controller.maxDpi);
			}
		}

		expect(propertyNames.includes("settingControl")).toBeTruthy();
		expect(propertyNames.includes("dpiStages")).toBeTruthy();
		expect(propertyNames.includes("dpiRollover")).toBeTruthy();
		expect(propertyNames.includes(`dpi${controller.getCurrentStage()}`)).toBeTruthy();
		expect(propertyNames.includes(`dpi${controller.getMaxStage()}`)).toBeTruthy();
		expect(propertyNames.includes(`dpi${controller.getSniperIdx()}`)).toBeTruthy();
	});


});