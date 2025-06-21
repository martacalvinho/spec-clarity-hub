
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
}

interface MaterialFiltersProps {
  projects: FilterOption[];
  clients: FilterOption[];
  pdfs: FilterOption[];
  selectedProject: string;
  selectedClient: string;
  selectedPdf: string;
  onProjectChange: (value: string) => void;
  onClientChange: (value: string) => void;
  onPdfChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const MaterialFilters = ({
  projects,
  clients,
  pdfs,
  selectedProject,
  selectedClient,
  selectedPdf,
  onProjectChange,
  onClientChange,
  onPdfChange,
  onClearFilters,
  hasActiveFilters
}: MaterialFiltersProps) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-gray-600" />
        <span className="font-medium text-gray-700">Filter Materials</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto text-xs text-gray-600 hover:text-gray-800"
          >
            <X className="h-3 w-3 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Project</label>
          <Select value={selectedProject} onValueChange={onProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Client</label>
          <Select value={selectedClient} onValueChange={onClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">PDF Source</label>
          <Select value={selectedPdf} onValueChange={onPdfChange}>
            <SelectTrigger>
              <SelectValue placeholder="All PDFs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All PDFs</SelectItem>
              {pdfs.map((pdf) => (
                <SelectItem key={pdf.id} value={pdf.id}>
                  {pdf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default MaterialFilters;
