export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-12">Pricing Plans</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Free</h2>
            <p className="text-4xl font-bold mb-6">$0<span className="text-sm">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li>✓ 10 queries per day</li>
              <li>✓ Basic search</li>
              <li>✓ Community support</li>
            </ul>
            <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300">
              Get Started
            </button>
          </div>
          
          <div className="bg-blue-600 text-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Pro</h2>
            <p className="text-4xl font-bold mb-6">$29<span className="text-sm">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li>✓ Unlimited queries</li>
              <li>✓ Advanced search</li>
              <li>✓ Priority support</li>
              <li>✓ API access</li>
            </ul>
            <button className="w-full bg-white text-blue-600 py-3 rounded-lg hover:bg-gray-100">
              Get Started
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Enterprise</h2>
            <p className="text-4xl font-bold mb-6">Custom</p>
            <ul className="space-y-3 mb-8">
              <li>✓ Everything in Pro</li>
              <li>✓ Custom integrations</li>
              <li>✓ Dedicated support</li>
              <li>✓ SLA guarantee</li>
            </ul>
            <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
