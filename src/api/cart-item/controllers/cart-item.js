'use strict';

const item = require('../../item/controllers/item');

/**
 * cart-item controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::cart-item.cart-item', ({ strapi }) => ({
  // Get an user's shopping cart
  async getUserShoppingCart(ctx) {
    const { user } = ctx.state;
    const shoppingCart = await strapi.service('api::cart-item.cart-item').getShoppingCartByUserId(user.id)
    ctx.send(shoppingCart)
  },
  
  // Add to cart. Handles both adding a new item to cart and adding to item's quantity
  async addToCart(ctx) {
    const { user } = ctx.state;
    const { itemId, quantity } = ctx.request.body;

    // Basic check of payload data
    if (!itemId || !quantity || isNaN(quantity) || quantity <= 0) {
      return ctx.badRequest('Check payload data again');
    }

    // Check if item is already in user's cart
    const cartItem = await strapi.service('api::cart-item.cart-item').getCartItemByUserAndOrderId(user.id, itemId);

    try {
      // Update item quantity if item is already in user's cart
      if (cartItem) {
        await strapi.entityService.update('api::cart-item.cart-item', cartItem.id, {
          data: {
            quantity: cartItem.quantity + quantity
          },
        });
      } else {
        // Item doesn't exist in user's cart. Create new entry
        await strapi.entityService.create('api::cart-item.cart-item', {
          data: {
            quantity: quantity,
            item: itemId,
            user: user.id,
          }
        })
      }
    
      // Return a success response
      return ctx.send({
        message: 'Item added to cart successfully',
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest('An error occurred while adding the item to the cart');
    }
  },

  // Delete item from cart, not just deducting quantity
  async removeFromCart(ctx) {
    const { user } = ctx.state;
    const { itemId } = ctx.params;

    // Basic check of payload data
    if (!itemId) {
      return ctx.badRequest('Check payload data again');
    }

    // Get the CartItem details
    const cartItem = await strapi.service('api::cart-item.cart-item').getCartItemByUserAndOrderId(user.id, parseInt(itemId));
    
    try {
      await strapi.entityService.delete('api::cart-item.cart-item', cartItem.id);
      // Return a success response
      return ctx.send({
        message: 'Item removed from cart successfully',
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest('An error occurred while removing the item from the cart');
    }
  },

  // Deduct item's quantity
  async deductFromCart(ctx) {
    const { user } = ctx.state;
    const { itemId, quantity } = ctx.request.body;

     // Basic check of payload data
    if (!itemId || !quantity || isNaN(quantity) || quantity <= 0) {
      return ctx.badRequest('Check payload data again');
    }

    // Get the CartItem details
    const cartItem = await strapi.service('api::cart-item.cart-item').getCartItemByUserAndOrderId(user.id, parseInt(itemId));
    
    // Remove item from cart if quantity to remove equal to current quantity
    if (quantity === cartItem.quantity) {
      try {
        await strapi.entityService.delete('api::cart-item.cart-item', cartItem.id);
        // Return a success response
        return ctx.send({
          message: 'Item removed from cart successfully',
        });
      } catch (error) {
        console.log(error);
        return ctx.badRequest('An error occurred while deducting the item\'s quantity in the cart');
      }
    }

    // Deduct item's quantity
    try {
      await strapi.entityService.update('api::cart-item.cart-item', cartItem.id, {
        data: {
          quantity: cartItem.quantity - quantity
        },
      });
      
      // Return a success response
      return ctx.send({
        message: 'Item\'s quantity deducted successfully',
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest('An error occurred while deducting the item\'s quantity in the cart');
    }
  }
}));
