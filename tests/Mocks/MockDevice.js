
export class MockDevice{
	log = jest.fn().mockImplementation((data) => {
		console.log(data);
	});
	color = jest.fn().mockImplementation(() => {
		return [10, 20, 30];
	});
	vendorId = jest.fn().mockImplementation(() => {} );
	productId = jest.fn().mockImplementation(() => {} );
	setName = jest.fn().mockImplementation((name) => {});
	setSize = jest.fn().mockImplementation(([x, y]) => {});
	setControllableLeds = jest.fn().mockImplementation((names, positions) => {});
	write = jest.fn().mockImplementation((data, length) => {});
	read = jest.fn().mockImplementation((data, length) => { return new Array(length).fill(0);});
	send_report = jest.fn().mockImplementation((data, length) => {});
	get_report = jest.fn().mockImplementation((data, length) => { return new Array(length).fill(0);});

	getHidInfo = jest.fn().mockImplementation(() => {});
	getLastReadSize = jest.fn().mockImplementation(() => { });

	set_endpoint = jest.fn().mockImplementation((Interface, Usage, UsagePage, Collection) => {});
	clearReadBuffer = jest.fn().mockImplementation(() => {});
	pause = jest.fn().mockImplementation(() => {});
	addFeature = jest.fn().mockImplementation((feature) => {}); //Each feature needs mocked tbh.
}