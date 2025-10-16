export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input type="text" className="w-full border rounded-lg px-4 py-2" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" className="w-full border rounded-lg px-4 py-2" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea className="w-full border rounded-lg px-4 py-2" rows={5} placeholder="Your message"></textarea>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Send Message
            </button>
          </form>
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-4">Other Ways to Reach Us</h2>
            <p className="text-gray-600">Email: support@gyaanai.com</p>
            <p className="text-gray-600">Phone: +1 (555) 123-4567</p>
          </div>
        </div>
      </div>
    </div>
  );
}
