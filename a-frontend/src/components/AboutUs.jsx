import React from "react";

const AboutUs = () => (
  <section className="w-full max-w-5xl mx-auto py-12 px-4 mb-12">
    <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">About Us</h2>
    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mb-6">
      Coms-Again has been serving customers with authentic, high-quality products for years. We believe in making your shopping journey meaningful and accessible.
    </p>
    <div className="flex gap-8 flex-wrap">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-primary">10K+</span>
        <span className="text-gray-500 dark:text-gray-400 text-sm">Happy Customers</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-primary">500+</span>
        <span className="text-gray-500 dark:text-gray-400 text-sm">Products</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-primary">24/7</span>
        <span className="text-gray-500 dark:text-gray-400 text-sm">Support</span>
      </div>
    </div>
  </section>
);

export default AboutUs;
