'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Store, 
  Truck,
  FileText,
  Calendar,
  Phone,
  Mail
} from "lucide-react";

interface Application {
  id: string;
  userId: string;
  type: 'driver' | 'vendor';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  reason?: string;
  userData: {
    personalInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    [key: string]: any;
  };
  documents: any[];
}

export default function AdminApplicationsPage() {
  const t = useTranslations('AdminApplications');
  const { toast } = useToast();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      // TODO: Call API to get applications
      // For now, simulate loading with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockApplications: Application[] = [
        {
          id: 'app-001',
          userId: 'user-001',
          type: 'driver',
          status: 'pending',
          submittedAt: new Date('2024-01-15'),
          userData: {
            personalInfo: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phone: '+66812345678',
            },
            vehicleInfo: {
              type: 'motorcycle',
              brand: 'Honda',
              model: 'Wave',
              year: 2020,
              licensePlate: 'ABC-1234',
            },
          },
          documents: [
            { type: 'idCard', status: 'uploaded' },
            { type: 'driverLicense', status: 'uploaded' },
            { type: 'vehicleRegistration', status: 'uploaded' },
            { type: 'profilePhoto', status: 'uploaded' },
          ],
        },
        {
          id: 'app-002',
          userId: 'user-002',
          type: 'vendor',
          status: 'pending',
          submittedAt: new Date('2024-01-14'),
          userData: {
            personalInfo: {
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              phone: '+66812345679',
            },
            businessInfo: {
              businessName: 'Fresh Vegetables Store',
              businessType: 'individual',
              categories: ['vegetables', 'fruits'],
            },
          },
          documents: [
            { type: 'idCard', status: 'uploaded' },
            { type: 'bankBook', status: 'uploaded' },
            { type: 'storePhotos', status: 'uploaded' },
          ],
        },
        {
          id: 'app-003',
          userId: 'user-003',
          type: 'driver',
          status: 'approved',
          submittedAt: new Date('2024-01-10'),
          reviewedAt: new Date('2024-01-12'),
          reviewedBy: 'admin-001',
          userData: {
            personalInfo: {
              firstName: 'Mike',
              lastName: 'Johnson',
              email: 'mike@example.com',
              phone: '+66812345680',
            },
            vehicleInfo: {
              type: 'car',
              brand: 'Toyota',
              model: 'Vios',
              year: 2019,
              licensePlate: 'DEF-5678',
            },
          },
          documents: [
            { type: 'idCard', status: 'verified' },
            { type: 'driverLicense', status: 'verified' },
            { type: 'vehicleRegistration', status: 'verified' },
            { type: 'profilePhoto', status: 'verified' },
          ],
        },
      ];
      
      setApplications(mockApplications);
    } catch (error: any) {
      toast({
        title: t('errorTitle'),
        description: error.message || t('loadErrorGeneric'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      // TODO: Call API to approve application
      console.log('Approving application:', applicationId);
      
      toast({
        title: t('approveSuccessTitle'),
        description: t('approveSuccessDescription'),
      });
      
      // Reload applications
      await loadApplications();
    } catch (error: any) {
      toast({
        title: t('errorTitle'),
        description: error.message || t('approveErrorGeneric'),
        variant: 'destructive',
      });
    }
  };

  const handleRejectApplication = async (applicationId: string, reason: string) => {
    try {
      // TODO: Call API to reject application
      console.log('Rejecting application:', applicationId, 'Reason:', reason);
      
      toast({
        title: t('rejectSuccessTitle'),
        description: t('rejectSuccessDescription'),
      });
      
      // Reload applications
      await loadApplications();
    } catch (error: any) {
      toast({
        title: t('errorTitle'),
        description: error.message || t('rejectErrorGeneric'),
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('statusPending')}</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{t('statusApproved')}</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">{t('statusRejected')}</Badge>;
      default:
        return <Badge variant="secondary">{t('statusUnknown')}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'driver' ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />;
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'pending') return app.status === 'pending';
    if (activeTab === 'approved') return app.status === 'approved';
    if (activeTab === 'rejected') return app.status === 'rejected';
    return true;
  });

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('pageDescription')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('pendingApplications')}</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('approvedApplications')}</p>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('rejectedApplications')}</p>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('totalApplications')}</p>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('applicationsListTitle')}</CardTitle>
            <CardDescription>{t('applicationsListDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">{t('allTab')} ({applications.length})</TabsTrigger>
                <TabsTrigger value="pending">{t('pendingTab')} ({pendingCount})</TabsTrigger>
                <TabsTrigger value="approved">{t('approvedTab')} ({approvedCount})</TabsTrigger>
                <TabsTrigger value="rejected">{t('rejectedTab')} ({rejectedCount})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">{t('loadingApplications')}</p>
                    </div>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('noApplicationsFound')}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('tableHeaders.applicant')}</TableHead>
                        <TableHead>{t('tableHeaders.type')}</TableHead>
                        <TableHead>{t('tableHeaders.status')}</TableHead>
                        <TableHead>{t('tableHeaders.submittedAt')}</TableHead>
                        <TableHead>{t('tableHeaders.documents')}</TableHead>
                        <TableHead>{t('tableHeaders.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <User className="h-8 w-8 rounded-full bg-muted p-2" />
                              <div>
                                <p className="font-medium">
                                  {application.userData.personalInfo.firstName} {application.userData.personalInfo.lastName}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span>{application.userData.personalInfo.email}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{application.userData.personalInfo.phone}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(application.type)}
                              <span className="capitalize">
                                {application.type === 'driver' ? t('driverApplication') : t('vendorApplication')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(application.status)}
                              {getStatusBadge(application.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{application.submittedAt.toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>{application.documents.length} {t('documentsCount')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedApplication(application)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {t('viewButton')}
                              </Button>
                              
                              {application.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleApproveApplication(application.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {t('approveButton')}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleRejectApplication(application.id, 'Incomplete documents')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {t('rejectButton')}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Application Detail Modal would go here */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {t('applicationDetailTitle')} - {selectedApplication.id}
                    </CardTitle>
                    <CardDescription>
                      {selectedApplication.userData.personalInfo.firstName} {selectedApplication.userData.personalInfo.lastName}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApplication(null)}
                  >
                    {t('closeButton')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Application Info */}
                  <div>
                    <h4 className="font-medium mb-3">{t('applicationInformation')}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('applicationType')}:</span>
                        <span className="ml-2 capitalize">{selectedApplication.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('status')}:</span>
                        <span className="ml-2">{getStatusBadge(selectedApplication.status)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('submittedAt')}:</span>
                        <span className="ml-2">{selectedApplication.submittedAt.toLocaleDateString()}</span>
                      </div>
                      {selectedApplication.reviewedAt && (
                        <div>
                          <span className="text-muted-foreground">{t('reviewedAt')}:</span>
                          <span className="ml-2">{selectedApplication.reviewedAt.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h4 className="font-medium mb-3">{t('personalInformation')}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('firstName')}:</span>
                        <span className="ml-2">{selectedApplication.userData.personalInfo.firstName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('lastName')}:</span>
                        <span className="ml-2">{selectedApplication.userData.personalInfo.lastName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('email')}:</span>
                        <span className="ml-2">{selectedApplication.userData.personalInfo.email}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('phone')}:</span>
                        <span className="ml-2">{selectedApplication.userData.personalInfo.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Type-specific Information */}
                  {selectedApplication.type === 'driver' && selectedApplication.userData.vehicleInfo && (
                    <div>
                      <h4 className="font-medium mb-3">{t('vehicleInformation')}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('vehicleType')}:</span>
                          <span className="ml-2 capitalize">{selectedApplication.userData.vehicleInfo.type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('vehicleBrand')}:</span>
                          <span className="ml-2">{selectedApplication.userData.vehicleInfo.brand}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('vehicleModel')}:</span>
                          <span className="ml-2">{selectedApplication.userData.vehicleInfo.model}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('licensePlate')}:</span>
                          <span className="ml-2">{selectedApplication.userData.vehicleInfo.licensePlate}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedApplication.type === 'vendor' && selectedApplication.userData.businessInfo && (
                    <div>
                      <h4 className="font-medium mb-3">{t('businessInformation')}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('businessName')}:</span>
                          <span className="ml-2">{selectedApplication.userData.businessInfo.businessName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('businessType')}:</span>
                          <span className="ml-2 capitalize">{selectedApplication.userData.businessInfo.businessType}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{t('categories')}:</span>
                          <span className="ml-2">{selectedApplication.userData.businessInfo.categories?.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  <div>
                    <h4 className="font-medium mb-3">{t('documents')}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedApplication.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="capitalize">{doc.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                          <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedApplication.status === 'pending' && (
                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          handleRejectApplication(selectedApplication.id, 'Incomplete documents');
                          setSelectedApplication(null);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('rejectButton')}
                      </Button>
                      
                      <Button
                        className="text-green-600 hover:text-green-700"
                        onClick={() => {
                          handleApproveApplication(selectedApplication.id);
                          setSelectedApplication(null);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('approveButton')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}