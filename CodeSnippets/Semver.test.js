import Semver from "./Semver";

describe("Semver", () => {
	it("1.0.0 == 1.0.0", () => {
		expect(Semver.compare("1.0.0", "1.0.0")).toBe(0);
	});
	it("1.0.1 > 1.0.0", () => {
		expect(Semver.compare("1.0.1", "1.0.0")).toBe(1);
	});
	it("1.0.0 < 1.0.1", () => {
		expect(Semver.compare("1.0.0", "1.0.1")).toBe(-1);
	});
	it("6.0.0 > 1.0.1", () => {
		expect(Semver.compare("6.0.0", "1.0.1")).toBe(1);
	});
	it("1.0.0 < 6.0.1", () => {
		expect(Semver.compare("1.0.0", "6.0.1")).toBe(-1);
	});
	it("1.0.0.1 > 1.0.0", () => {
		expect(Semver.compare("1.0.0.1", "1.0.0")).toBe(1);
	});
	it("01.0.0.1 > 1.0.0", () => {
		expect(Semver.compare("01.0.0.1", "1.0.0")).toBe(1);
	});
	it("01.000.0.0.0.0.01 > 1.0.0", () => {
		expect(Semver.compare("01.0.0.1", "1.0.0")).toBe(1);
	});
	it("1.0.1 isGreaterThan 1.0.0", () => {
		expect(Semver.isGreaterThan("1.0.1", "1.0.0")).toBe(true);
	});
	it("1.0.0 !isGreaterThan 1.0.1", () => {
		expect(Semver.isGreaterThan("1.0.0", "1.0.1")).toBe(false);
	});
	it("1.0.1 !isEqualTo 1.0.0", () => {
		expect(Semver.isEqualTo("1.0.1", "1.0.0")).toBe(false);
	});
	it("1.0.0 !isEqualTo 1.0.0", () => {
		expect(Semver.isEqualTo("1.0.0", "1.0.0")).toBe(true);
	});
	it("1.0.1 isLessThan 1.0.0", () => {
		expect(Semver.isLessThan("1.0.1", "1.0.0")).toBe(false);
	});
	it("1.0.0 isLessThan 1.0.1", () => {
		expect(Semver.isLessThan("1.0.0", "1.0.1")).toBe(true);
	});
	it("1.0.1 isGreaterThanOrEqual 1.0.0", () => {
		expect(Semver.isGreaterThanOrEqual("1.0.1", "1.0.0")).toBe(true);
	});
	it("1.0.0 !isGreaterThanOrEqual 1.0.1", () => {
		expect(Semver.isGreaterThanOrEqual("1.0.0", "1.0.1")).toBe(false);
	});
	it("1.0.0 isGreaterThanOrEqual 1.0.0", () => {
		expect(Semver.isGreaterThanOrEqual("1.0.0", "1.0.0")).toBe(true);
	});
	it("1.0.1 !isLessThanOrEqual 1.0.0", () => {
		expect(Semver.isLessThanOrEqual("1.0.1", "1.0.0")).toBe(false);
	});
	it("1.0.0 isLessThanOrEqual 1.0.1", () => {
		expect(Semver.isLessThanOrEqual("1.0.0", "1.0.1")).toBe(true);
	});
	it("1.0.0 isLessThanOrEqual 1.0.0", () => {
		expect(Semver.isLessThanOrEqual("1.0.0", "1.0.0")).toBe(true);
	});
});