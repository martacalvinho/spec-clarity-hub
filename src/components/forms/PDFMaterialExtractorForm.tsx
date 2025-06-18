
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Check, X, Eye, Download } from 'lucide-react';

interface Material {
  name: string;
  tag?: string;
  manufacturer_name?: string;
  category: string;
  subcategory?: string;
  location?: string;
  reference_model_sku?: string;
  dimensions?: string;
  notes?: string;
  selected?: boolean;
}

interface ManufacturerGroup {
  manufacturer_name: string;
  materials: Material[];
  selected?: boolean;
}

interface PDFMaterialExtractorFormProps {
  onMaterialsAdded?: () => void;
}

const PDFMaterialExtractorForm = ({ onMaterialsAdded }: PDFMaterialExtractorFormProps) => {
  const { studioId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractedData, setExtractedData] = useState<ManufacturerGroup[]>([]);
  const [step, setStep] = useState<'upload' | 'review' | 'complete'>('upload');

  const fetchProjectsAndClients = async () => {
    if (!studioId) return;

    try {
      const [projectsRes, clientsRes] = await Promise.all([
        supabase.from('projects').select('id, name').eq('studio_id', studioId).order('name'),
        supabase.from('clients').select('id, name').eq('studio_id', studioId).order('name')
      ]);

      setProjects(projectsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching projects/clients:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const extractMaterials = async () => {
    if (!file || !studioId) return;

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studioId', studioId);
      if (projectId && projectId !== 'none') formData.append('projectId', projectId);
      if (clientId && clientId !== 'none') formData.append('clientId', clientId);

      const response = await fetch('/api/extract-materials-from-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract materials');
      }

      const result = await response.json();
      
      // Initialize all materials as selected
      const dataWithSelection = result.extractedMaterials.map((group: ManufacturerGroup) => ({
        ...group,
        selected: true,
        materials: group.materials.map((material: Material) => ({
          ...material,
          selected: true
        }))
      }));

      setExtractedData(dataWithSelection);
      setStep('review');

      toast({
        title: "Materials extracted",
        description: `Found ${result.totalMaterials} materials from ${result.extractedMaterials.length} manufacturers`,
      });

    } catch (error) {
      console.error('Error extracting materials:', error);
      toast({
        title: "Extraction failed",
        description: "Failed to extract materials from PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  const toggleManufacturerSelection = (manufacturerIndex: number) => {
    setExtractedData(prev => {
      const updated = [...prev];
      const isSelected = !updated[manufacturerIndex].selected;
      updated[manufacturerIndex].selected = isSelected;
      updated[manufacturerIndex].materials = updated[manufacturerIndex].materials.map(m => ({
        ...m,
        selected: isSelected
      }));
      return updated;
    });
  };

  const toggleMaterialSelection = (manufacturerIndex: number, materialIndex: number) => {
    setExtractedData(prev => {
      const updated = [...prev];
      updated[manufacturerIndex].materials[materialIndex].selected = 
        !updated[manufacturerIndex].materials[materialIndex].selected;
      
      // Update manufacturer selection based on materials
      const allSelected = updated[manufacturerIndex].materials.every(m => m.selected);
      const noneSelected = updated[manufacturerIndex].materials.every(m => !m.selected);
      updated[manufacturerIndex].selected = allSelected ? true : noneSelected ? false : undefined;
      
      return updated;
    });
  };

  const getSelectedCount = () => {
    return extractedData.reduce((total, group) => 
      total + group.materials.filter(m => m.selected).length, 0
    );
  };

  const importSelectedMaterials = async () => {
    if (!studioId) return;

    setImporting(true);
    try {
      const selectedMaterials = extractedData.flatMap(group => 
        group.materials.filter(m => m.selected)
      );

      // First, create any missing manufacturers
      const manufacturerMap = new Map();
      for (const material of selectedMaterials) {
        if (material.manufacturer_name && !manufacturerMap.has(material.manufacturer_name)) {
          // Check if manufacturer exists
          const { data: existingManufacturer } = await supabase
            .from('manufacturers')
            .select('id')
            .eq('studio_id', studioId)
            .eq('name', material.manufacturer_name)
            .maybeSingle();

          if (existingManufacturer) {
            manufacturerMap.set(material.manufacturer_name, existingManufacturer.id);
          } else {
            // Create new manufacturer
            const { data: newManufacturer } = await supabase
              .from('manufacturers')
              .insert({
                name: material.manufacturer_name,
                studio_id: studioId
              })
              .select('id')
              .single();

            if (newManufacturer) {
              manufacturerMap.set(material.manufacturer_name, newManufacturer.id);
            }
          }
        }
      }

      // Now create materials
      let createdCount = 0;
      for (const material of selectedMaterials) {
        const manufacturerId = material.manufacturer_name ? 
          manufacturerMap.get(material.manufacturer_name) : null;

        const { data: createdMaterial, error } = await supabase
          .from('materials')
          .insert({
            name: material.name,
            category: material.category,
            subcategory: material.subcategory || null,
            tag: material.tag || null,
            location: material.location || null,
            reference_sku: material.reference_model_sku || null,
            dimensions: material.dimensions || null,
            notes: material.notes || null,
            manufacturer_id: manufacturerId,
            studio_id: studioId
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating material:', error);
          continue;
        }

        // Link to project if specified
        if (projectId && projectId !== 'none' && createdMaterial) {
          await supabase
            .from('proj_materials')
            .insert({
              project_id: projectId,
              material_id: createdMaterial.id,
              studio_id: studioId
            });
        }

        createdCount++;
      }

      toast({
        title: "Materials imported",
        description: `Successfully imported ${createdCount} materials${projectId && projectId !== 'none' ? ' and linked to project' : ''}`,
      });

      setStep('complete');
      if (onMaterialsAdded) {
        onMaterialsAdded();
      }

    } catch (error) {
      console.error('Error importing materials:', error);
      toast({
        title: "Import failed",
        description: "Failed to import materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setProjectId('');
    setClientId('');
    setExtractedData([]);
    setStep('upload');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-coral hover:bg-coral-600 text-white"
          onClick={fetchProjectsAndClients}
        >
          <Upload className="h-4 w-4 mr-2" />
          Extract from PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Upload Material Schedule PDF'}
            {step === 'review' && 'Review Extracted Materials'}
            {step === 'complete' && 'Import Complete'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a PDF containing a material schedule and let AI extract all materials automatically'}
            {step === 'review' && 'Review and select which materials to import into your library'}
            {step === 'complete' && 'Your materials have been successfully imported'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pdf-upload">PDF File</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {file.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="project">Link to Project (Optional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client">Link to Client (Optional)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={extractMaterials} 
                disabled={!file || extracting}
                className="bg-coral hover:bg-coral-600"
              >
                {extracting ? 'Extracting...' : 'Extract Materials'}
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Select the materials you want to import. {getSelectedCount()} of {extractedData.reduce((sum, g) => sum + g.materials.length, 0)} materials selected.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setExtractedData(prev => prev.map(g => ({
                      ...g,
                      selected: true,
                      materials: g.materials.map(m => ({ ...m, selected: true }))
                    })));
                  }}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setExtractedData(prev => prev.map(g => ({
                      ...g,
                      selected: false,
                      materials: g.materials.map(m => ({ ...m, selected: false }))
                    })));
                  }}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-4">
              {extractedData.map((group, groupIndex) => (
                <Card key={groupIndex}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={group.selected === true}
                          onCheckedChange={() => toggleManufacturerSelection(groupIndex)}
                          className="data-[state=checked]:bg-coral data-[state=checked]:border-coral"
                        />
                        <CardTitle className="text-lg">{group.manufacturer_name}</CardTitle>
                        <Badge variant="secondary">{group.materials.length} materials</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.materials.map((material, materialIndex) => (
                      <div key={materialIndex} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                        <Checkbox
                          checked={material.selected || false}
                          onCheckedChange={() => toggleMaterialSelection(groupIndex, materialIndex)}
                          className="mt-1 data-[state=checked]:bg-coral data-[state=checked]:border-coral"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{material.name}</h4>
                            {material.tag && <Badge variant="outline" className="text-xs">{material.tag}</Badge>}
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                            <span><strong>Category:</strong> {material.category}</span>
                            {material.subcategory && <span><strong>Subcategory:</strong> {material.subcategory}</span>}
                            {material.location && <span><strong>Location:</strong> {material.location}</span>}
                            {material.reference_model_sku && <span><strong>SKU:</strong> {material.reference_model_sku}</span>}
                            {material.dimensions && <span><strong>Dimensions:</strong> {material.dimensions}</span>}
                          </div>
                          {material.notes && (
                            <p className="text-xs text-gray-500 mt-1">{material.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={importSelectedMaterials}
                disabled={getSelectedCount() === 0 || importing}
                className="bg-coral hover:bg-coral-600"
              >
                {importing ? 'Importing...' : `Import ${getSelectedCount()} Materials`}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Materials Imported Successfully!</h3>
              <p className="text-gray-600">All selected materials have been added to your library.</p>
            </div>
            <Button onClick={resetForm} className="bg-coral hover:bg-coral-600">
              Import Another PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFMaterialExtractorForm;
