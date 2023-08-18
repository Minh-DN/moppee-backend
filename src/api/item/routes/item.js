'use strict';

/**
 * item router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;
const { transformFindOneResponse } = require('../middlewares/transformResponse');

module.exports = createCoreRouter('api::item.item', {
  config: {
    findOne: {
      middlewares: [
        transformFindOneResponse
      ]
    }
  }
});
