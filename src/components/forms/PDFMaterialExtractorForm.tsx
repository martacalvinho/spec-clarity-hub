
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Check } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'upload' | 'submitted'>('upload');
  const [notes, setNotes] = useState<string>('');

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

  const submitPDFForProcessing = async () => {
    if (!file || !studioId) return;

    setSubmitting(true);
    try {
      // Insert the submission directly into the pdf_submissions table
      const { error } = await supabase
        .from('pdf_submissions')
        .insert({
          studio_id: studioId,
          project_id: projectId && projectId !== 'none' ? projectId : null,
          client_id: clientId && clientId !== 'none' ? clientId : null,
          status: 'pending',
          notes: notes,
          file_name: file.name,
          file_size: file.size,
        });

      if (error) {
        throw new Error(error.message || 'Failed to submit PDF for processing');
      }

      toast({
        title: "PDF Submitted Successfully",
        description: "Your PDF has been submitted for processing by the Treqy team. You'll receive an alert when materials are ready for review.",
      });

      setStep('submitted');
      onMaterialsAdded?.();
    } catch (error: any) {
      console.error('Error submitting PDF:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setProjectId('');
    setClientId('');
    setNotes('');
    setStep('upload');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-coral hover:bg-coral-600 text-white w-full"
          onClick={fetchProjectsAndClients}
        >
          <Upload className="h-4 w-4 mr-2" />
          Submit PDF for Material Extraction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Submit Material Schedule PDF'}
            {step === 'submitted' && 'PDF Submitted Successfully'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a PDF containing a material schedule for the Treqy team to extract materials'}
            {step === 'submitted' && 'Your PDF has been submitted and is awaiting processing by the Treqy team'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pdf-upload">PDF File *</Label>
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
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
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

            <div>
              <Label htmlFor="notes">Notes for Processing Team (Optional)</Label>
              <Input
                id="notes"
                placeholder="Any specific requirements or information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitPDFForProcessing} 
                disabled={!file || submitting}
                className="bg-coral hover:bg-coral-600"
              >
                {submitting ? 'Submitting...' : 'Submit PDF for Processing'}
              </Button>
            </div>
          </div>
        )}

        {step === 'submitted' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">PDF Submitted Successfully!</h3>
              <p className="text-gray-600 mb-4">
                Your PDF has been submitted for processing by the Treqy team. 
                You'll receive an alert notification when materials are ready for your review and approval.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>The Treqy team will process your submitted PDF</li>
                  <li>Materials will be extracted and prepared for your review</li>
                  <li>You'll receive an alert notification when ready</li>
                  <li>You can review, edit, and approve materials individually or all at once</li>
                </ol>
              </div>
            </div>
            <Button onClick={resetForm} className="bg-coral hover:bg-coral-600 mt-4">
              Submit Another PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFMaterialExtractorForm;
