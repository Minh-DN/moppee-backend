module.exports = {
  routes: [
    {
      method: 'DELETE',
      path: '/cart-item/removeFromCart/:itemId',
      handler: 'cart-item.removeFromCart',
    }
  ]
}