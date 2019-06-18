/**
 * @rowanmanning/rpc module
 * @module @rowanmanning/rpc
 */
'use strict';

const isPlainObject = require('is-plain-object');
const parseJsonBody = require('co-body').json;

/**
 * Represents an RPC API.
 */
class RPC {

	/**
	 * Class constructor.
	 *
	 * @access public
	 * @param {Object} [options={}]
	 *     An options object used to configure the RPC API.
	 * @param {String} [options.method='POST']
	 *     The HTTP method to add the RPC API on.
	 * @param {String} [options.path='/rpc']
	 *     The path to add the RPC API on.
	 */
	constructor(options) {
		this.options = this.constructor.applyDefaultOptions(options);
		this.methods = {};
	}

	/**
	 * Add a method to the RPC API.
	 *
	 * @param {String} name
	 *     The name of the method.
	 * @param {CallHandler} handler
	 *     A function used to handle calls to the named method.
	 * @throws {TypeError}
	 *     Throws an error if input is invalid.
	 * @returns {undefined}
	 *     Returns nothing.
	 */
	addMethod(name, handler) {
		if (typeof name !== 'string' || name.trim().length === 0) {
			throw new TypeError('Method name must be a non-empty string');
		}
		if (typeof handler !== 'function') {
			throw new TypeError('Method handler must be a function');
		}
		this.methods[name] = handler;
	}

	/**
	 * Call a method.
	 *
	 * @access public
	 * @param {Call} call
	 *     An object containing information about the call being made.
	 * @param {Object} [request={}]
	 *     The HTTP request that resulted in the call (if one exists).
	 * @returns {Promise<CallResponse>}
	 *     Returns the result of the call.
	 */
	async call(call, request = {}) {
		try {
			this.assertValidCall(call);
			const id = call.id || null;
			const params = Object.assign({}, call.params);
			return {
				id,
				result: await this.methods[call.method](params, request, this)
			};
		} catch (error) {
			const response = {
				id: (call && call.id ? call.id : null),
				error: {}
			};
			if (error.code) {
				response.error.code = error.code;
			}
			if (error.message) {
				response.error.message = error.message;
			}
			if (error.data) {
				response.error.data = error.data;
			}
			return response;
		}
	}

	/**
	 * Call a batch of methods.
	 *
	 * @access public
	 * @param {Array<Call>} batch
	 *     An array of objects containing information about the calls being made.
	 * @param {Object} [request={}]
	 *     The HTTP request that resulted in the call (if one exists).
	 * @returns {Promise<Array<CallResponse>>}
	 *     Returns the result of the call.
	 */
	batch(batch, request = {}) {
		if (!Array.isArray(batch)) {
			return {
				id: null,
				error: {
					code: 'INVALID_REQUEST',
					message: 'Batch call must be an array'
				}
			};
		}
		return Promise.all(batch.map(call => this.call(call, request)));
	}

	/**
	 * Create an Express middleware function used to make calls to the RPC API.
	 * See the {@link RPC#call} method for more information.
	 *
	 * @access public
	 * @returns {Function}
	 *     Returns an Express middleware function.
	 */
	express() {
		return async (request, response, next) => {
			if (request.path !== this.options.path || request.method !== this.options.method) {
				return next();
			}
			if (!request.is('application/json')) {
				return response.send({
					id: null,
					error: {
						code: 'INVALID_REQUEST',
						message: 'Request Content-Type must be "application/json"'
					}
				});
			}
			try {
				const body = await parseJsonBody(request, {
					strict: false
				});
				if (Array.isArray(body)) {
					response.send(await this.batch(body, request));
				} else {
					response.send(await this.call(body, request));
				}
			} catch (error) {
				if (error instanceof SyntaxError) {
					return response.send({
						id: null,
						error: {
							code: 'INVALID_REQUEST',
							message: 'JSON is invalid and cannot be parsed'
						}
					});
				}
				return next(error);
			}
		};
	}

	/**
	 * Create a Koa middleware function used to make calls to the RPC API.
	 * See the {@link RPC#call} method for more information.
	 *
	 * @access public
	 * @returns {Function}
	 *     Returns a Koa middleware function.
	 */
	koa() {
		return async (context, next) => {
			if (context.path !== this.options.path || context.method !== this.options.method) {
				return next();
			}
			if (!context.is('application/json')) {
				context.body = {
					id: null,
					error: {
						code: 'INVALID_REQUEST',
						message: 'Request Content-Type must be "application/json"'
					}
				};
				return next();
			}
			try {
				const body = await parseJsonBody(context, {
					strict: false
				});
				if (Array.isArray(body)) {
					context.body = await this.batch(body, context.request);
				} else {
					context.body = await this.call(body, context.request);
				}
				return next();
			} catch (error) {
				if (error instanceof SyntaxError) {
					context.body = {
						id: null,
						error: {
							code: 'INVALID_REQUEST',
							message: 'JSON is invalid and cannot be parsed'
						}
					};
					return next();
				}
				return next(error);
			}
		};
	}

	/**
	 * Throw an error with some added properties.
	 *
	 * @access public
	 * @param {String} message
	 *     A short description of the error.
	 * @param {String} [code]
	 *     The error code.
	 * @param {*} [data]
	 *     Additional context to explain the error.
	 * @throws {CallError}
	 *     Throws an error if the call is invalid.
	 * @returns {undefined}
	 *     Returns nothing.
	 */
	throw(message, code, data) {
		const error = new Error(message);
		if (code) {
			error.code = code;
		}
		if (data) {
			error.data = data;
		}
		throw error;
	}

	/**
	 * Throw an error if a call is invalid.
	 *
	 * @access private
	 * @param {Call} call
	 *     An object containing information about the call being made.
	 * @throws {CallError}
	 *     Throws an error if the call is invalid.
	 * @returns {undefined}
	 *     Returns nothing.
	 */
	assertValidCall(call) {
		if (!isPlainObject(call)) {
			this.throw('Call must be a plain object', 'INVALID_REQUEST');
		}
		if (typeof call.id !== 'string' || call.id.trim().length === 0) {
			if (call.id !== undefined) {
				this.throw('Call ID must be a non-empty string or undefined', 'INVALID_REQUEST');
			}
		}
		if (typeof call.method !== 'string' || call.method.trim().length === 0) {
			this.throw('Call method must be a non-empty string', 'INVALID_REQUEST');
		}
		if (!isPlainObject(call.params) && call.params !== undefined) {
			this.throw('Call params must be a plain object or undefined', 'INVALID_REQUEST');
		}
		if (!this.methods[call.method]) {
			this.throw('Call method does not exist', 'METHOD_NOT_FOUND');
		}
	}

	/**
	 * Apply default values to a set of user-provided options.
	 * Used internally by {@link RPC#constructor}.
	 *
	 * @access private
	 * @param {Object} [userOptions={}]
	 *     Options to add on top of the defaults. See {@link RPC#constructor}.
	 * @returns {Object}
	 *     Returns the defaulted options.
	 */
	static applyDefaultOptions(userOptions) {
		return Object.assign({}, this.defaultOptions, userOptions);
	}

}

/**
 * Default options to be used in construction of an RPC API.
 *
 * @access private
 * @type {Object}
 */
RPC.defaultOptions = {
	method: 'POST',
	path: '/rpc'
};

module.exports = RPC;

/**
 * @typedef {Object} Call
 * @property {String} [id]
 *     A unique identifier for the call, used to match calls to their responses.
 * @property {String} method
 *     The method to execute.
 * @property {Object} [params]
 *     Parameters to pass to the method.
 */

/**
 * @typedef {Object} CallResponse
 * @property {String} [id]
 *     A unique identifier for the call, used to match calls to their responses.
 * @property {*} [result]
 *     The result of the method call.
 * @property {CallError} [error]
 *     Parameters to pass to the method.
 */

/**
 * @typedef {Object} CallError
 * @property {String} message
 *     A short description of the error.
 * @property {String} [code]
 *     The error code.
 * @property {*} [data]
 *     Additional context to explain the error.
 */

/**
 * @typedef {Function} CallHandler
 * @param {Object} params
 *     The parameters passed into the call.
 * @param {Object} [request]
 *     The HTTP request that resulted in the call (if one exists).
 * @param {RPC} rpc
 *     The RPC instance the call was made to.
 */
