import React from 'react';
import ImageCube from './ImageCube';
import EmailSignup from './EmailSignup';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    id: "faq-1",
    question: "What is Creative Technology Collective?",
    answer:
      "Creative Technology Collective (CTC) is a professional community for creative technologists, designers, developers, and innovators working at the intersection of creativity and technology. We provide resources, networking opportunities, and collaborative spaces for professionals pushing the boundaries of digital experiences.",
  },
  {
    id: "faq-2",
    question: "How do I become a member?",
    answer:
      "Membership to CTC is by invitation and nomination from existing members. We look for professionals with demonstrated experience in creative technology fields such as interactive design, creative coding, AR/VR development, AI applications in creative work, and emerging technology implementation.",
  },
  {
    id: "faq-3",
    question: "What are the benefits of membership?",
    answer:
      "Members gain access to our N8N server, social events, networking opportunities with industry leaders, collaboration on projects, early access to new tools and technologies, and participation in our knowledge-sharing community.",
  },
  {
    id: "faq-4",
    question: "Is there a membership fee?",
    answer:
      "CTC membership is and will remain free for all members. We believe in making our community accessible to creative technologists regardless of their financial situation.",
  },
  {
    id: "faq-5",
    question: "What types of resources do you provide?",
    answer:
      "Our resource directory includes cutting-edge tools, libraries, frameworks, educational materials, industry reports, job opportunities, and curated content relevant to creative technology work. Resources are continuously updated and vetted by our community.",
  },
  {
    id: "faq-6",
    question: "Can I submit resources to the directory?",
    answer:
      "Yes! We encourage anyone to submit valuable resources they discover. All submissions are reviewed by our curation team to ensure quality and relevance. You can submit resources through our contact form or directly to community moderators.",
  },
  {
    id: "faq-7",
    question: "Do you offer workshops or training?",
    answer:
      "We regularly organize workshops and skill-sharing sessions led by industry experts and community members. These cover topics like emerging technologies, creative coding techniques, design methodologies, and professional development.",
  },
  {
    id: "faq-8",
    question: "How can I collaborate with other members?",
    answer:
      "Members can connect internally, participate in collaborative projects, join working groups on specific technologies or challenges, and attend social events. We facilitate introductions and project matching based on skills and interests.",
  },
  {
    id: "faq-9",
    question: "What industries do your members work in?",
    answer:
      "Our members work across diverse industries including advertising agencies, tech companies, design studios, entertainment, gaming, education, healthcare, finance, and as independent freelancers and consultants. The common thread is their focus on creative technology applications.",
  },
  {
    id: "faq-10",
    question: "How do I stay updated with community activities?",
    answer:
      "Subscribe to our newsletter for regular updates on new resources, upcoming events, member spotlights, and industry insights. You can also follow our LinkedIn.",
  },
  {
    id: "faq-11",
    question: "Can I reach out for an event or workshop?",
    answer:
      "Absolutely! We welcome any opportunity to share our knowledge. If you are in need of our expertise on how to organize the event, reach out to our team. We can help with promotion, logistics, and connecting you with the right Creative Technologist.",
  },
];

const FAQPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row min-h-[70vh]">
        {/* Left Side - Text Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0">
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              Support
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
            <span className="block">Frequently</span>
            <span className="block text-zinc-500">Asked Questions</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            Everything you need to know about Creative Technology Collective. Can't find what you're looking for? Get in touch with us.
          </p>

          <div className="flex gap-12 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">{faqItems.length}</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Questions</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">2025</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Updated</span>
            </div>
          </div>
        </div>

        {/* Right Side - Cube */}
        <div className="flex-1 relative flex items-center justify-center min-h-[50vh] lg:min-h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-black" />
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <ImageCube 
              size={5.5} 
              rotationSpeed={0.008} 
              position={{ x: 0, y: 0, z: 0 }} 
              forceVisible={true} 
            />
          </div>
        </div>
      </div>

      {/* FAQ Content Section */}
      <section className="py-32 bg-black px-8 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item) => (
              <AccordionItem 
                key={item.id} 
                value={item.id}
                className="border border-zinc-800 rounded-lg px-6 bg-zinc-900/30"
              >
                <AccordionTrigger className="text-left text-lg font-primary text-white hover:text-zinc-300 py-6">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 font-secondary leading-relaxed pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Join Community CTA Section */}
      <section className="py-24 bg-zinc-900/30 px-8 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-primary font-medium text-white mb-4">
            Want to join our community of creative technologists?
          </h2>
          <p className="text-zinc-400 font-secondary mb-8">
            Subscribe to stay updated with the latest news, events, and opportunities.
          </p>
          <EmailSignup minimal={true} />
        </div>
      </section>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          FAQ • Support • 2025
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative • Technology • Collective
        </span>
      </div>
    </div>
  );
};

export default FAQPage;