
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Copy } from 'lucide-react';
import PdfDuplicateMaterialDetector from './PdfDuplicateMaterialDetector';

interface PdfJSONDataInputProps {
  studioId: string;
  submissionId: string;
  projectId?: string;
  clientId?: string;
  onImportComplete: () => void;
}

const TEMPLATE_MATERIALS = [
  {
    name: "White Oak Flooring",
    model: "NATURAL",
    category: "Flooring",
    subcategory: "Hardwood",
    tag: "Premium",
    location: "Living room",
    reference_sku: "WO-3-NAT",
    dimensions: "5\" x 3/4\" x RL",
    notes: "Available in 3 finishes"
  },
  {
    name: "Carrara Marble",
    model: "CLASSIC",
    category: "Stone", 
    subcategory: "Marble",
    tag: "Luxury",
    location: "Kitchen",
    reference_sku: "CAR-12-POL",
    dimensions: "12\" x 24\" x 3/4\"",
    notes: "Bookmatched slabs available"
  }
];

const TEMPLATE_MANUFACTURERS = [
  {
    name: "Premium Woods Co",
    contact_name: "John Smith",
    email: "john@premiumwoods.com",
    phone: "+1-555-0123",
    website: "premiumwoods.com",
    notes: "Lead time 4-6 weeks"
  },
  {
    name: "Stone Masters",
    contact_name: "Sarah Johnson", 
    email: "sarah@stonemasters.com",
    phone: "+1-555-0456",
    website: "stonemasters.com",
    notes: "Custom fabrication available"
  }
];

const PdfJSONDataInput = ({ studioId, submissionId, projectId, clientId, onImportComplete }: PdfJSONDataInputProps) => {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [dataType, setDataType] = useState<'materials' | 'manufacturers'>('materials');
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>('');
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [showDuplicateDetector, setShowDuplicateDetector] = useState(false);
  const [materialsToCheck, setMaterialsToCheck] = useState<any[]>([]);

  useEffect(() => {
    if (studioId && dataType === 'materials') {
      fetchManufacturers();
    }
  }, [studioId, dataType]);

  const fetchManufacturers = async () => {
    try {
      const { data } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');
      
      setManufacturers(data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const getTemplate = () => {
    switch (dataType) {
      case 'materials':
        return TEMPLATE_MATERIALS;
      case 'manufacturers':
        return TEMPLATE_MANUFACTURERS;
    }
  };

  const copyTemplate = () => {
    const templateString = JSON.stringify(getTemplate(), null, 2);
    setJsonInput(templateString);
    navigator.clipboard.writeText(templateString);
    toast({
      title: "Template copied",
      description: `${dataType} template has been copied to the input field and clipboard`,
    });
  };

  const flattenNestedJSON = (data: any): any[] => {
    // Handle nested structure like { "MANUFACTURER": [...] } or flat array
    if (Array.isArray(data)) {
      return data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const allItems: any[] = [];
      Object.keys(data).forEach(key => {
        const items = data[key];
        if (Array.isArray(items)) {
          // Add manufacturer info to each item if not present
          items.forEach(item => {
            if (!item.manufacturer_name && dataType === 'materials') {
              item.manufacturer_name = key;
            }
          });
          allItems.push(...items);
        }
      });
      return allItems;
    }
    
    return [];
  };

  const validateAndParseJSON = (jsonString: string) => {
    try {
      const rawData = JSON.parse(jsonString);
      const data = flattenNestedJSON(rawData);
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('JSON must contain an array of items or be a nested object with arrays');
      }

      if (dataType === 'materials') {
        data.forEach((item: any, index: number) => {
          if (!item.name || !item.category) {
            throw new Error(`Material at index ${index} must have name and category`);
          }
        });
      } else if (dataType === 'manufacturers') {
        data.forEach((item: any, index: number) => {
          if (!item.name) {
            throw new Error(`Manufacturer at index ${index} must have name`);
          }
        });
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleDuplicateResolution = async (results: any[]) => {
    console.log('=== HANDLE DUPLICATE RESOLUTION DEBUG ===');
    console.log('Results received:', results);
    console.log('Current projectId:', projectId);
    
    setImporting(true);
    let pendingCount = 0;
    let linkedCount = 0;
    let skippedCount = 0;

    try {
      // Get current user ID once
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      console.log('Current user ID:', currentUserId);

      for (const result of results) {
        console.log('Processing result:', result);
        
        if (result.action === 'create') {
          console.log('Creating pending material for:', result.materialToImport);
          
          // Create pending material for approval
          const pendingMaterial = {
            name: result.materialToImport.name,
            category: result.materialToImport.category,
            subcategory: result.materialToImport.subcategory || null,
            manufacturer_name: result.materialToImport.manufacturer_name || null,
            manufacturer_id: selectedManufacturerId === 'none' ? null : selectedManufacturerId,
            model: result.materialToImport.model || null,
            tag: result.materialToImport.tag || null,
            location: result.materialToImport.location || null,
            reference_sku: result.materialToImport.reference_sku || null,
            dimensions: result.materialToImport.dimensions || null,
            notes: result.materialToImport.notes || null,
            studio_id: studioId,
            submission_id: submissionId,
            project_id: projectId || null,
            client_id: clientId || null,
            created_by: currentUserId
          };

          console.log('Inserting pending material:', pendingMaterial);

          const { data: pendingData, error: pendingError } = await supabase
            .from('pending_materials')
            .insert([pendingMaterial])
            .select();

          if (pendingError) {
            console.error('Error inserting pending material:', pendingError);
            throw pendingError;
          }
          
          console.log('Successfully inserted pending material:', pendingData);
          pendingCount++;

        } else if (result.action === 'link' && result.selectedExistingId) {
          console.log('Linking existing material:', result.selectedExistingId, 'to project:', projectId);
          
          // Link existing material to project if projectId exists
          if (projectId) {
            // First, let's check what exists in the database currently
            const { data: currentLinks, error: checkError } = await supabase
              .from('proj_materials')
              .select('id, project_id, material_id')
              .eq('project_id', projectId)
              .eq('material_id', result.selectedExistingId)
              .eq('studio_id', studioId);

            console.log('Current links query result:', { currentLinks, checkError });

            if (checkError) {
              console.error('Error checking existing link:', checkError);
              throw checkError;
            }

            if (currentLinks && currentLinks.length > 0) {
              console.log(`Material ${result.selectedExistingId} already linked to project ${projectId}:`, currentLinks);
              console.log('Skipping link creation...');
              skippedCount++;
              continue;
            }

            // No existing link found, create the link
            console.log(`Creating new link: material ${result.selectedExistingId} to project ${projectId}`);
            const { data: linkData, error: projMaterialError } = await supabase
              .from('proj_materials')
              .insert([{
                project_id: projectId,
                material_id: result.selectedExistingId,
                studio_id: studioId,
                notes: result.materialToImport.tag ? `Tag: ${result.materialToImport.tag}` : null
              }])
              .select();

            if (projMaterialError) {
              console.error('Error linking material to project:', projMaterialError);
              throw projMaterialError;
            }
            
            console.log(`Successfully linked material ${result.selectedExistingId} to project ${projectId}:`, linkData);
            linkedCount++;
          } else {
            // No project ID, just count as linked for messaging
            console.log('No project ID provided, counting as linked');
            linkedCount++;
          }
        }
      }

      let message = '';
      if (pendingCount > 0) message += `Added ${pendingCount} materials to approval queue`;
      if (linkedCount > 0) {
        if (message) message += ' and ';
        message += `linked ${linkedCount} existing materials${projectId ? ' to project' : ''}`;
      }
      if (skippedCount > 0) {
        if (message) message += '. ';
        message += `${skippedCount} materials were already linked to this project`;
      }

      console.log('Final counts:', { pendingCount, linkedCount, skippedCount });
      console.log('Final message:', message);

      toast({
        title: "Import successful",
        description: message,
      });

      setJsonInput('');
      setSelectedManufacturerId('');
      setShowDuplicateDetector(false);
      setMaterialsToCheck([]);
      onImportComplete();

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import materials",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      console.log('=== END HANDLE DUPLICATE RESOLUTION DEBUG ===');
    }
  };

  const importData = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter JSON data to import",
        variant: "destructive",
      });
      return;
    }

    if (dataType === 'materials' && !selectedManufacturerId) {
      toast({
        title: "Error",
        description: "Please select a manufacturer for these materials",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = validateAndParseJSON(jsonInput);
      console.log('Parsed data:', data);

      if (dataType === 'materials') {
        // For materials, start duplicate detection process
        const validMaterials = data.filter((m: any) => m.name && m.name.trim() && m.category && m.category.trim());
        
        if (validMaterials.length === 0) {
          toast({
            title: "Error",
            description: "No valid materials found in the JSON data",
            variant: "destructive",
          });
          return;
        }

        console.log('Valid materials for duplicate check:', validMaterials);
        setMaterialsToCheck(validMaterials);
        setShowDuplicateDetector(true);
        return;
      }

      // For manufacturers, create pending entries directly
      setImporting(true);
      let pendingCount = 0;

      // Get current user ID once before mapping
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      const manufacturerInserts = data
        .filter((m: any) => m.name && m.name.trim())
        .map((m: any) => ({
          name: m.name,
          contact_name: m.contact_name || null,
          email: m.email || null,
          phone: m.phone || null,
          website: m.website || null,
          notes: m.notes || null,
          studio_id: studioId,
          submission_id: submissionId,
          created_by: currentUserId
        }));

      if (manufacturerInserts.length > 0) {
        const { data: pendingData, error: pendingError } = await supabase
          .from('pending_manufacturers')
          .insert(manufacturerInserts)
          .select();

        if (pendingError) throw pendingError;
        pendingCount = pendingData?.length || 0;
      }

      toast({
        title: "Import successful",
        description: `Added ${pendingCount} ${dataType} to approval queue`,
      });

      setJsonInput('');
      onImportComplete();

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data. Please check your JSON format.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  if (showDuplicateDetector) {
    return (
      <PdfDuplicateMaterialDetector
        materialsToImport={materialsToCheck}
        studioId={studioId}
        submissionId={submissionId}
        projectId={projectId}
        clientId={clientId}
        onResolutionComplete={handleDuplicateResolution}
        onCancel={() => {
          setShowDuplicateDetector(false);
          setMaterialsToCheck([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700">
            <strong>PDF Import Mode:</strong> All imported items will be added to your approval queue before being added to the main database.
          </p>
        </CardContent>
      </Card>

      {/* Data Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Data Type</CardTitle>
          <CardDescription>
            Choose what type of data you want to import from this PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={dataType} onValueChange={(value: 'materials' | 'manufacturers') => {
            setDataType(value);
            setJsonInput('');
            setSelectedManufacturerId('');
          }}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="manufacturers">Manufacturers</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Manufacturer Selection for Materials */}
      {dataType === 'materials' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Manufacturer</CardTitle>
            <CardDescription>
              Choose which manufacturer these materials belong to, or select "NONE" if no manufacturer is specified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedManufacturerId} onValueChange={setSelectedManufacturerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a manufacturer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">*NONE*</SelectItem>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              JSON Template for {dataType}
            </CardTitle>
            <CardDescription>
              Use this template format for your {dataType} data. You can also use nested format like {`{"MANUFACTURER_NAME": [...]}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(getTemplate(), null, 2)}
              </pre>
              <Button onClick={copyTemplate} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Template to Input
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>JSON Data Input</CardTitle>
            <CardDescription>
              Paste your {dataType} JSON data here following the template format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`Paste your ${dataType} JSON data here...`}
                className="min-h-96 font-mono text-sm"
              />
              <Button 
                onClick={importData} 
                disabled={importing || !jsonInput.trim() || (dataType === 'materials' && !selectedManufacturerId)}
                className="w-full bg-coral hover:bg-coral-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Processing...' : `Import ${dataType} for Approval`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PdfJSONDataInput;
