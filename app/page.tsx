import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Home, Users, TrendingUp, GraduationCap, Award } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">5 Point Education Hub</span>
          </div>
          <Link href="/auth/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Excellence in Education, <span className="text-primary">Delivered Your Way</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Empowering students with personalized learning experiences through expert tutoring 
            and comprehensive batch programs.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/enquiry">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90">
                Get in Touch
              </Button>
            </Link>
            <Link href="#services">
              <Button size="lg" variant="outline">
                Explore Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">Choose the learning mode that fits your needs</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Tuition Batch Card */}
            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardHeader>
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Tuition Batch</CardTitle>
                <CardDescription className="text-base">
                  Learn together in our well-equipped coaching center
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <Award className="h-5 w-5 text-secondary mr-2 mt-0.5" />
                    <span>Expert teachers with years of experience</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="h-5 w-5 text-secondary mr-2 mt-0.5" />
                    <span>Interactive group learning environment</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="h-5 w-5 text-secondary mr-2 mt-0.5" />
                    <span>Regular assessments and progress tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="h-5 w-5 text-secondary mr-2 mt-0.5" />
                    <span>Flexible batch timings</span>
                  </li>
                </ul>
                <Link href="/enquiry?service=batch" className="block mt-6">
                  <Button className="w-full">Enquire Now</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Home Tutor Card */}
            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardHeader>
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Home Tutor</CardTitle>
                <CardDescription className="text-base">
                  Personalized one-on-one learning at your doorstep
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <Award className="h-5 w-5 text-secondary mr-2 mt-0.5" />
                    <span>Dedicated attention to individual needs</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="h-5 w-5 text-secondary mr-2 mt-0.5" />
                    <span>Comfortable learning in your home</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="h-5 w-5 text-secondary mr-2 mt-0.5" />
                    <span>Customized curriculum and pace</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="h-5 w-5 text-secondary mr-2 mt-0.5" />
                    <span>Convenient scheduling</span>
                  </li>
                </ul>
                <Link href="/enquiry?service=home" className="block mt-6">
                  <Button className="w-full">Enquire Now</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose 5 Point Education Hub?</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Curriculum</h3>
              <p className="text-gray-600">
                ICSE, CBSE, and WBBSE board coverage with subject matter experts
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Proven Results</h3>
              <p className="text-gray-600">
                Track record of excellent academic performance and board exam success
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Attention</h3>
              <p className="text-gray-600">
                Small batch sizes and individual focus ensure every student thrives
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of students who have achieved academic excellence with us
          </p>
          <Link href="/enquiry">
            <Button size="lg" variant="secondary" className="text-lg">
              Submit Enquiry Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="h-6 w-6" />
            <span className="text-xl font-bold">5 Point Education Hub</span>
          </div>
          <p className="text-sm">
            © 2024 5 Point Education Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
