import React from 'react';

type TestimonialProps = {
  avatar: string;
  name: string;
  role: string;
  increase: string;
  testimonial: string;
  delay: number;
};

const Testimonial: React.FC<TestimonialProps> = ({ 
  avatar, name, role, increase, testimonial, delay 
}) => {
  return (
    <div 
      className="card p-6 hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xl font-bold">
            {avatar}
          </div>
        </div>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
          <div className="mt-1 text-success-600 dark:text-success-400 font-medium">
            {increase}
          </div>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 italic">{testimonial}</p>
    </div>
  );
};

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      avatar: "👩‍💼",
      name: "Anjali",
      role: "Quantitative Trader",
      increase: "+3%",
      testimonial: "InvestAI transformed my trading strategy. The AI-powered insights have increased my portfolio returns by 340% in just 6 months."
    },
    {
      avatar: "👨‍💻",
      name: "Raj",
      role: "Hedge Fund Manager",
      increase: "+5%",
      testimonial: "The strategy builder is incredibly intuitive. I can deploy complex algorithms without any coding knowledge."
    },
    {
      avatar: "👩‍🚀",
      name: "Priya",
      role: "Day Trader",
      increase: "+2%",
      testimonial: "Real-time signals and paper trading helped me refine my strategies before going live. Amazing platform!"
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gray-50 dark:bg-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Successful Traders</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            See what our community has to say about InvestAI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial 
              key={index}
              avatar={testimonial.avatar}
              name={testimonial.name}
              role={testimonial.role}
              increase={testimonial.increase}
              testimonial={testimonial.testimonial}
              delay={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;