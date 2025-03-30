import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | null;
}

interface InvoiceFormData {
  name: string;
  cost: string;
  invoice_date: string;
  type: 'Vendor' | 'Miscellaneous';
  platform?: string;
  organization_id: string;
}

export function InvoiceModal({ isOpen, onClose, organizationId }: InvoiceModalProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    name: '',
    cost: '',
    invoice_date: new Date().toISOString().split('T')[0],
    type: 'Vendor',
    platform: '',
    organization_id: organizationId || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      alert('Organization ID is required');
      return;
    }

    const costValue = parseFloat(formData.cost);
    if (isNaN(costValue)) {
      alert('Please enter a valid cost');
      return;
    }

    const { error } = await supabase.from('invoices').insert([{
      ...formData,
      cost: costValue,
      organization_id: organizationId,
    }]);

    if (error) {
      alert(`Error creating invoice: ${error.message}`);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add New Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" title="Close modal">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Invoice Name/Description</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="invoice_date">Invoice Date</Label>
            <Input
              id="invoice_date"
              name="invoice_date"
              type="date"
              value={formData.invoice_date}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              name="type"
              value={formData.type}
              onValueChange={(value: 'Vendor' | 'Miscellaneous') => handleSelectChange('type', value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vendor">Vendor</SelectItem>
                <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="platform">Platform (Optional)</Label>
            <Input
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Invoice</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 