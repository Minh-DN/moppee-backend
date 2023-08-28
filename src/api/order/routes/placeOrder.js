module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/orders/placeOrder',
      handler: 'order.placeOrder',
    }
  ]
}