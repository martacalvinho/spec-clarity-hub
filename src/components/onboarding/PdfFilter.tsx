
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';

interface PdfFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ id: string; name: string; count: number }>;
}

const PdfFilter = ({ value, onValueChange, options }: PdfFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 text-gray-500" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Filter by PDF source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All PDFs ({options.reduce((sum, opt) => sum + opt.count, 0)} materials)</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name} ({option.count} materials)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PdfFilter;
