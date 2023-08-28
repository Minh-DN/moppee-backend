'use strict';

/**
 * order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({strapi}) => ({
  async placeOrder(ctx) {
    const { user } = ctx.state;
    
    // Get user's shopping cart
    const shoppingCart = await strapi.service('api::cart-item.cart-item').getShoppingCartByUserId(user.id);

    // Check that we have enough stock in inventory
    const stockCheck = await strapi.service('api::order.order').checkStockBeforePlaceOrder(shoppingCart);

    if (!stockCheck.success) {
      ctx.response.status = 409;
      ctx.response.body = {
        error: 'Stock Issue',
        message: 'See attached for items with insufficient stock',
        notEnoughStockItems: stockCheck.items,
      }
      return;
    }

    // Deduct stock
    await strapi.service('api::order.order').deductStockAfterPlaceOrder(shoppingCart);

    // Create order
    await strapi.service('api::order.order').createOrder(shoppingCart, user.id);

    // Clear user's cart
    await strapi.service('api::cart-item.cart-item').deleteCartItemsByUserId(user.id);

    ctx.send({
      message: 'Order placed successfully'
    })
  },
  async generateInvoice(ctx) {
    // Get orderId from path variables
    const orderId = ctx.params.orderId;
    
    // Generate pdf
    const fileUrl = await strapi.service('api::order.order').generateInvoice(orderId);

    return ctx.send({
      message: 'Invoice generated successfully',
      fileUrl
    });
  },
  async findOne(ctx) {
    // Get orderId from path variables
    const orderId = parseInt(ctx.params.id);

    // Get data using order details service
    const data = await strapi.service('api::order.order').getOrderDetailsByOrderId(orderId);

    return ctx.send({ data })
  }
}));
