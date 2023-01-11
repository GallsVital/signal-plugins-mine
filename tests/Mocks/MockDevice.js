
export class MockDevice{
	log = jest.fn().mockImplementation((data) => {
		console.log(data);
	});
	color = jest.fn().mockImplementation(() => {
		return [10, 20, 30];
	});
	setName = jest.fn().mockImplementation((name) => {});
	setSize = jest.fn().mockImplementation(([x, y]) => {});
	setControllableLeds = jest.fn().mockImplementation((names, positions) => {});
	write = jest.fn().mockImplementation((data, length) => {});
	read = jest.fn().mockImplementation((data, length) => { return new Array(length).fill(0);});
	getLastReadSize = jest.fn().mockImplementation(() => { });

	set_endpoint = jest.fn().mockImplementation((Interface, Usage, UsagePage, Collection) => {});
	clearReadBuffer = jest.fn().mockImplementation(() => {});
}