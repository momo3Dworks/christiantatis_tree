import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What are your service times?",
    answer: "Our main service is on Sunday at 10:00 AM. We also have a midweek service on Wednesdays at 7:00 PM.",
  },
  {
    question: "Do you have programs for children?",
    answer: "Yes, we have a vibrant children's ministry for ages 0-12 during our Sunday service.",
  },
  {
    question: "How can I get involved?",
    answer: "We have many small groups and volunteer opportunities. Please visit our contact page to get in touch with a ministry leader.",
  },
  {
    question: "What do you believe?",
    answer: "Our beliefs are rooted in the Bible and centered on Jesus Christ. You can find a detailed statement of faith on our (soon to be created) 'About Us' page.",
  },
];

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-3xl">
      <h1 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h1>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
