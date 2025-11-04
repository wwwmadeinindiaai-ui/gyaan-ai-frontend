import React from 'react';
export const dynamic = "force-dynamic";

// Section Component
const Section = ({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section className={`py-16 md:py-24 ${className}`} id={id}>
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

// Features Section Component
const Features = () => (
  <div className="py-16 bg-gray-50">
    <Container>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
          Powerful Features to Accelerate Your Learning
        </h2>
        <p className="text-xl text-gray-600">
          Everything you need to master new skills and knowledge
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          icon="🤖" 
          title="AI-Powered Learning" 
          description="Experience adaptive learning powered by advanced artificial intelligence that understands your pace and style."
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
  </div>
);

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      
      {/* Features */}
      <Features />
      
      {/* CTA Section */}
      <section className="bg-blue-600 text-white">
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
      </section>
    </div>
  );
}
