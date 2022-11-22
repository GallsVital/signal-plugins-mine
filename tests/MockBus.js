export class MockBus{
	IsSystemBus = jest.fn().mockImplementation(() => {return false;});
	IsIntelBus = jest.fn().mockImplementation(() => {return false;});
	IsAMDBus = jest.fn().mockImplementation(() => {return false;});
	IsNvidiaBus = jest.fn().mockImplementation(() => {return false;});
	IsNuvotonBus = jest.fn().mockImplementation(() => {return false;});

	WriteQuick = jest.fn().mockImplementation((address) => { return -1; });
	WriteBlock = jest.fn().mockImplementation((register, Length, Data) => {return -1;  });
	ReadByte = jest.fn().mockImplementation((address, register) => {return -1;  });

	log = jest.fn().mockImplementation((data) => {
		console.log(data);
	});
}
