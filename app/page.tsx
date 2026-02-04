import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Home, Users, TrendingUp, Award, ChevronRight, Sparkles, Target, Star } from "lucide-react";
import logo from "./assets/5pointlogo.png";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-12 w-28 overflow-hidden">
              <Image
                src={logo}
                alt="5 Point Education"
                fill
                className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/enquiry">
              <Button
                variant="ghost"
                className="hidden sm:flex text-gray-600 hover:text-primary hover:bg-primary/5"
              >
                Contact Us
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300">
                Sign In
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Empowering Students Since Day One
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Excellence in Education,{" "}
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Delivered Your Way
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Empowering students with personalized learning experiences through expert tutoring
              and comprehensive batch programs. Your success is our mission.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/enquiry">
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary-dark text-white shadow-lg shadow-secondary/30 hover:shadow-secondary/50 transition-all duration-300 text-lg px-8 h-14"
                >
                  <Target className="mr-2 h-5 w-5" />
                  Get Started Today
                </Button>
              </Link>
              <Link href="#services">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-700 hover:text-primary transition-all duration-300 text-lg px-8 h-14"
                >
                  Explore Services
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-gray-500 mt-1">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-sm text-gray-500 mt-1">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-gray-500 mt-1">Expert Teachers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              Our Services
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Choose Your Learning Path</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Flexible options designed to fit your learning style and schedule
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Tuition Batch Card */}
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

              <CardHeader className="relative">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl mb-4 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Tuition Batch</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Learn together in our well-equipped coaching center
                </CardDescription>
              </CardHeader>

              <CardContent className="relative">
                <ul className="space-y-4 text-gray-600 mb-6">
                  {[
                    "Expert teachers with years of experience",
                    "Interactive group learning environment",
                    "Regular assessments and progress tracking",
                    "Flexible batch timings"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-secondary/10 rounded-full flex items-center justify-center mt-0.5">
                        <Award className="h-3 w-3 text-secondary" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/enquiry?service=batch" className="block">
                  <Button className="w-full bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 h-12">
                    Enquire Now
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Home Tutor Card */}
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-secondary-light transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

              <CardHeader className="relative">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary-light rounded-2xl mb-4 shadow-lg shadow-secondary/25 group-hover:scale-110 transition-transform duration-300">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Home Tutor</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Personalized one-on-one learning at your doorstep
                </CardDescription>
              </CardHeader>

              <CardContent className="relative">
                <ul className="space-y-4 text-gray-600 mb-6">
                  {[
                    "Dedicated attention to individual needs",
                    "Comfortable learning in your home",
                    "Customized curriculum and pace",
                    "Convenient scheduling"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                        <Award className="h-3 w-3 text-primary" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/enquiry?service=home" className="block">
                  <Button className="w-full bg-secondary hover:bg-secondary-dark text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/40 transition-all duration-300 h-12">
                    Enquire Now
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-primary">5 Point</span> Education?
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Trusted by hundreds of students for quality education
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: BookOpen,
                title: "Comprehensive Curriculum",
                description: "ICSE, CBSE, and WBBSE board coverage with subject matter experts",
                color: "primary"
              },
              {
                icon: TrendingUp,
                title: "Proven Results",
                description: "Track record of excellent academic performance and board exam success",
                color: "secondary"
              },
              {
                icon: Users,
                title: "Personalized Attention",
                description: "Small batch sizes and individual focus ensure every student thrives",
                color: "primary"
              }
            ].map((item, i) => (
              <div key={i} className="group text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${item.color === 'primary' ? 'from-primary to-primary-light' : 'from-secondary to-secondary-light'} rounded-2xl mx-auto mb-6 shadow-lg ${item.color === 'primary' ? 'shadow-primary/25' : 'shadow-secondary/25'} group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join hundreds of students who have achieved academic excellence with us
          </p>
          <Link href="/enquiry">
            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary-dark text-white shadow-2xl shadow-secondary/30 hover:shadow-secondary/50 transition-all duration-300 text-lg px-10 h-14"
            >
              Submit Enquiry Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <Image
              src={logo}
              alt="5 Point Education"
              width={160}
              height={45}
              className="h-12 w-auto object-contain bg-white rounded p-1 mb-4"
            />
            <p className="text-gray-400 text-sm text-center max-w-md mb-6">
              Empowering students with quality education through personalized learning experiences.
            </p>
            <div className="flex items-center gap-6 mb-8">
              <Link href="/enquiry" className="text-gray-400 hover:text-secondary transition-colors">
                Contact
              </Link>
              <Link href="/auth/login" className="text-gray-400 hover:text-secondary transition-colors">
                Login
              </Link>
            </div>
            <div className="border-t border-gray-800 pt-6 w-full text-center">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} 5 Point Education. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
