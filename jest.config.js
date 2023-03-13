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
		"^.+\\.jsx?$": "babel-jest", // Adding this line solved the issue
		"^.+\\.tsx?$": "ts-jest"
	},
	coveragePathIgnorePatterns: ["/node_modules/", "/tests/mocks.js", "/tests/Mocks/*"],
};

export default config;