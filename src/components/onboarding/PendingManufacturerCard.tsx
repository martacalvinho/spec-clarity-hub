
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Edit, CheckCircle, XCircle } from 'lucide-react';

interface PendingManufacturerCardProps {
  manufacturer: any;
  onEdit: (manufacturer: any) => void;
  onApprove: (manufacturerId: string) => void;
  onReject: (manufacturerId: string) => void;
}

const PendingManufacturerCard = ({ 
  manufacturer, 
  onEdit, 
  onApprove, 
  onReject 
}: PendingManufacturerCardProps) => {
  return (
    <Card className="border-blue-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Manufacturer Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{manufacturer.name}</h3>
              </div>
            </div>
          </div>

          {/* Contact Information Grid - Fixed Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Person */}
            {manufacturer.contact_name && (
              <div className="space-y-1">
                <span className="font-medium text-gray-700 text-sm">Contact:</span>
                <p className="text-gray-900 break-words">{manufacturer.contact_name}</p>
              </div>
            )}
            
            {/* Email - Ensure it doesn't overflow */}
            {manufacturer.email && (
              <div className="space-y-1">
                <span className="font-medium text-gray-700 text-sm">Email:</span>
                <p className="text-gray-900 break-all text-sm leading-relaxed">{manufacturer.email}</p>
              </div>
            )}
            
            {/* Phone */}
            {manufacturer.phone && (
              <div className="space-y-1">
                <span className="font-medium text-gray-700 text-sm">Phone:</span>
                <p className="text-gray-900 break-words">{manufacturer.phone}</p>
              </div>
            )}
          </div>

          {/* Website */}
          {manufacturer.website && (
            <div className="space-y-1">
              <span className="font-medium text-gray-700 text-sm">Website:</span>
              <p className="text-gray-900 break-all text-sm">{manufacturer.website}</p>
            </div>
          )}

          {/* Notes */}
          {manufacturer.notes && (
            <div className="space-y-1">
              <span className="font-medium text-gray-700 text-sm">Notes:</span>
              <p className="text-gray-600 text-sm leading-relaxed">{manufacturer.notes}</p>
            </div>
          )}

          {/* Source Information */}
          {manufacturer.pdf_submissions?.file_name && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                From PDF: <span className="font-medium">{manufacturer.pdf_submissions.file_name}</span>
                {manufacturer.created_at && (
                  <span className="ml-2">• Created on {new Date(manufacturer.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                )}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onEdit(manufacturer)}
              variant="outline"
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              onClick={() => onApprove(manufacturer.id)}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              onClick={() => onReject(manufacturer.id)}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingManufacturerCard;
