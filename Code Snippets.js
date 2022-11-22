// Use of Static functions
class TestClass{
	constructor(){
		this.value = 42;
		this.registers = TestClass.registers; // dumb workaround to keep static functions on the constructed instance
	};
	static registers() {
		return {
			mode: 1,
			red: 2,
			green: 3,
			blue: 4
		};
	};
	static DoThings(){
		return 42;
	};
}

// profile function call times
class Profiler{
	constructor(context){
		this.context = context;
		this.startTime = Date.now();
		this.shortestTime = Infinity;
		this.longestTime = 0;
		this.averageTime = 0;
		this.values = [];
	}
	setStart(){
		this.startTime = Date.now();
	}
	report(){
		const elapsedTime = Date.now() - this.startTime;
		device.log(`${this.context} took: ${elapsedTime}ms!`);
	}
	detailedReport(){
		const currentTime = Date.now();
		const elapsedTime = currentTime - this.startTime;

		this.shortestTime = Math.min(this.shortestTime, elapsedTime);
		this.longestTime = Math.max(this.longestTime, elapsedTime);

		this.values.push(elapsedTime);

		// calculate the real average at a small number of values
		// swap over to a quicker to calculate moving average when we hit 50 calls.
		if(this.values.length < 50){
			this.averageTime = this.values.reduce((a, b) => (a + b)) / this.values.length;
		}else{
			this.averageTime -= this.values.shift() / 50;
			this.averageTime += elapsedTime / 50;
		}

		device.log(`${this.context} took: ${elapsedTime}ms!, Shortest: [${this.shortestTime}]ms, Longest: [${this.longestTime}]ms, Average: [${Math.round(this.averageTime * 100) / 100}]ms`);

		this.startTime = currentTime;

	}
}