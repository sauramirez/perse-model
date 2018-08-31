'use strict';

const Axios = require('axios');

/**
 * Create an axios instance with the options supported
 */
exports.createAxiosInstance = function (options) {

  options = options || {};
  const interceptors = options.interceptors;
  delete options.interceptors;
  const axios = Axios.create(options);
  if (interceptors) {
    if (interceptors.response) {
      axios.interceptors.response.use(interceptors.response.fn, interceptors.response.errorFn);
    }

    if (interceptors.request) {
      axios.interceptors.request.use(interceptors.request.fn, interceptors.request.errorFn);
    }
  }

  return axios;
};
