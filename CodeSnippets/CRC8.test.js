import CRC8 from "./CRC8";

describe("CRC8", () => {
	it("Generates SMBus CheckSum Without Table", () => {
		const CRCFactory = new CRC8(0x07, 0x00, 0x00);

		expect(CRCFactory.FromBufferWithoutTable([0x42, 0x69, 0x32])).toBe(0x86);
		expect(CRCFactory.FromBufferWithoutTable([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59])).toBe(0x40);
	});

	it("Generates DARC CheckSum Without Table", () => {
		const CRCFactory = new CRC8(0x39, 0x00, 0x00, true, true);

		expect(CRCFactory.FromBufferWithoutTable([0x42, 0x69, 0x32])).toBe(0xF3);
		expect(CRCFactory.FromBufferWithoutTable([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59])).toBe(0x06);
	});

	it("Generates MAXIM CheckSum Without Table", () => {
		const CRCFactory = new CRC8(0x31, 0x00, 0x00, true, true);

		expect(CRCFactory.FromBufferWithoutTable([0x42, 0x69, 0x32])).toBe(0x94);
		expect(CRCFactory.FromBufferWithoutTable([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59])).toBe(0xCD);
	});
	it("Handles Razer CRC's Without Table", () => {
		const CRCFactory = new CRC8(0x01);
		expect(CRCFactory.FromBufferWithoutTable([5, 10, 15, 20, 25])).toBe(13);
		expect(CRCFactory.FromBufferWithoutTable([0x49, 0x37, 0x00, 0x49, 0x31, 0x69])).toBe(111);
	});

	it("Generates SMBus Table", () => {
		const SMBusPecTable = [
			0,   7,   14,  9,   28,  27,  18,  21,  56,  63,  54,  49,  36,  35,  42,  45,  112, 119, 126, 121, 108, 107, 98,  101, 72,  79,
			70,  65,  84,  83,  90,  93,  224, 231, 238, 233, 252, 251, 242, 245, 216, 223, 214, 209, 196, 195, 202, 205, 144, 151, 158, 153,
			140, 139, 130, 133, 168, 175, 166, 161, 180, 179, 186, 189, 199, 192, 201, 206, 219, 220, 213, 210, 255, 248, 241, 246, 227, 228,
			237, 234, 183, 176, 185, 190, 171, 172, 165, 162, 143, 136, 129, 134, 147, 148, 157, 154, 39,  32,  41,  46,  59,  60,  53,  50,
			31,  24,  17,  22,  3,   4,   13,  10,  87,  80,  89,  94,  75,  76,  69,  66,  111, 104, 97,  102, 115, 116, 125, 122, 137, 142,
			135, 128, 149, 146, 155, 156, 177, 182, 191, 184, 173, 170, 163, 164, 249, 254, 247, 240, 229, 226, 235, 236, 193, 198, 207, 200,
			221, 218, 211, 212, 105, 110, 103, 96,  117, 114, 123, 124, 81,  86,  95,  88,  77,  74,  67,  68,  25,  30,  23,  16,  5,   2,
			11,  12,  33,  38,  47,  40,  61,  58,  51,  52,  78,  73,  64,  71,  82,  85,  92,  91,  118, 113, 120, 127, 106, 109, 100, 99,
			62,  57,  48,  55,  34,  37,  44,  43,  6,   1,   8,   15,  26,  29,  20,  19,  174, 169, 160, 167, 178, 181, 188, 187, 150, 145,
			152, 159, 138, 141, 132, 131, 222, 217, 208, 215, 194, 197, 204, 203, 230, 225, 232, 239, 250, 253, 244, 243
		];
		const CRCFactory = new CRC8(0x07, 0x00, 0x00);
		expect(CRCFactory.GetPECTable()).toEqual(SMBusPecTable);
	});

	it("Generates DARC Table", () => {
		const DARCPecTable = [
			0x00, 0x72, 0xE4, 0x96, 0xF1, 0x83, 0x15, 0x67, 0xDB, 0xA9, 0x3F, 0x4D, 0x2A, 0x58, 0xCE, 0xBC,
			0x8F, 0xFD, 0x6B, 0x19, 0x7E, 0x0C, 0x9A, 0xE8, 0x54, 0x26, 0xB0, 0xC2, 0xA5, 0xD7, 0x41, 0x33,
			0x27, 0x55, 0xC3, 0xB1, 0xD6, 0xA4, 0x32, 0x40, 0xFC, 0x8E, 0x18, 0x6A, 0x0D, 0x7F, 0xE9, 0x9B,
			0xA8, 0xDA, 0x4C, 0x3E, 0x59, 0x2B, 0xBD, 0xCF, 0x73, 0x01, 0x97, 0xE5, 0x82, 0xF0, 0x66, 0x14,
			0x4E, 0x3C, 0xAA, 0xD8, 0xBF, 0xCD, 0x5B, 0x29, 0x95, 0xE7, 0x71, 0x03, 0x64, 0x16, 0x80, 0xF2,
			0xC1, 0xB3, 0x25, 0x57, 0x30, 0x42, 0xD4, 0xA6, 0x1A, 0x68, 0xFE, 0x8C, 0xEB, 0x99, 0x0F, 0x7D,
			0x69, 0x1B, 0x8D, 0xFF, 0x98, 0xEA, 0x7C, 0x0E, 0xB2, 0xC0, 0x56, 0x24, 0x43, 0x31, 0xA7, 0xD5,
			0xE6, 0x94, 0x02, 0x70, 0x17, 0x65, 0xF3, 0x81, 0x3D, 0x4F, 0xD9, 0xAB, 0xCC, 0xBE, 0x28, 0x5A,
			0x9C, 0xEE, 0x78, 0x0A, 0x6D, 0x1F, 0x89, 0xFB, 0x47, 0x35, 0xA3, 0xD1, 0xB6, 0xC4, 0x52, 0x20,
			0x13, 0x61, 0xF7, 0x85, 0xE2, 0x90, 0x06, 0x74, 0xC8, 0xBA, 0x2C, 0x5E, 0x39, 0x4B, 0xDD, 0xAF,
			0xBB, 0xC9, 0x5F, 0x2D, 0x4A, 0x38, 0xAE, 0xDC, 0x60, 0x12, 0x84, 0xF6, 0x91, 0xE3, 0x75, 0x07,
			0x34, 0x46, 0xD0, 0xA2, 0xC5, 0xB7, 0x21, 0x53, 0xEF, 0x9D, 0x0B, 0x79, 0x1E, 0x6C, 0xFA, 0x88,
			0xD2, 0xA0, 0x36, 0x44, 0x23, 0x51, 0xC7, 0xB5, 0x09, 0x7B, 0xED, 0x9F, 0xF8, 0x8A, 0x1C, 0x6E,
			0x5D, 0x2F, 0xB9, 0xCB, 0xAC, 0xDE, 0x48, 0x3A, 0x86, 0xF4, 0x62, 0x10, 0x77, 0x05, 0x93, 0xE1,
			0xF5, 0x87, 0x11, 0x63, 0x04, 0x76, 0xE0, 0x92, 0x2E, 0x5C, 0xCA, 0xB8, 0xDF, 0xAD, 0x3B, 0x49,
			0x7A, 0x08, 0x9E, 0xEC, 0x8B, 0xF9, 0x6F, 0x1D, 0xA1, 0xD3, 0x45, 0x37, 0x50, 0x22, 0xB4, 0xC6
		];

		const CRCFactory = new CRC8(0x39, 0x00, 0x00, true, true);
		expect(CRCFactory.GetPECTable()).toEqual(DARCPecTable);
	});

	it("Generates SMBus CheckSum", () => {
		const CRCFactory = new CRC8(0x07, 0x00, 0x00);

		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32])).toBe(0x86);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59])).toBe(0x40);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59], 1, 6)).toBe(0xBF);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59], 1)).toBe(0xBC);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59], 0, 6)).toBe(0x9B);
	});

	it("Generates DARC CheckSum", () => {
		const CRCFactory = new CRC8(0x39, 0x00, 0x00, true, true);

		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32])).toBe(0xF3);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59])).toBe(0x06);
	});

	it("Generates MAXIM CheckSum", () => {
		const CRCFactory = new CRC8(0x31, 0x00, 0x00, true, true);

		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32])).toBe(0x94);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59])).toBe(0xCD);
	});

	it("Handles Razer CRC's (for posterity)", () => {
		const CRCFactory = new CRC8(0x01);
		expect(CRCFactory.FromBuffer([5, 10, 15, 20, 25])).toBe(13);
		expect(CRCFactory.FromBuffer([0x49, 0x37, 0x00, 0x49, 0x31, 0x69])).toBe(111);
	});

	it("Generates ROHC CheckSum", () => {
		const CRCFactory = new CRC8(0x07, 0xFF, 0x00, true, true);

		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32])).toBe(0xE0);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59])).toBe(0x45);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59], 1, 6)).toBe(0xFE);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59], 1)).toBe(0xAD);
		expect(CRCFactory.FromBuffer([0x42, 0x69, 0x32, 0x49, 0x32, 0x36, 0x59], 0, 6)).toBe(0xB3);

	});
});
