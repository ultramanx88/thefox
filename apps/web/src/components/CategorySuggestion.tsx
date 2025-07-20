'use client';

import { useState, useTransition, useRef } from 'react';
import { useFormState } from 'react-dom';
import { Image as ImageIcon, Lightbulb, Loader2, RefreshCw } from 'lucide-react';

import { suggestCategories, type ActionState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function CategorySuggestion() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageForForm, setImageForForm] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const initialState: ActionState = {};
  const [state, formAction] = useFormState(suggestCategories, initialState);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast({
          title: 'Image too large',
          description: 'Please select an image smaller than 4MB.',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageForForm(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSuggestClick = () => {
    if (!imageForForm) {
      toast({
        title: 'No Image',
        description: 'Please select an image first to get suggestions.',
        variant: 'destructive',
      });
      return;
    }
    startTransition(() => {
        const formData = new FormData();
        formData.append('productImage', imageForForm);
        formAction(formData);
    });
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageForForm('');
    state.suggestions = [];
    state.error = undefined;
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  return (
    <Card className="bg-background/80">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Lightbulb className="text-accent" />
                AI Category Suggestion
            </CardTitle>
            <CardDescription>
                Upload a product image and our AI will suggest relevant categories for you.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Input
                id="productImage"
                name="productImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="file:text-primary file:font-semibold"
            />
            
            {imagePreview && (
                <div className="relative mt-4 w-full max-w-sm mx-auto aspect-square rounded-lg overflow-hidden border-2 border-dashed">
                    <Image src={imagePreview} alt="Product preview" layout="fill" objectFit="contain" />
                </div>
            )}

            <div className="flex items-center gap-2">
                 <Button type="button" onClick={handleSuggestClick} disabled={isPending || !imagePreview}>
                    {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Lightbulb className="mr-2 h-4 w-4" />
                    )}
                    Suggest Categories
                </Button>
                {imagePreview && (
                    <Button type="button" variant="ghost" size="icon" onClick={handleReset} disabled={isPending}>
                        <RefreshCw className="h-4 w-4"/>
                        <span className="sr-only">Reset Image</span>
                    </Button>
                )}
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            
            {state.suggestions && state.suggestions.length > 0 && (
                <div className="space-y-2 pt-4">
                    <h4 className="font-semibold">Suggested Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                    {state.suggestions.map((cat, index) => (
                        <Badge key={index} variant="secondary" className="text-base py-1 px-3 cursor-pointer hover:bg-primary hover:text-primary-foreground">
                         {cat}
                        </Badge>
                    ))}
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
