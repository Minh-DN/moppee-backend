'use strict';

/**
 * item controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::item.item', ({ strapi }) => ({
  async findOne(ctx) {
    // Get itemId from request
    const { id } = ctx.params;

    // Get related fields
    const itemDetails = await strapi.entityService.findOne('api::item.item', parseInt(id), {
      populate: ['image']
    });

    return ctx.send({ ...itemDetails })
  }
}));
