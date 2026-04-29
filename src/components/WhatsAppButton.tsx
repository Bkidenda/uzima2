import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "254708096833";
const PRESET = encodeURIComponent("Hello Uzima Community! I'd like to chat.");

const WhatsAppButton = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${PRESET}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Uzima on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-13 w-13 h-[52px] w-[52px] place-items-center rounded-full bg-[#25D366] text-white shadow-warm hover:scale-105 transition-smooth"
    >
      <MessageCircle className="h-6 w-6" fill="currentColor" />
      <span className="sr-only">WhatsApp chat</span>
    </a>
  );
};

export default WhatsAppButton;
