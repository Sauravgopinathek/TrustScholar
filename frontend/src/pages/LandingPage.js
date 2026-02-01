import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiLock, FiAward, FiCheckCircle, FiUsers, FiFileText, FiArrowRight } from 'react-icons/fi';

const LandingPage = () => {
  const features = [
    {
      icon: FiShield,
      title: 'Multi-Factor Authentication',
      description: 'Secure login with password + email OTP verification following NIST guidelines.'
    },
    {
      icon: FiLock,
      title: 'End-to-End Encryption',
      description: 'Your documents and data are encrypted using AES-256 + RSA-2048 hybrid encryption.'
    },
    {
      icon: FiCheckCircle,
      title: 'Digital Signatures',
      description: 'Every application is digitally signed to ensure authenticity and integrity.'
    },
    {
      icon: FiFileText,
      title: 'QR Verification',
      description: 'Instant verification of scholarship status through secure QR codes.'
    }
  ];

  const stats = [
    { value: '100%', label: 'Secure' },
    { value: 'AES-256', label: 'Encryption' },
    { value: 'NIST', label: 'Compliant' },
    { value: '24/7', label: 'Available' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-primary-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <FiShield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TrustScholar</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-300 hover:text-white transition font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition shadow-lg shadow-emerald-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-8">
            <FiShield className="w-4 h-4" />
            NIST SP 800-63-2 Compliant Security
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Secure Your
            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Scholarship Journey
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            TrustScholar provides a secure, encrypted platform for scholarship applications 
            with digital signatures, QR verification, and enterprise-grade security.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/register"
              className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition shadow-2xl shadow-emerald-500/30 flex items-center gap-2"
            >
              Start Application
              <FiArrowRight className="group-hover:translate-x-1 transition" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur">
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built with the highest security standards to protect your sensitive information
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-emerald-900/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Simple, secure, and streamlined scholarship application process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Register & Verify', desc: 'Create your account and verify your email with secure OTP' },
              { step: '02', title: 'Apply Securely', desc: 'Submit your application with encrypted documents' },
              { step: '03', title: 'Get Verified', desc: 'Receive your verified QR code after approval' }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-8xl font-bold text-white/5 absolute -top-4 -left-2">{item.step}</div>
                <div className="relative z-10 p-6">
                  <div className="text-emerald-400 font-semibold mb-2">Step {item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-3xl border border-emerald-500/20 backdrop-blur">
            <FiAward className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of students using TrustScholar for secure scholarship applications
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition shadow-2xl shadow-emerald-500/30"
            >
              Create Free Account
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FiShield className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-semibold">TrustScholar</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 TrustScholar. Secured with enterprise-grade encryption.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
