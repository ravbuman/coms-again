import React from "react";
import { Link } from "react-router-dom";

const actions = [
  { icon: "🛍️", title: "Shop All", route: "/products" },
  { icon: "🔥", title: "Offers", route: "/products?offer=true" },
  { icon: "📦", title: "Orders", route: "/orders" },
  { icon: "❤️", title: "Wishlist", route: "/wishlist" },
];

const QuickActions = () => (
  <section className="w-full max-w-5xl mx-auto py-6 px-4 mb-8">
    <div className="flex flex-wrap gap-4 justify-center">
      {actions.map((action, idx) => (
        <Link
          key={idx}
          to={action.route}
          className="flex flex-col items-center bg-white dark:bg-gray-900 rounded-2xl shadow p-6 w-36 hover:shadow-lg transition"
        >
          <span className="text-3xl mb-2">{action.icon}</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200 text-lg">{action.title}</span>
        </Link>
      ))}
    </div>
  </section>
);

export default QuickActions;
