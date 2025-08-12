import * as React from "react";
import { Html, Head, Preview, Body, Container, Text, Link } from "@react-email/components";

interface VerifyEmailProps {
  url: string;
  email: string;
}

export const VerifyEmail = ({ url, email }: VerifyEmailProps) => (
  <Html>
    <Head />
    <Preview>Email Verification</Preview>
    <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f9f9f9", padding: "20px" }}>
      <Container style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "6px" }}>
        <Text>Hello, {email}!</Text>
        <Text>Please verify your email by clicking on the link below:</Text>
        <Link href={url} style={{ color: "#2563eb" }}>
          Verify Email
        </Link>
        <Text>If you did not register, please ignore this email.</Text>
      </Container>
    </Body>
  </Html>
);
