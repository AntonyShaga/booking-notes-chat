import * as React from "react";
import { Html, Head, Preview, Body, Container, Text, Link } from "@react-email/components";

interface VerifyEmailProps {
  url: string;
  email: string;
}

export const VerifyEmail = ({ url, email }: VerifyEmailProps) => (
  <Html>
    <Head />
    <Preview>Подтверждение почты</Preview>
    <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f9f9f9", padding: "20px" }}>
      <Container style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "6px" }}>
        <Text>Здравствуйте, {email}!</Text>
        <Text>Пожалуйста, подтвердите свою почту, перейдя по ссылке ниже:</Text>
        <Link href={url} style={{ color: "#2563eb" }}>
          Подтвердить Email
        </Link>
        <Text>Если вы не регистрировались — просто проигнорируйте это письмо.</Text>
      </Container>
    </Body>
  </Html>
);
