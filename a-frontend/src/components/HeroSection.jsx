import React from "react";

const slides = [
  {
    title: "Welcome to Coms-Again",
    subtitle: "Your seamless shopping journey starts here.",
    cta: "Shop Now"
  },
  {
    title: "Special Offers",
    subtitle: "Save more on exclusive deals!",
    cta: "View Offers"
  },
  {
    title: "Premium Quality",
    subtitle: "Handpicked products, fast delivery.",
    cta: "Browse Products"
  }
];

const HeroSection = () => {
  // For simplicity, static slide (add animation later)
  const slide = slides[0];
  return (
    <section className="w-full max-w-5xl mx-auto py-12 px-4 flex flex-col items-center bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow mb-12">
      <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4 text-center">{slide.title}</h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 text-center">{slide.subtitle}</p>
      <button className="px-8 py-3 rounded-full bg-primary text-white font-semibold shadow hover:bg-primary/90 transition text-lg">
        {slide.cta}
      </button>
    </section>
  );
};

export default HeroSection;
