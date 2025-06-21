
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditPendingManufacturerDialogProps {
  manufacturer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManufacturerUpdated: () => void;
}

const EditPendingManufacturerDialog = ({
  manufacturer,
  open,
  onOpenChange,
  onManufacturerUpdated
}: EditPendingManufacturerDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    notes: ''
  });

  // Update form data when manufacturer changes or dialog opens
  useEffect(() => {
    console.log('=== EDIT DIALOG USEEFFECT ===');
    console.log('Manufacturer prop:', manufacturer);
    console.log('Dialog open:', open);
    console.log('Manufacturer keys:', manufacturer ? Object.keys(manufacturer) : 'null');
    
    if (manufacturer && open) {
      console.log('Setting form data with manufacturer data:');
      console.log('- name:', manufacturer.name);
      console.log('- contact_name:', manufacturer.contact_name);
      console.log('- email:', manufacturer.email);
      console.log('- phone:', manufacturer.phone);
      console.log('- website:', manufacturer.website);
      console.log('- notes:', manufacturer.notes);
      
      const newFormData = {
        name: manufacturer.name || '',
        contact_name: manufacturer.contact_name || '',
        email: manufacturer.email || '',
        phone: manufacturer.phone || '',
        website: manufacturer.website || '',
        notes: manufacturer.notes || ''
      };
      
      console.log('New form data being set:', newFormData);
      setFormData(newFormData);
    }
    
    console.log('=== END EDIT DIALOG USEEFFECT ===');
  }, [manufacturer, open]);

  // Also update when manufacturer changes even if dialog is already open
  useEffect(() => {
    if (manufacturer) {
      console.log('=== MANUFACTURER CHANGED EFFECT ===');
      console.log('Manufacturer changed, updating form data:', manufacturer);
      
      const newFormData = {
        name: manufacturer.name || '',
        contact_name: manufacturer.contact_name || '',
        email: manufacturer.email || '',
        phone: manufacturer.phone || '',
        website: manufacturer.website || '',
        notes: manufacturer.notes || ''
      };
      
      console.log('Updated form data:', newFormData);
      setFormData(newFormData);
      console.log('=== END MANUFACTURER CHANGED EFFECT ===');
    }
  }, [manufacturer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturer?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pending_manufacturers')
        .update(formData)
        .eq('id', manufacturer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Manufacturer updated successfully"
      });

      onManufacturerUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating manufacturer:', error);
      toast({
        title: "Error",
        description: "Failed to update manufacturer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    console.log(`Input changed - ${field}:`, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('Updated form data:', newData);
      return newData;
    });
  };

  // Debug: Log current form data state
  console.log('Current form data state:', formData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Manufacturer</DialogTitle>
          <DialogDescription>
            Make changes to the manufacturer information before approval.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <strong>Debug Info:</strong> Form data: {JSON.stringify(formData, null, 2)}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              placeholder="Enter manufacturer name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@manufacturer.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.manufacturer.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Enter any additional notes"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPendingManufacturerDialog;
