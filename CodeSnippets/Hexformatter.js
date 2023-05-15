export default class HexFormatter{
	/**
	 * @param {number} number
	 * @param {number} padding
	 */
	static toHex(number, padding){
		let hex = Number(number).toString(16);

		while (hex.length < padding) {
			hex = "0" + hex;
		}

		return "0x" + hex;
	}
	/**
	 * @param {number} number
	 */
	static toHex2(number){
		return this.toHex(number, 2);
	}
	/**
	 * @param {number} number
	 */
	static toHex4(number){
		return this.toHex(number, 4);
	}
}