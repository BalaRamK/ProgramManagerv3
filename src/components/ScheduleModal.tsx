import { X } from "lucide-react";
import { Button } from "@tremor/react";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ScheduleConfig) => void;
}

interface ScheduleConfig {
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  emails: string[];
  message: string;
}

export const ScheduleModal = ({ isOpen, onClose, onSubmit }: ScheduleModalProps) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const config: ScheduleConfig = {
      frequency: formData.get("frequency") as "daily" | "weekly" | "monthly",
      time: formData.get("time") as string,
      emails: (formData.get("emails") as string).split(",").map(email => email.trim()),
      message: formData.get("message") as string,
    };
    onSubmit(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Schedule Report</h3>
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
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              defaultValue="daily"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Time
            </label>
            <input
              id="time"
              name="time"
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              defaultValue="09:00"
              required
            />
          </div>
          <div>
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1">
              Recipients (comma-separated)
            </label>
            <input
              id="emails"
              name="emails"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter email addresses"
              required
            />
          </div>
          <div>
            <label htmlFor="scheduleMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              id="scheduleMessage"
              name="message"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              rows={3}
              placeholder="Add a message..."
            />
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
              Schedule Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type { ScheduleConfig }; 