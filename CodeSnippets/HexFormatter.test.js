import HexFormatter from "./Hexformatter";

describe("HexFormatter", () => {
	it("no padding", () => {
		const number = 0x450;

		expect(HexFormatter.toHex(number)).toEqual("0x450");
	});

	it("2 wide padding", () => {
		const number1 = 0x450;

		expect(HexFormatter.toHex2(number1)).toEqual("0x450");

		const number2 = 0x4;

		expect(HexFormatter.toHex2(number2)).toEqual("0x04");
	});
	it("4 wide padding", () => {
		const number1 = 0x450;
		const number2 = 0x4;
		const number3 = 0x424242;

		expect(HexFormatter.toHex4(number1)).toEqual("0x0450");
		expect(HexFormatter.toHex4(number2)).toEqual("0x0004");
		expect(HexFormatter.toHex4(number3)).toEqual("0x424242");
	});
	it("8 wide padding", () => {
		const number1 = 0x450;
		const number2 = 0x4;
		const number3 = 0x424242;

		expect(HexFormatter.toHex(number1, 8)).toEqual("0x00000450");
		expect(HexFormatter.toHex(number2, 8)).toEqual("0x00000004");
		expect(HexFormatter.toHex(number3, 8)).toEqual("0x00424242");
	});
});