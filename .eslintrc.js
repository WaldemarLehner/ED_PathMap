module.exports = {
	"env": {
		"browser": true,
		//"devel":true,
		"mocha":true,
		"commonjs": true,
		"es6": true,
		"node": true,
		
	},
	"extends": "eslint:recommended",
	"globals": {
		"Atomics": "readonly",
		"SharedArrayBuffer": "readonly",
		"no-console":"warn"
	},
	"parserOptions": {
		"ecmaVersion": 2018
	},
	"rules": {
		"indent": [
			"warn",
			"tab"
		],
		"linebreak-style": [
			"error",
			"windows"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		]
	}
};