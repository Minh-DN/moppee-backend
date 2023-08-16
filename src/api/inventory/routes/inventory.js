'use strict';

const transformResponse = require('../middlewares/transformResponse');

/**
 * inventory router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::inventory.inventory', {
  config: {
    find: {
      middlewares: [
        transformResponse
      ]
    }
  }
});
