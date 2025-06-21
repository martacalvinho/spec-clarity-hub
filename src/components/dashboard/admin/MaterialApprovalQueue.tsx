import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Package, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const MaterialApprovalQueue = () => {
  const { toast } = useToast();
  const [pendingMaterials, setPendingMaterials] = useState<any[]>([]);
  const [pendingManufacturers, setPendingManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      setLoading(true);
      
      console.log('=== ADMIN QUEUE DEBUG ===');
      
      // Fetch pending materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('pending_materials')
        .select(`
          *,
          pdf_submissions!pending_materials_submission_id_fkey(file_name, created_at)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (materialsError) {
        console.error('Materials error:', materialsError);
        // Try simpler query
        const { data: simpleMaterials } = await supabase
          .from('pending_materials')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setPendingMaterials(simpleMaterials || []);
      } else {
        setPendingMaterials(materialsData || []);
      }

      // First check if there are any pending manufacturers at all
      const { data: allManufacturers, error: allManError } = await supabase
        .from('pending_manufacturers')
        .select('*');

      console.log('All pending manufacturers:', allManufacturers);
      console.log('All manufacturers error:', allManError);

      // Fetch pending manufacturers with join
      const { data: manufacturersData, error: manufacturersError } = await supabase
        .from('pending_manufacturers')
        .select(`
          *,
          pdf_submissions!pending_manufacturers_submission_id_fkey(file_name, created_at)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Manufacturers with join:', manufacturersData);
      console.log('Manufacturers join error:', manufacturersError);

      if (manufacturersError) {
        console.error('Manufacturers join error:', manufacturersError);
        // Try simpler query without join
        const { data: simpleManufacturers, error: simpleError } = await supabase
          .from('pending_manufacturers')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        console.log('Simple manufacturers query:', simpleManufacturers);
        console.log('Simple manufacturers error:', simpleError);
        
        setPendingManufacturers(simpleManufacturers || []);
      } else {
        setPendingManufacturers(manufacturersData || []);
      }

      console.log('=== END ADMIN QUEUE DEBUG ===');
    } catch (error) {
      console.error('Error fetching pending items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveMaterial = async (materialId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user found');
      }

      // Get the pending material
      const { data: pendingMaterial, error: fetchError } = await supabase
        .from('pending_materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (fetchError) throw fetchError;
      if (!pendingMaterial) throw new Error('Material not found');

      // Update status to approved
      const { error: updateError } = await supabase
        .from('pending_materials')
        .update({
          status: 'approved',
          approved_by: currentUserId,
          approved_at: new Date().toISOString()
        })
        .eq('id', materialId);

      if (updateError) throw updateError;

      // Create the material in the main table
      const materialData = {
        name: pendingMaterial.name,
        category: pendingMaterial.category,
        subcategory: pendingMaterial.subcategory,
        manufacturer_id: pendingMaterial.manufacturer_id,
        model: pendingMaterial.model,
        tag: pendingMaterial.tag,
        location: pendingMaterial.location,
        reference_sku: pendingMaterial.reference_sku,
        dimensions: pendingMaterial.dimensions,
        notes: pendingMaterial.notes,
        studio_id: pendingMaterial.studio_id,
        created_by: currentUserId
      };

      const { data: newMaterial, error: insertError } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Link to project if project_id exists
      if (pendingMaterial.project_id && newMaterial) {
        const { error: linkError } = await supabase
          .from('proj_materials')
          .insert({
            project_id: pendingMaterial.project_id,
            material_id: newMaterial.id,
            studio_id: pendingMaterial.studio_id
          });

        if (linkError) {
          console.error('Error linking material to project:', linkError);
        }
      }

      toast({
        title: "Success",
        description: "Material approved and added to materials library"
      });

      fetchPendingItems();
    } catch (error) {
      console.error('Error approving material:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve material",
        variant: "destructive"
      });
    }
  };

  const approveManufacturer = async (manufacturerId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user found');
      }

      // Get the pending manufacturer
      const { data: pendingManufacturer, error: fetchError } = await supabase
        .from('pending_manufacturers')
        .select('*')
        .eq('id', manufacturerId)
        .single();

      if (fetchError) throw fetchError;
      if (!pendingManufacturer) throw new Error('Manufacturer not found');

      // Update status to approved
      const { error: updateError } = await supabase
        .from('pending_manufacturers')
        .update({
          status: 'approved',
          approved_by: currentUserId,
          approved_at: new Date().toISOString()
        })
        .eq('id', manufacturerId);

      if (updateError) throw updateError;

      // Create the manufacturer in the main table
      const manufacturerData = {
        name: pendingManufacturer.name,
        contact_name: pendingManufacturer.contact_name,
        email: pendingManufacturer.email,
        phone: pendingManufacturer.phone,
        website: pendingManufacturer.website,
        notes: pendingManufacturer.notes,
        studio_id: pendingManufacturer.studio_id
      };

      const { error: insertError } = await supabase
        .from('manufacturers')
        .insert([manufacturerData]);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Manufacturer approved and added to manufacturers library"
      });

      fetchPendingItems();
    } catch (error) {
      console.error('Error approving manufacturer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve manufacturer",
        variant: "destructive"
      });
    }
  };

  const rejectItem = async (itemId: string, itemType: 'material' | 'manufacturer') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user found');
      }

      const tableName = itemType === 'material' ? 'pending_materials' : 'pending_manufacturers';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          status: 'rejected',
          rejected_by: currentUserId,
          rejected_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} rejected`
      });

      fetchPendingItems();
    } catch (error) {
      console.error(`Error rejecting ${itemType}:`, error);
      toast({
        title: "Error",
        description: `Failed to reject ${itemType}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading approval queue...</div>
        </CardContent>
      </Card>
    );
  }

  const totalPendingCount = pendingMaterials.length + pendingManufacturers.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Approval Queue Overview</CardTitle>
          <CardDescription>
            Items awaiting approval from PDF submissions across all studios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{totalPendingCount}</div>
              <div className="text-sm text-yellow-700">Total Pending</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{pendingMaterials.length}</div>
              <div className="text-sm text-blue-700">Materials</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{pendingManufacturers.length}</div>
              <div className="text-sm text-green-700">Manufacturers</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Debug:</strong> Found {pendingManufacturers.length} pending manufacturers
            </p>
            <p className="text-xs text-blue-600">Check browser console for detailed information</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Materials ({pendingMaterials.length})</TabsTrigger>
          <TabsTrigger value="manufacturers">Manufacturers ({pendingManufacturers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Pending Materials</CardTitle>
              <CardDescription>Review and approve materials from PDF submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingMaterials.map((material) => (
                  <div key={material.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{material.name}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Studio:</span>
                              <p className="text-gray-600">{material.studios?.name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Category:</span>
                              <p className="text-gray-600">{material.category}</p>
                            </div>
                            {material.manufacturer_name && (
                              <div>
                                <span className="font-medium text-gray-700">Manufacturer:</span>
                                <p className="text-gray-600">{material.manufacturer_name}</p>
                              </div>
                            )}
                            {material.reference_sku && (
                              <div>
                                <span className="font-medium text-gray-700">SKU:</span>
                                <p className="text-gray-600">{material.reference_sku}</p>
                              </div>
                            )}
                          </div>
                          {material.notes && (
                            <div className="mt-2">
                              <span className="font-medium text-gray-700">Notes:</span>
                              <p className="text-gray-600 text-sm">{material.notes}</p>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            From PDF: {material.pdf_submissions?.file_name} • 
                            Created on {format(new Date(material.created_at), 'PPP')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => approveMaterial(material.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => rejectItem(material.id, 'material')}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingMaterials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No materials pending approval at this time.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manufacturers">
          <Card>
            <CardHeader>
              <CardTitle>Pending Manufacturers</CardTitle>
              <CardDescription>Review and approve manufacturers from PDF submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingManufacturers.map((manufacturer) => (
                  <div key={manufacturer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Building className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{manufacturer.name}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                            {manufacturer.contact_name && (
                              <div>
                                <span className="font-medium text-gray-700">Contact:</span>
                                <p className="text-gray-600">{manufacturer.contact_name}</p>
                              </div>
                            )}
                            {manufacturer.email && (
                              <div>
                                <span className="font-medium text-gray-700">Email:</span>
                                <p className="text-gray-600">{manufacturer.email}</p>
                              </div>
                            )}
                            {manufacturer.phone && (
                              <div>
                                <span className="font-medium text-gray-700">Phone:</span>
                                <p className="text-gray-600">{manufacturer.phone}</p>
                              </div>
                            )}
                            {manufacturer.website && (
                              <div>
                                <span className="font-medium text-gray-700">Website:</span>
                                <p className="text-gray-600">{manufacturer.website}</p>
                              </div>
                            )}
                          </div>
                          {manufacturer.notes && (
                            <div className="mt-2">
                              <span className="font-medium text-gray-700">Notes:</span>
                              <p className="text-gray-600 text-sm">{manufacturer.notes}</p>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            {manufacturer.pdf_submissions?.file_name ? (
                              <>From PDF: {manufacturer.pdf_submissions.file_name} • </>
                            ) : (
                              'No PDF info • '
                            )}
                            Created on {format(new Date(manufacturer.created_at), 'PPP')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => approveManufacturer(manufacturer.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => rejectItem(manufacturer.id, 'manufacturer')}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingManufacturers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No manufacturers pending approval at this time.
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

export default MaterialApprovalQueue;
