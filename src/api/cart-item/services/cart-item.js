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
  },
  async getShoppingCartByUserId(userId) {
    const shoppingCart = await strapi.entityService.findMany('api::cart-item.cart-item', {
      filters: {
        user: {
          id: {
            $eq: userId
          }
        }
      },
      populate: ['item']
    });
    return shoppingCart.map(cartItem => {
      return {
        itemId: cartItem.item.id,
        price: cartItem.item.price,
        quantity: cartItem.quantity,
        name: cartItem.item.name,
      }
    });
  },

  // Can't use Query Engine's deleteMany due to this bug:
  // https://github.com/strapi/strapi/issues/11998
  async deleteCartItemsByUserId(userId) {
    const cartItems = await strapi.db.query('api::cart-item.cart-item').findMany({
      where: {
        user: {
          id: userId
        }
      }
    });
    Promise.all(cartItems.map(async (item) => {
      await strapi.entityService.delete('api::cart-item.cart-item', item.id);
    }));
  }
}))
