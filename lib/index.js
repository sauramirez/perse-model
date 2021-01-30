'use strict';

const Axios = require('axios');
const Joi = require('joi');
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
    if (options.axios && options.axios.instance) {
      this.axios = options.axios.instance;
    }
    else {
      this.axios = Utils.createAxiosInstance(options.axios);
    }

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

          let value;
          try {
            value = Joi.assert(val, this.constructor.properties[key].label(key));
          }
          catch (error) {
            throw error;
          }

          this.attrs[key] = value;
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

    await this.sync('read', {}, options);
    return this;
  }

  save(options = {}) {

    const data = this.serialize();
    if (this.isNew()) {
      return this.sync('create', data, options);
    }

    return this.sync('update', data, options);
  }

  async sync(method, data, options = {}) {

    let response = false;
    if (method === 'create' && this.isNew()) {
      console.log('Posting', data);
      response = await this.axios.post(this.url(), data);
    }
    else if (method === 'update' && !this.isNew()) {
      console.log('Putting', data);
      response = await this.axios.put(this.url(), data);
    }
    else if (method === 'read' && !this.isNew()) {
      console.log('Fetching', this.url());
      response = await this.axios.get(this.url());
    }
    else if (method === 'delete' && !this.isNew()) {
      return this.axios.delete(this.url(), data);
    }

    if (response !== false) {
      return this.setAll(this.parse(response));
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
