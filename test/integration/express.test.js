'use strict';

const express = require('express');
const fixtures = require('./fixture/requests');
const request = require('request-promise-native');
const rpc = require('./fixture/rpc');

describe('Express middleware', () => {
	let app;
	let server;
	let endpoint;

	beforeAll(done => {
		app = express();
		app.use(rpc.express());
		server = app.listen(undefined, () => {
			endpoint = `http://localhost:${server.address().port}/rpc`;
			done();
		});
	});

	afterAll(() => {
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
			expect(response.statusCode).toStrictEqual(fixture.expectedResponseStatus);
			expect(JSON.parse(response.body)).toEqual(JSON.parse(fixture.expectedResponseData));
		});
	}

});
