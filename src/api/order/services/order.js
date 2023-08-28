'use strict';

/**
 * order service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const { transformOrderFindOneResponse } = require('../../../utils/transformOrderResponses');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

module.exports = createCoreService('api::order.order', ({strapi}) => ({
  async getOrderDetailsByOrderId(orderId) {
    // Get order details, including relevant relations
    const orderDetails = await strapi.entityService.findOne('api::order.order', orderId, {
      populate: [
        'orderItems',
        'orderItems.item',
        'orderItems.item.image',
        'user',
        'deliveryAddress',
        'billingAddress'
      ]
    });

    // Transform data
    const transformedData = transformOrderFindOneResponse(orderDetails);
    return transformedData;
  },
  async generateInvoice(orderId) {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    
    // Read EJS template content
    const invoiceTempatePath = path.resolve(__dirname, '../../../custom/templates/invoiceTemplate.ejs');
    const invoiceTemplate = fs.readFileSync(invoiceTempatePath, 'utf8');
    
    // Get order data
    const data = await this.getOrderDetailsByOrderId(orderId);

    const serverBaseUrl = "http://localhost:1337"
    
    // Render EJS template
    const renderedHtml = ejs.render(invoiceTemplate, { data, serverBaseUrl });
  
    // Set the HTML content of the page
    await page.setContent(renderedHtml);

    // Get file output path
    const fileOutputPath = path.resolve(__dirname, `../../../../public/invoices/invoice-order-id-${orderId}.pdf`)
    
    // Generate PDF
    await page.pdf({ 
      path: fileOutputPath, 
      format: 'A4'
    });
  
    await browser.close();
    return `/invoices/invoice-order-id-${orderId}.pdf`; 
  },
  async checkStockBeforePlaceOrder(shoppingCart) {
    const checkItemStock = async (cartItem) => {
      const stock = await strapi.db.query('api::inventory.inventory').findOne({
        where: {
          details: {
            id: cartItem.itemId
          },
        }
      })
      return cartItem.quantity < stock.quantity;
    }

    // Check stock in batches of item
    // In each batch items are check concurrently
    const batchSize = 3;
    const notEnoughStockItems = [];

    for (let i = 0; i < shoppingCart.length; i += batchSize) {
      const batch = shoppingCart.slice(i, i + batchSize);
      const promises = batch.map(async (cartItem) => {
        const hasEnoughStock = await checkItemStock(cartItem);
        if (!hasEnoughStock) {
          notEnoughStockItems.push(cartItem.name);
        }
      });
      await Promise.all(promises);
    }

    return notEnoughStockItems.length 
      ? { success: false, items: notEnoughStockItems } 
      : { success: true }
  },
  async deductStockAfterPlaceOrder(shoppingCart) {
    // Deduct the quantity of an inventory item
    const deductItemQuantity = async (cartItem) => {
      const { itemId, quantity } = cartItem;
      
      // Get inventory item data record
      const inventoryEntry = await strapi.db.query('api::inventory.inventory').findOne({
        where: {
          details: {
            id: itemId
          }
        }
      });

      // Deduct item's quantity using id of inventory item data record
      await strapi.entityService.update('api::inventory.inventory', inventoryEntry.id, {
        data: {
          quantity: inventoryEntry.quantity - quantity,
        }
      });
    }
    // Update stock in batches of inventory item
    // In each batch inventory items are processed concurrently 
    const batchSize = 3;
    for (let i = 0; i < shoppingCart.length; i += batchSize) {
      const batch = shoppingCart.slice(i, i + batchSize);
      const promises = batch.map(async (cartItem) => {
        await deductItemQuantity(cartItem);
      });
      await Promise.all(promises);
    }
  },

  async createOrder(shoppingCart, userId) {
    // Create new order data record
    const newOrder = await strapi.entityService.create('api::order.order', {
      data: {
        status: 'PLACED',
        user: userId,
        deliveryAddress: 1,
        billingAddress: 1
      }
    });

    // Create new orderItem data records
    const batchSize = 3;
    const orderItemIdArray = [];
    for (let i = 0; i < shoppingCart.length; i += batchSize) {
      const batch = shoppingCart.slice(i, i + batchSize);
      const promises = batch.map(async (cartItem) => {
        const newOrderItem = await strapi.entityService.create('api::order-item.order-item', {
          data: {
            order: newOrder.id,
            quantity: cartItem.quantity,
            item: cartItem.itemId,
          }
        });
        orderItemIdArray.push(newOrderItem.id);
      });
      await Promise.all(promises);
    };

    // Update the new order data record with the new orderItems
    await strapi.entityService.update('api::order.order', newOrder.id, {
      data: {
        orderItems: orderItemIdArray,
      }
    });
  }
}));
