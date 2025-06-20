import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2 } from 'lucide-react';

interface MaterialRow {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  manufacturer_name: string;
  tag: string;
  location: string;
  reference_sku: string;
  dimensions: string;
  notes: string;
}

interface ManufacturerRow {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
}

interface ClientRow {
  id: string;
  name: string;
  notes: string;
}

interface MaterialsDataGridProps {
  studioId: string;
  projectId?: string;
}

const MATERIAL_CATEGORIES = [
  'Flooring', 'Surface', 'Tile', 'Stone', 'Wood', 'Metal', 'Glass', 'Fabric', 'Lighting', 'Hardware', 'Other'
];

const COMMON_TAGS = [
  'Sustainable', 'Premium', 'Fire-rated', 'Water-resistant', 'Low-maintenance', 'Custom', 'Standard', 'Luxury', 'Budget-friendly', 'Eco-friendly'
];

const COMMON_LOCATIONS = [
  'Kitchen', 'Bathroom', 'Living room', 'Bedroom', 'Exterior', 'Commercial', 'Office', 'Hallway', 'Entrance', 'Outdoor'
];

const MaterialsDataGrid = ({ studioId, projectId }: MaterialsDataGridProps) => {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [saving, setSaving] = useState(false);

  const addMaterialRow = () => {
    const newRow: MaterialRow = {
      id: `temp-${Date.now()}`,
      name: '',
      category: '',
      subcategory: '',
      manufacturer_name: '',
      tag: '',
      location: '',
      reference_sku: '',
      dimensions: '',
      notes: ''
    };
    setMaterials([...materials, newRow]);
  };

  const addManufacturerRow = () => {
    const newRow: ManufacturerRow = {
      id: `temp-${Date.now()}`,
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      website: '',
      notes: ''
    };
    setManufacturers([...manufacturers, newRow]);
  };

  const addClientRow = () => {
    const newRow: ClientRow = {
      id: `temp-${Date.now()}`,
      name: '',
      notes: ''
    };
    setClients([...clients, newRow]);
  };

  const updateMaterial = (id: string, field: keyof MaterialRow, value: string) => {
    setMaterials(materials.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const updateManufacturer = (id: string, field: keyof ManufacturerRow, value: string) => {
    setManufacturers(manufacturers.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const updateClient = (id: string, field: keyof ClientRow, value: string) => {
    setClients(clients.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(row => row.id !== id));
  };

  const removeManufacturer = (id: string) => {
    setManufacturers(manufacturers.filter(row => row.id !== id));
  };

  const removeClient = (id: string) => {
    setClients(clients.filter(row => row.id !== id));
  };

  const saveAllData = async () => {
    setSaving(true);
    try {
      // Save manufacturers first
      const manufacturerInserts = manufacturers
        .filter(m => m.name.trim())
        .map(m => ({
          name: m.name,
          contact_name: m.contact_name || null,
          email: m.email || null,
          phone: m.phone || null,
          website: m.website || null,
          notes: m.notes || null,
          studio_id: studioId
        }));

      let savedManufacturers: any[] = [];
      if (manufacturerInserts.length > 0) {
        const { data: manufacturerData, error: manufacturerError } = await supabase
          .from('manufacturers')
          .insert(manufacturerInserts)
          .select();

        if (manufacturerError) throw manufacturerError;
        savedManufacturers = manufacturerData || [];
      }

      // Save clients
      const clientInserts = clients
        .filter(c => c.name.trim())
        .map(c => ({
          name: c.name,
          notes: c.notes || null,
          studio_id: studioId
        }));

      if (clientInserts.length > 0) {
        const { error: clientError } = await supabase
          .from('clients')
          .insert(clientInserts);

        if (clientError) throw clientError;
      }

      // Save materials
      const materialInserts = materials
        .filter(m => m.name.trim() && m.category.trim())
        .map(m => {
          const manufacturer = savedManufacturers.find(sm => sm.name === m.manufacturer_name);
          return {
            name: m.name,
            category: m.category,
            subcategory: m.subcategory || null,
            manufacturer_id: manufacturer?.id || null,
            tag: m.tag === 'none' ? null : m.tag || null,
            location: m.location === 'none' ? null : m.location || null,
            reference_sku: m.reference_sku || null,
            dimensions: m.dimensions || null,
            notes: m.notes || null,
            studio_id: studioId
          };
        });

      let savedMaterials: any[] = [];
      if (materialInserts.length > 0) {
        const { data: materialData, error: materialError } = await supabase
          .from('materials')
          .insert(materialInserts)
          .select();

        if (materialError) throw materialError;
        savedMaterials = materialData || [];
      }

      // If a project is selected, link materials to the project
      if (projectId && savedMaterials.length > 0) {
        const projMaterialInserts = savedMaterials.map(material => ({
          project_id: projectId,
          material_id: material.id,
          studio_id: studioId
        }));

        const { error: projMaterialError } = await supabase
          .from('proj_materials')
          .insert(projMaterialInserts);

        if (projMaterialError) throw projMaterialError;
      }

      toast({
        title: "Success",
        description: `Imported ${materialInserts.length} materials, ${manufacturerInserts.length} manufacturers, and ${clientInserts.length} clients${projectId ? ' and linked to project' : ''}`,
      });

      // Clear the form
      setMaterials([]);
      setManufacturers([]);
      setClients([]);

    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "Failed to save data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Fill in the data below and click Save All to import to the database
          {projectId && (
            <span className="block text-blue-600">Materials will be automatically linked to the selected project</span>
          )}
        </p>
        <Button onClick={saveAllData} disabled={saving} className="bg-coral hover:bg-coral-600">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Data'}
        </Button>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
          <TabsTrigger value="manufacturers">Manufacturers ({manufacturers.length})</TabsTrigger>
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Materials</CardTitle>
                  <CardDescription>Add materials with their categories, tags, locations and manufacturers</CardDescription>
                </div>
                <Button onClick={addMaterialRow} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>Reference/SKU</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Manufacturer Name</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => updateMaterial(row.id, 'name', e.target.value)}
                            placeholder="Enter material name"
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={row.category} onValueChange={(value) => updateMaterial(row.id, 'category', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {MATERIAL_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.subcategory}
                            onChange={(e) => updateMaterial(row.id, 'subcategory', e.target.value)}
                            placeholder="Subcategory"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.reference_sku}
                            onChange={(e) => updateMaterial(row.id, 'reference_sku', e.target.value)}
                            placeholder="Reference/SKU"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.dimensions}
                            onChange={(e) => updateMaterial(row.id, 'dimensions', e.target.value)}
                            placeholder="Dimensions"
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={row.tag || 'none'} onValueChange={(value) => updateMaterial(row.id, 'tag', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tag" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No tag</SelectItem>
                              {COMMON_TAGS.map((tag) => (
                                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={row.location || 'none'} onValueChange={(value) => updateMaterial(row.id, 'location', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No location</SelectItem>
                              {COMMON_LOCATIONS.map((location) => (
                                <SelectItem key={location} value={location}>{location}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.manufacturer_name}
                            onChange={(e) => updateMaterial(row.id, 'manufacturer_name', e.target.value)}
                            placeholder="Manufacturer name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.notes}
                            onChange={(e) => updateMaterial(row.id, 'notes', e.target.value)}
                            placeholder="Notes"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {materials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No materials added yet. Click "Add Row" to start.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manufacturers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manufacturers</CardTitle>
                  <CardDescription>Add manufacturer contact information</CardDescription>
                </div>
                <Button onClick={addManufacturerRow} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Contact Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manufacturers.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => updateManufacturer(row.id, 'name', e.target.value)}
                            placeholder="Company name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.contact_name}
                            onChange={(e) => updateManufacturer(row.id, 'contact_name', e.target.value)}
                            placeholder="Contact person"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.email}
                            onChange={(e) => updateManufacturer(row.id, 'email', e.target.value)}
                            placeholder="email@company.com"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.phone}
                            onChange={(e) => updateManufacturer(row.id, 'phone', e.target.value)}
                            placeholder="Phone number"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.website}
                            onChange={(e) => updateManufacturer(row.id, 'website', e.target.value)}
                            placeholder="website.com"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.notes}
                            onChange={(e) => updateManufacturer(row.id, 'notes', e.target.value)}
                            placeholder="Notes"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeManufacturer(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {manufacturers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No manufacturers added yet. Click "Add Row" to start.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>Add client information</CardDescription>
                </div>
                <Button onClick={addClientRow} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => updateClient(row.id, 'name', e.target.value)}
                            placeholder="Client name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.notes}
                            onChange={(e) => updateClient(row.id, 'notes', e.target.value)}
                            placeholder="Notes"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeClient(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {clients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No clients added yet. Click "Add Row" to start.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaterialsDataGrid;
