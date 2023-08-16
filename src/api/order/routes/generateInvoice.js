module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/orders/generateInvoice/:orderId',
      handler: 'order.generateInvoice',
      config: {
        auth: false,
      }
    }
  ]
}