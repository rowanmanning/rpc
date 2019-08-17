'use strict';

const assert = require('proclaim');
const express = require('express');
const fixtures = require('./fixture/requests');
const request = require('request-promise-native');
const rpc = require('./fixture/rpc');

describe('Express middleware', () => {
	let app;
	let server;
	let endpoint;

	before(done => {
		app = express();
		app.use(rpc.express());
		server = app.listen(undefined, () => {
			endpoint = `http://localhost:${server.address().port}/rpc`;
			done();
		});
	});

	after(() => {
		server.close();
	});

	for (const fixture of fixtures) {
		it(fixture.name, async () => {
			const response = await request({
				method: 'post',
				uri: endpoint,
				headers: {
					'content-type': fixture.requestContentType || 'application/json'
				},
				body: fixture.requestData,
				resolveWithFullResponse: true
			});
			assert.strictEqual(response.statusCode, fixture.expectedResponseStatus);
			assert.deepEqual(JSON.parse(response.body), JSON.parse(fixture.expectedResponseData));
		});
	}

});
