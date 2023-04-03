
export default class semver{
	static isEqual(a, b){
		return this.compare(a, b) === 0;
	}
	static isGreaterThan(a, b){
		return this.compare(a, b) > 0;
	}
	static isLessThan(a, b){
		return this.compare(a, b) < 0;
	}
	static isGreaterThanOrEqual(a, b){
		return this.compare(a, b) >= 0;
	}
	static isLessThanOrEqual(a, b){
		return this.compare(a, b) <= 0;
	}

	static compare(a, b){
		const parsedA = a.split(".").map((x) => parseInt(x));
		const parsedB = b.split(".").map((x) => parseInt(x));

		return this.#recursiveCompare(parsedA, parsedB);
	}

	static #recursiveCompare(a, b){
		if (a.length === 0) { a = [0]; }

		if (b.length === 0) { b = [0]; }

		if (a[0] !== b[0] || (a.length === 1 && b.length === 1)) {
			if(a[0] < b[0]){
				return -1;
			}

			if(a[0] > b[0]){
				return 1;
			}

			return 0;

		}

		return this.#recursiveCompare(a.slice(1), b.slice(1));
	}
}