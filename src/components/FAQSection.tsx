
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How does Treqy work?",
      answer: "You can either upload your specification PDFs and the Treqy team will extract and organize all your material information for you - or manually add materials yourself. Then, easily search, filter, and track usage across all your projects."
    },
    {
      question: "What file formats does Treqy support?",
      answer: "Treqy supports PDF files, which are the most common format for architectural specifications. Our AI can extract material information from various PDF layouts and formats."
    },
    {
      question: "How quickly can I get started?",
      answer: "After signing up, you can send us your first spec PDF to onboard - or jump in and start building your own searchable material library."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security seriously. All your specifications and material data are encrypted and stored securely. We never share your information with third parties."
    },
    {
      question: "How does the optional onboarding work?",
      answer: "You can send us as many past projects as you'd like, and we'll upload all the materials you've specified for them. The more historical data you provide, the more valuable Treqy becomes for your team."
    },
    {
      question: "Do you offer team collaboration features?",
      answer: "Yes, Treqy supports team collaboration with shared material libraries, project organization, and user permission management for studios of all sizes."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Treqy
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-lg border border-gray-200 px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-coral py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
