import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Home,
  Users,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Target,
  Star,
  MapPin,
  Phone,
  CheckCircle2,
  GraduationCap,
  Clock,
  Award,
  Cpu,
  BarChart3,
  Activity,
} from "lucide-react";

const heroVideoUrl = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* ========== NAVIGATION ========== */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <div className="relative h-16 w-56">
              <Image
                src="/landing/logo.png"
                alt="5 Point Education Hub"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/enquiry" className="hidden sm:block">
              <Button
                variant="ghost"
                className="text-[#1B4F8A] font-semibold hover:bg-blue-50"
              >
                Contact Us
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-[#1B4F8A] hover:bg-[#153e6c] text-white shadow-md transition-all duration-300 font-semibold px-6 rounded-lg">
                Login
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-white to-[#FFF7ED]">
        {heroVideoUrl ? (
          <video className="absolute inset-0 h-full w-full object-cover opacity-15" autoPlay muted loop playsInline poster="/landing/1.jpeg">
            <source src={heroVideoUrl} />
          </video>
        ) : (
          <Image src="/landing/1.jpeg" alt="" fill priority className="object-cover opacity-5" />
        )}
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/60 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 py-16 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold mb-8 border border-orange-200">
                <Sparkles className="h-4 w-4 text-orange-500" />
                Admissions Open for 2026-2027
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#0F172A] mb-6 leading-[1.12] tracking-tight">
                Build Your Future with{" "}
                <span className="text-[#1B4F8A]">5 Point</span>{" "}
                <span className="text-[#F97316]">Education Hub</span>
              </h1>

              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Quality coaching for School, Board Exams, NEET, JEE, and
                beyond. Expert faculty, personalised attention, and a proven
                track record of results — right here in Sonarpur.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/enquiry">
                  <Button
                    size="lg"
                    className="bg-[#F97316] hover:bg-[#EA580C] text-white shadow-lg shadow-orange-400/25 text-lg px-8 h-14 rounded-xl font-bold w-full sm:w-auto transition-all duration-300"
                  >
                    <Target className="mr-2 h-5 w-5" />
                    Enquire Now
                  </Button>
                </Link>
                <a href="tel:8100567748">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#1B4F8A] text-[#1B4F8A] hover:bg-[#1B4F8A] hover:text-white text-lg px-8 h-14 rounded-xl font-bold w-full sm:w-auto bg-white transition-all duration-300"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call Us Now
                  </Button>
                </a>
                <a href="tel:8902673460">
                  <Button size="lg" variant="outline" className="border-2 border-[#F97316] text-[#C2410C] hover:bg-[#F97316] hover:text-white text-lg px-6 h-14 rounded-xl font-bold w-full sm:w-auto bg-white transition-all duration-300">
                    <Phone className="mr-2 h-5 w-5" /> 8902673460
                  </Button>
                </a>
              </div>

              {/* Stats row */}
              <div className="mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
                {[
                  { value: "500+", label: "Students" },
                  { value: "95%", label: "Success Rate" },
                  { value: "ISO 9001:2015", label: "Quality Standard" },
                ].map((s, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-black text-[#1B4F8A]">
                      {s.value}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Main banner poster */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200/50">
                <Image
                  src="/landing/1.jpeg"
                  width={1200}
                  height={800}
                  alt="5 Point Education Hub — Programs & Courses"
                  className="w-full h-auto block"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 sm:-left-8 bg-white p-3 sm:p-4 rounded-xl shadow-lg ring-1 ring-slate-100 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Top Rated</div>
                    <div className="text-xs text-slate-500">Coaching Center</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROGRAMS WE OFFER (from the banners) ========== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-[#F97316] font-bold tracking-wider uppercase text-sm mb-3">
              What We Offer
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-4">
              Programs Designed for{" "}
              <span className="text-[#1B4F8A]">Your Success</span>
            </h3>
            <p className="text-lg text-slate-600">
              From school education to competitive exams and beyond — we cover
              it all with subject-wise expert faculty.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "School Education",
                subtitle: "Class V – X",
                desc: "CBSE, ICSE & WBSE boards. All subjects covered by dedicated teachers with regular assessments.",
                color: "bg-[#1B4F8A]",
                shadow: "shadow-blue-900/15",
              },
              {
                icon: GraduationCap,
                title: "Higher Secondary",
                subtitle: "XI – XII (Science & Arts)",
                desc: "Comprehensive coaching for board exams with focus on conceptual clarity and exam techniques.",
                color: "bg-[#0369A1]",
                shadow: "shadow-sky-900/15",
              },
              {
                icon: Target,
                title: "NEET / JEE Prep",
                subtitle: "Competitive Exams",
                desc: "Focused preparation for medical & engineering entrances with mock tests, strategy sessions, and repeater batches.",
                color: "bg-[#F97316]",
                shadow: "shadow-orange-500/15",
              },
              {
                icon: Cpu,
                title: "Robotics & Computer",
                subtitle: "AI, Programming, Web Dev",
                desc: "Future-ready skills in robotics, AI fundamentals, basic programming, and web development.",
                color: "bg-[#7C3AED]",
                shadow: "shadow-violet-500/15",
              },
              {
                icon: BarChart3,
                title: "Financial Courses",
                subtitle: "Tally, GST, Share Market",
                desc: "Practical financial literacy and accounting courses for students and young professionals.",
                color: "bg-[#059669]",
                shadow: "shadow-emerald-600/15",
              },
              {
                icon: Activity,
                title: "Extra-Curricular",
                subtitle: "Table Tennis, Abacus, Drawing",
                desc: "Holistic development through sports, mental math, and creative activities alongside academics.",
                color: "bg-[#DB2777]",
                shadow: "shadow-pink-600/15",
              },
            ].map((program, i) => (
              <div
                key={i}
                className={`group relative bg-white rounded-2xl border border-slate-200 p-7 hover:shadow-xl ${program.shadow} transition-all duration-300`}
              >
                <div
                  className={`w-14 h-14 ${program.color} rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:-translate-y-1 transition-transform duration-300`}
                >
                  <program.icon className="h-7 w-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-[#0F172A] mb-1">
                  {program.title}
                </h4>
                <p className="text-sm font-semibold text-[#F97316] mb-3">
                  {program.subtitle}
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {program.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BANNERS SHOWCASE ========== */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
            <Image
              src="/landing/3.jpeg"
              width={1600}
              height={1000}
              alt="5 Point Education Hub — Our Facilities"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
            <Image
              src="/landing/2.jpeg"
              width={1600}
              height={1000}
              alt="5 Point Education Hub — Home Tuition Program"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ========== OUR RESULTS ========== */}
      <section className="py-20 bg-gradient-to-b from-[#EFF6FF] to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-yellow-200">
              <Award className="h-4 w-4 text-yellow-500" />
              Proven Track Record
            </div>
            <h2 className="text-[#F97316] font-bold tracking-wider uppercase text-sm mb-3">
              Our Results
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-4">
              Class X Board Results{" "}
              <span className="text-[#1B4F8A]">2026</span>
            </h3>
            <p className="text-lg text-slate-600">
              We take pride in our students&apos; academic excellence. Here are
              the outstanding results achieved by our Class X batch in 2026.
            </p>
          </div>

          {/* Result Card */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1B4F8A] via-[#F97316] to-[#1B4F8A] rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500 pointer-events-none" />

            <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 ring-1 ring-slate-200/50">
              {/* Top accent bar */}
              <div className="h-2 w-full bg-gradient-to-r from-[#1B4F8A] to-[#F97316]" />

              {/* Badge row */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1B4F8A] rounded-xl flex items-center justify-center shadow">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">
                      5 Point Education Hub
                    </div>
                    <div className="text-xs text-slate-500">
                      Board Examination Results — 2026
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Outstanding Performance
                </div>
              </div>

              {/* SVG Result Sheet */}
              <div className="p-4 sm:p-6 bg-white">
                <Image
                  src="/landing/class-x-result-2026.svg"
                  width={1600}
                  height={1000}
                  alt="5 Point Education Hub — Class X Board Examination Results 2026"
                  className="w-full h-auto block rounded-xl border border-slate-100"
                  loading="lazy"
                />
              </div>

              {/* Bottom CTA */}
              <div className="px-6 py-5 bg-gradient-to-r from-[#EFF6FF] to-[#FFF7ED] border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 text-center sm:text-left">
                  🎉 Congratulations to all our achievers! Join us for the{" "}
                  <span className="font-bold text-[#1B4F8A]">2026–2027</span>{" "}
                  batch and write your own success story.
                </p>
                <Link href="/enquiry" className="flex-shrink-0">
                  <button className="bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-md shadow-orange-400/25 transition-all duration-300 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Enquire Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SERVICES: BATCH VS HOME TUTOR ========== */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-[#F97316] font-bold tracking-wider uppercase text-sm mb-3">
              How You Learn
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-4">
              Choose Your Learning Style
            </h3>
            <p className="text-lg text-slate-600">
              Whether you prefer group learning or personal coaching — we have
              the perfect option for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Batch Card */}
            <div className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="h-2 bg-[#1B4F8A] w-full" />
              <div className="p-8">
                <div className="w-16 h-16 bg-[#1B4F8A] rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:-translate-y-1 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-black text-[#0F172A] mb-2">
                  Tuition Batch
                </h4>
                <p className="text-slate-600 mb-6">
                  Learn collaboratively at our center in Millan Pally, Sonarpur.
                </p>
                <ul className="space-y-3 text-slate-700 mb-8">
                  {[
                    "Highly qualified & experienced teachers",
                    "Interactive & competitive group learning",
                    "Regular mock tests & progress tracking",
                    "Doubt-clearing sessions after class",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-[#1B4F8A] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/enquiry?service=batch" className="block">
                  <Button className="w-full bg-[#1B4F8A] hover:bg-[#153e6c] text-white shadow-md h-13 rounded-xl text-base font-bold transition-all duration-300">
                    Enquire for Batch
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Home Tutor Card */}
            <div className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="h-2 bg-[#F97316] w-full" />
              <div className="p-8">
                <div className="w-16 h-16 bg-[#F97316] rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:-translate-y-1 transition-transform duration-300">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-black text-[#0F172A] mb-2">
                  Home Tutor
                </h4>
                <p className="text-slate-600 mb-6">
                  Premium 1-on-1 attention at your doorstep — expert teachers at home.
                </p>
                <ul className="space-y-3 text-slate-700 mb-8">
                  {[
                    "100% dedicated attention to your child",
                    "Comfortable learning in your home",
                    "Customised curriculum & pace",
                    "Flexible scheduling that works for you",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/enquiry?service=home" className="block">
                  <Button className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white shadow-md h-13 rounded-xl text-base font-bold transition-all duration-300">
                    Enquire for Home Tuition
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE US ========== */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-[#F97316] font-bold tracking-wider uppercase text-sm mb-3">
              Why 5 Point?
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-4">
              What Sets Us Apart
            </h3>
            <p className="text-lg text-slate-600">
              We don&apos;t just teach — we build strong foundations,
              confidence, and a love for learning.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Award,
                title: "Expert Faculty",
                desc: "Subject-wise specialist teachers with years of coaching experience.",
              },
              {
                icon: Users,
                title: "Small Batches",
                desc: "Limited students per batch to ensure personalised attention for everyone.",
              },
              {
                icon: BookOpen,
                title: "Study Materials",
                desc: "Comprehensive notes, worksheets, and practice sets provided free of cost.",
              },
              {
                icon: Clock,
                title: "All Boards",
                desc: "CBSE, ICSE, and WBSE — we cover every board with dedicated curriculums.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#1B4F8A] rounded-xl flex items-center justify-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h4 className="text-lg font-bold text-[#0F172A] mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#1B4F8A]" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
            Ready to Start Your{" "}
            <span className="text-[#F97316]">Learning Journey?</span>
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of students who have achieved academic excellence
            with 5 Point Education Hub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/enquiry">
              <Button
                size="lg"
                className="bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xl shadow-orange-600/30 rounded-xl px-10 h-14 text-lg font-bold transition-all duration-300 hover:scale-105"
              >
                Submit Enquiry
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="tel:8100567748">
              <Button
                size="lg"
                className="bg-white text-[#1B4F8A] hover:bg-blue-50 rounded-xl px-10 h-14 text-lg font-bold shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Phone className="mr-2 w-5 h-5" />
                Call 8100567748
              </Button>
            </a>
            <a href="tel:8902673460">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1B4F8A] rounded-xl px-8 h-14 text-lg font-bold w-full sm:w-auto">
                <Phone className="mr-2 w-5 h-5" /> Call 8902673460
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-[#0F172A] text-slate-300 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
            {/* Brand */}
            <div>
              <div className="relative h-14 w-48 mb-5 bg-white p-2 rounded-lg">
                <Image
                  src="/landing/logo.png"
                  alt="5 Point Education Hub"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Empowering students with quality education through personalised
                learning experiences and expert guidance.
              </p>
              <p className="text-orange-400 text-sm font-bold italic">
                &ldquo;Learn Smart. Score Higher.&rdquo;
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-widest">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Our Programs", href: "/#services" },
                  { label: "Enquiry Form", href: "/enquiry" },
                  { label: "Student Login", href: "/auth/login" },
                  { label: "Admin Login", href: "/admin/login" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-3 h-3 text-[#F97316]" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Programs */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-widest">
                Programs
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  "School Education (V–X)",
                  "Higher Secondary (XI-XII)",
                  "NEET / JEE Prep",
                  "Robotics & Computer",
                  "Home Tuition",
                ].map((c, i) => (
                  <li
                    key={i}
                    className="text-slate-400 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-widest">
                Contact Us
              </h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                  <span className="text-slate-400 leading-relaxed">
                    Millan Pally, Sonarpur
                    <br />
                    Kolkata, West Bengal
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#F97316] flex-shrink-0" />
                  <a href="tel:8902673460" className="text-slate-300 font-bold hover:text-white transition-colors text-base">+91 8902673460</a>
                </li>
                <li className="text-xs font-semibold uppercase tracking-widest text-slate-500">ISO 9001:2015 certified quality processes</li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#F97316] flex-shrink-0" />
                  <a
                    href="tel:8100567748"
                    className="text-slate-300 font-bold hover:text-white transition-colors text-base"
                  >
                    +91 8100567748
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} 5 Point Education Hub. All rights
              reserved.
            </p>
            <p className="text-sm text-slate-600">
              Millan Pally, Sonarpur, Kolkata
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
