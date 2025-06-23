import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface Faq3Props {
  heading: string;
  description: string;
  items?: FaqItem[];
  supportHeading: string;
  supportDescription: string;
  supportButtonText: string;
  supportButtonUrl: string;
}

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
      "Absolutely! We welcome any oppurtunity to share our knowledge. If you are in need of our expertise on how to organize the event, reach out to our team. We can help with promotion, logistics, and connecting you with the right Creative Technologist.",
  },
];

const Faq3 = ({
  heading = "Frequently Asked Questions",
  description = "Everything you need to know about Creative Technology Collective. Can't find the answer you're looking for? Feel free to contact our support team.",
  items = faqItems,
  supportHeading = "Still have questions?",
  supportDescription = "Can't find the answer you're looking for? Our support team is here to help with any technical questions or concerns.",
  supportButtonText = "Contact Support",
  supportButtonUrl = "/contact",
}: Faq3Props) => {
  return (
    <section className="py-16 md:py-32 bg-black">
      <div className="container max-w-6xl mx-auto px-4 md:px-8 space-y-16">
        <div className="mx-auto flex max-w-3xl flex-col text-center">
          <h2 className="mb-3 text-4xl md:text-5xl lg:text-6xl font-primary text-white font-bold md:mb-4 lg:mb-6">
            {heading}
          </h2>
          <p className="text-zinc-400 font-secondary lg:text-lg font-medium">{description}</p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="mx-auto w-full lg:max-w-4xl"
        >
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="transition-opacity duration-200 hover:no-underline hover:opacity-60">
                <div className="font-medium sm:py-1 lg:py-2 lg:text-lg text-left">
                  {item.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="sm:mb-1 lg:mb-2">
                <div className="text-zinc-300 font-secondary lg:text-lg leading-relaxed">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mx-auto flex max-w-4xl flex-col items-center rounded-lg bg-zinc-900/50 border border-zinc-800 p-6 text-center md:rounded-xl md:p-8 lg:p-10">
          <div className="relative mb-6">
            <Avatar className="absolute mb-4 size-16 origin-bottom -translate-x-[60%] scale-[80%] border border-zinc-700 md:mb-5">
              <AvatarImage src="/members/Florido.png" />
              <AvatarFallback>FL</AvatarFallback>
            </Avatar>
            <Avatar className="absolute mb-4 size-16 origin-bottom translate-x-[60%] scale-[80%] border border-zinc-700 md:mb-5">
              <AvatarImage src="/members/Pax.png" />
              <AvatarFallback>PX</AvatarFallback>
            </Avatar>
            <Avatar className="mb-4 size-16 border border-zinc-700 md:mb-5">
              <AvatarImage src="/members/Dwayne.png" />
              <AvatarFallback>DW</AvatarFallback>
            </Avatar>
          </div>
          <h3 className="mb-2 max-w-3xl font-primary font-semibold text-white lg:text-xl">
            {supportHeading}
          </h3>
          <p className="mb-8 max-w-3xl text-zinc-400 font-secondary lg:text-lg">
            {supportDescription}
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto font-primary" asChild>
              <a href={supportButtonUrl}>
                {supportButtonText}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Faq3 };