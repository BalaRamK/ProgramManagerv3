import { X } from "lucide-react";
import { Button } from "@tremor/react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ShareConfig) => void;
}

interface ShareConfig {
  email: string;
  message: string;
  expiryDays: number;
}

export const ShareModal = ({ isOpen, onClose, onSubmit }: ShareModalProps) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const config: ShareConfig = {
      email: formData.get("email") as string,
      message: formData.get("message") as string,
      expiryDays: Number(formData.get("expiryDays")),
    };
    onSubmit(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Share Report</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter email address"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              rows={3}
              placeholder="Add a message..."
            />
          </div>
          <div>
            <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700 mb-1">
              Link Expiry
            </label>
            <select
              id="expiryDays"
              name="expiryDays"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              defaultValue={7}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              className="border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              Share Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type { ShareConfig }; 