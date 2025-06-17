
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectFiltersProps {
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  dateStartedFilter: string;
  setDateStartedFilter: (value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const projectTypes = [
  'residential',
  'commercial', 
  'hospitality',
  'retail',
  'office',
  'healthcare',
  'education',
  'mixed_use',
  'other'
];

const ProjectFilters = ({
  typeFilter,
  setTypeFilter,
  dateStartedFilter,
  setDateStartedFilter,
  clearFilters,
  hasActiveFilters
}: ProjectFiltersProps) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Type Filter */}
        <div>
          <Label htmlFor="type-filter" className="text-sm font-medium">Project Type</Label>
          <Select value={typeFilter || 'all'} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {projectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Started Filter */}
        <div>
          <Label htmlFor="date-filter" className="text-sm font-medium">Date Started (From)</Label>
          <Input
            id="date-filter"
            type="date"
            value={dateStartedFilter}
            onChange={(e) => setDateStartedFilter(e.target.value)}
            placeholder="Filter by start date"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {typeFilter && typeFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Type: {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1).replace('_', ' ')}
              <button
                onClick={() => setTypeFilter('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateStartedFilter && (
            <Badge variant="secondary" className="text-xs">
              Started from: {new Date(dateStartedFilter).toLocaleDateString()}
              <button
                onClick={() => setDateStartedFilter('')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;
