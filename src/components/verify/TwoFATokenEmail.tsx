import * as React from "react";
import { Html, Head, Preview, Body, Container, Text, Hr } from "@react-email/components";

interface TwoFATokenEmailProps {
  token: string;
  email?: string;
}

export const TwoFATokenEmail = ({ token, email }: TwoFATokenEmailProps) => (
  <Html>
    <Head />
    <Preview>Ваш код подтверждения для входа</Preview>
    <Body
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f3f4f6",
        padding: "20px",
      }}
    >
      <Container
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "6px",
          padding: "24px",
          maxWidth: "480px",
        }}
      >
        <Text style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
          Здравствуйте{email ? `, ${email}` : ""}!
        </Text>

        <Text style={{ fontSize: "16px", marginBottom: "12px" }}>
          Вот ваш код подтверждения для входа:
        </Text>

        <Text
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            backgroundColor: "#f0f0f0",
            padding: "12px 16px",
            textAlign: "center",
            borderRadius: "6px",
            letterSpacing: "2px",
            color: "#111827",
          }}
        >
          {token}
        </Text>

        <Text style={{ fontSize: "14px", marginTop: "24px", color: "#6b7280" }}>
          Этот код истекает через несколько минут. Не сообщайте его никому.
        </Text>

        <Hr style={{ margin: "32px 0", borderColor: "#e5e7eb" }} />

        <Text style={{ fontSize: "13px", color: "#9ca3af" }}>
          Если вы не пытались войти, просто проигнорируйте это письмо.
        </Text>
      </Container>
    </Body>
  </Html>
);
