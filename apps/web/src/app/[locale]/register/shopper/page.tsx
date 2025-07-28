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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { registerDriver } from '@/lib/actions';
import { 
  Bike, 
  Car, 
  Truck, 
  FileText, 
  User as UserIcon, 
  Loader2, 
  Mail, 
  Phone, 
  Calendar, 
  Lock,
  CreditCard,
  MapPin,
  Clock
} from "lucide-react";

export default function DriverRegistrationPage() {
  const t = useTranslations('DriverRegistration');
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<'motorcycle' | 'car' | 'truck' | ''>('');
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
    dateOfBirth: z.string().min(1, t('validation.dateOfBirthRequired')),
    nationalId: z.string().min(13, t('validation.nationalIdRequired')),
    
    // Vehicle Information
    vehicleType: z.enum(['motorcycle', 'car', 'truck'], {
      required_error: t('validation.vehicleTypeRequired'),
    }),
    vehicleBrand: z.string().min(1, t('validation.vehicleBrandRequired')),
    vehicleModel: z.string().min(1, t('validation.vehicleModelRequired')),
    vehicleYear: z.coerce.number().min(2000, t('validation.vehicleYearRequired')),
    licensePlate: z.string().min(1, t('validation.licensePlateRequired')),
    
    // Availability
    availableAreas: z.array(z.string()).min(1, t('validation.availableAreasRequired')),
    
    // Working Hours (simplified for now)
    workingHoursStart: z.string().min(1, t('validation.workingHoursRequired')),
    workingHoursEnd: z.string().min(1, t('validation.workingHoursRequired')),
    
    // Documents
    idCard: z.any().refine((file) => file?.length > 0, t('validation.idCardRequired')),
    driverLicense: z.any().refine((file) => file?.length > 0, t('validation.driverLicenseRequired')),
    vehicleRegistration: z.any().refine((file) => file?.length > 0, t('validation.vehicleRegistrationRequired')),
    profilePhoto: z.any().refine((file) => file?.length > 0, t('validation.profilePhotoRequired')),
    
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
      dateOfBirth: "",
      nationalId: "",
      vehicleType: undefined,
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: new Date().getFullYear(),
      licensePlate: "",
      availableAreas: [],
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        // Convert working hours to the expected format
        const workingHours = {
          monday: { isOpen: true, openTime: values.workingHoursStart, closeTime: values.workingHoursEnd },
          tuesday: { isOpen: true, openTime: values.workingHoursStart, closeTime: values.workingHoursEnd },
          wednesday: { isOpen: true, openTime: values.workingHoursStart, closeTime: values.workingHoursEnd },
          thursday: { isOpen: true, openTime: values.workingHoursStart, closeTime: values.workingHoursEnd },
          friday: { isOpen: true, openTime: values.workingHoursStart, closeTime: values.workingHoursEnd },
          saturday: { isOpen: false },
          sunday: { isOpen: false },
        };

        const registrationData = {
          ...values,
          workingHours,
          documents: {
            idCard: values.idCard[0],
            driverLicense: values.driverLicense[0],
            vehicleRegistration: values.vehicleRegistration[0],
            profilePhoto: values.profilePhoto[0],
          },
        };

        const result = await registerDriver(registrationData);
        
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

  const handleAreaToggle = (area: string) => {
    const currentAreas = form.getValues('availableAreas');
    const updatedAreas = currentAreas.includes(area)
      ? currentAreas.filter(a => a !== area)
      : [...currentAreas, area];
    form.setValue('availableAreas', updatedAreas);
  };

  const availableAreas = [
    'Bangkok', 'Nonthaburi', 'Pathum Thani', 'Samut Prakan', 
    'Samut Sakhon', 'Nakhon Pathom', 'Ayutthaya'
  ];

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <Truck className="h-8 w-8" />
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
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dateOfBirthLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date" 
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
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('nationalIdLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder={t('nationalIdPlaceholder')} 
                              className="pl-10"
                              maxLength={13}
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

              {/* Vehicle Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">{t('vehicleInformationTitle')}</h3>
                
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vehicleTypeLabel')}</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { value: 'motorcycle', icon: Bike, label: t('motorcycle') },
                            { value: 'car', icon: Car, label: t('car') },
                            { value: 'truck', icon: Truck, label: t('truck') },
                          ].map(({ value, icon: Icon, label }) => (
                            <div key={value}>
                              <input
                                type="radio"
                                id={value}
                                value={value}
                                checked={field.value === value}
                                onChange={() => {
                                  field.onChange(value);
                                  setSelectedVehicleType(value as any);
                                }}
                                className="peer sr-only"
                              />
                              <label
                                htmlFor={value}
                                className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary cursor-pointer text-center"
                              >
                                <Icon className="mb-3 h-6 w-6" />
                                {label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleBrand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('vehicleBrandLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('vehicleBrandPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicleModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('vehicleModelLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('vehicleModelPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicleYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('vehicleYearLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="2000"
                            max={new Date().getFullYear()}
                            placeholder={t('vehicleYearPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('licensePlateLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('licensePlatePlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">{t('availabilityTitle')}</h3>
                
                <FormField
                  control={form.control}
                  name="availableAreas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('availableAreasLabel')}</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {availableAreas.map((area) => (
                            <div key={area} className="flex items-center space-x-2">
                              <Checkbox
                                id={area}
                                checked={field.value.includes(area)}
                                onCheckedChange={() => handleAreaToggle(area)}
                              />
                              <label
                                htmlFor={area}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {area}
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workingHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('workingHoursStartLabel')}</FormLabel>
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
                    name="workingHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('workingHoursEndLabel')}</FormLabel>
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
                    name="idCard"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('idCardLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                    name="driverLicense"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('driverLicenseLabel')}</FormLabel>
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
                    name="vehicleRegistration"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('vehicleRegistrationLabel')}</FormLabel>
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
                    name="profilePhoto"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('profilePhotoLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                              type="file" 
                              accept="image/*"
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