'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { registerVendor } from '@/lib/actions';
import { 
  Store, 
  Loader2, 
  Mail, 
  Phone, 
  Lock,
  User,
  MapPin,
  FileText,
  Building,
  Clock,
  CreditCard
} from "lucide-react";

export default function VendorRegistrationPage() {
  const t = useTranslations('VendorRegistration');
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = z.object({
    // Personal Information
    firstName: z.string().min(1, t('validation.firstNameRequired')),
    lastName: z.string().min(1, t('validation.lastNameRequired')),
    email: z.string().email(t('validation.invalidEmail')),
    phone: z.string().min(10, t('validation.phoneRequired')),
    password: z.string().min(8, t('validation.passwordLength')),
    confirmPassword: z.string().min(8, t('validation.confirmPasswordRequired')),
    
    // Business Information
    businessName: z.string().min(1, t('validation.businessNameRequired')),
    businessType: z.enum(['individual', 'company'], {
      required_error: t('validation.businessTypeRequired'),
    }),
    taxId: z.string().optional(),
    alternativePhone: z.string().optional(),
    
    // Location Information
    address: z.string().min(1, t('validation.addressRequired')),
    district: z.string().min(1, t('validation.districtRequired')),
    province: z.string().min(1, t('validation.provinceRequired')),
    postalCode: z.string().min(5, t('validation.postalCodeRequired')),
    
    // Business Details
    categories: z.array(z.string()).min(1, t('validation.categoriesRequired')),
    description: z.string().min(1, t('validation.descriptionRequired')),
    
    // Operating Hours (simplified)
    openTime: z.string().min(1, t('validation.openTimeRequired')),
    closeTime: z.string().min(1, t('validation.closeTimeRequired')),
    
    // Documents
    businessLicense: z.any().optional(),
    idCard: z.any().refine((file) => file?.length > 0, t('validation.idCardRequired')),
    bankBook: z.any().refine((file) => file?.length > 0, t('validation.bankBookRequired')),
    storePhotos: z.any().refine((files) => files?.length > 0, t('validation.storePhotosRequired')),
    
    acceptTerms: z.boolean().refine(val => val === true, {
      message: t('validation.acceptTermsRequired'),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordMismatch'),
    path: ["confirmPassword"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      businessName: "",
      businessType: undefined,
      taxId: "",
      alternativePhone: "",
      address: "",
      district: "",
      province: "",
      postalCode: "",
      categories: [],
      description: "",
      openTime: "08:00",
      closeTime: "18:00",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        // Create operating hours object
        const operatingHours = {
          monday: { open: values.openTime, close: values.closeTime, isOpen: true },
          tuesday: { open: values.openTime, close: values.closeTime, isOpen: true },
          wednesday: { open: values.openTime, close: values.closeTime, isOpen: true },
          thursday: { open: values.openTime, close: values.closeTime, isOpen: true },
          friday: { open: values.openTime, close: values.closeTime, isOpen: true },
          saturday: { open: values.openTime, close: values.closeTime, isOpen: true },
          sunday: { open: values.openTime, close: values.closeTime, isOpen: false },
        };

        const registrationData = {
          ...values,
          coordinates: { lat: 0, lng: 0 }, // TODO: Get from map selection
          operatingHours,
          documents: {
            businessLicense: values.businessLicense?.[0],
            idCard: values.idCard[0],
            bankBook: values.bankBook[0],
            storePhotos: Array.from(values.storePhotos || []),
          },
        };

        const result = await registerVendor(registrationData);
        
        if (result.success) {
          toast({
            title: t('registrationSuccessTitle'),
            description: result.message,
          });
          form.reset();
          
          // Redirect to application status page
          router.push('/account/application-status');
        } else {
          toast({
            title: t('registrationFailedTitle'),
            description: result.message,
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        toast({
          title: t('registrationFailedTitle'),
          description: error.message || t('registrationFailedGeneric'),
          variant: 'destructive',
        });
      }
    });
  }

  const handleCategoryToggle = (category: string) => {
    const currentCategories = form.getValues('categories');
    const updatedCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    form.setValue('categories', updatedCategories);
    setSelectedCategories(updatedCategories);
  };

  const availableCategories = [
    'vegetables', 'fruits', 'meat', 'seafood', 'bakery', 
    'dairy', 'beverages', 'snacks', 'household', 'other'
  ];

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <Store className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">{t('personalInformationTitle')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('firstNameLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder={t('firstNamePlaceholder')} 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('lastNameLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder={t('lastNamePlaceholder')} 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('emailLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="email" 
                              placeholder={t('emailPlaceholder')} 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('phoneLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="tel" 
                              placeholder={t('phonePlaceholder')} 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('passwordLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder={t('passwordPlaceholder')} 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder={t('confirmPasswordPlaceholder')} 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showPassword"
                    checked={showPassword}
                    onCheckedChange={setShowPassword}
                  />
                  <label 
                    htmlFor="showPassword" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('showPassword')}
                  </label>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">{t('businessInformationTitle')}</h3>
                
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('businessNameLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder={t('businessNamePlaceholder')} 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('businessTypeLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectBusinessType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">{t('individual')}</SelectItem>
                            <SelectItem value="company">{t('company')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('taxIdLabel')} <span className="text-muted-foreground">({t('optional')})</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder={t('taxIdPlaceholder')} 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="alternativePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('alternativePhoneLabel')} <span className="text-muted-foreground">({t('optional')})</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="tel" 
                            placeholder={t('alternativePhonePlaceholder')} 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">{t('locationInformationTitle')}</h3>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addressLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea 
                            placeholder={t('addressPlaceholder')} 
                            className="pl-10 resize-none"
                            rows={2}
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('districtLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('districtPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('provinceLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('provincePlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('postalCodeLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('postalCodePlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">{t('businessDetailsTitle')}</h3>
                
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('categoriesLabel')}</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {availableCategories.map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                id={category}
                                checked={field.value.includes(category)}
                                onCheckedChange={() => handleCategoryToggle(category)}
                              />
                              <label
                                htmlFor={category}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {t(`category_${category}`)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('descriptionLabel')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('descriptionPlaceholder')} 
                          className="resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="openTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('openTimeLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="time" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closeTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('closeTimeLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="time" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">{t('documentsTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('documentsDescription')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessLicense"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('businessLicenseLabel')} <span className="text-muted-foreground">({t('optional')})</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                              type="file" 
                              accept="image/*,.pdf"
                              className="pl-10"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idCard"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('idCardLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                              type="file" 
                              accept="image/*,.pdf"
                              className="pl-10"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankBook"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('bankBookLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                              type="file" 
                              accept="image/*,.pdf"
                              className="pl-10"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storePhotos"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('storePhotosLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                              type="file" 
                              accept="image/*"
                              multiple
                              className="pl-10"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          {t('acceptTermsLabel')} <a href="/terms" className="text-primary hover:underline">{t('termsLink')}</a> {t('and')} <a href="/privacy" className="text-primary hover:underline">{t('privacyLink')}</a>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    {t('approvalNotice')}
                  </p>
                </div>

                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('submitButton')}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  {t('alreadyHaveAccount')} <a href="/login" className="text-primary hover:underline">{t('signInLink')}</a>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}