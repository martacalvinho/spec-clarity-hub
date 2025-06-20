
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { useUnitToggle } from '@/hooks/useUnitToggle';
import { supabase } from '@/integrations/supabase/client';
import { Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddMaterialForm from '@/components/forms/AddMaterialForm';
import EditMaterialForm from '@/components/forms/EditMaterialForm';

const Materials = () => {
  const { studioId } = useAuth();
  const { formatArea } = useUnitToggle();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest_first');

  useEffect(() => {
    if (studioId) {
      fetchMaterials();
    }
  }, [studioId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          manufacturers(name)
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedMaterials = materials
    .filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.manufacturers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (categoryFilter === 'all') return matchesSearch;
      return matchesSearch && material.category === categoryFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest_first') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'price_high_low') {
        const aPrice = a.price_per_sqft || 0;
        const bPrice = b.price_per_sqft || 0;
        return bPrice - aPrice;
      }
      if (sortBy === 'price_low_high') {
        const aPrice = a.price_per_sqft || 0;
        const bPrice = b.price_per_sqft || 0;
        return aPrice - bPrice;
      }
      // Default alphabetical sorting
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

  const categories = [...new Set(materials.map(m => m.category))];

  if (loading) {
    return <div className="p-6">Loading materials...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
        <div className="flex items-center gap-4">
          <UnitToggle />
          <AddMaterialForm onMaterialAdded={fetchMaterials} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Materials</CardTitle>
              <CardDescription>Manage your material library</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest_first">Newest First</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="price_high_low">Price: High to Low</SelectItem>
                  <SelectItem value="price_low_high">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAndSortedMaterials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-coral-100 rounded-lg">
                    <Package className="h-6 w-6 text-coral-600" />
                  </div>
                  <div className="flex-1">
                    <Link to={`/materials/${material.id}`} className="hover:text-coral">
                      <h3 className="font-semibold text-lg">{material.name}</h3>
                    </Link>
                    <div className="flex items-center gap-4 mt-1">
                      <Badge variant="outline">{material.category}</Badge>
                      <span className="text-sm text-gray-500">
                        {material.manufacturers?.name || 'No manufacturer'}
                      </span>
                      {material.price_per_sqft && (
                        <span className="text-sm text-green-600 font-medium">
                          ${material.price_per_sqft}/{formatArea(1).split(' ')[1]}
                        </span>
                      )}
                    </div>
                    {material.notes && (
                      <p className="text-sm text-gray-600 mt-1">{material.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EditMaterialForm material={material} onMaterialUpdated={fetchMaterials} />
                </div>
              </div>
            ))}
            {filteredAndSortedMaterials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'No materials found matching your filters.' 
                  : 'No materials yet. Add your first material!'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Materials;
