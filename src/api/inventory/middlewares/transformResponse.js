module.exports = async (ctx, next) => {
  // Call the next middleware in the chain
  await next();

  // Check if there is data to transform, i.e. response was successful 
  if (ctx.response.status !== 200) {
    return;
  }

  // Modify the response data 
  const { data, meta } = ctx.response.body;

  const transformedData = data.map((inventoryEntry) => {
    const inventoryEntryId = inventoryEntry.id;
    const quantity = inventoryEntry.quantity;

    // Filter for only desired attributes
    const { id, price, name, image } = inventoryEntry.details;
    const transformedItemDetails = {
      itemId: id,
      price: price,
      name: name,
      imageUrl: image[0].url
    }

    return {
      inventoryEntryId,
      quantity,
      ...transformedItemDetails,
    };
  });
  
  // Update the response data
  ctx.response.body = { data: transformedData, meta };
}
