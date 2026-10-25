const variant = await tx.productSizePrice.findUnique({
    where: {
        productId_size: {
            productId: item.productId,
            size: item.size,
        },
    },
});

if (!variant) {
    throw new BadRequestException(
        'Sản phẩm không hỗ trợ size được chọn',
    );
}

const basePrice = Number(variant.price);