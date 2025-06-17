
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [deleteType, setDeleteType] = useState<'move-to-not-used' | 'delete-from-projects' | 'delete-forever'>('move-to-not-used');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  const { user, studioId } = useAuth();
  const { toast } = useToast();

  const projectsUsingMaterial = material.proj_materials || [];

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  const handleDelete = async () => {
    if (!user || !studioId) return;

    setLoading(true);
    try {
      if (deleteType === 'delete-forever') {
        // Permanently delete the material
        const { error } = await supabase
          .from('materials')
          .delete()
          .eq('id', material.id);

        if (error) throw error;

        toast({
          title: "Material deleted permanently",
          description: "The material has been permanently deleted.",
        });
      } else if (deleteType === 'delete-from-projects') {
        // Remove from selected projects only
        if (selectedProjects.length === 0) {
          toast({
            title: "No projects selected",
            description: "Please select at least one project to remove the material from.",
            variant: "destructive",
          });
          return;
        }

        // Create considered materials entries for selected projects
        for (const projectId of selectedProjects) {
          const projMaterial = projectsUsingMaterial.find(pm => pm.project_id === projectId);
          if (projMaterial) {
            await supabase
              .from('considered_materials')
              .insert({
                studio_id: studioId,
                project_id: projectId,
                material_name: material.name,
                manufacturer_id: material.manufacturer_id,
                category: material.category,
                subcategory: material.subcategory,
                notes: notes || 'Material was removed from project',
                photo_url: material.photo_url,
                reference_sku: material.reference_sku,
                dimensions: material.dimensions,
                location: material.location,
                evaluated_by: user.id,
              });
          }
        }

        // Remove from proj_materials for selected projects
        const { error } = await supabase
          .from('proj_materials')
          .delete()
          .eq('material_id', material.id)
          .in('project_id', selectedProjects);

        if (error) throw error;

        toast({
          title: "Material removed from selected projects",
          description: `The material has been removed from ${selectedProjects.length} project(s).`,
        });
      } else {
        // Move to not used (existing functionality)
        if (projectsUsingMaterial.length > 0) {
          for (const projMaterial of projectsUsingMaterial) {
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

          await supabase
            .from('proj_materials')
            .delete()
            .eq('material_id', material.id);
        } else {
          await supabase
            .from('considered_materials')
            .insert({
              studio_id: studioId,
              project_id: null,
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

        const { error } = await supabase
          .from('materials')
          .delete()
          .eq('id', material.id);

        if (error) throw error;

        toast({
          title: "Material moved to not used",
          description: "The material has been moved to the not used list.",
        });
      }

      setOpen(false);
      setNotes('');
      setSelectedProjects([]);
      
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

  const getButtonText = () => {
    switch (deleteType) {
      case 'delete-forever':
        return loading ? "Deleting..." : "Delete Forever";
      case 'delete-from-projects':
        return loading ? "Removing..." : "Remove from Projects";
      default:
        return loading ? "Moving..." : "Move to Not Used";
    }
  };

  const getButtonColor = () => {
    return deleteType === 'delete-forever' 
      ? "bg-red-600 hover:bg-red-700 text-white" 
      : "bg-orange-600 hover:bg-orange-700 text-white";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Material: {material.name}</DialogTitle>
          <DialogDescription>
            Choose how you want to handle this material deletion.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Deletion Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Deletion Options</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="move-to-not-used"
                  name="deleteType"
                  value="move-to-not-used"
                  checked={deleteType === 'move-to-not-used'}
                  onChange={(e) => setDeleteType(e.target.value as any)}
                />
                <Label htmlFor="move-to-not-used" className="text-sm">
                  Move to "Not Used" list (keeps material for reference)
                </Label>
              </div>
              
              {projectsUsingMaterial.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="delete-from-projects"
                    name="deleteType"
                    value="delete-from-projects"
                    checked={deleteType === 'delete-from-projects'}
                    onChange={(e) => setDeleteType(e.target.value as any)}
                  />
                  <Label htmlFor="delete-from-projects" className="text-sm">
                    Remove from specific projects only
                  </Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="delete-forever"
                  name="deleteType"
                  value="delete-forever"
                  checked={deleteType === 'delete-forever'}
                  onChange={(e) => setDeleteType(e.target.value as any)}
                />
                <Label htmlFor="delete-forever" className="text-sm text-red-600">
                  Delete permanently (cannot be undone)
                </Label>
              </div>
            </div>
          </div>

          {/* Project Selection (when deleting from specific projects) */}
          {deleteType === 'delete-from-projects' && projectsUsingMaterial.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Projects to Remove From:</Label>
              <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
                {projectsUsingMaterial.map((projMaterial) => (
                  <div key={projMaterial.project_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${projMaterial.project_id}`}
                      checked={selectedProjects.includes(projMaterial.project_id)}
                      onCheckedChange={(checked) => 
                        handleProjectSelection(projMaterial.project_id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`project-${projMaterial.project_id}`}
                      className="text-sm cursor-pointer"
                    >
                      {projMaterial.projects?.name || 'Unknown Project'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <Label htmlFor="notes">
              Reason for {deleteType === 'delete-forever' ? 'deletion' : 'removal'} (optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Why is this material being ${deleteType === 'delete-forever' ? 'deleted' : 'removed'}?`}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={loading || (deleteType === 'delete-from-projects' && selectedProjects.length === 0)}
              className={getButtonColor()}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMaterialForm;
