'use strict';

const Qs = require('qs');
const Utils = require('./utils');

class PerseCollection {

  static get model() {

    throw new Error('Override static model getter');
  }

  static get urlRoot() {

    return this.model.urlRoot;
  }

  constructor(options = {}) {

    this.models = [];
    if (options.axios && options.axios.instance) {
      this.axios = options.axios.instance;
    }
    else {
      this.axios = Utils.createAxiosInstance(options.axios);
    }
  }

  url() {

    return this.constructor.urlRoot;
  }

  async fetch(options = {}) {

    const response = await this.sync('read', {}, options);
    const parsedResponse = this.parse(response);
    this.addAll(parsedResponse);
    return this;
  }

  sync(method, data, options) {
    // TODO move to separate sync class
    options = options || {};
    if (method === 'create') {
      console.log('Posting', data);
      return this.axios.post(this.url(), data, options);
    }
    else if (method === 'update') {
      console.log('Putting', data);
      return this.axios.put(this.url(), data, options);
    }
    else if (method === 'read') {
      console.log('REading', method, this.url());
      let url = options.url || this.url();
      if (options.query) {
        url = url + `?${Qs.stringify(options.query)}`;
      }

      return this.axios.get(url, options);
    }
    else if (method === 'delete') {
      return this.axios.delete(this.url(), data, options);
    }
  }

  parse(response) {

    console.log('Parsing', response.data);
    return response.data;
  }

  async create(modelData) {

    const model = new this.constructor.model(modelData, {
      axios: {
        instance: this.axios
      }
    });
    await model.save();
    this.add(model);
    return model;
  }

  addAll(models) {

    for (const modelData of models) {
      const model = new this.constructor.model(modelData);
      this.add(model);
    }
  }

  add(model) {

    this.models.push(model);
  }

  at(index) {

    return this.models[index];
  }

  get length() {

    return this.models.length;
  }

  get isCollection() {

    return true;
  }
}

module.exports = PerseCollection;
