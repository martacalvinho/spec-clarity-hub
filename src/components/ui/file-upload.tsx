
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  selectedFile?: File | null;
  className?: string;
}

const FileUpload = ({ onFileSelect, accept, selectedFile, className }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileSelect(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        className="w-full justify-start"
      >
        <Upload className="h-4 w-4 mr-2" />
        {selectedFile ? selectedFile.name : "Choose File"}
      </Button>
      {selectedFile && (
        <p className="text-sm text-gray-600">
          Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
        </p>
      )}
    </div>
  );
};

export { FileUpload };
