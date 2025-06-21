import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useThemeContext } from "../theme/ThemeProvider";
import { getProducts } from "../services/productService";
import ProductCard from "../components/ProductCard";

const ProductList = () => {
  const { primary } = useThemeContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  useEffect(() => {
    setLoading(true);
    getProducts().then(res => {
      let items = res.data.products || [];
      if (category) items = items.filter(p => p.category === category);
      setProducts(items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900 transition-colors py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-primary" style={{ color: primary }}>All Products</h1>
        {loading ? (
          <div className="flex gap-6 flex-wrap justify-center">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse w-72 h-[320px] bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-16">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
