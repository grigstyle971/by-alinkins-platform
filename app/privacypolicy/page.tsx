import LegalPage from "@/components/LegalPage";

export default function PrivacyPolicyPage() {
  return <LegalPage title="PRIVACY POLICY" updated="August 25, 2026" sections={[
    { heading: "1. Introduction", paragraphs: ["This Privacy Policy explains how we handle your personal data.", "Data Controller", "This website and its services are operated by ALINKINS LLC, which is responsible for the processing of personal data described in this Privacy Policy."] },
    { heading: "2. Data Collection", paragraphs: ["We may process personal data when you purchase programs, create an account, request a refund, contact us, or otherwise use our website and services."] },
    { heading: "2.1 Information You Provide", paragraphs: ["We may collect personal information that you provide when purchasing a program, creating an account, contacting us, or requesting support or a refund. This may include your name, email address, phone number, account information, and purchase details."] },
    { heading: "2.2 Automatically Collected Information", paragraphs: ["When you use our website, certain technical information may be collected automatically, such as your IP address, browser type, device information, and information about how you interact with the website."] },
    { heading: "2.3 Payment Information", paragraphs: ["Payments are processed by third-party payment providers. We do not directly store your full payment card details."] },
    { heading: "3. Purpose of Processing", paragraphs: ["Personal data may be used for the following purposes:"], bullets: ["processing purchases and payments", "providing and managing access to digital programs", "creating and maintaining user accounts", "providing customer support", "processing refund requests", "communicating with users about their purchases", "maintaining the security and functionality of the website", "complying with legal and regulatory obligations"] },
    { heading: "4. Legal Basis (GDPR)", paragraphs: ["We process personal data based on:"], bullets: ["performance of a contract", "user consent", "legal obligations"] },
    { heading: "5. Third-Party Services", paragraphs: ["Payment processing and course access may be handled by trusted third-party service providers. Their privacy policies also apply to the processing of personal data.", "We use PostHog for product analytics. PostHog helps us understand how visitors use the website, including pages and sections viewed, time spent, device and browser information, and interactions with website elements. When you are signed in, this information may be associated with your account identifier and email address. We use this information to improve the website and our programs."] },
    { heading: "6. Data Storage", paragraphs: ["We do not retain personal data longer than necessary to provide services, process payments or refunds, and meet legal obligations."] },
    { heading: "7. International Data Transfers", paragraphs: ["Your personal data may be processed or stored in countries other than your country of residence, including countries where our service providers operate. Where required by applicable law, appropriate safeguards are used for international transfers of personal data."] },
    { heading: "8. Your Rights", paragraphs: ["You may request access to, correction of, or deletion of your personal data. To make a request, contact byalinkinsupport@gmail.com."] },
    { heading: "9. Changes to This Privacy Policy", paragraphs: ["We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the “Last updated” date will be revised accordingly."] },
    { heading: "10. Contact", paragraphs: ["For privacy-related questions, contact byalinkinsupport@gmail.com."] },
  ]} />;
}
