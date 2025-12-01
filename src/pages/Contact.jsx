import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", form);
    alert("Message submitted successfully!");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section className="mt-6 px-2 md:px-4 lg:px-6">
      <div className="max-w-[1200px] mx-auto rounded-[38px] border border-[#b9b6a6]/70 px-6 py-8 md:px-12 md:py-14 lg:px-16 lg:py-16 shadow-sm bg-transparent">

        {/* Header Text */}
        <h1 className="font-grotesk text-[2.6rem] sm:text-[3.1rem] md:text-[3.6rem] lg:text-[4.3rem] font-semibold leading-tight mb-8">
          Let's Connect
        </h1>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="space-y-6 font-grotesk">

          <div>
            <label className="uppercase text-xs tracking-widest block mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-[#b9b6a6] rounded-xl px-4 py-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#e0cf87] transition"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="uppercase text-xs tracking-widest block mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-[#b9b6a6] rounded-xl px-4 py-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#e0cf87] transition"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="uppercase text-xs tracking-widest block mb-2">
              Message
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows="6"
              className="w-full border border-[#b9b6a6] rounded-xl px-4 py-3 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-[#e0cf87] transition"
              placeholder="Type your message"
            />
          </div>

          <button
            type="submit"
            className="mt-3 bg-[#e84534] text-white rounded-xl px-8 py-3 font-semibold tracking-wide hover:-translate-y-[2px] hover:shadow-md transition-all"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
