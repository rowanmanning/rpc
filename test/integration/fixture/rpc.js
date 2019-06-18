'use strict';

const RPC = require('../../..');

const rpc = module.exports = new RPC();

rpc.addMethod('subtract', params => {
	if (typeof params.a !== 'number') {
		throw new Error('"a" must be a number');
	}
	if (typeof params.b !== 'number') {
		throw new Error('"b" must be a number');
	}
	return params.a - params.b;
});
