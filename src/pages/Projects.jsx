import { useState, useEffect, useRef } from "react";
import { projectsData } from "../data/projects";

export default function Projects() {
  const [projects] = useState(projectsData);
  const containerRef = useRef(null);

  // fade-in animation on scroll
  useEffect(() => {
    const cards = containerRef.current?.querySelectorAll(".project-card");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("opacity-100", "translate-y-0");
        });
      },
      { threshold: 0.2 }
    );
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mt-6 px-2 md:px-4 lg:px-6">
      <div className="max-w-[1650px] mx-auto rounded-[38px] border border-[#b9b6a6]/70 px-6 py-8 md:px-12 md:py-14 lg:px-16 lg:py-16 shadow-sm bg-transparent">

        <h1 className="font-grotesk text-[2.8rem] sm:text-[3.3rem] md:text-[3.8rem] lg:text-[4.4rem] font-semibold mb-12 leading-tight">
          Selected Projects
        </h1>

        <div
          className="grid gap-12 md:grid-cols-2 lg:grid-cols-3"
          ref={containerRef}
        >
          {projects.map((project) => (
            <div
              key={project.id}
              className="
                project-card opacity-0 translate-y-[30px] transition-all duration-[900ms]
                rounded-[32px] border border-[#b9b6a6]/60 overflow-hidden 
                bg-[#f7eedf] dark:bg-[#f7eedf]
                hover:-translate-y-[6px] hover:shadow-xl
              "
            >
              {/* Image */}
              <div className="overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-[200px] w-full object-cover transition duration-500 hover:scale-[1.06]"
                />
              </div>

              {/* Text section */}
              <div className="px-6 py-6 flex flex-col justify-between gap-4 text-[#222] dark:text-[#222]">
                <div>
                  <h2 className="font-grotesk font-semibold text-xl mb-1">
                    {project.title}
                  </h2>
                  <p className="font-grotesk text-sm opacity-80 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between gap-3 mt-auto">
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-[10px] rounded-lg border border-[#e84534] text-[#e84534] font-semibold text-xs 
                    hover:bg-[#e84534] hover:text-white transition-all"
                  >
                    Live Demo ↗
                  </a>

                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-[10px] rounded-lg border border-black text-black font-semibold text-xs
                    hover:bg-black hover:text-white transition-all"
                  >
                    GitHub ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
