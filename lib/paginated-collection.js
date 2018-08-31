'use strict';

const PerseCollection = require('./collection');

class PaginatedCollection extends PerseCollection {

  constructor(options) {

    super(options);
    this.count = null;
    this.pageCount = null;
    this.totalCount = null;
    this.hasNext = false;
    this.nextUrl = null;
  }

  parse(response) {

    this.count = response.data.meta.count;
    if (this.totalCount === null) {
      this.totalCount = response.data.meta.totalCount;
    }

    if (response.data.meta.next) {
      this.hasNext = true;
      this.nextUrl = response.data.meta.next;
    }

    return response.data.data;
  }

  fetchNext(options = {}) {

    if (this.nextUrl) {
      this.hasNext = false;
      return this.fetch({ url: this.nextUrl });
    }
  }
}

module.exports = PaginatedCollection;
