
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export default function TermsContent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground">
        Last updated: October 26, 2023
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>1. Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Welcome to Christianitatis. These Terms of Service ("Terms") govern
            your use of our website and services. By accessing or using our
            service, you agree to be bound by these Terms.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non
            risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing
            nec, ultricies sed, dolor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. User Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            You agree to use our services responsibly and in compliance with
            all applicable laws. You are responsible for any content you
            post and for your interactions with other users.
          </p>
          <p>
            Cras elementum ultrices diam. Maecenas ligula massa, varius a,
            semper congue, euismod non, mi. Proin porttitor, orci nec nonummy
            molestie, enim est eleifend mi, non fermentum diam nisl sit amet
            erat.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            All content on this site, including text, graphics, logos, and
            images, is the property of Christianitatis or its content
            suppliers and is protected by international copyright laws.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Termination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We may terminate or suspend your access to our service
            immediately, without prior notice or liability, for any reason
            whatsoever, including without limitation if you breach the Terms.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>5. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            If you have any questions about these Terms, please contact us through our contact page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
