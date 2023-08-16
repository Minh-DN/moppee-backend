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
  }
}));
