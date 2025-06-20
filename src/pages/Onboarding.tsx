
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building, FileSpreadsheet, Code, FolderOpen, Users, FileText } from 'lucide-react';
import MaterialsDataGrid from '@/components/onboarding/MaterialsDataGrid';
import JSONDataInput from '@/components/onboarding/JSONDataInput';
import AddProjectForm from '@/components/forms/AddProjectForm';
import AddClientForm from '@/components/forms/AddClientForm';

interface Studio {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Client {
  id: string;
  name: string;
  status: string;
}

interface PdfSubmission {
  id: string;
  file_name: string;
  status: string;
  project_id: string | null;
  client_id: string | null;
  projects?: { name: string } | null;
  clients?: { name: string } | null;
}

const Onboarding = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedStudio, setSelectedStudio] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedPdfSubmission, setSelectedPdfSubmission] = useState<string>('');
  const [studios, setStudios] = useState<Studio[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pdfSubmissions, setPdfSubmissions] = useState<PdfSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudios();
  }, []);

  useEffect(() => {
    if (selectedStudio) {
      fetchProjects();
      fetchClients();
      fetchPdfSubmissions();
      setSelectedProject(''); // Reset project selection when studio changes
      setSelectedClient(''); // Reset client selection when studio changes
      setSelectedPdfSubmission(''); // Reset PDF selection when studio changes
    }
  }, [selectedStudio]);

  useEffect(() => {
    // Auto-fill client and project when PDF is selected
    if (selectedPdfSubmission) {
      const selectedPdf = pdfSubmissions.find(pdf => pdf.id === selectedPdfSubmission);
      if (selectedPdf) {
        if (selectedPdf.client_id) {
          setSelectedClient(selectedPdf.client_id);
        }
        if (selectedPdf.project_id) {
          setSelectedProject(selectedPdf.project_id);
        }
      }
    }
  }, [selectedPdfSubmission, pdfSubmissions]);

  const fetchStudios = async () => {
    try {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setStudios(data || []);
    } catch (error) {
      console.error('Error fetching studios:', error);
      toast({
        title: "Error",
        description: "Failed to load studios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!selectedStudio) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('studio_id', selectedStudio)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    if (!selectedStudio) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, status')
        .eq('studio_id', selectedStudio)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    }
  };

  const fetchPdfSubmissions = async () => {
    if (!selectedStudio) return;
    
    try {
      const { data, error } = await supabase
        .from('pdf_submissions')
        .select(`
          id, 
          file_name, 
          status,
          project_id,
          client_id,
          projects(name),
          clients(name)
        `)
        .eq('studio_id', selectedStudio)
        .eq('status', 'processing')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPdfSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching PDF submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load PDF submissions",
        variant: "destructive",
      });
    }
  };

  const handleProjectAdded = () => {
    // Refresh projects list when a new project is created
    fetchProjects();
  };

  const handleClientAdded = () => {
    // Refresh clients list when a new client is created
    fetchClients();
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Loading studios...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Data Import Wizard</h1>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Studio Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Select Studio
            </CardTitle>
            <CardDescription>
              Choose which studio to import data for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedStudio} onValueChange={setSelectedStudio}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a studio..." />
              </SelectTrigger>
              <SelectContent>
                {studios.map((studio) => (
                  <SelectItem key={studio.id} value={studio.id}>
                    {studio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* PDF Submission Selection */}
        {selectedStudio && pdfSubmissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Link to PDF Submission (Optional)
              </CardTitle>
              <CardDescription>
                Select a processing PDF submission to link these materials to, or leave empty for general materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedPdfSubmission} onValueChange={setSelectedPdfSubmission}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a PDF submission (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific PDF</SelectItem>
                  {pdfSubmissions.map((submission) => (
                    <SelectItem key={submission.id} value={submission.id}>
                      {submission.file_name}
                      {submission.projects?.name && ` - ${submission.projects.name}`}
                      {submission.clients?.name && ` (${submission.clients.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Client Selection */}
        {selectedStudio && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Client (Optional)
              </CardTitle>
              <CardDescription>
                Choose a specific client to link materials to, or leave empty for general studio materials
                {selectedPdfSubmission && selectedPdfSubmission !== "none" && (
                  <span className="block mt-1 text-sm text-blue-600">
                    Auto-filled from selected PDF submission
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="flex-1 max-w-md">
                    <SelectValue placeholder="Select a client (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AddClientForm onClientAdded={handleClientAdded} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Selection */}
        {selectedStudio && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Select Project (Optional)
              </CardTitle>
              <CardDescription>
                Choose a specific project to link materials to, or leave empty for general studio materials
                {selectedPdfSubmission && selectedPdfSubmission !== "none" && (
                  <span className="block mt-1 text-sm text-blue-600">
                    Auto-filled from selected PDF submission
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="flex-1 max-w-md">
                    <SelectValue placeholder="Select a project (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AddProjectForm onProjectAdded={handleProjectAdded} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Import Interface */}
        {selectedStudio && (
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Choose how you want to input your materials, manufacturers, and clients data
                {selectedProject && selectedProject !== "none" && (
                  <span className="block mt-1 text-sm text-blue-600">
                    Materials will be linked to the selected project
                  </span>
                )}
                {selectedClient && selectedClient !== "none" && (
                  <span className="block mt-1 text-sm text-green-600">
                    Data will be associated with the selected client
                  </span>
                )}
                {selectedPdfSubmission && selectedPdfSubmission !== "none" && (
                  <span className="block mt-1 text-sm text-purple-600">
                    Materials will be linked to the selected PDF submission
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="grid" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="grid" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Grid View
                  </TabsTrigger>
                  <TabsTrigger value="json" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    JSON Input
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="grid" className="mt-6">
                  <MaterialsDataGrid 
                    studioId={selectedStudio} 
                    projectId={selectedProject === "none" ? undefined : selectedProject}
                    pdfSubmissionId={selectedPdfSubmission === "none" ? undefined : selectedPdfSubmission}
                  />
                </TabsContent>
                
                <TabsContent value="json" className="mt-6">
                  <JSONDataInput 
                    studioId={selectedStudio} 
                    projectId={selectedProject === "none" ? undefined : selectedProject}
                    pdfSubmissionId={selectedPdfSubmission === "none" ? undefined : selectedPdfSubmission}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
