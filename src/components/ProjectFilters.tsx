
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProjectFiltersProps {
  onFiltersChange: (filters: {
    projectType: string;
    clientId: string;
    status: string;
    filterDate: string;
    dateType: string;
  }) => void;
}

const ProjectFilters = ({ onFiltersChange }: ProjectFiltersProps) => {
  const { studioId } = useAuth();
  const [projectType, setProjectType] = useState('all');
  const [clientId, setClientId] = useState('all');
  const [status, setStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [dateType, setDateType] = useState('either');
  const [showFilters, setShowFilters] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (studioId) {
      fetchClients();
    }
  }, [studioId]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleFilterChange = () => {
    onFiltersChange({
      projectType,
      clientId,
      status,
      filterDate,
      dateType,
    });
  };

  const clearFilters = () => {
    setProjectType('all');
    setClientId('all');
    setStatus('all');
    setFilterDate('');
    setDateType('either');
    onFiltersChange({
      projectType: 'all',
      clientId: 'all',
      status: 'all',
      filterDate: '',
      dateType: 'either',
    });
  };

  const hasActiveFilters = projectType !== 'all' || clientId !== 'all' || status !== 'all' || filterDate;

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
              {[projectType !== 'all', clientId !== 'all', status !== 'all', filterDate].filter(Boolean).length}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-type">Project Type</Label>
                <Select value={projectType} onValueChange={(value) => {
                  setProjectType(value);
                  setTimeout(handleFilterChange, 0);
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
                <Label htmlFor="client">Client</Label>
                <Select value={clientId} onValueChange={(value) => {
                  setClientId(value);
                  setTimeout(handleFilterChange, 0);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => {
                  setStatus(value);
                  setTimeout(handleFilterChange, 0);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-date">Date Filter</Label>
                <Input
                  id="filter-date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setTimeout(handleFilterChange, 0);
                  }}
                />
                {filterDate && (
                  <div className="space-y-2">
                    <Label className="text-xs">Date Type</Label>
                    <RadioGroup
                      value={dateType}
                      onValueChange={(value) => {
                        setDateType(value);
                        setTimeout(handleFilterChange, 0);
                      }}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="either" id="either" />
                        <Label htmlFor="either" className="text-xs">Either</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="start" id="start" />
                        <Label htmlFor="start" className="text-xs">Start</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="end" id="end" />
                        <Label htmlFor="end" className="text-xs">End</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectFilters;
