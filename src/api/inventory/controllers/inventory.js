'use strict';

/**
 * inventory controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::inventory.inventory', ({strapi}) => ({
  
  // Extend controlled to retrieve only desired fields
  async find(ctx) {
    // @ts-ignore
    const { data, meta } = await super.find(ctx);

    const transformedData = await Promise.all(
      data.map(async (inventoryEntry) => {
        const inventoryEntryId = inventoryEntry.id;
        const quantity = inventoryEntry.attributes.quantity;

        // Get related item
        const itemDetails = await strapi.db.query('api::item.item').findOne({
          where: {
            inventory: inventoryEntryId
          },
          populate: {
            // @ts-ignore
            image: true,
          },
        })
        
        // Filter for only desired attributes
        const { id, price, name, image } = itemDetails;
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
      })
    );

    return { data: transformedData, meta };
  }
}));
