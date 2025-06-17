
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface ProjectFiltersProps {
  onFiltersChange: (filters: {
    projectType: string;
    startDateFrom: string;
    startDateTo: string;
  }) => void;
}

const ProjectFilters = ({ onFiltersChange }: ProjectFiltersProps) => {
  const [projectType, setProjectType] = useState('');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = () => {
    onFiltersChange({
      projectType,
      startDateFrom,
      startDateTo,
    });
  };

  const clearFilters = () => {
    setProjectType('');
    setStartDateFrom('');
    setStartDateTo('');
    onFiltersChange({
      projectType: '',
      startDateFrom: '',
      startDateTo: '',
    });
  };

  const hasActiveFilters = projectType || startDateFrom || startDateTo;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-coral text-white text-xs px-1.5 py-0.5 rounded-full">
              {[projectType, startDateFrom, startDateTo].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-type">Project Type</Label>
                <Select value={projectType} onValueChange={(value) => {
                  setProjectType(value);
                  handleFilterChange();
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date-from">Start Date From</Label>
                <Input
                  id="start-date-from"
                  type="date"
                  value={startDateFrom}
                  onChange={(e) => {
                    setStartDateFrom(e.target.value);
                    handleFilterChange();
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date-to">Start Date To</Label>
                <Input
                  id="start-date-to"
                  type="date"
                  value={startDateTo}
                  onChange={(e) => {
                    setStartDateTo(e.target.value);
                    handleFilterChange();
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectFilters;
