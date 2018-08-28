'use strict';

const Axios = require('axios');
const Joi = require('joi-browser');
const Utils = require('./utils');

const internals = {};

class Model {

  static get properties() {

    return {};
  }

  static get urlRoot() {

    return '/';
  }

  static get idAttr() {

    return 'id';
  }

  /**
   * @param options {object}
   * @param options.properties {Joi} The model properties
   */
  constructor(attributes = {}, options = {}) {

    this.attrs = {};
    this.idAttr = this.constructor.idAttr;
    this.axios = Utils.createAxiosInstance(options.axios);
    for (const key of Object.keys(this.constructor.properties)) {

      const gettersAndSetters = {};
      const descriptor = Object.getOwnPropertyDescriptor(this.constructor.prototype, key);
      if (typeof descriptor === 'undefined' || typeof descriptor.get === 'undefined') {
        gettersAndSetters.get = function () {

          return this.attrs[key];
        };
      }
      else {
        gettersAndSetters.get = Object.getOwnPropertyDescriptor(this.constructor.prototype, key).get;
      }

      if (typeof descriptor === 'undefined' || typeof descriptor.set === 'undefined') {
        gettersAndSetters.set = function (val) {

          const result = Joi.validate(val, this.constructor.properties[key].label(key));
          if (result.error) {
            throw result.error;
          }

          this.attrs[key] = result.value;
        };
      }
      else {
        gettersAndSetters.set = Object.getOwnPropertyDescriptor(this.constructor.prototype, key).set;
      }

      if (Object.keys(gettersAndSetters).length > 0) {
        Object.defineProperty(this, key, gettersAndSetters);
      }
    }

    for (const attrKey of Object.keys(attributes)) {
      this[attrKey] = attributes[attrKey];
    }

    return this.init();
  }

  init() {}

  /**
   * Set all of the properties by using the instance setters
   */
  setAll(newAttrs) {

    for (const key of Object.keys(newAttrs)) {
      this[key] = newAttrs[key];
    }
  }

  async fetch(options = {}) {

    const response = await this.sync('read', {}, {
    });
    const parsedResponse = this.parse(response);
    this.setAll(parsedResponse);
    return this;
  }

  save(options = {}) {

    const data = this.serialize();
    if (this.isNew()) {
      return this.sync('create', data, options);
    }

    return this.sync('update', data, options);
  }

  sync(method, data, options = {}) {

    if (method === 'create' && this.isNew()) {
      console.log('Posting', data);
      return this.axios.post(this.url(), data);
    }
    else if (method === 'update' && !this.isNew()) {
      console.log('Putting', data);
      return this.axios.put(this.url(), data);
    }
    else if (method === 'read' && !this.isNew()) {
      console.log('Fetching', this.url());
      return this.axios.get(this.url());
    }
    else if (method === 'delete' && !this.isNew()) {
      return this.axios.delete(this.url(), data);
    }

    throw new Error('Method not supported');
  }

  serialize() {

    return JSON.parse(JSON.stringify(this.attrs));
  }

  /**
   * @param response {object} The axios response
   */
  parse(response) {

    console.log('Response data', response.data);
    return response.data;
  }

  isNew() {

    return this[this.idAttr] == null;
  }

  getId() {

    return this.attrs[this.idAttr];
  }

  url() {

    if (this.isNew()) {
      return this.constructor.urlRoot;
    }

    const base = this.constructor.urlRoot;
    return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.getId());
  }
}

module.exports = Model;
