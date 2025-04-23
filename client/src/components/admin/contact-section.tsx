import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

// Define the schema for contact information
const contactSchema = z.object({
  phoneNumbers: z.array(
    z.object({
      number: z.string().min(1, { message: "Phone number is required" }),
      label: z.string().optional(),
    })
  ).min(1, { message: "At least one phone number is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  facebook: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
  instagram: z.string().url({ message: "Invalid URL" }).optional().or(z.literal(""))
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with default values
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      phoneNumbers: [{ number: "", label: "Reception" }],
      email: "",
      whatsapp: "",
      facebook: "",
      instagram: ""
    },
  });

  // Load saved contact information from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("adminSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.contactInfo) {
        const contactInfo = JSON.parse(settings.contactInfo);
        form.reset(contactInfo);
      }
    }
  }, [form]);

  // Handle form submission
  const onSubmit = (data: ContactFormValues) => {
    setIsLoading(true);
    
    try {
      // Save to localStorage
      const savedSettings = localStorage.getItem("adminSettings") || "{}";
      const settings = JSON.parse(savedSettings);
      
      settings.contactInfo = JSON.stringify(data);
      localStorage.setItem("adminSettings", JSON.stringify(settings));
      
      toast({
        title: "Contact information saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving contact information",
        description: "There was a problem saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new phone number field
  const addPhoneNumber = () => {
    const currentPhoneNumbers = form.getValues().phoneNumbers || [];
    form.setValue("phoneNumbers", [...currentPhoneNumbers, { number: "", label: "" }]);
  };

  // Remove a phone number field
  const removePhoneNumber = (index: number) => {
    const currentPhoneNumbers = form.getValues().phoneNumbers;
    if (currentPhoneNumbers.length > 1) {
      form.setValue(
        "phoneNumbers",
        currentPhoneNumbers.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: "Cannot remove",
        description: "At least one phone number is required.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          Manage contact details displayed on the website. These details will be shown in the Contact Us section.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Phone Numbers</h3>
              <p className="text-sm text-muted-foreground">
                Add up to 7 phone numbers with optional labels (e.g., Reception, Manager)
              </p>
              
              {form.watch("phoneNumbers")?.map((_, index) => (
                <div key={index} className="flex items-end gap-3">
                  <FormField
                    control={form.control}
                    name={`phoneNumbers.${index}.number`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Phone Number {index + 1}</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`phoneNumbers.${index}.label`}
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormLabel>Label (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Reception" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePhoneNumber(index)}
                    className="mb-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {form.watch("phoneNumbers")?.length < 7 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPhoneNumber}
                  className="mt-2"
                >
                  Add Phone Number
                </Button>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email & Social Media</h3>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="info@raiguesthouse.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/raiguesthouse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/raiguesthouse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Contact Information"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}