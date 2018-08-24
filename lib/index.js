'use strict';

const Axios = require('axios');
const Joi = require('joi-browser');

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

    this.attrs = attributes;
    this.idAttr = this.constructor.idAttr;
    for (const key of Object.keys(this.constructor.properties)) {

      const gettersAndSetters = {};
      console.log('KEY', key);
      const descriptor = Object.getOwnPropertyDescriptor(this.constructor.prototype, key);
      if (typeof descriptor === 'undefined' || typeof descriptor.get === 'undefined') {
        gettersAndSetters.get = function () {

          return this.attrs[key];
        }
      }
      else {
        gettersAndSetters.get = Object.getOwnPropertyDescriptor(this.constructor.prototype, key).get
      }
      if (typeof descriptor === 'undefined' || typeof descriptor.set === 'undefined') {
        gettersAndSetters.set = function (val) {

          const result = Joi.validate(val, this.constructor.properties[key].label(key));
          if (result.error) {
            throw result.error;
          }
          this.attrs[key] = result.value;
        }
      }
      else {
        gettersAndSetters.set = Object.getOwnPropertyDescriptor(this.constructor.prototype, key).set
      }
      if (Object.keys(gettersAndSetters).length > 0) {
        Object.defineProperty(this, key, gettersAndSetters);
      }
    }

    return this.init();
  }

  init() {}

  save(options = {}) {

    const data = this.serialize();
    return this.sync(data, options);
  }

  async sync(data, options = {}) {

    if (this.isNew()) {

      // post
      console.log('Posting', data);
      return Axios.post(this.url(), data);
    }
    // put
    else {
      console.log('Putting', data);
      return Axios.put(this.url(), data);
    }
  }

  serialize() {

    return JSON.parse(JSON.stringify(this.attrs));
  }

  isNew() {

    return this.attrs[this.idAttr] == null;
  }

  getId() {

    return this.attrs[this.idAttr];
  }

  url() {

    if (this.isNew()) {
      return this.constructor.urlRoot
    }
    const base = this.constructor.urlRoot;
    return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.getId());
  }
}

module.exports = Model;
