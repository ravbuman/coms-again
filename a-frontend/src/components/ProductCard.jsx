import React from "react";

const ProductCard = ({ product, onAddToCart, onWishlist, isWishlisted }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 flex flex-col items-center w-72 min-h-[320px] transition hover:shadow-xl">
    <img
      src={product.images?.[0] || "/placeholder.png"}
      alt={product.name}
      className="w-40 h-40 object-cover rounded-xl mb-4 bg-gray-100"
    />
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center line-clamp-2">
      {product.name}
    </h3>
    <p className="text-primary text-xl font-semibold mb-2">₹{product.price}</p>
    <div className="flex gap-4 mt-auto">
      <button
        className="px-4 py-2 rounded-full bg-primary text-white font-semibold shadow hover:bg-primary/90 transition"
        onClick={() => onAddToCart?.(product)}
      >
        Add to Cart
      </button>
      <button
        className={`px-3 py-2 rounded-full border ${isWishlisted ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400'} transition`}
        onClick={() => onWishlist?.(product)}
      >
        {isWishlisted ? '♥' : '♡'}
      </button>
    </div>
  </div>
);

export default ProductCard;
