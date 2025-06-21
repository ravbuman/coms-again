import React from "react";

const testimonials = [
  {
    text: "Best quality products. Very satisfied with the service!",
    author: "Priya S.",
    rating: 5
  },
  {
    text: "Fast delivery and authentic products. Highly recommended!",
    author: "Raj K.",
    rating: 5
  }
];

const Testimonials = () => (
  <section className="w-full max-w-5xl mx-auto py-12 px-4">
    <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">What Our Customers Say</h2>
    <div className="flex flex-wrap gap-8 justify-center">
      {testimonials.map((t, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 w-80">
          <div className="flex mb-2">
            {Array.from({ length: t.rating }).map((_, i) => (
              <span key={i} className="text-yellow-400 text-lg">★</span>
            ))}
          </div>
          <p className="text-gray-700 dark:text-gray-200 italic mb-2">“{t.text}”</p>
          <span className="text-gray-500 dark:text-gray-400 text-sm">- {t.author}</span>
        </div>
      ))}
    </div>
  </section>
);

export default Testimonials;
