
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload } from 'lucide-react';

interface AddConsideredMaterialFormProps {
  projectId?: string;
  onMaterialAdded: () => void;
  manufacturers: any[];
  materials: any[];
}

const AddConsideredMaterialForm = ({ projectId, onMaterialAdded, manufacturers, materials }: AddConsideredMaterialFormProps) => {
  const { studioId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `considered-${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('material-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('material-photos')
        .getPublicUrl(filePath);

      setPhotoUrl(publicUrl);
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (!studioId) throw new Error('No studio ID found');

      const { error } = await supabase
        .from('considered_materials')
        .insert({
          studio_id: studioId,
          project_id: data.project_id,
          material_name: data.material_name,
          manufacturer_id: data.manufacturer_id || null,
          category: data.category,
          subcategory: data.subcategory || null,
          notes: data.notes || null,
          selected_material_id: data.selected_material_id || null,
          photo_url: photoUrl,
          reference_sku: data.reference_sku || null,
          dimensions: data.dimensions || null,
          location: data.location || null,
          evaluated_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Considered material added successfully",
      });

      reset();
      setPhotoUrl(null);
      setOpen(false);
      onMaterialAdded();
    } catch (error) {
      console.error('Error adding considered material:', error);
      toast({
        title: "Error",
        description: "Failed to add considered material. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-coral hover:bg-coral-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Considered Material
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Considered Material</DialogTitle>
          <DialogDescription>
            Track materials that were evaluated but not selected for this project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material_name">Material Name *</Label>
              <Input
                id="material_name"
                {...register('material_name', { required: true })}
                placeholder="Enter material name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                {...register('category', { required: true })}
                placeholder="e.g., Flooring, Lighting"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                {...register('subcategory')}
                placeholder="e.g., Carpet tiles, LED strips"
              />
            </div>
            <div>
              <Label htmlFor="manufacturer_id">Manufacturer</Label>
              <Select onValueChange={(value) => setValue('manufacturer_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference_sku">Reference SKU</Label>
              <Input
                id="reference_sku"
                {...register('reference_sku')}
                placeholder="Product reference number"
              />
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                {...register('dimensions')}
                placeholder="e.g., 600x600x15mm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Where this material was sourced or stored"
            />
          </div>

          <div>
            <Label htmlFor="selected_material_id">What was chosen instead?</Label>
            <Select onValueChange={(value) => setValue('selected_material_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select the material that was chosen" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Why wasn't this chosen?</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Explain why this material wasn't selected..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="photo">Material Photo</Label>
            <div className="flex items-center gap-4">
              {photoUrl && (
                <img src={photoUrl} alt="Material" className="w-20 h-20 object-cover rounded border" />
              )}
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="pointer-events-none"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </div>
            </div>
          </div>

          <input type="hidden" {...register('project_id')} value={projectId} />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-coral hover:bg-coral-600">
              Add Considered Material
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddConsideredMaterialForm;
