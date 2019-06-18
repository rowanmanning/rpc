'use strict';

module.exports = [
	{
		name: 'RPC call',
		requestData: '{"id": "abc", "method": "subtract", "params": {"a": 42, "b": 23}}',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": "abc", "result": 19}'
	},
	{
		name: 'Batch RPC call',
		requestData: '[{"id": "abc", "method": "subtract", "params": {"a": 42, "b": 23}}, {"id": "def", "method": "subtract", "params": {"a": 5, "b": 3}}]',
		expectedResponseStatus: 200,
		expectedResponseData: '[{"id": "abc", "result": 19}, {"id": "def", "result": 2}]'
	},
	{
		name: 'Batch RPC call with one erroring call',
		requestData: '[{"id": "abc", "method": "subtract", "params": {"a": 42, "b": 23}}, {"id": "def", "method": "foobar"}]',
		expectedResponseStatus: 200,
		expectedResponseData: '[{"id": "abc", "result": 19}, {"id": "def", "error": {"code": "METHOD_NOT_FOUND", "message": "Call method does not exist"}}]'
	},
	{
		name: 'RPC call with no ID',
		requestData: '{"method": "subtract", "params": {"a": 42, "b": 23}}',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": null, "result": 19}'
	},
	{
		name: 'RPC call with invalid ID',
		requestData: '{"id": [1], "method": "subtract", "params": {"a": 42, "b": 23}}',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": [1], "error": {"code": "INVALID_REQUEST", "message": "Call ID must be a non-empty string or undefined"}}'
	},
	{
		name: 'RPC call with non-existent method',
		requestData: '{"id": "abc", "method": "foobar"}',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": "abc", "error": {"code": "METHOD_NOT_FOUND", "message": "Call method does not exist"}}'
	},
	{
		name: 'RPC call with invalid method',
		requestData: '{"id": "abc", "method": 1}',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": "abc", "error": {"code": "INVALID_REQUEST", "message": "Call method must be a non-empty string"}}'
	},
	{
		name: 'RPC call with invalid params (general)',
		requestData: '{"id": "abc", "method": "subtract", "params": [1, 2]}',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": "abc", "error": {"code": "INVALID_REQUEST", "message": "Call params must be a plain object or undefined"}}'
	},
	{
		name: 'RPC call with invalid params (method-specific)',
		requestData: '{"id": "abc", "method": "subtract", "params": {"a": 42, "b": "23"}}',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": "abc", "error": {"message": "\\"b\\" must be a number"}}'
	},
	{
		name: 'RPC call with invalid JSON',
		requestData: '{"id": "abc", "method": "foobar, "params": "bar", "baz]',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": null, "error": {"code": "INVALID_REQUEST", "message": "JSON is invalid and cannot be parsed"}}'
	},
	{
		name: 'RPC call with non-JSON',
		requestContentType: 'application/x-www-form-urlencoded',
		requestData: 'id=abc&method=subtract&params[a]=42&params[b]=23',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": null, "error": {"code": "INVALID_REQUEST", "message": "Request Content-Type must be \\"application/json\\""}}'
	},
	{
		name: 'RPC call with non-object-or-array JSON',
		requestData: '123',
		expectedResponseStatus: 200,
		expectedResponseData: '{"id": null, "error": {"code": "INVALID_REQUEST", "message": "Call must be a plain object"}}'
	}
];
