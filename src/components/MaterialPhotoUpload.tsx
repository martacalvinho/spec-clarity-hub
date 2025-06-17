
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MaterialPhotoUploadProps {
  materialId: string;
  currentPhotoUrl?: string;
  onPhotoUpdated: (photoUrl: string | null) => void;
}

const MaterialPhotoUpload = ({ materialId, currentPhotoUrl, onPhotoUpdated }: MaterialPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${materialId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Remove old photo if exists
      if (currentPhotoUrl) {
        const oldFileName = currentPhotoUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('material-photos')
            .remove([oldFileName]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('material-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('material-photos')
        .getPublicUrl(filePath);

      // Update material with photo URL
      const { error: updateError } = await supabase
        .from('materials')
        .update({ photo_url: publicUrl })
        .eq('id', materialId);

      if (updateError) {
        throw updateError;
      }

      onPhotoUpdated(publicUrl);
      toast({
        title: "Success",
        description: "Material photo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading}
              className="pointer-events-none p-2 h-8 w-8"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentPhotoUrl ? 'Change photo' : 'Add photo'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MaterialPhotoUpload;
