// NavNotificationBar.tsx
import React from 'react';
import { PartyPopper } from 'lucide-react';

const NavNotificationBar: React.FC = () => {
  return (
    <div className="bg-orange-500 text-white text-center py-2 flex items-center justify-center gap-2">
      <PartyPopper className="h-5 w-5" />
      <span>This is the Beta version of the platform. For queries or connect, reach out to us on </span>
      <a 
        href="mailto:balaramakrishnasaikarumanchi0@gmail.com" 
        className="inline-flex items-center px-3 py-1 rounded-md bg-white text-orange-500 hover:bg-orange-100 transition-colors font-medium"
      >
        Contact
      </a>
    </div>
  );
};

export default NavNotificationBar;