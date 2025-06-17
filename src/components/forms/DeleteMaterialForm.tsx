
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteMaterialFormProps {
  material: any;
  onMaterialDeleted?: () => void;
}

const DeleteMaterialForm = ({ material, onMaterialDeleted }: DeleteMaterialFormProps) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, studioId } = useAuth();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user || !studioId) return;

    setLoading(true);
    try {
      // Move material to considered_materials (not used)
      // First, check if this material is used in any projects
      const { data: projectMaterials } = await supabase
        .from('proj_materials')
        .select('project_id, projects(name)')
        .eq('material_id', material.id);

      // If used in projects, create considered materials entries for each project
      if (projectMaterials && projectMaterials.length > 0) {
        for (const projMaterial of projectMaterials) {
          await supabase
            .from('considered_materials')
            .insert({
              studio_id: studioId,
              project_id: projMaterial.project_id,
              material_name: material.name,
              manufacturer_id: material.manufacturer_id,
              category: material.category,
              subcategory: material.subcategory,
              notes: notes || 'Material was removed from materials library',
              photo_url: material.photo_url,
              reference_sku: material.reference_sku,
              dimensions: material.dimensions,
              location: material.location,
              evaluated_by: user.id,
            });
        }

        // Remove from proj_materials
        await supabase
          .from('proj_materials')
          .delete()
          .eq('material_id', material.id);
      } else {
        // If not used in any projects, create a general considered material entry
        await supabase
          .from('considered_materials')
          .insert({
            studio_id: studioId,
            project_id: null, // Will need to handle this case in the query
            material_name: material.name,
            manufacturer_id: material.manufacturer_id,
            category: material.category,
            subcategory: material.subcategory,
            notes: notes || 'Material was considered but removed from library',
            photo_url: material.photo_url,
            reference_sku: material.reference_sku,
            dimensions: material.dimensions,
            location: material.location,
            evaluated_by: user.id,
          });
      }

      // Delete the material
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;

      toast({
        title: "Material moved to not used",
        description: "The material has been moved to the not used list.",
      });

      setOpen(false);
      setNotes('');
      
      if (onMaterialDeleted) {
        onMaterialDeleted();
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "Failed to delete material. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Material to Not Used</DialogTitle>
          <DialogDescription>
            This will move "{material.name}" to the not used materials list. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Reason for removal (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why is this material being removed?"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Moving..." : "Move to Not Used"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMaterialForm;
