module.exports = {
  transformFindOneResponse: transformFindOneResponse
}

async function transformFindOneResponse(ctx, next) {
  // Call the next middleware in the chain
  await next();

  // Check if there is data to transform, i.e. response was successful 
  if (ctx.response.status !== 200) {
    return;
  }

  // Extract desired fields
  const { id, price, name, image } = ctx.response.body;

  ctx.response.body = {
    id,
    price,
    name, 
    imageUrl: image[0].url,
  }
}