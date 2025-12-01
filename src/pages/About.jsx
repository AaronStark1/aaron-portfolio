import React from "react";

export default function About() {
  return (
    <section className="mt-6 px-2 md:px-4 lg:px-6 overflow-hidden">
      <div
        className="
          max-w-[1500px] mx-auto 
          rounded-[38px] border border-[#b9b6a6]/70
          px-6 py-10 md:px-14 md:py-16 
          bg-transparent    
          shadow-sm backdrop-blur-[2px]
          opacity-0 translate-y-[40px]
          animate-[fadeUp_1s_ease-out_forwards]
        "
      >
        {/* Heading */}
        <h1 className="font-display text-[3rem] sm:text-[3.8rem] md:text-[4.5rem] font-semibold mb-5 tracking-tight">
          About Me
        </h1>

        {/* Divider like Home page */}
        <div className="border-t border-[#8f8c7c] mb-10" />

        {/* Sub heading */}
        <h2 className="font-grotesk text-xl sm:text-2xl md:text-[1.65rem] mb-10 opacity-80 leading-snug animate-[fadeSlide_1.4s_ease-out_forwards]">
          A little more about who I am, what I do, and what drives me.
        </h2>

        {/* Bio content */}
        <div className="space-y-6 font-grotesk text-base md:text-lg leading-relaxed max-w-[1100px]">
          <p className="animate-[fadeSlide_1.4s_ease-out_forwards]">
            I’m <span className="font-semibold">Aaron Correya</span> — a MERN-stack developer based in Kochi
            who loves building fast, interactive and visually polished web applications.
          </p>

          <p className="animate-[fadeSlide_1.7s_ease-out_forwards]">
            With hands-on experience in 
            <span className="font-semibold"> React, JavaScript and MongoDB</span> from my internship at 
            Luminar and several self-driven projects, I focus on writing clean, scalable code and crafting 
            interfaces that feel seamless and intuitive.
          </p>

          <p className="animate-[fadeSlide_1.9s_ease-out_forwards]">
            Beyond coding, I enjoy experimenting with animations, design systems and UI/UX concepts — 
            combining performance and creativity to build digital experiences that feel good to use.
          </p>

          <p className="animate-[fadeSlide_2.2s_ease-out_forwards]">
            I’m always open to collaboration, learning opportunities and exciting projects — 
            whether it's full-stack development, UI design, or something entirely new.
          </p>
        </div>
      </div>
    </section>
  );
}
