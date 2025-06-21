import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Trash2, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PendingMaterialCard from '@/components/onboarding/PendingMaterialCard';
import EditPendingMaterialDialog from '@/components/onboarding/EditPendingMaterialDialog';
import EditPendingManufacturerDialog from '@/components/onboarding/EditPendingManufacturerDialog';
import MaterialFilters from '@/components/onboarding/MaterialFilters';

const UploadDocuments = () => {
  const { userProfile, studioId } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);
  const [approvedMaterials, setApprovedMaterials] = useState<any[]>([]);
  const [pendingApproval, setPendingApproval] = useState<any[]>([]);
  const [pendingManufacturers, setPendingManufacturers] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDuplicates, setEditingDuplicates] = useState<any[]>([]);
  const [editingManufacturer, setEditingManufacturer] = useState<any>(null);
  const [editManufacturerDialogOpen, setEditManufacturerDialogOpen] = useState(false);

  // Add filter states
  const [filterProject, setFilterProject] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterPdf, setFilterPdf] = useState('');

  useEffect(() => {
    if (studioId) {
      fetchProjects();
      fetchClients();
      fetchSubmissionHistory();
      fetchApprovedMaterials();
      fetchPendingApproval();
      fetchPendingManufacturers();
    }
  }, [studioId]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('studio_id', studioId)
        .order('name');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('studio_id', studioId)
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchSubmissionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_submissions')
        .select(`
          *,
          projects(name),
          clients(name)
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissionHistory(data || []);
    } catch (error) {
      console.error('Error fetching submission history:', error);
    }
  };

  const fetchApprovedMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('extracted_materials')
        .select(`
          *,
          pdf_submissions(file_name, created_at)
        `)
        .eq('studio_id', studioId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setApprovedMaterials(data || []);
    } catch (error) {
      console.error('Error fetching approved materials:', error);
    }
  };

  const fetchPendingApproval = async () => {
    try {
      // Fetch from pending_materials table instead of extracted_materials
      const { data: pendingMaterialsData, error: pendingMaterialsError } = await supabase
        .from('pending_materials')
        .select(`
          *,
          pdf_submissions(file_name, created_at)
        `)
        .eq('studio_id', studioId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingMaterialsError) throw pendingMaterialsError;

      // Also fetch from extracted_materials for backward compatibility
      const { data: extractedMaterialsData, error: extractedMaterialsError } = await supabase
        .from('extracted_materials')
        .select(`
          *,
          pdf_submissions(file_name, created_at)
        `)
        .eq('studio_id', studioId)
        .in('status', ['pending', 'ready_for_review'])
        .order('created_at', { ascending: false });

      if (extractedMaterialsError) throw extractedMaterialsError;

      // Combine both datasets
      const allPendingMaterials = [
        ...(pendingMaterialsData || []),
        ...(extractedMaterialsData || [])
      ];

      setPendingApproval(allPendingMaterials);
    } catch (error) {
      console.error('Error fetching pending approval materials:', error);
    }
  };

  const fetchPendingManufacturers = async () => {
    try {
      console.log('=== FETCHING PENDING MANUFACTURERS DEBUG ===');
      console.log('Studio ID:', studioId);

      const { data, error } = await supabase
        .from('pending_manufacturers')
        .select(`
          *,
          pdf_submissions!pending_manufacturers_submission_id_fkey(file_name, created_at)
        `)
        .eq('studio_id', studioId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Pending manufacturers data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('Error in fetchPendingManufacturers:', error);
        const { data: simpleData, error: simpleError } = await supabase
          .from('pending_manufacturers')
          .select('*')
          .eq('studio_id', studioId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        console.log('Simple query result:', simpleData);
        if (simpleError) throw simpleError;
        setPendingManufacturers(simpleData || []);
      } else {
        setPendingManufacturers(data || []);
      }

      console.log('=== END PENDING MANUFACTURERS DEBUG ===');
    } catch (error) {
      console.error('Error fetching pending manufacturers:', error);
      setPendingManufacturers([]);
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else if (file) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive"
      });
      setSelectedFile(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !studioId) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${studioId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create PDF submission record
      const { error: dbError } = await supabase
        .from('pdf_submissions')
        .insert({
          studio_id: studioId,
          project_id: selectedProject || null,
          client_id: selectedClient || null,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          object_path: filePath,
          notes: notes || null,
          status: 'pending'
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "PDF uploaded successfully"
      });

      // Reset form
      setSelectedFile(null);
      setSelectedProject('');
      setSelectedClient('');
      setNotes('');
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh submission history
      fetchSubmissionHistory();

    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteSubmission = async (submissionId: string, objectPath: string) => {
    if (!submissionId) {
      console.error('No submission ID provided');
      return;
    }

    setDeleting(submissionId);
    
    try {
      console.log('Deleting submission:', submissionId, 'Object path:', objectPath);
      
      // Delete the file from storage first if object path exists
      if (objectPath) {
        const { error: storageError } = await supabase.storage
          .from('pdfs')
          .remove([objectPath]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log('File deleted from storage successfully');
        }
      }

      // Delete the submission record from database
      const { error: dbError } = await supabase
        .from('pdf_submissions')
        .delete()
        .eq('id', submissionId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      console.log('Database record deleted successfully');

      toast({
        title: "Success",
        description: "PDF submission deleted successfully"
      });

      // Refresh submission history
      await fetchSubmissionHistory();
      
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete PDF submission. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Processing' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Processing' },
      ready_for_review: { color: 'bg-purple-100 text-purple-800', icon: AlertCircle, label: 'Ready for Review' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Complete' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const approveMaterial = async (materialId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user found');
      }

      const { data: pendingMaterial, error: fetchError } = await supabase
        .from('pending_materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          const { error } = await supabase
            .from('extracted_materials')
            .update({ 
              status: 'approved',
              approved_by: currentUserId,
              approved_at: new Date().toISOString()
            })
            .eq('id', materialId);

          if (error) throw error;

          toast({
            title: "Success",
            description: "Material approved"
          });

          fetchApprovedMaterials();
          fetchPendingApproval();
          return;
        } else {
          throw fetchError;
        }
      }

      if (!pendingMaterial) {
        throw new Error('Material not found');
      }

      let manufacturerId = pendingMaterial.manufacturer_id;
      
      if (!manufacturerId && pendingMaterial.manufacturer_name) {
        const { data: existingManufacturer } = await supabase
          .from('manufacturers')
          .select('id')
          .eq('studio_id', pendingMaterial.studio_id)
          .ilike('name', pendingMaterial.manufacturer_name)
          .single();

        if (existingManufacturer) {
          manufacturerId = existingManufacturer.id;
        } else {
          const { data: newManufacturer, error: manufacturerError } = await supabase
            .from('manufacturers')
            .insert({
              name: pendingMaterial.manufacturer_name,
              studio_id: pendingMaterial.studio_id
            })
            .select()
            .single();

          if (manufacturerError) {
            console.error('Error creating manufacturer:', manufacturerError);
          } else {
            manufacturerId = newManufacturer.id;
          }
        }
      }

      const { error: updateError } = await supabase
        .from('pending_materials')
        .update({
          status: 'approved',
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
          manufacturer_id: manufacturerId
        })
        .eq('id', materialId);

      if (updateError) throw updateError;

      const materialData = {
        name: pendingMaterial.name,
        category: pendingMaterial.category,
        subcategory: pendingMaterial.subcategory,
        manufacturer_id: manufacturerId,
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
        .insert(materialData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (pendingMaterial.project_id && newMaterial) {
        const { error: linkError } = await supabase
          .from('proj_materials')
          .insert({
            project_id: pendingMaterial.project_id,
            material_id: newMaterial.id,
            studio_id: pendingMaterial.studio_id,
            notes: pendingMaterial.tag ? `Tag: ${pendingMaterial.tag}` : null
          });

        if (linkError) {
          console.error('Error linking material to project:', linkError);
        }
      }

      toast({
        title: "Success",
        description: "Material approved and moved to materials library"
      });

      fetchApprovedMaterials();
      fetchPendingApproval();
    } catch (error) {
      console.error('Error approving material:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve material",
        variant: "destructive"
      });
    }
  };

  const approveAllMaterials = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const material of filteredPendingMaterials) {
        try {
          await approveMaterial(material.id);
          successCount++;
        } catch (error) {
          console.error(`Error approving material ${material.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${successCount} materials approved and moved to materials library${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Error",
          description: "Failed to approve materials",
          variant: "destructive"
        });
      }

      fetchApprovedMaterials();
      fetchPendingApproval();
    } catch (error) {
      console.error('Error approving all materials:', error);
      toast({
        title: "Error",
        description: "Failed to approve materials",
        variant: "destructive"
      });
    }
  };

  const rejectMaterial = async (materialId: string, reason: string = '') => {
    try {
      const { error } = await supabase.rpc('reject_pending_material', {
        material_id: materialId,
        rejection_reason_text: reason || 'No reason provided'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Material rejected"
      });

      fetchPendingApproval();
    } catch (error) {
      console.error('Error rejecting material:', error);
      toast({
        title: "Error",
        description: "Failed to reject material",
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

      const { data: pendingManufacturer, error: fetchError } = await supabase
        .from('pending_manufacturers')
        .select('*')
        .eq('id', manufacturerId)
        .single();

      if (fetchError) throw fetchError;
      if (!pendingManufacturer) throw new Error('Manufacturer not found');

      const { error: updateError } = await supabase
        .from('pending_manufacturers')
        .update({
          status: 'approved',
          approved_by: currentUserId,
          approved_at: new Date().toISOString()
        })
        .eq('id', manufacturerId);

      if (updateError) throw updateError;

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

      fetchPendingManufacturers();
    } catch (error) {
      console.error('Error approving manufacturer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve manufacturer",
        variant: "destructive"
      });
    }
  };

  const approveAllManufacturers = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const manufacturer of pendingManufacturers) {
        try {
          await approveManufacturer(manufacturer.id);
          successCount++;
        } catch (error) {
          console.error(`Error approving manufacturer ${manufacturer.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${successCount} manufacturers approved and added to manufacturers library${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Error",
          description: "Failed to approve manufacturers",
          variant: "destructive"
        });
      }

      fetchPendingManufacturers();
    } catch (error) {
      console.error('Error approving all manufacturers:', error);
      toast({
        title: "Error",
        description: "Failed to approve manufacturers",
        variant: "destructive"
      });
    }
  };

  const rejectManufacturer = async (manufacturerId: string, reason: string = '') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase
        .from('pending_manufacturers')
        .update({
          status: 'rejected',
          rejected_by: currentUserId,
          rejected_at: new Date().toISOString(),
          notes: reason || 'No reason provided'
        })
        .eq('id', manufacturerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Manufacturer rejected"
      });

      fetchPendingManufacturers();
    } catch (error) {
      console.error('Error rejecting manufacturer:', error);
      toast({
        title: "Error",
        description: "Failed to reject manufacturer",
        variant: "destructive"
      });
    }
  };

  const handleEditMaterial = (material: any, duplicates: any[]) => {
    setEditingMaterial(material);
    setEditingDuplicates(duplicates);
    setEditDialogOpen(true);
  };

  const handleEditManufacturer = (manufacturer: any) => {
    console.log('=== EDIT MANUFACTURER CLICKED ===');
    console.log('Manufacturer data being passed:', manufacturer);
    console.log('Manufacturer keys:', Object.keys(manufacturer || {}));
    console.log('=== END EDIT MANUFACTURER DEBUG ===');
    
    setEditingManufacturer(manufacturer);
    setEditManufacturerDialogOpen(true);
  };

  const handleMaterialUpdated = () => {
    fetchPendingApproval();
  };

  const handleManufacturerUpdated = () => {
    fetchPendingManufacturers();
  };

  // Add function to get unique filter options from pending materials
  const getFilterOptions = () => {
    const projectsMap = new Map<string, { id: string; name: string }>();
    const clientsMap = new Map<string, { id: string; name: string }>();
    const pdfsMap = new Map<string, { id: string; name: string }>();

    // Build maps from projects and clients state arrays for lookup
    const projectLookup = new Map(projects.map(p => [p.id, p.name]));
    const clientLookup = new Map(clients.map(c => [c.id, c.name]));

    pendingApproval.forEach((material) => {
      // Collect projects
      if (material.project_id) {
        const projectName = projectLookup.get(material.project_id);
        if (projectName) {
          projectsMap.set(material.project_id, { id: material.project_id, name: projectName });
        }
      }

      // Collect clients  
      if (material.client_id) {
        const clientName = clientLookup.get(material.client_id);
        if (clientName) {
          clientsMap.set(material.client_id, { id: material.client_id, name: clientName });
        }
      }

      // Collect PDFs
      if (material.pdf_submissions?.file_name) {
        const pdfId = material.submission_id || material.id;
        pdfsMap.set(pdfId, { id: pdfId, name: material.pdf_submissions.file_name });
      }
    });

    return {
      projects: Array.from(projectsMap.values()),
      clients: Array.from(clientsMap.values()),
      pdfs: Array.from(pdfsMap.values())
    };
  };

  // Filter pending materials based on selected filters
  const filteredPendingMaterials = pendingApproval.filter((material) => {
    if (filterProject && material.project_id !== filterProject) return false;
    if (filterClient && material.client_id !== filterClient) return false;
    if (filterPdf) {
      const materialPdfId = material.submission_id || material.id;
      if (materialPdfId !== filterPdf) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilterProject('');
    setFilterClient('');
    setFilterPdf('');
  };

  const hasActiveFilters = filterProject !== '' || filterClient !== '' || filterPdf !== '';

  const totalPendingCount = pendingApproval.length + pendingManufacturers.length;
  const filterOptions = getFilterOptions();

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
          <p className="text-gray-600 mt-1">
            Upload PDF documents for material extraction and processing
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload PDF</TabsTrigger>
            <TabsTrigger value="history">Submission History</TabsTrigger>
            <TabsTrigger value="approval">Pending Approval ({totalPendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved Materials ({approvedMaterials.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  PDF Document Upload
                </CardTitle>
                <CardDescription>
                  Upload a PDF document containing material specifications or project details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pdf-upload">Select PDF File</Label>
                  <div className="mt-1">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept=".pdf"
                      selectedFile={selectedFile}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="client">Client (Optional)</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes or context about this document..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full"
                >
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Submission History</CardTitle>
                <CardDescription>View all your PDF submissions and their processing status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissionHistory.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{submission.file_name}</h3>
                          <div className="text-sm text-gray-600">
                            <p>Uploaded on {format(new Date(submission.created_at), 'PPP')}</p>
                            {submission.projects && <p>Project: {submission.projects.name}</p>}
                            {submission.clients && <p>Client: {submission.clients.name}</p>}
                            {submission.notes && <p>Notes: {submission.notes}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(submission.status)}
                          <div className="text-xs text-gray-500">
                            {submission.file_size && `${Math.round(submission.file_size / 1024)} KB`}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSubmission(submission.id, submission.object_path)}
                          disabled={deleting === submission.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deleting === submission.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {submissionHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No PDF submissions yet. Upload your first document above!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approval">
            <div className="space-y-6">
              {/* Materials Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Materials Pending Approval</CardTitle>
                      <CardDescription>Review and approve materials extracted from your PDFs</CardDescription>
                    </div>
                    {pendingApproval.length > 0 && (
                      <Button onClick={approveAllMaterials} className="bg-green-600 hover:bg-green-700">
                        Approve All Materials ({filteredPendingMaterials.length})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingApproval.length > 0 && (
                    <MaterialFilters
                      projects={filterOptions.projects}
                      clients={filterOptions.clients}
                      pdfs={filterOptions.pdfs}
                      selectedProject={filterProject}
                      selectedClient={filterClient}
                      selectedPdf={filterPdf}
                      onProjectChange={setFilterProject}
                      onClientChange={setFilterClient}
                      onPdfChange={setFilterPdf}
                      onClearFilters={clearFilters}
                      hasActiveFilters={hasActiveFilters}
                    />
                  )}
                  
                  <div className="space-y-4">
                    {hasActiveFilters && (
                      <div className="text-sm text-gray-600 mb-4">
                        Showing {filteredPendingMaterials.length} of {pendingApproval.length} materials
                      </div>
                    )}
                    
                    {filteredPendingMaterials.map((material) => (
                      <PendingMaterialCard
                        key={material.id}
                        material={material}
                        onApprove={approveMaterial}
                        onReject={rejectMaterial}
                        onEdit={handleEditMaterial}
                      />
                    ))}
                    {filteredPendingMaterials.length === 0 && pendingApproval.length > 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No materials match the current filters.
                      </div>
                    )}
                    {pendingApproval.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No materials pending approval at this time.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Manufacturers Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Manufacturers Pending Approval</CardTitle>
                      <CardDescription>Review and approve manufacturers extracted from your PDFs</CardDescription>
                    </div>
                    {pendingManufacturers.length > 0 && (
                      <Button onClick={approveAllManufacturers} className="bg-green-600 hover:bg-green-700">
                        Approve All Manufacturers ({pendingManufacturers.length})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Debug Info:</strong> Found {pendingManufacturers.length} pending manufacturers
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Check browser console for detailed debug information
                      </p>
                    </div>
                    {pendingManufacturers.map((manufacturer) => {
                      console.log('Rendering manufacturer:', manufacturer.id, manufacturer);
                      return (
                        <div key={manufacturer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Building className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{manufacturer.name}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
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
                              </div>
                              {manufacturer.website && (
                                <div className="mt-2">
                                  <span className="font-medium text-gray-700">Website:</span>
                                  <p className="text-gray-600 text-sm">{manufacturer.website}</p>
                                </div>
                              )}
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
                              onClick={() => {
                                console.log('Edit button clicked for manufacturer:', manufacturer);
                                handleEditManufacturer(manufacturer);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => approveManufacturer(manufacturer.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => rejectManufacturer(manufacturer.id, 'Rejected by user')}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {pendingManufacturers.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No manufacturers pending approval at this time.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Materials</CardTitle>
                <CardDescription>Materials that have been approved and added to your library</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvedMaterials.map((material) => (
                    <div key={material.id} className="p-4 border rounded-lg bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{material.name}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Category:</span>
                              <p className="text-gray-600">{material.category}</p>
                            </div>
                            {material.subcategory && (
                              <div>
                                <span className="font-medium text-gray-700">Subcategory:</span>
                                <p className="text-gray-600">{material.subcategory}</p>
                              </div>
                            )}
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
                            Approved on {format(new Date(material.approved_at), 'PPP')}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(material.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {approvedMaterials.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No approved materials yet. Upload and approve some PDFs to see them here!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <EditPendingMaterialDialog
          material={editingMaterial}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onMaterialUpdated={handleMaterialUpdated}
          duplicates={editingDuplicates}
        />

        <EditPendingManufacturerDialog
          manufacturer={editingManufacturer}
          open={editManufacturerDialogOpen}
          onOpenChange={setEditManufacturerDialogOpen}
          onManufacturerUpdated={handleManufacturerUpdated}
        />
      </div>
    </div>
  );
};

export default UploadDocuments;
