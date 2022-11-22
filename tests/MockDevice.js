
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
}