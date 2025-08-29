import React from 'react';
import { 
  BrainCircuit, 
  LineChart, 
  Activity, 
  BarChart3, 
  FileStack, 
  PieChart 
} from 'lucide-react';

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <div 
      className="card p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-start"
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <BrainCircuit size={24} />,
      title: "Strategy Builder",
      description: "Create sophisticated algorithmic trading strategies with our intuitive easy-to-use interface."
    },
    {
      icon: <Activity size={24} />,
      title: "Algo Trading",
      description: "Deploy your strategies with our advanced algorithmic trading engine and real-time execution."
    },
    {
      icon: <LineChart size={24} />,
      title: "Signals Viewer",
      description: "Get real-time trading signals and market insights powered by advanced analytics calculations."
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Advanced Charts",
      description: "Professional-grade charting tools with technical indicators and market analysis."
    },
    {
      icon: <FileStack size={24} />,
      title: "Paper Trading",
      description: "Test your strategies risk-free with our comprehensive paper trading simulator."
    },
    {
      icon: <PieChart size={24} />,
      title: "Performance Analytics",
      description: "Track and analyze your trading performance with detailed reports and metrics."
    }
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-dark-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Modern Traders</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to succeed in algorithmic trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;