const _ = require('lodash');

module.exports = {
  transformOrderFindOneResponse: transformOrderFindOneResponse,
}

function transformOrderFindOneResponse(data) {
  // Filter for only desired attributes
  const orderItems = data.orderItems.map(orderItemEntry => {
    const item = orderItemEntry.item;
    return {
      itemId: item.id,
      quantity: orderItemEntry.quantity,
      unitPrice: item.price,
      name: item.name,
      imageUrl: item.image[0].url
    }
  });

  const totalPrice = calculateTotalPrice(orderItems);

  const { username, email } = data.user;

  // Use lodash omit to clean address data
  const deliveryAddress = _.omit(data.deliveryAddress, ['id', 'createdAt', 'updatedAt', 'publishedAt']);
  const billingAddress = _.omit(data.billingAddress, ['id', 'createdAt', 'updatedAt', 'publishedAt']);

  const transformedData = {
    orderId: data.id,
    status: data.status,
    totalPrice,
    orderItems,
    user: {
      username,
      email,
    },
    deliveryAddress,
    billingAddress,
  }

  return transformedData;
}

/**
 * 
 * @param {Array} items The order's items
 * @returns {Number} Total price of order
 */
function calculateTotalPrice(items) {
  return items.reduce((accumulator, currentItem) => {
    return accumulator + currentItem.unitPrice * currentItem.quantity;
  }, 0);
}

