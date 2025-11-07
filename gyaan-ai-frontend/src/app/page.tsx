'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, 
  Lock, 
  BarChart3, 
  Zap, 
  FileText, 
  Users, 
  Brain, 
  Code, 
  Shield,
  Star,
  ArrowRight
} from 'lucide-react';

export const dynamic = "force-dynamic";

// ===== COMPONENTS =====

const Section = ({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section className={`py-16 md:py-24 ${className}`} id={id}>
    {children}
  </section>
);

const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl ${className}`}>
    {children}
  </div>
);

const PrimaryButton = ({ children, href = '#', onClick }: { children: React.ReactNode; href?: string; onClick?: () => void;}) => (
  <a href={href} onClick={onClick} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-300 shadow-lg">
    {children}
  </a>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string;}) => (
  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
    <div className="inline-block p-3 bg-blue-100 rounded-lg mb-4">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }: { number: number; title: string; description: string;}) => (
  <div className="relative">
    <div className="flex items-start">
      <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold text-lg">
        {number}
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-gray-600">{description}</p>
      </div>
    </div>
  </div>
);

const TestimonialCard = ({ name, role, content }: { name: string; role: string; content: string;}) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      ))}
    </div>
    <p className="text-gray-700 mb-4" style={{whiteSpace: 'pre-wrap'}}>{'"' + content + '"'}</p>
    <div>
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="text-sm text-gray-600">{role}</p>
    </div>
  </div>
);

// ===== MAIN PAGE =====

export default function Home() {
  const { data: session } = useSession();

  const handleGetStarted = () => {
    if (session) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/api/auth/signin';
    }
  };

  return (
    <div>
      {/* HERO SECTION */}
      <Section className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Knowledge into <span className="text-blue-600">Actionable Insights</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Gyaan AI leverages advanced artificial intelligence to help you search, analyze, and generate reports from your private data sources. Make data-driven decisions faster than ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PrimaryButton onClick={handleGetStarted}>
                {session ? 'Go to Dashboard' : 'Get Started Free'}
              </PrimaryButton>
              <a 
                href="#features" 
                className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors duration-300"
              >
                Learn More <ArrowRight className="inline ml-2 w-4 h-4" />
              </a>
            </div>
          </div>
        </Container>
      </Section>

      {/* TRUSTED BY SECTION */}
      <Section className="bg-gray-50">
        <Container>
          <div className="text-center">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-8">
              Trusted by leading organizations
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              {['TechCorp', 'FinanceHub', 'DataSys', 'InnovateLabs'].map((company) => (
                <div key={company} className="text-gray-400 font-bold text-lg md:text-xl">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* HOW IT WORKS SECTION */}
      <Section id="how-it-works">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How Gyaan AI Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to unlock insights from your data
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number={1}
              title="Connect Your Sources"
              description="Link your databases, APIs, documents, and web sources. Gyaan AI supports multiple data connectors for seamless integration."
            />
            <StepCard 
              number={2}
              title="Ask Questions"
              description="Query your data using natural language. No SQL required. Get answers in seconds with AI-powered analysis."
            />
            <StepCard 
              number={3}
              title="Get Reports"
              description="Receive comprehensive, formatted reports with visualizations, insights, and actionable recommendations."
            />
          </div>
        </Container>
      </Section>

      {/* FEATURES SECTION */}
      <Section className="bg-gray-50" id="features">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Everyone
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to master data analysis and reporting
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={Search} title="Advanced Search" description="Search across multiple data sources simultaneously with powerful AI-driven search capabilities." />
            <FeatureCard icon={Lock} title="Private Data Integration" description="Keep your data secure. Integrate private databases and documents with enterprise-grade encryption." />
            <FeatureCard icon={FileText} title="Article Generation" description="Automatically generate well-formatted articles, reports, and documentation from your data." />
            <FeatureCard icon={BarChart3} title="Advanced Analytics" description="Perform complex data analysis with built-in statistical models and visualization tools." />
            <FeatureCard icon={Code} title="Developer API" description="Build custom applications with our powerful REST API and SDKs for multiple languages." />
            <FeatureCard icon={Shield} title="Enterprise Security" description="HTTPS encryption, role-based access control, and SOC 2 compliance for peace of mind." />
          </div>
        </Container>
      </Section>

      {/* INTEGRATIONS SECTION */}
      <Section>
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Integrations</h2>
            <p className="text-xl text-gray-600">Connect with tools you already use</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {[{icon: Zap, name: 'Integrations'}, {icon: Brain, name: 'Analytics'}, {icon: Lock, name: 'Security'}, {icon: BarChart3, name: 'Reports'}, {icon: Code, name: 'API'}, {icon: Users, name: 'Teams'}].map(({icon: Icon, name}) => (
              <div key={name} className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                <Icon className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 text-center">{name}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* USE CASES SECTION */}
      <Section className="bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Use Cases</h2>
            <p className="text-xl text-gray-600">Gyaan AI serves various industries and roles</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{title: 'Financial Analysts', description: 'Analyze market trends, generate investment reports, and extract insights from financial data.', icon: BarChart3}, {title: 'Tech Developers', description: 'Build intelligent applications with our API. Integrate AI-powered search into your product.', icon: Code}, {title: 'Academic Researchers', description: 'Conduct literature reviews, analyze research data, and generate academic reports effortlessly.', icon: Brain}].map(({title, description, icon: Icon}) => (
              <div key={title} className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="inline-block p-3 bg-blue-100 rounded-lg mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* TESTIMONIALS SECTION */}
      <Section>
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied users worldwide</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard name="Sarah Chen" role="Financial Analyst" content="Gyaan AI reduced my report generation time by 80%. Highly recommend!" />
            <TestimonialCard name="James Rodriguez" role="Tech Developer" content="The API documentation is excellent. Integration was seamless and quick." />
            <TestimonialCard name="Dr. Emily Watson" role="Research Director" content="Best tool for literature research. Saves hours of manual work every week." />
          </div>
        </Container>
      </Section>

      {/* PRICING PREVIEW SECTION */}
      <Section className="bg-gray-50">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 mb-8">Start free, upgrade as you grow</p>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200 hover:border-blue-600 transition-colors">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Plan</h3>
                <p className="text-gray-600 mb-6">Perfect for getting started</p>
                <div className="text-4xl font-bold text-gray-900 mb-6">$0<span className="text-lg text-gray-600">/month</span></div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center"><span className="text-blue-600 mr-3">✓</span> Up to 5 sources</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-3">✓</span> 100 queries/month</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-3">✓</span> Community support</li>
                </ul>
                <PrimaryButton href="#">Get Started Free</PrimaryButton>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-600 transform md:scale-105">
                <div className="text-blue-600 font-bold mb-2">MOST POPULAR</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Plan</h3>
                <p className="text-gray-600 mb-6">For professionals and teams</p>
                <div className="text-4xl font-bold text-gray-900 mb-6">$99<span className="text-lg text-gray-600">/month</span></div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center"><span className="text-blue-600 mr-3">✓</span> Unlimited sources</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-3">✓</span> Unlimited queries</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-3">✓</span> Priority support</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-3">✓</span> API access</li>
                </ul>
                <PrimaryButton href="#">Start Free Trial</PrimaryButton>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FINAL CTA SECTION */}
      <Section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Data?</h2>
            <p className="text-xl mb-8 text-blue-100">Join thousands of professionals using Gyaan AI to make smarter decisions faster.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleGetStarted} className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg">
                Start For Free
              </button>
              <a href="#" className="inline-block bg-transparent text-white font-semibold px-8 py-3 rounded-lg border-2 border-white hover:bg-white hover:text-blue-600 transition-colors duration-300">
                Schedule Demo
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
