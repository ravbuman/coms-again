import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useThemeContext } from "../theme/ThemeProvider";
import { getProductById } from "../services/productService";
import { addToCart } from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";

const ProductDetail = () => {
  const { id } = useParams();
  const { primary } = useThemeContext();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductById(id).then(res => {
      setProduct(res.data.product);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  if (!product) return <div className="text-center text-gray-500 py-16">Product not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900 transition-colors py-12">
      <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row gap-12">
        <img
          src={product.images?.[0] || "/placeholder.png"}
          alt={product.name}
          className="w-full md:w-96 h-96 object-cover rounded-2xl bg-gray-100 dark:bg-gray-700 shadow"
        />
        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-bold mb-4 text-primary" style={{ color: primary }}>{product.name}</h1>
          <p className="text-xl font-semibold mb-2" style={{ color: primary }}>₹{product.price.toLocaleString()}</p>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{product.description}</p>
          <button className="px-8 py-3 rounded-full text-white font-semibold shadow transition mb-4" style={{ background: primary }}
            onClick={() => addToCart(product._id)}>
            Add to Cart
          </button>
          <button className="px-8 py-3 rounded-full border border-primary text-primary font-semibold transition" style={{ color: primary, borderColor: primary }}
            onClick={() => addToWishlist(product._id)}>
            Add to Wishlist
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
