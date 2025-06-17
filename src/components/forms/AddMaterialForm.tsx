import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMaterialLimits } from '@/hooks/useMaterialLimits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MaterialLimitDialog from '@/components/dialogs/MaterialLimitDialog';

const categories = [
  'Flooring', 'Lighting', 'Furniture', 'Textiles', 'Art & Accessories', 
  'Window Treatments', 'Wall Finishes', 'Plumbing', 'Hardware', 'Other'
];

interface AddMaterialFormProps {
  onMaterialAdded?: () => void;
}

const AddMaterialForm = ({ onMaterialAdded }: AddMaterialFormProps) => {
  const [open, setOpen] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tag, setTag] = useState('');
  const [location, setLocation] = useState('');
  const [referenceSku, setReferenceSku] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [notes, setNotes] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [includePhoto, setIncludePhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  
  // Options for dropdowns
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const { user, studioId } = useAuth();
  const { canAddMaterial, checkAndHandleMaterialLimit, incrementMaterialCount } = useMaterialLimits();
  const { toast } = useToast();

  useEffect(() => {
    if (studioId && open) {
      fetchManufacturers();
      fetchProjects();
    }
  }, [studioId, open]);

  const fetchManufacturers = async () => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (error) throw error;
      setManufacturers(data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          name,
          clients(name)
        `)
        .eq('studio_id', studioId)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const uploadPhoto = async (materialId: string): Promise<string | null> => {
    if (!photoFile) return null;

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${materialId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('material-photos')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('material-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check material limits first
    const canProceed = await checkAndHandleMaterialLimit();
    if (!canProceed) {
      setPendingSubmit(true);
      setLimitDialogOpen(true);
      return;
    }

    await submitMaterial();
  };

  const submitMaterial = async () => {
    if (!user || !studioId) return;

    setLoading(true);
    try {
      // Create material first
      const { data: materialData, error: materialError } = await supabase
        .from('materials')
        .insert({
          name,
          category,
          subcategory: subcategory || null,
          tag: tag || null,
          location: location || null,
          reference_sku: referenceSku || null,
          dimensions: dimensions || null,
          notes: notes || null,
          manufacturer_id: manufacturerId || null,
          studio_id: studioId,
        })
        .select()
        .single();

      if (materialError) throw materialError;

      // Upload photo if included
      let photoUrl = null;
      if (includePhoto && photoFile) {
        photoUrl = await uploadPhoto(materialData.id);
        if (photoUrl) {
          await supabase
            .from('materials')
            .update({ photo_url: photoUrl })
            .eq('id', materialData.id);
        }
      }

      // Add to project if selected
      if (projectId) {
        await supabase
          .from('proj_materials')
          .insert({
            project_id: projectId,
            material_id: materialData.id,
            studio_id: studioId,
          });
      }

      // Increment material count after successful creation
      await incrementMaterialCount();

      toast({
        title: "Material added",
        description: "Your material has been added to the library.",
      });

      // Reset form
      setName('');
      setCategory('');
      setSubcategory('');
      setTag('');
      setLocation('');
      setReferenceSku('');
      setDimensions('');
      setNotes('');
      setManufacturerId('');
      setProjectId('');
      setIncludePhoto(false);
      setPhotoFile(null);
      setOpen(false);
      setPendingSubmit(false);
      
      if (onMaterialAdded) {
        onMaterialAdded();
      }
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: "Error",
        description: "Failed to add material. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLimitDialogConfirm = () => {
    if (pendingSubmit) {
      submitMaterial();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            className="bg-coral hover:bg-coral-dark text-white"
            disabled={!canAddMaterial}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Material</DialogTitle>
            <DialogDescription>
              Add a new material to your library.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Material Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter material name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g., Hardwood, Ceramic, etc."
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Select value={manufacturerId} onValueChange={setManufacturerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manufacturer</SelectItem>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} {project.clients?.name && `(${project.clients.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tag">Tag</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g., Sustainable, Budget-friendly"
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Storage location or showroom"
              />
            </div>
            
            <div>
              <Label htmlFor="referenceSku">Reference SKU</Label>
              <Input
                id="referenceSku"
                value={referenceSku}
                onChange={(e) => setReferenceSku(e.target.value)}
                placeholder="Product SKU or code"
              />
            </div>
            
            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g., 12x12 inches, 2x4 feet"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includePhoto" 
                checked={includePhoto}
                onCheckedChange={(checked) => setIncludePhoto(checked === true)}
              />
              <Label htmlFor="includePhoto">Add photo</Label>
            </div>

            {includePhoto && (
              <div>
                <Label htmlFor="photo">Material Photo</Label>
                <div className="relative">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {photoFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selected: {photoFile.name}
                  </p>
                )}
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this material"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Material"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MaterialLimitDialog
        open={limitDialogOpen}
        onOpenChange={setLimitDialogOpen}
        onConfirm={handleLimitDialogConfirm}
      />
    </>
  );
};

export default AddMaterialForm;
