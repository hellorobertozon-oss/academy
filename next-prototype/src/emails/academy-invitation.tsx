import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";
import type { InviteLanguage } from "../lib/admin/validation";
import { getInvitationEmailCopy } from "../lib/email/invitation-copy";

type AcademyInvitationEmailProps = {
  actionLink?: string;
  language?: InviteLanguage;
};

export function AcademyInvitationEmail({
  actionLink = "https://academy.example.com/auth/confirm?token_hash=preview&type=invite",
  language = "pl",
}: AcademyInvitationEmailProps) {
  const copy = getInvitationEmailCopy(language);

  return (
    <Html lang={language} dir="ltr">
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>XZONE ACADEMY</Text>
          <Heading style={styles.heading}>{copy.heading}</Heading>
          <Text style={styles.bodyText}>{copy.body}</Text>
          <Section style={styles.buttonSection}>
            <Button href={actionLink} style={styles.button}>
              {copy.button}
            </Button>
          </Section>
          <Hr style={styles.rule} />
          <Text style={styles.fallback}>{copy.fallback}</Text>
          <Text style={styles.link}>{actionLink}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AcademyInvitationEmail;

const styles = {
  body: {
    backgroundColor: "#f3f4f6",
    color: "#171717",
    fontFamily: "Arial, Helvetica, sans-serif",
    margin: "0",
    padding: "24px 12px",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "36px 32px",
  },
  brand: {
    color: "#57534e",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    margin: "0 0 24px",
  },
  heading: {
    color: "#171717",
    fontSize: "26px",
    fontWeight: "700",
    lineHeight: "1.25",
    margin: "0 0 16px",
  },
  bodyText: {
    color: "#525252",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0",
  },
  buttonSection: {
    margin: "28px 0",
  },
  button: {
    backgroundColor: "#dc2626",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "700",
    padding: "13px 20px",
    textDecoration: "none",
  },
  rule: {
    borderColor: "#e5e7eb",
    margin: "28px 0 20px",
  },
  fallback: {
    color: "#737373",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 8px",
  },
  link: {
    color: "#525252",
    fontSize: "12px",
    lineHeight: "1.5",
    overflowWrap: "anywhere" as const,
    margin: "0",
  },
};
