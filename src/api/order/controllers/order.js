'use strict';

/**
 * order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({strapi}) => ({
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
