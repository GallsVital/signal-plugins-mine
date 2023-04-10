import BinaryUtils from "./BinaryUtils.js";


describe("BinaryUtils", () => {
	it("WriteInt16LittleEndian handles typical input", () => {
		expect(BinaryUtils.WriteInt16LittleEndian(0x1337)).toStrictEqual([0x37, 0x13]);
		expect(BinaryUtils.WriteInt16LittleEndian(0xFF42)).toStrictEqual([0x42, 0xFF]);
		expect(BinaryUtils.WriteInt16LittleEndian(0x42FF)).toStrictEqual([0xFF, 0x42]);
	});
	it("WriteInt16LittleEndian handles out of bounds input", () => {
		expect(BinaryUtils.WriteInt16LittleEndian(0x133724)).toStrictEqual([0x24, 0x37]);
	});
	it("WriteInt16BigEndian handles typical input", () => {
		expect(BinaryUtils.WriteInt16BigEndian(0x1337)).toStrictEqual([0x13, 0x37]);
		expect(BinaryUtils.WriteInt16BigEndian(0xFF42)).toStrictEqual([0xFF, 0x42]);
		expect(BinaryUtils.WriteInt16BigEndian(0x42FF)).toStrictEqual([0x42, 0xFF]);
	});
	it("ReadInt16LittleEndian handles typical input", () => {
		expect(BinaryUtils.ReadInt16LittleEndian([0x37, 0x13])).toStrictEqual(0x1337);
		expect(BinaryUtils.ReadInt16LittleEndian([0xFF, 0x42])).toStrictEqual(0x42FF);
		expect(BinaryUtils.ReadInt16LittleEndian([0x42, 0xFF])).toStrictEqual(0xFF42);
	});
	it("ReadInt16LittleEndian handles out of bounds input", () => {
		expect(BinaryUtils.ReadInt16LittleEndian([0x37, 0x13, 0x42])).toStrictEqual(0x1337);
		expect(BinaryUtils.ReadInt16LittleEndian([0xFFFF, 0x3742])).toStrictEqual(0x42FF);
	});
	it("ReadInt16BigEndian handles typical input", () => {
		expect(BinaryUtils.ReadInt16BigEndian([0x13, 0x37])).toStrictEqual(0x1337);
		expect(BinaryUtils.ReadInt16BigEndian([0x42, 0xFF])).toStrictEqual(0x42FF);
		expect(BinaryUtils.ReadInt16BigEndian([0xFF, 0x42])).toStrictEqual(0xFF42);
	});
	it("WriteInt32LittleEndian handles typical input", () => {
		expect(BinaryUtils.WriteInt32LittleEndian(0x13373839)).toStrictEqual([0x39, 0x38, 0x37, 0x13]);
		expect(BinaryUtils.WriteInt32LittleEndian(0xFF42)).toStrictEqual([0x42, 0xFF, 0x00, 0x00]);
		expect(BinaryUtils.WriteInt32LittleEndian(0x42000000)).toStrictEqual([0x00, 0x00, 0x00, 0x42]);
		expect(BinaryUtils.WriteInt32LittleEndian(0x00000042)).toStrictEqual([0x42, 0x00, 0x00, 0x00]);
	});
	it("WriteInt32LittleEndian handles out of bounds input", () => {
		expect(BinaryUtils.WriteInt32LittleEndian(0x4013373839)).toStrictEqual([0x39, 0x38, 0x37, 0x13]);
		expect(BinaryUtils.WriteInt32LittleEndian(0x4042000000)).toStrictEqual([0x00, 0x00, 0x00, 0x42]);
		expect(BinaryUtils.WriteInt32LittleEndian(0x4000000042)).toStrictEqual([0x42, 0x00, 0x00, 0x00]);
	});
	it("WriteInt32BigEndian handles typical input", () => {
		expect(BinaryUtils.WriteInt32BigEndian(0x13373839)).toStrictEqual([0x13, 0x37, 0x38, 0x39]);
		expect(BinaryUtils.WriteInt32BigEndian(0xFF42)).toStrictEqual([0x00, 0x00, 0xFF, 0x42]);
		expect(BinaryUtils.WriteInt32BigEndian(0x42000000)).toStrictEqual([0x42, 0x00, 0x00, 0x00]);
		expect(BinaryUtils.WriteInt32BigEndian(0x00000042)).toStrictEqual([0x00, 0x00, 0x00, 0x42]);
	});
	it("WriteInt32BigEndian handles out of bounds input", () => {
		expect(BinaryUtils.WriteInt32BigEndian(0x4013373839)).toStrictEqual([0x13, 0x37, 0x38, 0x39]);
		expect(BinaryUtils.WriteInt32BigEndian(0x4042000000)).toStrictEqual([0x42, 0x00, 0x00, 0x00]);
		expect(BinaryUtils.WriteInt32BigEndian(0x4000000042)).toStrictEqual([0x00, 0x00, 0x00, 0x42]);
	});
	it("ReadInt32LittleEndian handles typical input", () => {
		expect(BinaryUtils.ReadInt32LittleEndian([0x39, 0x38, 0x37, 0x13])).toStrictEqual(0x13373839);
		expect(BinaryUtils.ReadInt32LittleEndian([0xFF, 0x42])).toStrictEqual(0x42FF);
	});
	it("ReadInt32BigEndian handles typical input", () => {
		expect(BinaryUtils.ReadInt32BigEndian([0x13, 0x37, 0x38, 0x39])).toStrictEqual(0x13373839);
		expect(BinaryUtils.ReadInt32BigEndian([0x42, 0xFF])).toStrictEqual(0x42FF0000);
	});
});