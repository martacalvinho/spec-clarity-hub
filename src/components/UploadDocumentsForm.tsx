
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AddProjectForm from '@/components/forms/AddProjectForm';
import AddClientForm from '@/components/forms/AddClientForm';

interface UploadDocumentsFormProps {
  projects: any[];
  clients: any[];
  onProjectsChange: () => void;
  onClientsChange: () => void;
}

const UploadDocumentsForm = ({ 
  projects, 
  clients, 
  onProjectsChange, 
  onClientsChange 
}: UploadDocumentsFormProps) => {
  const { studioId } = useAuth();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auto-select client when project changes
  useEffect(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject);
      if (project && project.client_id) {
        setSelectedClient(project.client_id);
      } else {
        setSelectedClient('');
      }
    }
  }, [selectedProject, projects]);

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
    <div className="space-y-4">
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
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="flex-1">
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
          <AddProjectForm onProjectAdded={onProjectsChange} />
        </div>
      </div>

      <div>
        <Label htmlFor="client">Client (Optional)</Label>
        <div className="flex gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="flex-1">
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
          <AddClientForm onClientAdded={onClientsChange} />
        </div>
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
    </div>
  );
};

export default UploadDocumentsForm;
