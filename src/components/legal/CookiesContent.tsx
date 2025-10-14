
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export default function CookiesContent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <p className="mt-4 text-muted-foreground">
        Last updated: October 26, 2023
      </p>

      <Card>
        <CardHeader>
          <CardTitle>1. What Are Cookies?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. How We Use Cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We use cookies to understand how you use our site and to improve your experience. This includes personalizing content and advertising. We use cookies for several purposes, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To enable certain functions of the service.</li>
            <li>To provide analytics.</li>
            <li>To store your preferences.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Types of Cookies We Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            <strong>Essential Cookies:</strong> We may use essential cookies to authenticate users and prevent fraudulent use of user accounts.
          </p>
          <p>
            <strong>Analytics Cookies:</strong> We may use analytics cookies to track information how the Service is used so that we can make improvements.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Your Choices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
