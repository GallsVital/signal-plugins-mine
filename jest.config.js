// /** @type {import('jest').Config} */

const config = {
	// coverageThreshold: {
	// 	global: {
	// 		branches: 70,
	// 		functions: 70,
	// 		lines: 70,
	// 		statements: -10,
	// 	},
	// },
	//moduleDirectories: ["node_modules", "<rootDir>/tests"],
	transform: {
		"^.+\\.[t|j]sx?$": "babel-jest"
	},
	coveragePathIgnorePatterns: ["/node_modules/", "/tests/mocks.js", "/tests/Mocks/*"],
};

export default config;