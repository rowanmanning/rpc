
# @rowanmanning/rpc

Handle RPC endpoints, standalone or for [Express](https://expressjs.com/) and [Koa](https://koajs.com/). The RPC endpoint accepts JSON POST requests and takes some influence from [JSON-RPC 2.0](https://www.jsonrpc.org/specification).

**:warning: This is pre-release software, use in production at your own risk**


## Table of Contents

  * [Requirements](#requirements)
  * [Usage](#usage)
    * [Creating an RPC endpoint](#creating-an-rpc-endpoint)
    * [Adding a method](#adding-a-method)
    * [Mounting in Express](#mounting-in-express)
    * [Mounting in Koa](#mounting-in-koa)
    * [Using the API](#using-the-api)
      * [Making a call](#making-a-call)
      * [Batching calls](#batching-calls)
      * [Identifying call responses](#identifying-call-responses)
      * [Handling errors](#handling-errors)
  * [Contributing](#contributing)
  * [License](#license)


## Requirements

This library requires the following to run:

  * [Node.js](https://nodejs.org/) 10+


## Usage

Install with [npm](https://www.npmjs.com/):

```sh
npm install @rowanmanning/rpc
```

Load the library into your code with a `require` call:

```js
const RPC = require('@rowanmanning/rpc');
```

### Creating an RPC endpoint

```js
const rpc = new RPC(options);
```

The available options are:

  - `method`: The HTTP method to add the RPC API on. Defaults to `POST`.
  - `path`: The path to add the RPC API on. Defaults to `/rpc`.

### Adding a method

To add a method to the RPC endpoint, use:

```js
rpc.addMethod('sum', params => {
    return params.a + params.b;
});
```

Methods also have access to the original request that resulted in the call, as well as the RPC instance that it belongs to:

```js
rpc.addMethod('sum', (params, request, rpc) => {
    // ...
});
```

### Mounting in Express

Mount on an Express application by adding as middleware:

```js
const app = express();
app.use(rpc.express());
```

### Mounting in Koa

Mount on a Koa application by adding as middleware:

```js
const app = new Koa();
app.use(rpc.koa());
```

### Using the API

Once you have set up an application, you can access the rpc endpoint that you set up over HTTP. All methods (even methods that only _retrieve_ data) are called with a POST request with a JSON request body.

#### Making a call

There are a couple of rules to follow when making calls to the RPC API:

  - The `Content-Type` header **must** be `application/json`
  - The request body **must** be a JSON object: `{}`
  - Each JSON object in the request body **must** have a `method` property set to a non-empty string
  - Each JSON object in the request body **may** have an `id` property set to a non-empty string
  - Each JSON object in the request body **may** have a `params` property set to an object

Assuming that your application is running locally on port `8080`:

```http
POST /rpc HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{"method": "sum", "params": {"a": 100, "b": 37}}
```

Will result in the response:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"id": null, "result": 137}
```

#### Batching calls

You can call multiple methods in parallel by batching calls together. There are a couple of rules to follow when making batch calls to the RPC API:

  - The `Content-Type` header **must** be `application/json`
  - The request body **must** be a JSON array: `[]`
  - Each entry in the JSON array must be an object which meets the rules outlined in ["Making a call"](#making-a-call)

Assuming that your application is running locally on port `8080`:

```http
POST /rpc HTTP/1.1
Host: localhost:8080
Content-Type: application/json

[
    {"method": "sum", "params": {"a": 100, "b": 37}},
    {"method": "sum", "params": {"a": 63, "b": 74}}
]
```

Will result in the response:

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
    {"id": null, "result": 137},
    {"id": null, "result": 137}
]
```

#### Identifying call responses

Mostly when batching calls, it's useful to be able to identify which call output which result. You can do this by specifying an `id` property on each of your calls. The `id` will be reflected in the result:

```http
POST /rpc HTTP/1.1
Host: localhost:8080
Content-Type: application/json

[
    {"id": "call1", "method": "sum", "params": {"a": 100, "b": 37}},
    {"id": "call2", "method": "sum", "params": {"a": 63, "b": 74}}
]
```

Will result in the response:

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
    {"id": "call1", "result": 137},
    {"id": "call2", "result": 137}
]
```

We recommend using UUIDs for call IDs.


#### Handling errors

If an error occurs when executing a call, the response will contain an error property rather than a result property. It's important to note that even erroring responses have a `200` HTTP status code – don't rely on this meaning that your call was successful.

Assuming that your application is running locally on port `8080`:

```http
POST /rpc HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{"method": "sum", "params": "invalid"}
```

Will result in the response:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"id": null, "error": {"code": "INVALID_REQUEST", "message": "Call params must be a plain object or undefined"}}
```

Some errors will also have a `data` property which gives more context to the error.

When batching calls, it's possible for some calls to succeed and some to fail as they're executed separately. Take this into consideration when processing results.


## Contributing

To contribute to this library, clone this repo locally and commit your code on a separate branch. Please write unit tests for your code, and run the linter before opening a pull-request:

```sh
make test    # run all tests
make verify  # run all linters
```


## License

Licensed under the [MIT](LICENSE) license.<br/>
Copyright &copy; 2019, Rowan Manning
