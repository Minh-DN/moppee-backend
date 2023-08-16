'use strict';

/**
 * cart-item service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::cart-item.cart-item', ({ strapi }) => ({
  
  async getCartItemByUserAndOrderId(userId, itemId) {
    return await strapi.db.query('api::cart-item.cart-item').findOne({
      where: {
        item: {
          id: {
            $eq: itemId,
          }
        }, 
        user: {
          id: {
            $eq: userId
          }
        }
      },
    });
  }
}))
