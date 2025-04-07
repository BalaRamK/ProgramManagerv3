import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | null;
  editingInvoice?: Invoice | null;
}

interface Invoice {
  id: string;
  name: string;
  type: 'Vendor' | 'Miscellaneous';
  cost: number;
  invoice_date: string;
  platform?: string;
  organization_id: string;
}

interface InvoiceFormData {
  name: string;
  cost: string;
  invoice_date: string;
  type: 'Vendor' | 'Miscellaneous';
  platform?: string;
  organization_id: string;
  start_date: string;
  end_date?: string;
  cycle?: 'one-time' | 'Continuous';
  approver_id?: string;
  billed_by_id?: string;
  approved_by_id?: string;
  program_id?: string;
}

export function InvoiceModal({ isOpen, onClose, organizationId, editingInvoice = null }: InvoiceModalProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    name: '',
    cost: '',
    invoice_date: new Date().toISOString().split('T')[0],
    type: 'Vendor',
    platform: '',
    organization_id: organizationId || '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    cycle: 'one-time',
    approver_id: '',
    billed_by_id: '',
    approved_by_id: '',
    program_id: ''
  });

  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch users and programs for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;

      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .eq('organization_id', organizationId);

      const { data: programsData } = await supabase
        .from('programs')
        .select('id, name')
        .eq('organization_id', organizationId);

      if (usersData) setUsers(usersData);
      if (programsData) setPrograms(programsData);
    };

    fetchData();
  }, [organizationId]);

  useEffect(() => {
    if (editingInvoice) {
      // Fetch existing cost entry for the invoice
      const fetchCostEntry = async () => {
        const costTable = editingInvoice.type === 'Vendor' ? 'vendor_costs' : 'miscellaneous_costs';
        const { data: costData } = await supabase
          .from(costTable)
          .select('*')
          .eq('invoice_id', editingInvoice.id)
          .single();

        setFormData({
          name: editingInvoice.name,
          cost: editingInvoice.cost.toString(),
          invoice_date: editingInvoice.invoice_date,
          type: editingInvoice.type,
          platform: editingInvoice.platform || '',
          organization_id: editingInvoice.organization_id,
          start_date: costData?.start_date || new Date().toISOString().split('T')[0],
          end_date: costData?.end_date || '',
          cycle: costData?.cycle || 'one-time',
          approver_id: costData?.approver_id || '',
          billed_by_id: costData?.billed_by_id || '',
          approved_by_id: costData?.approved_by_id || '',
          program_id: costData?.program_id || ''
        });
      };

      fetchCostEntry();
    } else {
      setFormData({
        name: '',
        cost: '',
        invoice_date: new Date().toISOString().split('T')[0],
        type: 'Vendor',
        platform: '',
        organization_id: organizationId || '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        cycle: 'one-time',
        approver_id: '',
        billed_by_id: '',
        approved_by_id: '',
        program_id: ''
      });
    }
  }, [editingInvoice, organizationId, isOpen]);

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

    // Validate required fields
    if (!formData.start_date) {
      alert('Start date is required');
      return;
    }

    const dataToSave = {
      ...formData,
      cost: costValue,
      organization_id: organizationId,
    };

    // Start a transaction to ensure both invoice and cost are created/updated together
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User not authenticated');
      return;
    }

    if (editingInvoice) {
      // Update existing invoice
      const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update(dataToSave)
        .eq('id', editingInvoice.id)
        .select()
        .single();

      if (updateError) {
        alert(`Error updating invoice: ${updateError.message}`);
        return;
      }

      // Update corresponding cost entry
      const costTable = formData.type === 'Vendor' ? 'vendor_costs' : 'miscellaneous_costs';
      const costData = formData.type === 'Vendor' ? {
        cost: costValue,
        vendor_name: formData.name,
        organization_id: organizationId,
        invoice_id: invoice.id,
        program_id: formData.program_id || null,
        cycle: formData.cycle,
        approver_id: formData.approver_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        updated_at: new Date().toISOString()
      } : {
        cost: costValue,
        name: formData.name,
        organization_id: organizationId,
        invoice_id: invoice.id,
        program_id: formData.program_id || null,
        billed_by_id: formData.billed_by_id || null,
        approved_by_id: formData.approved_by_id || null,
        updated_at: new Date().toISOString()
      };

      const { error: costUpdateError } = await supabase
        .from(costTable)
        .update(costData)
        .eq('invoice_id', invoice.id);

      if (costUpdateError) {
        alert(`Error updating cost entry: ${costUpdateError.message}`);
        return;
      }
    } else {
      // Create new invoice
      const { data: invoice, error: insertError } = await supabase
        .from('invoices')
        .insert([dataToSave])
        .select()
        .single();

      if (insertError) {
        alert(`Error creating invoice: ${insertError.message}`);
        return;
      }

      // Create corresponding cost entry
      const costTable = formData.type === 'Vendor' ? 'vendor_costs' : 'miscellaneous_costs';
      const costData = formData.type === 'Vendor' ? {
        organization_id: organizationId,
        cost: costValue,
        invoice_id: invoice.id,
        vendor_name: formData.name,
        program_id: formData.program_id || null,
        cycle: formData.cycle,
        approver_id: formData.approver_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : {
        organization_id: organizationId,
        cost: costValue,
        invoice_id: invoice.id,
        name: formData.name,
        program_id: formData.program_id || null,
        billed_by_id: formData.billed_by_id || null,
        approved_by_id: formData.approved_by_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: costInsertError } = await supabase
        .from(costTable)
        .insert([costData]);

      if (costInsertError) {
        // If cost creation fails, delete the invoice to maintain consistency
        await supabase.from('invoices').delete().eq('id', invoice.id);
        alert(`Error creating cost entry: ${costInsertError.message}`);
        return;
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{editingInvoice ? 'Edit' : 'Add New'} Invoice</h2>
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
            <Label htmlFor="program_id">Program</Label>
            <Select
              name="program_id"
              value={formData.program_id || ''}
              onValueChange={(value) => handleSelectChange('program_id', value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>

          {formData.type === 'Vendor' && (
            <>
              <div>
                <Label htmlFor="cycle">Cycle</Label>
                <Select
                  name="cycle"
                  value={formData.cycle || 'one-time'}
                  onValueChange={(value) => handleSelectChange('cycle', value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select Cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="Continuous">Continuous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="approver_id">Approver</Label>
                <Select
                  name="approver_id"
                  value={formData.approver_id || ''}
                  onValueChange={(value) => handleSelectChange('approver_id', value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select Approver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formData.type === 'Miscellaneous' && (
            <>
              <div>
                <Label htmlFor="billed_by_id">Billed By</Label>
                <Select
                  name="billed_by_id"
                  value={formData.billed_by_id || ''}
                  onValueChange={(value) => handleSelectChange('billed_by_id', value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select Billed By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="approved_by_id">Approved By</Label>
                <Select
                  name="approved_by_id"
                  value={formData.approved_by_id || ''}
                  onValueChange={(value) => handleSelectChange('approved_by_id', value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select Approved By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

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
            <Button type="submit">{editingInvoice ? 'Update' : 'Save'} Invoice</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 