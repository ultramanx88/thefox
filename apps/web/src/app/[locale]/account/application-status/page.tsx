'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Mail, 
  Phone, 
  User,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface ApplicationStatus {
  id: string;
  type: 'driver' | 'vendor';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  reason?: string;
  userData: any;
  documents: any[];
}

export default function ApplicationStatusPage() {
  const t = useTranslations('ApplicationStatus');
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
    documents: false,
  });

  useEffect(() => {
    loadApplicationStatus();
  }, []);

  const loadApplicationStatus = async () => {
    setIsLoading(true);
    try {
      // TODO: Call API to get application status
      // For now, simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockApplication: ApplicationStatus = {
        id: 'app-123',
        type: 'driver',
        status: 'pending',
        submittedAt: new Date(),
        userData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+66812345678',
        },
        documents: [
          { type: 'idCard', status: 'uploaded' },
          { type: 'driverLicense', status: 'uploaded' },
          { type: 'vehicleRegistration', status: 'uploaded' },
          { type: 'profilePhoto', status: 'uploaded' },
        ],
      };
      
      setApplication(mockApplication);
      setVerificationStatus({
        email: false,
        phone: false,
        documents: true,
      });
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

  const handleResendEmailVerification = async () => {
    try {
      // TODO: Call API to resend email verification
      toast({
        title: t('emailSentTitle'),
        description: t('emailSentDescription'),
      });
    } catch (error: any) {
      toast({
        title: t('errorTitle'),
        description: error.message || t('emailSendErrorGeneric'),
        variant: 'destructive',
      });
    }
  };

  const handleResendSMSVerification = async () => {
    try {
      // TODO: Call API to resend SMS verification
      toast({
        title: t('smsSentTitle'),
        description: t('smsSentDescription'),
      });
    } catch (error: any) {
      toast({
        title: t('errorTitle'),
        description: error.message || t('smsSendErrorGeneric'),
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
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

  const getVerificationIcon = (verified: boolean) => {
    return verified ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t('loadingStatus')}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>{t('noApplicationTitle')}</CardTitle>
            <CardDescription>{t('noApplicationDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/register/shopper')}
              className="w-full"
            >
              {t('startApplicationButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('pageDescription')}</p>
        </div>

        {/* Application Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(application.status)}
                <div>
                  <CardTitle>{t('applicationStatusTitle')}</CardTitle>
                  <CardDescription>
                    {t('applicationId')}: {application.id}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(application.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('applicationType')}</p>
                <p className="text-sm">{application.type === 'driver' ? t('driverApplication') : t('vendorApplication')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('submittedAt')}</p>
                <p className="text-sm">{application.submittedAt.toLocaleDateString()}</p>
              </div>
            </div>

            {application.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">{t('pendingReviewTitle')}</h4>
                    <p className="text-sm text-yellow-700">{t('pendingReviewDescription')}</p>
                  </div>
                </div>
              </div>
            )}

            {application.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">{t('approvedTitle')}</h4>
                    <p className="text-sm text-green-700">{t('approvedDescription')}</p>
                    {application.reviewedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        {t('reviewedAt')}: {application.reviewedAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {application.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">{t('rejectedTitle')}</h4>
                    <p className="text-sm text-red-700">{t('rejectedDescription')}</p>
                    {application.reason && (
                      <p className="text-sm text-red-700 mt-2">
                        <strong>{t('rejectionReason')}:</strong> {application.reason}
                      </p>
                    )}
                    {application.reviewNotes && (
                      <p className="text-sm text-red-700 mt-1">
                        <strong>{t('reviewNotes')}:</strong> {application.reviewNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('verificationStatusTitle')}</CardTitle>
            <CardDescription>{t('verificationStatusDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('emailVerification')}</p>
                    <p className="text-sm text-muted-foreground">{application.userData.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getVerificationIcon(verificationStatus.email)}
                  {!verificationStatus.email && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleResendEmailVerification}
                    >
                      {t('resendEmail')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('phoneVerification')}</p>
                    <p className="text-sm text-muted-foreground">{application.userData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getVerificationIcon(verificationStatus.phone)}
                  {!verificationStatus.phone && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleResendSMSVerification}
                    >
                      {t('resendSMS')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('documentVerification')}</p>
                    <p className="text-sm text-muted-foreground">
                      {application.documents.length} {t('documentsUploaded')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getVerificationIcon(verificationStatus.documents)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('uploadedDocumentsTitle')}</CardTitle>
            <CardDescription>{t('uploadedDocumentsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t(`document_${doc.type}`)}</p>
                      <p className="text-sm text-muted-foreground">{t('documentUploaded')}</p>
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={loadApplicationStatus}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('refreshStatus')}
          </Button>
          
          {application.status === 'approved' && (
            <Button onClick={() => router.push('/dashboard')}>
              {t('goToDashboard')}
            </Button>
          )}
          
          {application.status === 'rejected' && (
            <Button onClick={() => router.push('/register/shopper')}>
              {t('reapplyButton')}
            </Button>
          )}
        </div>

        {/* Help Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('needHelp')} <a href="/support" className="text-primary hover:underline">{t('contactSupport')}</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}