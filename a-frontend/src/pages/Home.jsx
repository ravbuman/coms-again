import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useThemeContext } from "../theme/ThemeProvider";
import api from "../services/api";

// Define green color shades in Tailwind config (add to tailwind.config.js)
// theme: {
//   extend: {
//     colors: {
//       primary: {
//         50: '#f0fdf4',
//         100: '#dcfce7',
//         200: '#bbf7d0',
//         300: '#86efac',
//         400: '#4ade80',
//         500: '#22c55e', // Main primary green
//         600: '#16a34a',
//         700: '#15803d',
//         800: '#166534',
//         900: '#14532d',
//       }
//     }
//   }
// }

const ProductCard = ({ product }) => {
  const { primary } = useThemeContext();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col items-center w-72 min-h-[320px] transition hover:shadow-xl hover:scale-[1.02] border border-gray-100 dark:border-gray-700">
      <img
        src={product.images?.[0] || "/placeholder.png"}
        alt={product.name}
        className="w-40 h-40 object-cover rounded-xl mb-4 bg-gray-100 dark:bg-gray-700"
        loading="lazy"
      />
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center line-clamp-2">
        {product.name}
      </h3>
      <p className="text-xl font-semibold mb-2" style={{ color: primary }}>
        ₹{product.price.toLocaleString()}
      </p>
      <button className="mt-auto px-6 py-2 rounded-full text-white font-semibold shadow-md transition" style={{ background: primary }}>
        Add to Cart
      </button>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="flex justify-center items-center gap-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse w-72 h-[320px] bg-gray-200 dark:bg-gray-700 rounded-2xl" />
    ))}
  </div>
);

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/products/")
      .then(res => {
        setProducts(res.data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Featured Products
        </h2>
        <Link to="/products" className="text-primary-600 dark:text-primary-400 hover:underline">
          View All
        </Link>
      </div>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex flex-wrap gap-8 justify-center">
          {products.slice(0, 3).map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    const demoCategories = [
      { name: "Electronics", icon: "📱" },
      { name: "Fashion", icon: "👕" },
      { name: "Home & Kitchen", icon: "🏠" },
      { name: "Beauty", icon: "💄" },
      { name: "Sports", icon: "⚽" },
    ];
    setCategories(demoCategories);
  }, []);

  return (
    <section className="w-full bg-gray-50 dark:bg-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/products?category=${category.name}`}
              className="flex flex-col items-center p-6 rounded-xl bg-white dark:bg-gray-700 hover:shadow-md transition border border-gray-100 dark:border-gray-600"
            >
              <span className="text-3xl mb-2">{category.icon}</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const HeroSection = () => (
  <div className="relative w-full h-96 bg-gradient-to-r from-primary-700 to-primary-500 overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center px-4 z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Summer Sale Up To 50% Off
        </h1>
        <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
          Discover amazing deals on your favorite products. Limited time offer!
        </p>
        <Link
          to="/products"
          className="inline-block px-8 py-3 bg-white text-primary-600 font-bold rounded-full hover:bg-gray-100 transition shadow-lg"
        >
          Shop Now
        </Link>
      </div>
    </div>
    <div className="absolute inset-0 bg-black/10" />
  </div>
);

const Testimonials = () => {
  const testimonials = [
    {
      quote: "The shopping experience was seamless and the products exceeded my expectations!",
      author: "Rahul Sharma",
      role: "Premium Member"
    },
    {
      quote: "Fast delivery and excellent customer service. Will definitely shop again!",
      author: "Priya Patel",
      role: "New Customer"
    },
    {
      quote: "Great quality products at affordable prices. Highly recommend!",
      author: "Amit Singh",
      role: "Verified Buyer"
    }
  ];

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
        What Our Customers Say
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-600 dark:text-gray-300 mb-4">
              "{testimonial.quote}"
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {testimonial.author}
            </div>
            <div className="text-sm text-primary-600 dark:text-primary-400">
              {testimonial.role}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you for subscribing with ${email}!`);
    setEmail("");
  };

  return (
    <section className="w-full bg-primary-600 py-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Stay Updated
        </h2>
        <p className="text-white/90 mb-6">
          Subscribe to our newsletter for the latest products and exclusive offers.
        </p>
        <form onSubmit={handleSubmit} className="flex max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-grow px-4 py-3 rounded-l-full focus:outline-none"
            required
          />
          <button
            type="submit"
            className="bg-primary-700 hover:bg-primary-800 text-white px-6 py-3 rounded-r-full font-medium"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <div className="flex flex-col items-center bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900 transition-colors">
        <FeaturedProducts />
        <CategoriesSection />
        <Testimonials />
        <Newsletter />
      </div>
    </div>
  );
};

export default Home;