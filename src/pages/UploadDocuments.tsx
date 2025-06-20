
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, History, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PdfSubmissionHistory from '@/components/PdfSubmissionHistory';
import MaterialApproval from '@/components/MaterialApproval';

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

  useEffect(() => {
    if (studioId) {
      fetchProjects();
      fetchClients();
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
    if (!selectedFile || !studioId) {
      console.log('Missing file or studio ID:', { selectedFile: !!selectedFile, studioId });
      return;
    }

    setUploading(true);
    try {
      console.log('Starting upload process...');
      
      // Upload file to storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${studioId}/${fileName}`;
      
      console.log('Uploading to path:', filePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Create PDF submission record
      const submissionData = {
        studio_id: studioId,
        project_id: selectedProject || null,
        client_id: selectedClient || null,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        object_path: filePath,
        notes: notes || null,
        status: 'pending'
      };

      console.log('Creating submission record:', submissionData);

      const { data: dbData, error: dbError } = await supabase
        .from('pdf_submissions')
        .insert(submissionData)
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Submission record created:', dbData);

      toast({
        title: "Success",
        description: "PDF uploaded successfully"
      });

      // Reset form
      setSelectedFile(null);
      setSelectedProject('');
      setSelectedClient('');
      setNotes('');

    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload PDF: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-1">
            Upload PDF documents, track their processing status, and approve extracted materials
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload PDF
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Submission History
            </TabsTrigger>
            <TabsTrigger value="approval" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Material Approval
            </TabsTrigger>
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
            <PdfSubmissionHistory />
          </TabsContent>

          <TabsContent value="approval">
            <MaterialApproval />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UploadDocuments;
