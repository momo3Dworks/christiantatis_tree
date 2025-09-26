import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What are your service times?",
    answer: "Our main service is on Sunday at 10:00 AM. We also have a mid-week service on Wednesdays at 7:00 PM.",
  },
  {
    question: "Do you have programs for children?",
    answer: "Yes, we have a vibrant children's ministry for ages 2-12 during our Sunday service. All our volunteers are background-checked and trained.",
  },
  {
    question: "How can I get involved in the community?",
    answer: "We have many small groups and volunteer teams. You can find more information on our 'Events' page or by filling out the contact form.",
  },
  {
    question: "What does your church believe?",
    answer: "We adhere to the core tenets of the Christian faith. A detailed statement of faith is available upon request.",
  },
  {
    question: "How can I donate?",
    answer: "You can donate online through our website, during our services, or via mail. We appreciate your support for our ministry.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen text-black pt-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about our church and activities.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="bg-white/60 backdrop-blur-sm rounded-lg mb-4 border-gray-200">
              <AccordionTrigger className="text-left text-lg p-6 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0 text-gray-700">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
