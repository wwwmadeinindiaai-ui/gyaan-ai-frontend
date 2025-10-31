import React from 'react';

// Section Component
const Section = ({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-16 md:py-24 ${className}`}>
    {children}
  </section>
);

// Container Component
const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl ${className}`}>
    {children}
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Social Proof Component
const SocialProof = () => (
  <div className="bg-gray-50 py-12">
    <Container>
      <div className="text-center">
        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-8">
          Trusted by leading organizations
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
          <div className="text-gray-400 font-bold text-2xl">Company 1</div>
          <div className="text-gray-400 font-bold text-2xl">Company 2</div>
          <div className="text-gray-400 font-bold text-2xl">Company 3</div>
          <div className="text-gray-400 font-bold text-2xl">Company 4</div>
        </div>
      </div>
    </Container>
  </div>
);

// Main Marketing Landing Page
export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <Section className="pt-20 md:pt-32">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your Learning Experience with{' '}
              <span className="text-blue-600">Gyaan AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Intelligent, personalized education powered by cutting-edge AI technology.
              Learn smarter, faster, and more effectively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-lg">
                Get Started Free
              </button>
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors duration-300">
                Watch Demo
              </button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Social Proof */}
      <SocialProof />

      {/* Features Section */}
      <Section id="features">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Learning
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to accelerate your educational journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🤖"
              title="AI-Powered Learning"
              description="Leverage advanced AI algorithms that adapt to your learning style and pace for optimal knowledge retention."
            />
            <FeatureCard
              icon="📚"
              title="Comprehensive Content"
              description="Access a vast library of curated educational materials covering diverse subjects and skill levels."
            />
            <FeatureCard
              icon="🎯"
              title="Personalized Paths"
              description="Get customized learning paths tailored to your goals, background, and preferred learning methods."
            />
            <FeatureCard
              icon="📊"
              title="Progress Tracking"
              description="Monitor your advancement with detailed analytics and insights into your learning journey."
            />
            <FeatureCard
              icon="💬"
              title="Interactive Support"
              description="Engage with AI tutors and community experts for instant help whenever you need it."
            />
            <FeatureCard
              icon="🏆"
              title="Certification Ready"
              description="Prepare for industry-recognized certifications with targeted practice and assessment tools."
            />
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="bg-blue-600 text-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of learners who are already transforming their education with Gyaan AI.
            </p>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-lg">
              Start Learning Today
            </button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
