
import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ProjectFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    type: string;
    client: string;
    status: string;
    year: string;
    dateType: string;
  }) => void;
  clients: Array<{ id: string; name: string }>;
}

const ProjectFilters = ({ onFiltersChange, clients }: ProjectFiltersProps) => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [client, setClient] = useState('all');
  const [status, setStatus] = useState('all');
  const [year, setYear] = useState('all');
  const [dateType, setDateType] = useState('start');

  const projectTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'retail', label: 'Retail' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'office', label: 'Office' },
    { value: 'mixed_use', label: 'Mixed Use' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Generate year options (current year and past 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...Array.from({ length: 6 }, (_, i) => {
      const yearValue = currentYear - i;
      return { value: yearValue.toString(), label: yearValue.toString() };
    })
  ];

  const dateTypeOptions = [
    { value: 'start', label: 'Start Date' },
    { value: 'end', label: 'End Date' }
  ];

  useEffect(() => {
    onFiltersChange({
      search,
      type,
      client,
      status,
      year,
      dateType
    });
  }, [search, type, client, status, year, dateType, onFiltersChange]);

  const clearFilters = () => {
    setSearch('');
    setType('all');
    setClient('all');
    setStatus('all');
    setYear('all');
    setDateType('start');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Project Type" />
          </SelectTrigger>
          <SelectContent>
            {projectTypes.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={client} onValueChange={setClient}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((clientOption) => (
              <SelectItem key={clientOption.id} value={clientOption.id}>
                {clientOption.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {year !== 'all' && (
          <Select value={dateType} onValueChange={setDateType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date Type" />
            </SelectTrigger>
            <SelectContent>
              {dateTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" onClick={clearFilters} size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default ProjectFilters;
