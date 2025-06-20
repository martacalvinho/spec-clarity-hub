
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  model: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  manufacturer_name: z.string().optional(),
  manufacturer_id: z.string().optional(),
  reference_sku: z.string().optional(),
  dimensions: z.string().optional(),
  location: z.string().optional(),
  tag: z.string().optional(),
  notes: z.string().optional(),
});

interface EditPendingMaterialDialogProps {
  material: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMaterialUpdated: () => void;
  duplicates?: any[];
}

const EditPendingMaterialDialog = ({ 
  material, 
  open, 
  onOpenChange, 
  onMaterialUpdated,
  duplicates = []
}: EditPendingMaterialDialogProps) => {
  const { toast } = useToast();
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: material?.name || '',
      model: material?.model || '',
      category: material?.category || '',
      subcategory: material?.subcategory || '',
      manufacturer_name: material?.manufacturer_name || '',
      manufacturer_id: material?.manufacturer_id || '',
      reference_sku: material?.reference_sku || '',
      dimensions: material?.dimensions || '',
      location: material?.location || '',
      tag: material?.tag || '',
      notes: material?.notes || '',
    },
  });

  useEffect(() => {
    if (open && material?.studio_id) {
      fetchManufacturers();
      // Reset form when material changes
      form.reset({
        name: material?.name || '',
        model: material?.model || '',
        category: material?.category || '',
        subcategory: material?.subcategory || '',
        manufacturer_name: material?.manufacturer_name || '',
        manufacturer_id: material?.manufacturer_id || '',
        reference_sku: material?.reference_sku || '',
        dimensions: material?.dimensions || '',
        location: material?.location || '',
        tag: material?.tag || '',
        notes: material?.notes || '',
      });
    }
  }, [open, material, form]);

  const fetchManufacturers = async () => {
    if (!material?.studio_id) return;
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('studio_id', material.studio_id)
        .order('name');
      
      if (error) throw error;
      setManufacturers(data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!material?.id) return;
    
    try {
      setLoading(true);
      
      // Update the pending material
      const { error } = await supabase
        .from('pending_materials')
        .update({
          name: values.name,
          model: values.model || null,
          category: values.category,
          subcategory: values.subcategory || null,
          manufacturer_name: values.manufacturer_name || null,
          manufacturer_id: values.manufacturer_id || null,
          reference_sku: values.reference_sku || null,
          dimensions: values.dimensions || null,
          location: values.location || null,
          tag: values.tag || null,
          notes: values.notes || null,
        })
        .eq('id', material.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Material updated successfully",
      });

      onOpenChange(false);
      onMaterialUpdated();
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        title: "Error",
        description: "Failed to update material",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const linkToExistingMaterial = async (existingMaterialId: string) => {
    if (!material?.project_id) {
      toast({
        title: "Error",
        description: "No project specified for linking",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Check if already linked
      const { data: existingLink } = await supabase
        .from('proj_materials')
        .select('id')
        .eq('project_id', material.project_id)
        .eq('material_id', existingMaterialId)
        .eq('studio_id', material.studio_id)
        .single();

      if (existingLink) {
        toast({
          title: "Already linked",
          description: "This material is already linked to the project",
        });
        
        // Delete the pending material since it's already linked
        await supabase
          .from('pending_materials')
          .delete()
          .eq('id', material.id);

        onOpenChange(false);
        onMaterialUpdated();
        return;
      }

      // Create the link
      const { error: linkError } = await supabase
        .from('proj_materials')
        .insert({
          project_id: material.project_id,
          material_id: existingMaterialId,
          studio_id: material.studio_id,
          notes: material.tag ? `Tag: ${material.tag}` : null
        });

      if (linkError) throw linkError;

      // Delete the pending material
      const { error: deleteError } = await supabase
        .from('pending_materials')
        .delete()
        .eq('id', material.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "Material linked to project successfully",
      });

      onOpenChange(false);
      onMaterialUpdated();
    } catch (error) {
      console.error('Error linking material:', error);
      toast({
        title: "Error",
        description: "Failed to link material",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pending Material</DialogTitle>
        </DialogHeader>

        {duplicates.length > 0 && (
          <div className="mb-4 p-4 border rounded-lg bg-orange-50">
            <h4 className="font-semibold text-orange-800 mb-2">Duplicate Materials Found</h4>
            <p className="text-sm text-orange-700 mb-3">
              The following materials already exist in your database. You can link to an existing material instead of creating a new one:
            </p>
            {duplicates.map((duplicate) => (
              <div key={duplicate.id} className="flex items-center justify-between p-2 bg-white rounded border mb-2">
                <div>
                  <p className="font-medium">{duplicate.name}</p>
                  <p className="text-sm text-gray-600">
                    {duplicate.category} • {duplicate.manufacturer_name} • {duplicate.reference_sku}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => linkToExistingMaterial(duplicate.id)}
                  disabled={loading}
                >
                  Link to This
                </Button>
              </div>
            ))}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., NATURAL, RUSTICORK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Flooring, Wall Covering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Vinyl, Carpet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter manufacturer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Existing Manufacturer</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manufacturer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No manufacturer</SelectItem>
                        {manufacturers.map((manufacturer) => (
                          <SelectItem key={manufacturer.id} value={manufacturer.id}>
                            {manufacturer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference_sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference/SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Product reference or SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensions</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 12x24, 2m x 1m x 10mm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kitchen, Living Room" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium, Eco-friendly" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Material'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPendingMaterialDialog;
