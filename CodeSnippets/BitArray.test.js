import BitArray from "./BitArray.js";


describe("BitArray", () => {

	test("Constructor", () => {
		let bitArray = new BitArray(3);

		expect(bitArray.toArray().length).toBe(3);

		bitArray = new BitArray(10);

		expect(bitArray.toArray().length).toBe(10);
	});

	test("Can set and clear bits", () => {
		const bitArray = new BitArray(3);

		expect(bitArray.toArray()).toEqual([0, 0, 0]);

		bitArray.set(1);

		expect(bitArray.toArray()).toEqual([2, 0, 0]);
		bitArray.set(0);

		expect(bitArray.toArray()).toEqual([3, 0, 0]);

		bitArray.clear(1);
		expect(bitArray.toArray()).toEqual([1, 0, 0]);

		bitArray.set(8 * 2 + 5);

		expect(bitArray.toArray()).toEqual([1, 0, 1 << 5]);

		bitArray.clear(8 * 2 + 4);

		expect(bitArray.toArray()).toEqual([1, 0, 1 << 5]);

	});

	test("Can toggle bits", () => {
		const bitArray = new BitArray(3);

		expect(bitArray.toArray()).toEqual([0, 0, 0]);

		bitArray.toggle(1);

		expect(bitArray.toArray()).toEqual([2, 0, 0]);
		bitArray.toggle(0);

		expect(bitArray.toArray()).toEqual([3, 0, 0]);

		bitArray.toggle(1);
		bitArray.toggle(0);

		expect(bitArray.toArray()).toEqual([0, 0, 0]);

		bitArray.set(8 * 2 + 5);

		expect(bitArray.toArray()).toEqual([0, 0, 1 << 5]);

		bitArray.toggle(8 * 2 + 5);

		expect(bitArray.toArray()).toEqual([0, 0, 0]);
	});

	test("Can get bit states", () => {
		const bitArray = new BitArray(3);
		const mockCallback = jest.fn((bitIdx, state) => {});
		bitArray.setCallback(mockCallback);

		bitArray.setState(0, true);
		expect(bitArray.get(0)).toBe(true);

		bitArray.setState(0, false);
		expect(bitArray.get(0)).toBe(false);

		bitArray.update([2, 0, 0]);
		expect(bitArray.get(1)).toBe(true);
	});

	test("Can set bit states", () => {
		const bitArray = new BitArray(3);

		expect(bitArray.toArray()).toEqual([0, 0, 0]);

		bitArray.setState(1, true);

		expect(bitArray.toArray()).toEqual([2, 0, 0]);
		bitArray.setState(0, true);

		expect(bitArray.toArray()).toEqual([3, 0, 0]);

		bitArray.setState(1, true);
		bitArray.setState(0, false);

		expect(bitArray.toArray()).toEqual([2, 0, 0]);

		bitArray.setState(8 * 2 + 5, true);

		expect(bitArray.toArray()).toEqual([2, 0, 1 << 5]);

		bitArray.setState(8 * 2 + 5, true);

		expect(bitArray.toArray()).toEqual([2, 0, 1 << 5]);
	});

	test("Can track changes", () => {
		const bitArray = new BitArray(3);

		const mockCallback = jest.fn((bitIdx, state) => {});

		bitArray.setCallback(mockCallback);

		// Set Bit
		bitArray.update([0, 2, 0]);

		expect(mockCallback).toBeCalledTimes(1);
		expect(mockCallback).lastCalledWith(8 * 1 + 1, true);

		// Call with same bits set
		bitArray.update([0, 2, 0]);

		expect(mockCallback).toBeCalledTimes(1);

		// Call with another bit set
		bitArray.update([0, 2, 1]);

		expect(mockCallback).toBeCalledTimes(2);
		expect(mockCallback).lastCalledWith(8 * 2, true);

		// Call with no bits set and expect the callback to fire twice
		bitArray.update([0, 0, 0]);

		expect(mockCallback).toBeCalledTimes(4);
		expect(mockCallback).nthCalledWith(3, 8 * 1 + 1, false);
		expect(mockCallback).nthCalledWith(4, 8 * 2, false);
	});

	test("Mock Logitech Sniper Mode with clicks", () => {
		const bitArray = new BitArray(1);

		const mockCallback = jest.fn((bitIdx, state) => {console.log(`Called with ${bitIdx} - ${state}`);});

		bitArray.setCallback(mockCallback);

		bitArray.update([0x20]);
		expect(mockCallback).toBeCalledTimes(1);
		expect(mockCallback).lastCalledWith(5, true);

		bitArray.update([0x00]);
		expect(mockCallback).toBeCalledTimes(2);
		expect(mockCallback).lastCalledWith(5, false);

		bitArray.update([0x20]);
		expect(mockCallback).toBeCalledTimes(3);
		expect(mockCallback).lastCalledWith(5, true);

		bitArray.update([0x21]);
		expect(mockCallback).toBeCalledTimes(4);
		expect(mockCallback).lastCalledWith(0, true);

		bitArray.update([0x20]);
		expect(mockCallback).toBeCalledTimes(5);
		expect(mockCallback).lastCalledWith(0, false);

		bitArray.update([0x00]);
		expect(mockCallback).toBeCalledTimes(6);
		expect(mockCallback).lastCalledWith(5, false);
	});
});