import React from 'react';
import { ArrowRight, Play, Lock, Zap, FileCheck, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Trading?</h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Join thousands of traders who are already using InvestAI to maximize their profits. Start your journey to smarter trading today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/login" className="btn bg-white text-primary-600 hover:bg-gray-100 hover:text-primary-700">
            Go to dashboard 
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <button className="btn bg-transparent border border-white hover:bg-white/10">
            <Play className="mr-2 h-5 w-5" />
            Watch demo
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 text-center">
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-white/10 mb-3">
              <Lock className="h-6 w-6" />
            </div>
            <p className="font-medium">Bank-level Security</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-white/10 mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <p className="font-medium">Lightning Fast Execution</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-white/10 mb-3">
              <FileCheck className="h-6 w-6" />
            </div>
            <p className="font-medium">Risk-Free Paper Trading</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-white/10 mb-3">
              <BarChart className="h-6 w-6" />
            </div>
            <p className="font-medium">Automated Trading</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;