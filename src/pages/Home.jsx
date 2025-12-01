import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function TimeDisplay() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <span>{time}</span>;
}

export default function Home() {
  return (
    <section className="mt-6">
      <div className="rounded-[38px] border border-[#b9b6a6]/70 px-4 py-6 md:px-10 md:py-10 lg:px-16 lg:py-14 shadow-sm bg-transparent">
        
        {/* Big name */}
        <div className="flex items-baseline justify-between gap-4 text-[3.5rem] sm:text-[4.5rem] md:text-[5.8rem] lg:text-[6.6rem] leading-none font-display tracking-tight">
          <h1>Aaron</h1>
          <h1>Correya</h1>
        </div>

        {/* Divider */}
        <div className="border-t border-[#8f8c7c] mt-5 mb-4" />

        {/* Meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 text-[0.65rem] sm:text-[0.72rem] uppercase tracking-[0.22em] mb-7 font-grotesk font-medium">
          <span>full-stack developer</span>
          <span className="text-right md:text-center">Intern @ Luminar</span>
          <span className="hidden md:block text-center">Email</span>
          <span className="text-right">Kochi&nbsp; <TimeDisplay /></span>
        </div>

        {/* Divider */}
        <div className="border-t border-[#8f8c7c] mb-7" />

        {/* Main grid */}
<div className="space-y-7">

  {/* Row 1 → About | MERN Developer | Contact */}
  <div className="grid gap-6 lg:grid-cols-3 items-stretch">

    {/* About Card */}
    <Link
      to="/about"
      className="bg-[#f7eedf] text-[#222] rounded-tr-[32px] rounded-br-[32px] px-7 py-6 h-[145px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition"
    >
      <span className="text-sm font-grotesk font-medium">About</span>
      <div className="flex items-center justify-between text-xs font-grotesk">
        <span className="opacity-70">
          MERN developer passionate about clean UI & UX.
        </span>
        <span className="font-semibold">01</span>
      </div>
    </Link>

    {/* MERN Developer Text */}
    <div className="flex items-center justify-center">
      <p className="font-grotesk text-[2.8rem] sm:text-[3.4rem] md:text-[4rem] lg:text-[4.9rem] font-semibold leading-[0.87] tracking-[-0.02em] text-center">
        MERN Developer
      </p>
    </div>

    {/* Contact Card */}
    <Link
      to="/contact"
      className="bg-[#f2b12c] text-[#222] rounded-tl-[32px] rounded-bl-[32px] px-7 py-6 h-[145px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition"
    >
      <span className="text-sm font-grotesk font-medium">Contact</span>
      <div className="flex items-center justify-between text-xs font-grotesk">
        <span className="opacity-80">Let's collaborate or say hi.</span>
        <span className="font-semibold">03</span>
      </div>
    </Link>

  </div>

  {/* Divider */}
  <div className="border-t border-[#8f8c7c]" />

  {/* Row 2 → Based in | Projects | Kochi */}
  <div className="grid gap-6 lg:grid-cols-3 items-stretch">

    {/* "Based in" Text */}
    <div className="flex items-center justify-center lg:justify-start">
      <p className="font-grotesk text-[2.8rem] sm:text-[3.4rem] md:text-[4rem] lg:text-[4.9rem] font-semibold leading-[0.87] tracking-[-0.02em] whitespace-nowrap">
        Based in
      </p>
    </div>

    {/* Projects Card */}
    <Link
      to="/projects"
      className="bg-[#e84534] text-white rounded-[24px] px-7 py-6 h-[145px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition"
    >
      <span className="text-sm font-grotesk font-medium">Projects</span>
      <div className="flex items-center justify-between text-xs font-grotesk">
        <span className="opacity-90">
          Explore selected work & experiments.
        </span>
        <span className="font-semibold">02</span>
      </div>
    </Link>

    {/* "Kochi" Text */}
    <div className="flex items-center justify-center lg:justify-end">
      <p className="font-grotesk text-[2.8rem] sm:text-[3.4rem] md:text-[4rem] lg:text-[4.9rem] font-semibold leading-[0.87] tracking-[-0.02em] whitespace-nowrap">
        Kochi
      </p>
    </div>
    
  </div>

</div>

      </div>
    </section>
  );
}
